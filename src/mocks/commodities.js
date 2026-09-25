/*
 * MOCK commodity catalog, standing in for GET /api/commodities until the
 * backend exists. Tomato is the spec's own sample payload (§7.3). The other
 * values are rough placeholders for UI development and are labelled
 * "prototype estimate". The backend's data replaces all of this.
 */

const MOCK_SOURCE = 'Mock catalog: placeholder values for UI development, not a verified source';

function f(value, provenance = 'prototype estimate', confidence = 'prototype') {
  return { value, provenance, confidence };
}

function entry(commodityId, name, category, v) {
  return {
    commodityId,
    name,
    category,
    moisturePct: f(v.moisture),
    fatPct: f(v.fat),
    ph: f(v.ph),
    respirationClass: f(v.respiration, 'rule-derived'),
    oxidationSensitivity: f(v.oxidation, 'rule-derived'),
    source: MOCK_SOURCE,
  };
}

export const MOCK_COMMODITIES = [
  {
    commodityId: 'TOMATO_GENERIC',
    name: 'Tomato',
    category: 'fresh_produce',
    moisturePct: { value: 94.0, provenance: 'source-backed', confidence: 'medium' },
    ph: { value: 4.5, provenance: 'source-backed', confidence: 'medium' },
    fatPct: { value: 0.2, provenance: 'source-backed', confidence: 'medium' },
    respirationClass: { value: 'high', provenance: 'rule-derived', confidence: 'medium' },
    oxidationSensitivity: { value: 'medium', provenance: 'rule-derived', confidence: 'medium' },
    source: 'Spec sample payload (build spec §7.3), mock data',
  },
  entry('SPINACH_GENERIC', 'Spinach', 'fresh_produce', { moisture: 91, fat: 0.4, ph: 6.5, respiration: 'high', oxidation: 'medium' }),
  entry('BANANA_GENERIC', 'Banana', 'fresh_produce', { moisture: 75, fat: 0.3, ph: 5.0, respiration: 'medium', oxidation: 'medium' }),
  entry('POTATO_CHIPS', 'Potato chips', 'snack', { moisture: 2, fat: 35, ph: 6.0, respiration: 'none', oxidation: 'high' }),
  entry('BISCUITS_GENERIC', 'Biscuits', 'snack', { moisture: 3, fat: 20, ph: 6.5, respiration: 'none', oxidation: 'medium' }),
  entry('BASMATI_RICE', 'Basmati rice', 'dry_goods', { moisture: 12, fat: 0.9, ph: 6.5, respiration: 'none', oxidation: 'low' }),
  entry('WHEAT_FLOUR', 'Wheat flour', 'dry_goods', { moisture: 12, fat: 1.5, ph: 6.0, respiration: 'none', oxidation: 'medium' }),
  entry('PANEER_GENERIC', 'Paneer', 'dairy', { moisture: 55, fat: 22, ph: 5.8, respiration: 'none', oxidation: 'medium' }),
  entry('MILK_POWDER', 'Milk powder', 'dairy', { moisture: 3, fat: 26, ph: 6.7, respiration: 'none', oxidation: 'high' }),
  entry('CHICKEN_FRESH', 'Fresh chicken', 'meat_seafood', { moisture: 75, fat: 4, ph: 6.0, respiration: 'none', oxidation: 'medium' }),
  entry('FISH_FRESH', 'Fresh fish', 'meat_seafood', { moisture: 78, fat: 2, ph: 6.8, respiration: 'none', oxidation: 'high' }),
  // pH isn't meaningful for oil: the payload carries null rather than a made-up number.
  { ...entry('GROUNDNUT_OIL', 'Groundnut oil', 'other', { moisture: 0.1, fat: 99.9, ph: null, respiration: 'none', oxidation: 'high' }), ph: { value: null, provenance: null, confidence: null } },
];
