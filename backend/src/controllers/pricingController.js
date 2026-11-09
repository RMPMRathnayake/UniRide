import Pricing from '../models/Pricing.js';

export async function getPublicPricing(_req, res) {
  const item = await Pricing.findOne({ key: 'global' }).lean() || {
    baseFare: 100, perKmRate: 50, deliverySurcharge: 100
  };
  res.json({ item: {
    baseFare: Number(item.baseFare ?? 100),
    perKmRate: Number(item.perKmRate ?? 50),
    deliverySurcharge: Number(item.deliverySurcharge ?? 100)
  } });
}
