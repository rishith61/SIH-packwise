/*
 * MOCK /api/analyze responses: the two demo scenarios from the build spec
 * (§9) plus a generic fallback. These are canned fixtures for building the
 * UI, NOT frontend recommendation logic, and they're never used once
 * VITE_API_BASE_URL is set.
 *
 * `alternatives[].requirements` is an optional extension to the §7.3 draft so
 * the report screen can compare alternatives row by row. It still needs the
 * backend's sign-off.
 */

export const FRESH_PRODUCE_RESULT = {
  freshProduceMode: true,
  recommendation: {
    structure: 'Micro-perforated breathable film (OPP-based)',
    confidence: 'prototype',
  },
  requirements: [
    { label: 'OTR target', value: 'controlled (breathable)', status: 'PASS', provenance: 'rule-derived' },
    { label: 'WVTR target', value: 'moderate', status: 'PASS', provenance: 'rule-derived' },
    { label: 'Thickness', value: 'range placeholder', status: 'REVIEW', provenance: 'prototype estimate' },
    { label: 'Sealability', value: 'medium', status: 'PASS', provenance: 'rule-derived' },
    { label: 'Mechanical protection', value: 'medium', status: 'PASS', provenance: 'rule-derived' },
    { label: 'MAP', value: 'suitable', status: 'PASS', provenance: 'rule-derived' },
  ],
  why: [
    'High respiration rate requires controlled gas exchange.',
    'High relative humidity increases moisture-ingress risk, raising the barrier requirement.',
    'Medium transport stress requires moderate mechanical protection.',
  ],
  alternatives: [
    {
      structure: 'LDPE breathable bag with macro-perforations',
      tradeoffSummary: 'Lower cost, less control over the in-pack atmosphere.',
      requirements: [
        { label: 'OTR target', value: 'high (open)', status: 'REVIEW', provenance: 'rule-derived' },
        { label: 'WVTR target', value: 'high', status: 'REVIEW', provenance: 'rule-derived' },
        { label: 'Thickness', value: 'range placeholder', status: 'REVIEW', provenance: 'prototype estimate' },
        { label: 'Sealability', value: 'high', status: 'PASS', provenance: 'rule-derived' },
        { label: 'Mechanical protection', value: 'low', status: 'REVIEW', provenance: 'rule-derived' },
        { label: 'MAP', value: 'not suited', status: 'REVIEW', provenance: 'rule-derived' },
      ],
    },
    {
      structure: 'Compostable PLA film with micro-perforations',
      tradeoffSummary: 'Higher sustainability score, higher cost band.',
      requirements: [
        { label: 'OTR target', value: 'controlled (breathable)', status: 'PASS', provenance: 'rule-derived' },
        { label: 'WVTR target', value: 'moderate to high', status: 'REVIEW', provenance: 'model-estimated' },
        { label: 'Thickness', value: 'range placeholder', status: 'REVIEW', provenance: 'prototype estimate' },
        { label: 'Sealability', value: 'medium', status: 'PASS', provenance: 'rule-derived' },
        { label: 'Mechanical protection', value: 'low to medium', status: 'REVIEW', provenance: 'model-estimated' },
        { label: 'MAP', value: 'suitable', status: 'PASS', provenance: 'rule-derived' },
      ],
    },
  ],
  freshProduce: {
    gasExchangeRequirement: 'controlled',
    mapSuitable: true,
    configTemplate: {
      note: 'Gas composition values not validated for this scenario — showing configuration template only.',
      o2Target: null,
      co2Target: null,
    },
  },
};

export const DRY_GOODS_RESULT = {
  freshProduceMode: false,
  recommendation: {
    structure: 'PET / Metallised PET / PE',
    confidence: 'prototype',
  },
  requirements: [
    { label: 'OTR target', value: 'low', status: 'PASS', provenance: 'rule-derived' },
    { label: 'WVTR target', value: 'very low', status: 'PASS', provenance: 'rule-derived' },
    { label: 'Light barrier', value: 'high', status: 'PASS', provenance: 'rule-derived' },
    { label: 'Thickness', value: 'range placeholder', status: 'REVIEW', provenance: 'prototype estimate' },
    { label: 'Sealability', value: 'high', status: 'PASS', provenance: 'rule-derived' },
    { label: 'Mechanical protection', value: 'medium', status: 'PASS', provenance: 'rule-derived' },
    { label: 'MAP', value: 'not required', status: 'PASS', provenance: 'rule-derived' },
  ],
  why: [
    'Very low moisture content makes the product highly sensitive to moisture ingress, requiring a very low WVTR.',
    'High fat content with high oxidation sensitivity raises rancidity risk, requiring a low OTR and a light barrier.',
    'The product does not respire, so gas exchange is not needed and a sealed high-barrier laminate is preferred.',
    'Medium transport stress requires moderate mechanical protection against crushing.',
  ],
  alternatives: [
    {
      structure: 'OPP / Metallised OPP',
      tradeoffSummary: 'Lower cost band, slightly weaker oxygen barrier.',
      requirements: [
        { label: 'OTR target', value: 'low to medium', status: 'REVIEW', provenance: 'rule-derived' },
        { label: 'WVTR target', value: 'very low', status: 'PASS', provenance: 'rule-derived' },
        { label: 'Light barrier', value: 'high', status: 'PASS', provenance: 'rule-derived' },
        { label: 'Thickness', value: 'range placeholder', status: 'REVIEW', provenance: 'prototype estimate' },
        { label: 'Sealability', value: 'medium', status: 'PASS', provenance: 'rule-derived' },
        { label: 'Mechanical protection', value: 'medium', status: 'PASS', provenance: 'rule-derived' },
        { label: 'MAP', value: 'not required', status: 'PASS', provenance: 'rule-derived' },
      ],
    },
    {
      structure: 'Mono-material PP with barrier coating',
      tradeoffSummary: 'Recyclable mono-material, higher cost band, barrier needs review.',
      requirements: [
        { label: 'OTR target', value: 'medium', status: 'REVIEW', provenance: 'model-estimated' },
        { label: 'WVTR target', value: 'low', status: 'PASS', provenance: 'model-estimated' },
        { label: 'Light barrier', value: 'medium', status: 'REVIEW', provenance: 'prototype estimate' },
        { label: 'Thickness', value: 'range placeholder', status: 'REVIEW', provenance: 'prototype estimate' },
        { label: 'Sealability', value: 'high', status: 'PASS', provenance: 'rule-derived' },
        { label: 'Mechanical protection', value: 'medium', status: 'PASS', provenance: 'rule-derived' },
        { label: 'MAP', value: 'not required', status: 'PASS', provenance: 'rule-derived' },
      ],
    },
  ],
};

export const GENERIC_RESULT = {
  freshProduceMode: false,
  recommendation: {
    structure: 'PET / Barrier Layer / PE',
    confidence: 'prototype',
  },
  requirements: [
    { label: 'OTR target', value: 'low', status: 'PASS', provenance: 'rule-derived' },
    { label: 'WVTR target', value: 'low', status: 'PASS', provenance: 'rule-derived' },
    { label: 'Thickness', value: 'range placeholder', status: 'REVIEW', provenance: 'prototype estimate' },
    { label: 'Sealability', value: 'high', status: 'PASS', provenance: 'rule-derived' },
    { label: 'Mechanical protection', value: 'medium', status: 'PASS', provenance: 'rule-derived' },
  ],
  why: [
    'Mock response: this generic fixture is returned for every scenario other than the two demo cases.',
    'Connect the backend (VITE_API_BASE_URL) to see requirements derived from your actual inputs.',
  ],
  alternatives: [
    {
      structure: 'Alternative candidate A',
      tradeoffSummary: 'Lower cost, slightly weaker oxygen barrier.',
    },
  ],
};
