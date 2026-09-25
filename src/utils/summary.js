import { STORAGE_TYPES, TRANSPORT_MODES, optionLabel } from '../data/wizard';

/** One-line recap of the user's own conditions, e.g. "chilled storage at 6 °C, 85% RH · …". */
export function conditionsSummary(state) {
  const c = state.conditions;
  const parts = [];
  if (c.storageType) {
    let s = optionLabel(STORAGE_TYPES, c.storageType).toLowerCase() + ' storage';
    if (c.temperatureC !== '') s += ` at ${c.temperatureC} °C`;
    if (c.relativeHumidityPct !== '') s += `, ${c.relativeHumidityPct}% RH`;
    parts.push(s);
  }
  if (c.targetShelfLifeDays !== '') parts.push(`${c.targetShelfLifeDays}-day target shelf life`);
  if (c.transportMode) {
    parts.push(c.transportMode === 'none'
      ? 'no transport'
      : `${optionLabel(TRANSPORT_MODES, c.transportMode).toLowerCase()} transport${c.transportStress ? `, ${c.transportStress} stress` : ''}`);
  }
  return parts.join(' · ');
}
