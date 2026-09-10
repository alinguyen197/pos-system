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
