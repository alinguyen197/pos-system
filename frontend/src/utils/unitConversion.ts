export const normalizeUnit = (u: string): string => {
  if (!u) return ''
  const str = u.trim().toLowerCase()
  if (['lít', 'lit', 'l'].includes(str)) return 'lit'
  if (['ml', 'milliliter', 'cc'].includes(str)) return 'ml'
  if (['kg', 'kilogram', 'kilo'].includes(str)) return 'kg'
  if (['g', 'gram', 'gr'].includes(str)) return 'g'
  if (['mg', 'milligram'].includes(str)) return 'mg'
  return str
}

/**
 * Returns how many `baseUnit` are equivalent to 1 `targetUnit`.
 * Formula: 1 `targetUnit` = `factor` * `baseUnit`
 *
 * Example 1: baseUnit = 'lit', targetUnit = 'ml' -> 1 ml = 0.001 lit -> factor = 0.001
 * Cost per ml = baseUnitCost * 0.001 (e.g. 1,000 ₫/lit * 0.001 = 1 ₫/ml)
 *
 * Example 2: baseUnit = 'kg', targetUnit = 'g' -> 1 g = 0.001 kg -> factor = 0.001
 * Cost per g = baseUnitCost * 0.001 (e.g. 180,000 ₫/kg * 0.001 = 180 ₫/g)
 */
export const getUnitConversionFactor = (baseUnit: string, targetUnit: string): number => {
  const base = normalizeUnit(baseUnit)
  const target = normalizeUnit(targetUnit)

  if (base === target) return 1

  // Volume conversions (lit <-> ml)
  if (base === 'lit' && target === 'ml') return 0.001
  if (base === 'ml' && target === 'lit') return 1000

  // Weight conversions (kg <-> g <-> mg)
  if (base === 'kg' && target === 'g') return 0.001
  if (base === 'g' && target === 'kg') return 1000
  if (base === 'kg' && target === 'mg') return 0.000001
  if (base === 'mg' && target === 'kg') return 1000000
  if (base === 'g' && target === 'mg') return 0.001
  if (base === 'mg' && target === 'g') return 1000

  return 1
}

export const COMMON_UNITS = ['ly', 'g', 'ml', 'kg', 'lít', 'cốc', 'phần', 'hộp', 'lon', 'chai', 'gói', 'cái', 'thùng']
