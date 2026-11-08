import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MAX_RECEIPT_SIZE_BYTES = Number(
  process.env.MAX_RECEIPT_SIZE_BYTES || 5 * 1024 * 1024 // 5 MB default
);

const DEFAULT_STORAGE_DIR = path.resolve(
  __dirname,
  '..',
  process.env.RECEIPT_STORAGE_DIR || 'storage/receipts'
);

/**
 * Inspects actual file magic bytes to verify genuine JPEG, PNG, or WebP image content.
 * Prevents disguised scripts, HTML, or invalid payloads from being uploaded as receipts.
 *
 * @param {Buffer} buffer
 * @returns {{ mimeType: string, extension: string } | null}
 */
export function detectImageMagicBytes(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: '.jpg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: '.png' };
  }

  // 3. WebP: "RIFF" (0..3) and "WEBP" (8..11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mimeType: 'image/webp', extension: '.webp' };
  }

  return null;
}

/**
 * Parses a base64 data URL (`data:image/png;base64,...`) or raw base64 string into a Buffer.
 */
export function parseReceiptPayloadToBuffer(payload, declaredMimeType = '') {
  if (Buffer.isBuffer(payload)) {
    return { buffer: payload, declaredMimeType };
  }

  if (typeof payload !== 'string' || payload.trim() === '') {
    const err = new Error('Receipt image payload is required.');
    err.status = 400;
    err.code = 'MISSING_RECEIPT_PAYLOAD';
    throw err;
  }

  let base64Data = payload.trim();
  let extractedMime = declaredMimeType ? declaredMimeType.trim().toLowerCase() : '';

  const dataUrlMatch = base64Data.match(
    /^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/s
  );
  if (dataUrlMatch) {
    extractedMime = dataUrlMatch[1].toLowerCase();
    base64Data = dataUrlMatch[2];
  }

  const buffer = Buffer.from(base64Data, 'base64');
  return { buffer, declaredMimeType: extractedMime };
}

/**
 * Validates and persists a receipt image using the local filesystem storage adapter.
 */
export async function saveValidatedReceipt({
  payload,
  declaredMimeType = '',
  orderId = '',
}) {
  const { buffer, declaredMimeType: parsedMime } = parseReceiptPayloadToBuffer(
    payload,
    declaredMimeType
  );

  if (buffer.length === 0) {
    const err = new Error('Receipt file cannot be empty.');
    err.status = 400;
    err.code = 'EMPTY_RECEIPT_FILE';
    throw err;
  }

  if (buffer.length > MAX_RECEIPT_SIZE_BYTES) {
    const err = new Error(
      `Receipt file size (${buffer.length} bytes) exceeds maximum limit of ${MAX_RECEIPT_SIZE_BYTES} bytes.`
    );
    err.status = 413;
    err.code = 'RECEIPT_FILE_TOO_LARGE';
    throw err;
  }

  const detected = detectImageMagicBytes(buffer);
  if (!detected) {
    const err = new Error(
      'Invalid receipt file content. Only genuine JPEG, PNG, or WebP images are accepted.'
    );
    err.status = 400;
    err.code = 'INVALID_RECEIPT_FILE_CONTENT';
    throw err;
  }

  if (
    parsedMime &&
    parsedMime !== detected.mimeType &&
    !(parsedMime === 'image/jpg' && detected.mimeType === 'image/jpeg')
  ) {
    const err = new Error(
      `Declared MIME type (${parsedMime}) does not match actual image signature (${detected.mimeType}).`
    );
    err.status = 400;
    err.code = 'RECEIPT_MIME_MISMATCH';
    throw err;
  }

  await fs.mkdir(DEFAULT_STORAGE_DIR, { recursive: true });

  // Safe generated filename using random UUID — never uses client-supplied filename
  const safeOrderPrefix = String(orderId || 'order')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 24);
  const safeFilename = `receipt-${safeOrderPrefix}-${crypto.randomUUID()}${detected.extension}`;
  const fullPath = path.join(DEFAULT_STORAGE_DIR, safeFilename);

  await fs.writeFile(fullPath, buffer);

  return {
    storageKey: safeFilename,
    safeFilename,
    mimeType: detected.mimeType,
    sizeBytes: buffer.length,
    uploadedAt: new Date(),
  };
}

/**
 * Reads a persisted receipt image from storage by its safe storageKey.
 */
export async function readReceiptFromStorage(storageKey) {
  if (!storageKey || typeof storageKey !== 'string') {
    const err = new Error('Receipt storage key is missing.');
    err.status = 404;
    throw err;
  }

  // Prevent any path traversal
  const cleanKey = path.basename(storageKey);
  if (cleanKey !== storageKey || cleanKey.includes('..')) {
    const err = new Error('Invalid receipt storage key.');
    err.status = 400;
    throw err;
  }

  const fullPath = path.join(DEFAULT_STORAGE_DIR, cleanKey);
  const buffer = await fs.readFile(fullPath);
  return buffer;
}
