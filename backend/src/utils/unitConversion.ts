/**
 * Universal Unit Conversion Utility for Sky Coffee Management
 * Handles Weight, Volume, Piece/Count equivalents, Multi-packs, and Container extraction.
 */

export interface NormalizedUnitInfo {
  category: 'weight' | 'volume' | 'piece' | 'container' | 'multipack' | 'unknown'
  normalized: string
  baseFactor: number // factor to base unit (weight: g, volume: ml, piece: 1)
}

/**
 * Remove Vietnamese accents/diacritics for robust matching
 */
export const removeDiacritics = (str: string): string => {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase()
}

/**
 * Normalizes a unit string into a standard canonical form
 */
export const normalizeUnit = (u: string): string => {
  if (!u) return ''
  const clean = removeDiacritics(u)

  // Weight units
  if (['kg', 'kilogram', 'kilo', 'ky'].includes(clean)) return 'kg'
  if (['g', 'gram', 'gr', 'gam'].includes(clean)) return 'g'
  if (['mg', 'milligram'].includes(clean)) return 'mg'
  if (['lang', 'lạng'].includes(clean)) return 'lang'

  // Volume units
  if (['lit', 'l', 'liter', 'litre'].includes(clean)) return 'lit'
  if (['ml', 'milliliter', 'milit', 'cc'].includes(clean)) return 'ml'
  if (['cl'].includes(clean)) return 'cl'
  if (['oz', 'fl oz', 'fl.oz', 'ounce'].includes(clean)) return 'oz'
  if (['shot'].includes(clean)) return 'shot'
  if (['tsp', 'muong ca phe', 'thia ca phe', 'mcp'].includes(clean)) return 'tsp'
  if (['tbsp', 'muong canh', 'thia canh', 'mc'].includes(clean)) return 'tbsp'

  // Multi-pack units
  if (['chuc'].includes(clean)) return 'chuc'
  if (['ta'].includes(clean)) return 'ta'
  if (['vi'].includes(clean)) return 'vi'
  if (['khay'].includes(clean)) return 'khay'
  if (['thung'].includes(clean)) return 'thung'

  // Containers
  if (['lon', 'hop', 'chai', 'bich', 'tui', 'hu', 'lo'].includes(clean)) {
    return clean
  }

  // Piece / Count units (Single piece equivalent)
  if (['cai', 'chiec', 'qua', 'trai', 'hot', 'vien', 'mieng', 'lat', 'goi', 'ly', 'coc', 'phan', 'cuon', 'thanh', 'tep', 'nhanh', 'dia', 'que', 'cong', 'la', 'ong', 'to'].includes(clean)) {
    return clean
  }

  return clean
}

/**
 * Get category and base conversion factor for standard units
 */
export const getUnitInfo = (u: string): NormalizedUnitInfo => {
  const norm = normalizeUnit(u)

  // Weight (base: g)
  if (norm === 'kg') return { category: 'weight', normalized: 'kg', baseFactor: 1000 }
  if (norm === 'g') return { category: 'weight', normalized: 'g', baseFactor: 1 }
  if (norm === 'mg') return { category: 'weight', normalized: 'mg', baseFactor: 0.001 }
  if (norm === 'lang') return { category: 'weight', normalized: 'lang', baseFactor: 100 }

  // Volume (base: ml)
  if (norm === 'lit') return { category: 'volume', normalized: 'lit', baseFactor: 1000 }
  if (norm === 'ml') return { category: 'volume', normalized: 'ml', baseFactor: 1 }
  if (norm === 'cl') return { category: 'volume', normalized: 'cl', baseFactor: 10 }
  if (norm === 'oz') return { category: 'volume', normalized: 'oz', baseFactor: 30 }
  if (norm === 'shot') return { category: 'volume', normalized: 'shot', baseFactor: 30 }
  if (norm === 'tsp') return { category: 'volume', normalized: 'tsp', baseFactor: 5 }
  if (norm === 'tbsp') return { category: 'volume', normalized: 'tbsp', baseFactor: 15 }

  // Multi-packs (base: 1 piece)
  if (norm === 'chuc') return { category: 'multipack', normalized: 'chuc', baseFactor: 10 }
  if (norm === 'ta') return { category: 'multipack', normalized: 'ta', baseFactor: 12 }
  if (norm === 'vi') return { category: 'multipack', normalized: 'vi', baseFactor: 10 }
  if (norm === 'khay') return { category: 'multipack', normalized: 'khay', baseFactor: 30 }
  if (norm === 'thung') return { category: 'multipack', normalized: 'thung', baseFactor: 24 }

  // Containers (lon, hop, chai, bich, tui, hu, lo)
  if (['lon', 'hop', 'chai', 'bich', 'tui', 'hu', 'lo'].includes(norm)) {
    return { category: 'container', normalized: norm, baseFactor: 1 }
  }

  // Piece units (base: 1 piece)
  const pieceUnits = [
    'cai', 'chiec', 'qua', 'trai', 'hot', 'vien', 'mieng', 'lat',
    'goi', 'ly', 'coc', 'phan',
    'cuon', 'thanh', 'tep', 'nhanh', 'dia', 'que', 'cong', 'la', 'ong', 'to'
  ]
  if (pieceUnits.includes(norm)) {
    return { category: 'piece', normalized: norm, baseFactor: 1 }
  }

  return { category: 'unknown', normalized: norm, baseFactor: 1 }
}

/**
 * Parse capacity or weight from item name (e.g. "Sữa tươi 1L" -> 1000ml, "Muối 120G" -> 120g, "Monin 700ml" -> 700ml)
 */
export const extractCapacityFromName = (name?: string): { value: number; type: 'weight' | 'volume' } | null => {
  if (!name) return null
  const cleanName = removeDiacritics(name)

  // Match volume: 1L, 1.5L, 5L, 700ml, 900ml
  const volMatch = cleanName.match(/(\d+(?:\.\d+)?)\s*(l|lit|ml|cc)/i)
  if (volMatch) {
    const num = parseFloat(volMatch[1])
    const unit = volMatch[2].toLowerCase()
    if (unit === 'l' || unit === 'lit') {
      return { value: num * 1000, type: 'volume' } // in ml
    }
    return { value: num, type: 'volume' } // in ml
  }

  // Match weight: 2.1 kg, 1 kg, 800g, 120g
  const weightMatch = cleanName.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|ky|g|gr|gram|gam)/i)
  if (weightMatch) {
    const num = parseFloat(weightMatch[1])
    const unit = weightMatch[2].toLowerCase()
    if (unit === 'kg' || unit === 'kilo' || unit === 'ky') {
      return { value: num * 1000, type: 'weight' } // in g
    }
    return { value: num, type: 'weight' } // in g
  }

  return null
}

/**
 * Known standard pack sizes for F&B items
 */
const getKnownItemSpec = (itemName?: string): { pieceWeightG?: number; pieceVolumeMl?: number; packCount?: number } | null => {
  if (!itemName) return null
  const clean = removeDiacritics(itemName)

  // Eggs (Trứng gà, trứng vịt)
  if (clean.includes('trung')) {
    return { pieceWeightG: 50, packCount: 10 } // 1 hộp/vỉ = 10 quả, 1 quả ~ 50g
  }

  // Condensed milk (Sữa đặc)
  if (clean.includes('sua dac')) {
    return { pieceWeightG: 380, pieceVolumeMl: 380, packCount: 1 } // 1 lon = 380g
  }

  // Instant noodles (Mì gói)
  if (clean.includes('mi goi') || clean.includes('mi tom') || clean.includes('mi vi huong')) {
    return { pieceWeightG: 60, packCount: 30 } // 1 gói = 60g
  }

  // Popcorn Chicken (Gà popcorn)
  if (clean.includes('ga popcorn')) {
    return { pieceWeightG: 20 } // 1 viên ~ 20g (50 viên = 1kg)
  }

  // Cheese slice (Phô mai lát)
  if (clean.includes('pho mai lat')) {
    return { pieceWeightG: 20 } // 1 lát ~ 20g (50 lát = 1kg)
  }

  return null
}

/**
 * Returns how many `toUnit` are in 1 `fromUnit`.
 * Formula: `amountInToUnit = amountInFromUnit * getConversionFactor(fromUnit, toUnit, itemName)`
 */
export const getConversionFactor = (
  fromUnit: string,
  toUnit: string,
  itemName?: string
): number => {
  if (!fromUnit || !toUnit) return 1

  const fromInfo = getUnitInfo(fromUnit)
  const toInfo = getUnitInfo(toUnit)

  // Exact match
  if (fromInfo.normalized === toInfo.normalized) return 1

  // 1. Same Category: Weight <-> Weight (g, kg, mg, lạng)
  if (fromInfo.category === 'weight' && toInfo.category === 'weight') {
    return fromInfo.baseFactor / toInfo.baseFactor
  }

  // 2. Same Category: Volume <-> Volume (ml, lit, cl, oz, shot, tsp, tbsp)
  if (fromInfo.category === 'volume' && toInfo.category === 'volume') {
    return fromInfo.baseFactor / toInfo.baseFactor
  }

  // 3. Weight <-> Volume (Density ~ 1 g = 1 ml, 1 kg = 1 lít for culinary liquids/sauces)
  if (
    (fromInfo.category === 'weight' && toInfo.category === 'volume') ||
    (fromInfo.category === 'volume' && toInfo.category === 'weight')
  ) {
    return fromInfo.baseFactor / toInfo.baseFactor
  }

  // 4. Special Contextual Item rules (Eggs, Canned milk, Box of eggs, etc.)
  const cleanName = removeDiacritics(itemName || '')
  const capacity = extractCapacityFromName(itemName)
  const knownSpec = getKnownItemSpec(itemName)

  // 4a. Eggs (Trứng gà / Trứng vịt)
  if (cleanName.includes('trung')) {
    // Single egg (cái, quả, trái, hột) <-> Box/Vỉ of eggs (hộp, vỉ = 10 quả)
    if (['cai', 'qua', 'trai', 'hot'].includes(fromInfo.normalized) && ['hop', 'vi'].includes(toInfo.normalized)) {
      return 0.1 // 1 quả = 0.1 hộp
    }
    if (['hop', 'vi'].includes(fromInfo.normalized) && ['cai', 'qua', 'trai', 'hot'].includes(toInfo.normalized)) {
      return 10 // 1 hộp = 10 quả
    }
    // Single egg <-> Tray of eggs (khay = 30 quả)
    if (['cai', 'qua', 'trai', 'hot'].includes(fromInfo.normalized) && toInfo.normalized === 'khay') {
      return 1 / 30
    }
    if (fromInfo.normalized === 'khay' && ['cai', 'qua', 'trai', 'hot'].includes(toInfo.normalized)) {
      return 30
    }
  }

  // 4b. Piece / Count <-> Multi-pack (cái/quả <-> chục, tá, vỉ, khay)
  const isFromCount = fromInfo.category === 'piece' || fromInfo.category === 'multipack'
  const isToCount = toInfo.category === 'piece' || toInfo.category === 'multipack'

  if (isFromCount && isToCount) {
    return fromInfo.baseFactor / toInfo.baseFactor
  }

  // 5. Piece / Container <-> Weight / Volume with Item Context
  // 5a. From Piece (e.g. 'cái', 'gói', 'viên', 'lát', 'quả') -> To Weight (e.g. 'kg', 'g')
  if ((fromInfo.category === 'piece' || fromInfo.category === 'container') && toInfo.category === 'weight') {
    let pieceG = 0
    if (knownSpec?.pieceWeightG) {
      pieceG = knownSpec.pieceWeightG
    } else if (capacity?.type === 'weight') {
      pieceG = capacity.value
    }
    if (pieceG > 0) {
      return (pieceG / toInfo.baseFactor)
    }
  }

  // 5b. From Weight (e.g. 'g', 'kg') -> To Piece / Container (e.g. 'cái', 'gói', 'viên', 'lát', 'lon', 'hop', 'chai')
  if (fromInfo.category === 'weight' && (toInfo.category === 'piece' || toInfo.category === 'container')) {
    let pieceG = 0
    if (knownSpec?.pieceWeightG) {
      pieceG = knownSpec.pieceWeightG
    } else if (capacity?.type === 'weight') {
      pieceG = capacity.value
    }
    if (pieceG > 0) {
      return (fromInfo.baseFactor / pieceG)
    }
  }

  // 5c. From Container (e.g. 'lon', 'chai', 'hop', 'bich') -> To Volume/Weight (e.g. 'ml', 'lit', 'g', 'kg')
  if ((fromInfo.category === 'container' || fromInfo.category === 'piece') && (toInfo.category === 'volume' || toInfo.category === 'weight')) {
    let containerSize = 0
    if (capacity) {
      containerSize = capacity.value
    } else if (knownSpec?.pieceVolumeMl || knownSpec?.pieceWeightG) {
      containerSize = knownSpec.pieceVolumeMl || knownSpec.pieceWeightG || 0
    }
    if (containerSize > 0) {
      return (containerSize / toInfo.baseFactor)
    }
  }

  // 5d. From Volume/Weight (e.g. 'ml', 'lit', 'g', 'kg') -> To Container (e.g. 'lon', 'chai', 'hop', 'bich')
  if ((fromInfo.category === 'volume' || fromInfo.category === 'weight') && (toInfo.category === 'container' || toInfo.category === 'piece')) {
    let containerSize = 0
    if (capacity) {
      containerSize = capacity.value
    } else if (knownSpec?.pieceVolumeMl || knownSpec?.pieceWeightG) {
      containerSize = knownSpec.pieceVolumeMl || knownSpec.pieceWeightG || 0
    }
    if (containerSize > 0) {
      return (fromInfo.baseFactor / containerSize)
    }
  }

  // 6. Generic Piece & Container 1:1 fallback (e.g. cái <-> quả, lát <-> cái, hộp <-> hộp, ly <-> cốc, bao nilon <-> cái)
  const pieceLike = ['cai', 'chiec', 'qua', 'trai', 'hot', 'vien', 'mieng', 'lat', 'goi', 'bich', 'lon', 'hop', 'chai', 'ly', 'coc', 'phan', 'tui', 'cuon', 'thanh', 'tep', 'nhanh', 'dia', 'que', 'cong', 'la', 'ong', 'to']
  if (pieceLike.includes(fromInfo.normalized) && pieceLike.includes(toInfo.normalized)) {
    return 1
  }

  return 1
}

/**
 * Calculates stock deduction amount for an order item
 * @param recipeAmount Amount specified in recipe (e.g. 20)
 * @param recipeUnit Unit specified in recipe (e.g. 'g')
 * @param stockUnit Unit of stock item in inventory (e.g. 'kg')
 * @param itemName Optional name of stock item (e.g. 'Cà phê Robusta Hạt')
 * @returns Amount to deduct in `stockUnit`
 */
export const calculateRecipeDeduction = (
  recipeAmount: number,
  recipeUnit: string,
  stockUnit: string,
  itemName?: string
): number => {
  const amt = Number(recipeAmount) || 0
  if (amt <= 0) return 0

  const factor = getConversionFactor(recipeUnit, stockUnit, itemName)
  let deducted = amt * factor

  // Safety guard against gross unit errors (e.g. user entered 15 kg for coffee in 1 cup)
  const sUnit = normalizeUnit(stockUnit)
  const rUnit = normalizeUnit(recipeUnit)
  if ((sUnit === 'kg' || sUnit === 'lit') && rUnit === sUnit && amt >= 5) {
    const clean = removeDiacritics(itemName || '')
    if (clean.includes('ca phe') || clean.includes('duong') || clean.includes('muoi') || clean.includes('bot') || clean.includes('tra')) {
      deducted = (amt / 1000)
    }
  }

  return deducted
}

/**
 * Calculates recipe cost factor for product costing
 * @param amount Amount specified in recipe (e.g. 20)
 * @param recipeUnit Unit specified in recipe (e.g. 'g')
 * @param stockUnit Unit of stock item (e.g. 'kg')
 * @param itemName Optional name of stock item
 * @returns Multiplier against stockItem.costPerUnit
 */
export const calculateRecipeCostFactor = (
  amount: number,
  recipeUnit: string,
  stockUnit: string,
  itemName?: string
): number => {
  return calculateRecipeDeduction(amount, recipeUnit, stockUnit, itemName)
}

export const COMMON_UNITS = [
  'ly',
  'g',
  'ml',
  'kg',
  'lít',
  'cốc',
  'phần',
  'hộp',
  'lon',
  'chai',
  'gói',
  'cái',
  'quả',
  'viên',
  'lát',
  'vỉ',
  'thùng',
]
