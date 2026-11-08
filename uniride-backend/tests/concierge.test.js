import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

// Prevent server.js from auto-binding port 5000 during tests
process.env.UNI_SKIP_AUTO_START = 'true';

import { app } from '../server.js';
import { seedDatabase } from '../seedData.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Rider from '../models/Rider.js';
import DiscoveredShop from '../models/DiscoveredShop.js';
import DiscoveryCache from '../models/DiscoveryCache.js';
import ConciergeOrder from '../models/ConciergeOrder.js';
import SettlementLedger from '../models/SettlementLedger.js';
import {
  setOverpassFetchAdapter,
  resetOverpassCooldown,
  normalizeOsmElement,
} from '../services/overpassProvider.js';
import { resetRateLimiter } from '../middleware/rateLimiter.js';
import {
  SEUSL_COORDS,
  OVERPASS_SEUSL_FIXTURE,
  VALID_PNG_BASE64,
} from './fixtures/overpassFixtures.js';

let server;
let baseUrl;
const createdTestOrderIds = [];

async function apiFetch(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await res.json()
    : await res.arrayBuffer();
  return { status: res.status, headers: res.headers, body };
}

before(async () => {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uniEatsDB';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  await seedDatabase();

  // Ensure test riders start online and available
  await Rider.updateMany(
    { id: { $in: ['rider-1', 'rider-2', 'rider-3'] } },
    {
      $set: {
        isOnline: true,
        isAvailable: true,
        activeOrderId: null,
        lastKnownLocation: {
          type: 'Point',
          coordinates: [SEUSL_COORDS.lng, SEUSL_COORDS.lat],
        },
        lastLocationUpdatedAt: new Date(),
      },
    }
  );

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  setOverpassFetchAdapter(null);
  resetOverpassCooldown();
  resetRateLimiter();

  if (createdTestOrderIds.length > 0) {
    await ConciergeOrder.deleteMany({
      orderId: { $in: createdTestOrderIds },
    });
    await SettlementLedger.deleteMany({
      orderId: { $in: createdTestOrderIds },
    });
  }

  await Rider.updateMany(
    { id: { $in: ['rider-1', 'rider-2', 'rider-3'] } },
    {
      $set: {
        isOnline: true,
        isAvailable: true,
        activeOrderId: null,
      },
    }
  );

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

// ============================================================================
// TEST 1: Invalid coordinates are rejected on client & server
// ============================================================================
test('1. Rejects missing, NaN, non-finite, and out-of-range coordinates with HTTP 400', async () => {
  const invalidCases = [
    '/api/concierge/discovery/shops',
    '/api/concierge/discovery/shops?lat=NaN&lng=81.85',
    '/api/concierge/discovery/shops?lat=7.29&lng=NaN',
    '/api/concierge/discovery/shops?lat=95&lng=81.85',
    '/api/concierge/discovery/shops?lat=7.29&lng=-195',
    '/api/concierge/discovery/shops?lat=Infinity&lng=81.85',
    '/api/locations/detect?lat=NaN&lng=NaN',
  ];

  for (const url of invalidCases) {
    const res = await apiFetch(url);
    assert.equal(
      res.status,
      400,
      `Expected HTTP 400 for invalid coordinate request: ${url}`
    );
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_COORDINATES');
  }

  // Also reject radius exceeding max limit
  const badRadius = await apiFetch(
    `/api/concierge/discovery/shops?lat=${SEUSL_COORDS.lat}&lng=${SEUSL_COORDS.lng}&radius=99999`
  );
  assert.equal(badRadius.status, 400);
  assert.equal(badRadius.body.code, 'INVALID_RADIUS');
});

// ============================================================================
// TEST 2: OSM nodes, ways, and relations normalize accurately without inventing data
// ============================================================================
test('2. Normalizes OSM node, way, and relation elements into GeoJSON without inventing fields', () => {
  const [nodeEl, wayEl, relEl, pharmEl, unnamedEl] =
    OVERPASS_SEUSL_FIXTURE.elements;

  const normNode = normalizeOsmElement(nodeEl);
  assert.equal(normNode.externalId, 'osm:node:9001001');
  assert.equal(normNode.osmType, 'node');
  assert.equal(normNode.category, 'stationery');
  assert.deepEqual(normNode.location.coordinates, [81.8512, 7.2982]); // [lng, lat]
  assert.equal(normNode.locationAccuracy, 'node');
  assert.equal(normNode.coordinatesApprox, false);
  assert.equal(normNode.contact.phone, '+94 67 225 5101');
  assert.equal(normNode.openingHours, 'Mo-Sa 08:00-20:00');
  assert.equal(normNode.storeType, 'independent_osm');
  assert.equal(normNode.isIndependent, true);
  assert.ok(normNode.conciergeNotice.includes('independent rider'));

  const normWay = normalizeOsmElement(wayEl);
  assert.equal(normWay.externalId, 'osm:way:9002002');
  assert.equal(normWay.osmType, 'way');
  assert.equal(normWay.category, 'grocery');
  assert.deepEqual(normWay.location.coordinates, [81.8535, 7.301]);
  assert.equal(normWay.locationAccuracy, 'approximate_center');
  assert.equal(normWay.coordinatesApprox, true);
  // Missing phone and opening_hours must be null, never invented
  assert.equal(normWay.contact.phone, null);
  assert.equal(normWay.openingHours, null);

  const normRel = normalizeOsmElement(relEl);
  assert.equal(normRel.externalId, 'osm:relation:9003003');
  assert.equal(normRel.osmType, 'relation');
  assert.equal(normRel.category, 'food');
  assert.equal(normRel.coordinatesApprox, true);

  const normPharm = normalizeOsmElement(pharmEl);
  assert.equal(normPharm.category, 'pharmacy');

  const normUnnamed = normalizeOsmElement(unnamedEl);
  assert.equal(normUnnamed, null);
});

// ============================================================================
// TEST 3: Discovery caching, concurrent deduplication, timeout/stale fallback, and rate limiting
// ============================================================================
test('3. Handles Overpass deduplication, caching, stale fallback on timeout, and 429 rate limiting', async () => {
  await DiscoveryCache.deleteMany({});
  await DiscoveredShop.deleteMany({});
  resetOverpassCooldown();
  resetRateLimiter();

  let overpassCallCount = 0;
  setOverpassFetchAdapter(async () => {
    overpassCallCount += 1;
    await new Promise((r) => setTimeout(r, 40));
    return {
      ok: true,
      status: 200,
      json: async () => OVERPASS_SEUSL_FIXTURE,
    };
  });

  // 3a. Concurrent equivalent searches share a single Overpass fetch
  const url = `/api/concierge/discovery/shops?lat=${SEUSL_COORDS.lat}&lng=${SEUSL_COORDS.lng}&radius=2000`;
  const [res1, res2, res3] = await Promise.all([
    apiFetch(url),
    apiFetch(url),
    apiFetch(url),
  ]);

  assert.equal(res1.status, 200);
  assert.equal(res2.status, 200);
  assert.equal(res3.status, 200);
  assert.equal(
    overpassCallCount,
    1,
    'Concurrent identical area searches must be deduplicated into 1 Overpass call'
  );
  assert.equal(res1.body.shops.length, 4);
  assert.ok(
    res1.body.shops[0].straightLineDistanceMeters <
      res1.body.shops[0].estimatedRoadDistanceKm * 1000
  );

  // 3b. Subsequent search within covered area hits cache without calling Overpass
  const cachedRes = await apiFetch(`${url}&category=stationery`);
  assert.equal(cachedRes.status, 200);
  assert.equal(cachedRes.body.cacheStatus, 'HIT');
  assert.equal(cachedRes.body.shops.length, 1);
  assert.equal(cachedRes.body.shops[0].externalId, 'osm:node:9001001');
  assert.equal(overpassCallCount, 1);

  // 3c. Expire cache and simulate Overpass timeout -> must return stale cached results with stale: true
  await DiscoveryCache.updateMany(
    {},
    { $set: { expiresAt: new Date(Date.now() - 10000) } }
  );
  setOverpassFetchAdapter(async () => {
    const abortErr = new Error('Simulated timeout');
    abortErr.name = 'AbortError';
    throw abortErr;
  });

  const staleRes = await apiFetch(url);
  assert.equal(staleRes.status, 200);
  assert.equal(staleRes.body.stale, true);
  assert.equal(staleRes.body.cacheStatus, 'STALE_FALLBACK');
  assert.equal(staleRes.body.shops.length, 4);

  // 3d. Uncached area when Overpass is down returns 503 (distinct from "0 shops found")
  const uncachedFailRes = await apiFetch(
    '/api/concierge/discovery/shops?lat=8.5000&lng=81.2000&radius=1500'
  );
  assert.equal(uncachedFailRes.status, 503);
  assert.equal(uncachedFailRes.body.providerAvailable, false);
  assert.equal(uncachedFailRes.body.success, false);

  // 3e. Endpoint rate limiter enforces 429 when exceeded
  process.env.DISCOVERY_RATE_LIMIT_MAX = '3';
  resetRateLimiter();
  await apiFetch(url, { headers: { 'X-Demo-Actor-Id': 'cust-ruvini' } });
  await apiFetch(url, { headers: { 'X-Demo-Actor-Id': 'cust-ruvini' } });
  await apiFetch(url, { headers: { 'X-Demo-Actor-Id': 'cust-ruvini' } });
  const rateLimitedRes = await apiFetch(url, {
    headers: { 'X-Demo-Actor-Id': 'cust-ruvini' },
  });
  assert.equal(rateLimitedRes.status, 429);
  assert.equal(rateLimitedRes.body.code, 'DISCOVERY_RATE_LIMIT_EXCEEDED');
  process.env.DISCOVERY_RATE_LIMIT_MAX = '30';
  resetRateLimiter();
});

// ============================================================================
// TEST 4: Estimated templates are never labeled as verified inventory; pharmacies have no auto catalog
// ============================================================================
test('4. Master catalog templates are labeled as estimated and pharmacies do not auto-generate medicine catalogs', async () => {
  const statRes = await apiFetch('/api/concierge/catalog?category=stationery');
  assert.equal(statRes.status, 200);
  assert.equal(statRes.body.isVerifiedInventory, false);
  assert.ok(statRes.body.data.length >= 4);

  for (const item of statRes.body.data) {
    assert.equal(item.isVerifiedInventory, false);
    assert.equal(item.priceLabel, 'Estimated price');
    assert.equal(item.availabilityLabel, 'Availability confirmed by rider');
    assert.equal(item.imageLabel, 'Illustrative image');
    assert.ok(Number.isInteger(item.estimatedUnitPriceMinor));
  }

  const pharmRes = await apiFetch('/api/concierge/catalog?category=pharmacy');
  assert.equal(pharmRes.status, 200);
  assert.equal(pharmRes.body.data.length, 0);
  assert.ok(
    pharmRes.body.catalogNotice.includes(
      'do not generate automatic medicine catalogs'
    )
  );
});

// ============================================================================
// TEST 5, 6, 7, 8, 9, 10: Complete Order Lifecycle, Concurrency, Access Control, Quotes, Receipts & Settlement
// ============================================================================
test('5-10. Full Concierge Order lifecycle: idempotency, atomic concurrent rider claim, access control, quote approval, receipt magic-byte validation, post-purchase cancellation guard, and idempotent settlement', async () => {
  const orderPayload = {
    idempotencyKey: `idem-test-${Date.now()}`,
    deliveryAddress: 'Room 204, Women’s Hostel Block B, SEUSL, Oluvil',
    deliveryCoordinates: SEUSL_COORDS,
    deliveryInstructions: 'Call at hostel security gate',
    substitutionPolicy: 'NO_SUBSTITUTIONS',
    shop: {
      externalId: 'osm:node:9001001',
      name: 'Oluvil Campus Bookshop & Stationery',
      category: 'stationery',
      storeType: 'independent_osm',
      isIndependent: true,
      coordinates: { lat: 7.2982, lng: 81.8512 },
    },
    items: [
      {
        templateId: 'mc-stat-cr-80',
        requestedQuantity: 2,
      },
      {
        name: 'Casio FX-991EX Scientific Calculator Cover',
        isCustomRequest: true,
        requestedQuantity: 1,
        preferredBrand: 'Casio',
        estimatedUnitPriceMinor: 45000, // LKR 450.00
        substitutionPolicy: 'NO_SUBSTITUTIONS',
      },
    ],
  };

  // --- TEST 9a: Idempotent Order Creation (Double-click checkout protection) ---
  const [createRes1, createRes2] = await Promise.all([
    apiFetch('/api/concierge/orders', {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': 'cust-ruvini' },
      body: JSON.stringify(orderPayload),
    }),
    apiFetch('/api/concierge/orders', {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': 'cust-ruvini' },
      body: JSON.stringify(orderPayload),
    }),
  ]);

  assert.ok([200, 201].includes(createRes1.status));
  assert.ok([200, 201].includes(createRes2.status));
  assert.equal(
    createRes1.body.data.orderId,
    createRes2.body.data.orderId,
    'Duplicate checkout requests with same idempotencyKey must return the exact same order'
  );

  const orderId = createRes1.body.data.orderId;
  createdTestOrderIds.push(orderId);

  // Verify backend calculated pricing in minor units (2 * 22000 + 1 * 45000 = 89000)
  assert.equal(createRes1.body.data.pricing.estimatedItemSubtotalMinor, 89000);
  assert.equal(createRes1.body.data.pricing.deliveryFeeMinor, 10000);

  // --- TEST 6a: Browsing Rider Privacy & Unauthorized Customer Access ---
  const jobsBoardRes = await apiFetch('/api/concierge/jobs/available', {
    headers: { 'X-Demo-Actor-Id': 'rider-1' },
  });
  assert.equal(jobsBoardRes.status, 200);
  const listedJob = jobsBoardRes.body.data.find((j) => j.orderId === orderId);
  assert.ok(listedJob, 'New order should appear on nearby jobs board');
  assert.equal(
    listedJob.deliveryAddress,
    '[Hidden until job is accepted]',
    'Full delivery address must be hidden from unassigned riders browsing jobs'
  );
  assert.equal(
    listedJob.customerPhone,
    '[Hidden until job is accepted]',
    'Customer phone must be hidden from unassigned riders browsing jobs'
  );

  // Another customer (cust-kamal) cannot access cust-ruvini's order
  const unauthorizedCustRes = await apiFetch(
    `/api/concierge/orders/${orderId}`,
    {
      headers: { 'X-Demo-Actor-Id': 'cust-kamal' },
    }
  );
  assert.equal(unauthorizedCustRes.status, 403);
  assert.equal(unauthorizedCustRes.body.code, 'FORBIDDEN_NOT_ORDER_OWNER');

  // --- TEST 5: Concurrent Rider Acceptance (Atomic Claim -> Exactly One Winner) ---
  const [claimRider1, claimRider2] = await Promise.all([
    apiFetch(`/api/concierge/orders/${orderId}/accept`, {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': 'rider-1' },
    }),
    apiFetch(`/api/concierge/orders/${orderId}/accept`, {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': 'rider-2' },
    }),
  ]);

  const statuses = [claimRider1.status, claimRider2.status].sort();
  assert.deepEqual(
    statuses,
    [200, 409],
    'Concurrent rider acceptance must result in exactly one 200 OK winner and one 409 Conflict'
  );

  const winnerId =
    claimRider1.status === 200 ? 'rider-1' : 'rider-2';
  const loserId =
    winnerId === 'rider-1' ? 'rider-2' : 'rider-1';

  // Verify loser rider's activeOrderId was cleanly rolled back to null
  const loserProfile = await Rider.findOne({ id: loserId }).lean();
  assert.equal(loserProfile.activeOrderId, null);
  assert.equal(loserProfile.isAvailable, true);

  // Verify winner rider cannot accept a second assignment while busy
  const secondAcceptAttempt = await apiFetch(
    `/api/concierge/orders/${orderId}/accept`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
    }
  );
  assert.equal(secondAcceptAttempt.status, 409);

  // --- TEST 6b: Unassigned rider (loserId) cannot perform actions on the order ---
  const wrongRiderAction = await apiFetch(
    `/api/concierge/orders/${orderId}/start-shopping`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': loserId },
    }
  );
  assert.equal(wrongRiderAction.status, 403);
  assert.equal(wrongRiderAction.body.code, 'NOT_ASSIGNED_RIDER');

  // --- TEST 7a: Invalid status transition fails (cannot jump from ASSIGNED to PURCHASED) ---
  const invalidJump = await apiFetch(
    `/api/concierge/orders/${orderId}/purchase`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
      body: JSON.stringify({}),
    }
  );
  assert.equal(invalidJump.status, 409);
  assert.equal(invalidJump.body.code, 'INVALID_STATUS_TRANSITION');

  // Transition ASSIGNED -> SHOPPING by winning rider
  const shopStartRes = await apiFetch(
    `/api/concierge/orders/${orderId}/start-shopping`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
    }
  );
  assert.equal(shopStartRes.status, 200);
  assert.equal(shopStartRes.body.data.status, 'SHOPPING');

  const orderItems = shopStartRes.body.data.items;

  // --- TEST 8a: Substitution policy enforcement ("NO_SUBSTITUTIONS" rejects SUBSTITUTED quote) ---
  const forbiddenSubQuote = await apiFetch(
    `/api/concierge/orders/${orderId}/quote`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
      body: JSON.stringify({
        items: [
          {
            itemId: orderItems[0].itemId,
            availabilityStatus: 'SUBSTITUTED',
            confirmedQuantity: 2,
            actualUnitPriceMinor: 21000,
            substituteName: 'Other Brand Book',
          },
          {
            itemId: orderItems[1].itemId,
            availabilityStatus: 'AVAILABLE',
            confirmedQuantity: 1,
            actualUnitPriceMinor: 45000,
          },
        ],
      }),
    }
  );
  assert.equal(forbiddenSubQuote.status, 400);
  assert.equal(
    forbiddenSubQuote.body.code,
    'SUBSTITUTION_FORBIDDEN_BY_POLICY'
  );

  // Submit valid Quote v1
  const quoteV1Res = await apiFetch(
    `/api/concierge/orders/${orderId}/quote`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
      body: JSON.stringify({
        riderSummaryNote: 'CR books in stock; calculator cover unavailable.',
        items: [
          {
            itemId: orderItems[0].itemId,
            availabilityStatus: 'AVAILABLE',
            confirmedQuantity: 2,
            actualUnitPriceMinor: 23000, // LKR 230.00 each -> 46000
          },
          {
            itemId: orderItems[1].itemId,
            availabilityStatus: 'UNAVAILABLE',
            riderNote: 'Sold out at Oluvil Bookshop',
          },
        ],
      }),
    }
  );
  assert.equal(quoteV1Res.status, 200);
  assert.equal(quoteV1Res.body.data.status, 'AWAITING_CUSTOMER_APPROVAL');
  assert.equal(quoteV1Res.body.data.quote.version, 1);
  assert.equal(
    quoteV1Res.body.data.pricing.confirmedItemSubtotalMinor,
    46000
  );

  // Customer approves Quote v1
  const approveV1Res = await apiFetch(
    `/api/concierge/orders/${orderId}/approve-quote`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': 'cust-ruvini' },
      body: JSON.stringify({ quoteVersion: 1 }),
    }
  );
  assert.equal(approveV1Res.status, 200);
  assert.equal(approveV1Res.body.data.status, 'PURCHASE_APPROVED');
  assert.equal(approveV1Res.body.data.approval.isApproved, true);

  // --- TEST 8b: Changing quote (v2) invalidates previous approval ---
  const quoteV2Res = await apiFetch(
    `/api/concierge/orders/${orderId}/quote`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
      body: JSON.stringify({
        riderSummaryNote: 'Shop owner found the calculator cover in back room!',
        items: [
          {
            itemId: orderItems[0].itemId,
            availabilityStatus: 'AVAILABLE',
            confirmedQuantity: 2,
            actualUnitPriceMinor: 23000, // 46000
          },
          {
            itemId: orderItems[1].itemId,
            availabilityStatus: 'AVAILABLE',
            confirmedQuantity: 1,
            actualUnitPriceMinor: 44000, // 44000 -> total items = 90000
          },
        ],
      }),
    }
  );
  assert.equal(quoteV2Res.status, 200);
  assert.equal(quoteV2Res.body.data.status, 'AWAITING_CUSTOMER_APPROVAL');
  assert.equal(quoteV2Res.body.data.quote.version, 2);
  assert.equal(
    quoteV2Res.body.data.approval.isApproved,
    false,
    'Revised quote v2 must invalidate previous approval'
  );

  // Approving stale version v1 must fail with 409
  const staleApproveRes = await apiFetch(
    `/api/concierge/orders/${orderId}/approve-quote`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': 'cust-ruvini' },
      body: JSON.stringify({ quoteVersion: 1 }),
    }
  );
  assert.equal(staleApproveRes.status, 409);
  assert.equal(staleApproveRes.body.code, 'QUOTE_VERSION_MISMATCH');

  // Approve current version v2
  const approveV2Res = await apiFetch(
    `/api/concierge/orders/${orderId}/approve-quote`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': 'cust-ruvini' },
      body: JSON.stringify({ quoteVersion: 2 }),
    }
  );
  assert.equal(approveV2Res.status, 200);
  assert.equal(approveV2Res.body.data.status, 'PURCHASE_APPROVED');

  // --- TEST 8c: Rider cannot purchase beyond approvedMaxAmountMinor ---
  const overBudgetPurchase = await apiFetch(
    `/api/concierge/orders/${orderId}/purchase`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
      body: JSON.stringify({
        actualItemSubtotalMinor: 120000, // Exceeds approved 90000
        receiptData: VALID_PNG_BASE64,
      }),
    }
  );
  assert.equal(overBudgetPurchase.status, 409);
  assert.equal(
    overBudgetPurchase.body.code,
    'PURCHASE_EXCEEDS_APPROVED_AMOUNT'
  );

  // --- TEST 10: Receipt validation rejects disguised non-image content and persists valid PNG ---
  const fakeReceiptRes = await apiFetch(
    `/api/concierge/orders/${orderId}/receipt`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
      body: JSON.stringify({
        receiptData: Buffer.from('<script>alert(1)</script>').toString(
          'base64'
        ),
        mimeType: 'image/png',
      }),
    }
  );
  assert.equal(fakeReceiptRes.status, 400);
  assert.equal(fakeReceiptRes.body.code, 'INVALID_RECEIPT_FILE_CONTENT');

  // Valid PNG upload succeeds and generates safe UUID filename
  const validReceiptRes = await apiFetch(
    `/api/concierge/orders/${orderId}/receipt`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
      body: JSON.stringify({
        receiptData: VALID_PNG_BASE64,
        merchantReceiptRef: 'INV-OLUVIL-882',
      }),
    }
  );
  assert.equal(validReceiptRes.status, 200);
  assert.equal(validReceiptRes.body.data.receipt.uploaded, true);
  assert.equal(validReceiptRes.body.data.receipt.mimeType, 'image/png');
  assert.match(
    validReceiptRes.body.data.receipt.safeFilename,
    /^receipt-.*\.png$/
  );

  // Unauthorized user (cust-kamal) cannot view receipt
  const unauthReceiptView = await apiFetch(
    `/api/concierge/orders/${orderId}/receipt`,
    {
      headers: { 'X-Demo-Actor-Id': 'cust-kamal' },
    }
  );
  assert.equal(unauthReceiptView.status, 403);

  // Owning customer (cust-ruvini) can view receipt binary
  const ownerReceiptView = await apiFetch(
    `/api/concierge/orders/${orderId}/receipt`,
    {
      headers: { 'X-Demo-Actor-Id': 'cust-ruvini' },
    }
  );
  assert.equal(ownerReceiptView.status, 200);
  assert.equal(ownerReceiptView.headers.get('content-type'), 'image/png');

  // Mark order PURCHASED within approved budget
  const purchaseRes = await apiFetch(
    `/api/concierge/orders/${orderId}/purchase`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
      body: JSON.stringify({
        actualItemSubtotalMinor: 90000,
      }),
    }
  );
  assert.equal(purchaseRes.status, 200);
  assert.equal(purchaseRes.body.data.status, 'PURCHASED');

  // --- TEST 7b: Post-Purchase Cancellation Guard & Exception Flow ---
  const postPurchaseCancel = await apiFetch(
    `/api/concierge/orders/${orderId}/cancel`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': 'cust-ruvini' },
      body: JSON.stringify({ reason: 'Changed my mind after purchase' }),
    }
  );
  assert.equal(postPurchaseCancel.status, 409);
  assert.equal(
    postPurchaseCancel.body.code,
    'POST_PURCHASE_CANCELLATION_FORBIDDEN'
  );

  // Transition PURCHASED -> OUT_FOR_DELIVERY
  const outRes = await apiFetch(
    `/api/concierge/orders/${orderId}/out-for-delivery`,
    {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
    }
  );
  assert.equal(outRes.status, 200);
  assert.equal(outRes.body.data.status, 'OUT_FOR_DELIVERY');

  // --- TEST 9b: Idempotent Delivery Confirmation & Append-Only Settlement Ledger ---
  const riderBefore = await Rider.findOne({ id: winnerId }).lean();
  const balanceBefore = riderBefore.demoLedgerBalanceMinor || 0;

  const [deliv1, deliv2] = await Promise.all([
    apiFetch(`/api/concierge/orders/${orderId}/deliver`, {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
    }),
    apiFetch(`/api/concierge/orders/${orderId}/deliver`, {
      method: 'POST',
      headers: { 'X-Demo-Actor-Id': winnerId },
    }),
  ]);

  assert.equal(deliv1.status, 200);
  assert.equal(deliv2.status, 200);
  assert.equal(deliv1.body.data.status, 'DELIVERED');
  assert.equal(deliv1.body.data.financials.settlementStatus, 'SETTLED');
  assert.equal(deliv1.body.data.financials.riderFundedPurchaseMinor, 90000);
  assert.equal(deliv1.body.data.financials.riderReimbursementMinor, 90000);
  assert.equal(deliv1.body.data.financials.riderDeliveryEarningsMinor, 10000);

  // Verify exactly 5 append-only ledger entries exist (never duplicated)
  const ledgerDocs = await SettlementLedger.find({ orderId }).lean();
  assert.equal(
    ledgerDocs.length,
    5,
    'Repeated delivery confirmation must never duplicate ledger entries'
  );

  const riderAfter = await Rider.findOne({ id: winnerId }).lean();
  assert.equal(
    riderAfter.demoLedgerBalanceMinor,
    balanceBefore + 10000,
    'Rider demoLedgerBalanceMinor must be credited with delivery earnings exactly once'
  );
  assert.equal(
    riderAfter.activeOrderId,
    null,
    'Rider activeOrderId must be released upon delivery'
  );
});

// ============================================================================
// TEST 12: Existing data survives seedDatabase() / backend restart
// ============================================================================
test('12. Rerunning seedDatabase() preserves all existing stores, products, and orders', async () => {
  const storesBefore = await Store.countDocuments();
  const productsBefore = await Product.countDocuments();
  const ordersBefore = await Order.countDocuments();

  await seedDatabase();

  const storesAfter = await Store.countDocuments();
  const productsAfter = await Product.countDocuments();
  const ordersAfter = await Order.countDocuments();

  assert.equal(storesAfter, storesBefore);
  assert.equal(productsAfter, productsBefore);
  assert.equal(ordersAfter, ordersBefore);
});
