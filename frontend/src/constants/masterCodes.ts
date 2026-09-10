export const MASTER_CODES = {
  FILTER: {
    ALL: 'all',
  },
  PRODUCT_CATEGORY: {
    COFFEE: 'coffee',
    TEA: 'tea',
    CAKE: 'cake',
  },
  INGREDIENT_CATEGORY: {
    COFFEE_BEANS: 'coffee_beans',
    MILK_CREAM: 'milk_cream',
    SYRUP_SUGAR: 'syrup_sugar',
    PACKAGING: 'packaging',
  },
  STOCK_STATUS: {
    SAFE: 'safe',
    NEED_IMPORT: 'need_import',
    NEAR_EMPTY: 'near_empty',
    VERY_LOW: 'very_low',
    OUT_OF_STOCK: 'out_of_stock',
  },
  PRODUCT_STATUS: {
    IN_BUSINESS: 'in_business',
    SUSPENDED: 'suspended',
  },
  USER_ROLE: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    VIEWER: 'viewer',
  },
  UNIT: {
    KG: 'kg',
    GRAM: 'g',
    LITER: 'lit',
    ML: 'ml',
    BOX: 'hop',
    CAN: 'lon',
    BOTTLE: 'chai',
    PACKET: 'goi',
    CUP: 'ly',
    PORTION: 'phan',
    PIECE: 'cai',
  },
} as const

export const INGREDIENT_CATEGORY_OPTIONS = [
  { code: MASTER_CODES.FILTER.ALL, label: 'Tất cả' },
  { code: MASTER_CODES.INGREDIENT_CATEGORY.COFFEE_BEANS, label: 'Cà phê hạt' },
  { code: MASTER_CODES.INGREDIENT_CATEGORY.MILK_CREAM, label: 'Sữa & Kem' },
  { code: MASTER_CODES.INGREDIENT_CATEGORY.SYRUP_SUGAR, label: 'Siro & Đường' },
  { code: MASTER_CODES.INGREDIENT_CATEGORY.PACKAGING, label: 'Đóng gói' },
]

export const PRODUCT_CATEGORY_OPTIONS = [
  { code: MASTER_CODES.FILTER.ALL, label: 'Tất cả' },
  { code: MASTER_CODES.PRODUCT_CATEGORY.COFFEE, label: 'Cà phê' },
  { code: MASTER_CODES.PRODUCT_CATEGORY.TEA, label: 'Trà' },
  { code: MASTER_CODES.PRODUCT_CATEGORY.CAKE, label: 'Bánh ngọt' },
]

export const UNIT_OPTIONS = [
  { code: 'kg', label: 'kg' },
  { code: 'g', label: 'g' },
  { code: 'lit', label: 'lít' },
  { code: 'ml', label: 'ml' },
  { code: 'hop', label: 'hộp' },
  { code: 'lon', label: 'lon' },
  { code: 'chai', label: 'chai' },
  { code: 'goi', label: 'gói' },
  { code: 'ly', label: 'ly' },
  { code: 'phan', label: 'phần' },
  { code: 'cai', label: 'cái' },
]

export const STOCK_STATUS_MAP: Record<string, { label: string; class: string }> = {
  [MASTER_CODES.STOCK_STATUS.SAFE]: { label: 'An toàn', class: 'bg-[#c9edb5]/60 text-[#326824]' },
  [MASTER_CODES.STOCK_STATUS.NEED_IMPORT]: { label: 'Cần nhập', class: 'bg-[#ffe082]/50 text-[#8c6b00]' },
  [MASTER_CODES.STOCK_STATUS.NEAR_EMPTY]: { label: 'Gần hết', class: 'bg-[#ffe082]/50 text-[#8c6b00]' },
  [MASTER_CODES.STOCK_STATUS.VERY_LOW]: { label: 'Rất thấp', class: 'bg-[#ffdad6] text-[#ba1a1a]' },
  [MASTER_CODES.STOCK_STATUS.OUT_OF_STOCK]: { label: 'Đã hết', class: 'bg-[#ffdad6] text-[#ba1a1a]' },
}
