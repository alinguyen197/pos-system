import db from '../models'
import { parseError } from '../utils'

const initialMasterCodes = [
  // Common Filters
  { groupCategory: 'COMMON_FILTER', code: 'all', label: 'Tất cả', sortOrder: 0 },

  // Product Categories
  { groupCategory: 'PRODUCT_CATEGORY', code: 'coffee', label: 'Cà phê', sortOrder: 1 },
  { groupCategory: 'PRODUCT_CATEGORY', code: 'tea', label: 'Trà', sortOrder: 2 },
  { groupCategory: 'PRODUCT_CATEGORY', code: 'cake', label: 'Bánh ngọt', sortOrder: 3 },

  // Ingredient Categories
  { groupCategory: 'INGREDIENT_CATEGORY', code: 'coffee_beans', label: 'Cà phê hạt', sortOrder: 1 },
  { groupCategory: 'INGREDIENT_CATEGORY', code: 'milk_cream', label: 'Sữa & Kem', sortOrder: 2 },
  { groupCategory: 'INGREDIENT_CATEGORY', code: 'syrup_sugar', label: 'Siro & Đường', sortOrder: 3 },
  { groupCategory: 'INGREDIENT_CATEGORY', code: 'packaging', label: 'Đóng gói', sortOrder: 4 },

  // Stock Status
  { groupCategory: 'STOCK_STATUS', code: 'safe', label: 'An toàn', sortOrder: 1 },
  { groupCategory: 'STOCK_STATUS', code: 'need_import', label: 'Cần nhập', sortOrder: 2 },
  { groupCategory: 'STOCK_STATUS', code: 'near_empty', label: 'Gần hết', sortOrder: 3 },
  { groupCategory: 'STOCK_STATUS', code: 'very_low', label: 'Rất thấp', sortOrder: 4 },
  { groupCategory: 'STOCK_STATUS', code: 'out_of_stock', label: 'Đã hết', sortOrder: 5 },

  // Product Status
  { groupCategory: 'PRODUCT_STATUS', code: 'in_business', label: 'Đang kinh doanh', sortOrder: 1 },
  { groupCategory: 'PRODUCT_STATUS', code: 'suspended', label: 'Tạm ngừng', sortOrder: 2 },

  // User Roles
  { groupCategory: 'USER_ROLE', code: 'admin', label: 'Quản trị viên', sortOrder: 1 },
  { groupCategory: 'USER_ROLE', code: 'manager', label: 'Quản lý cửa hàng', sortOrder: 2 },
  { groupCategory: 'USER_ROLE', code: 'staff', label: 'Nhân viên thu ngân / Pha chế', sortOrder: 3 },
  { groupCategory: 'USER_ROLE', code: 'viewer', label: 'Người xem', sortOrder: 4 },

  // Units of Measurement (Đơn vị tính)
  { groupCategory: 'UNIT', code: 'ly', label: 'ly', sortOrder: 1 },
  { groupCategory: 'UNIT', code: 'kg', label: 'kg', sortOrder: 2 },
  { groupCategory: 'UNIT', code: 'g', label: 'g', sortOrder: 3 },
  { groupCategory: 'UNIT', code: 'lit', label: 'lít', sortOrder: 4 },
  { groupCategory: 'UNIT', code: 'ml', label: 'ml', sortOrder: 5 },
  { groupCategory: 'UNIT', code: 'coc', label: 'cốc', sortOrder: 6 },
  { groupCategory: 'UNIT', code: 'hop', label: 'hộp', sortOrder: 7 },
  { groupCategory: 'UNIT', code: 'lon', label: 'lon', sortOrder: 8 },
  { groupCategory: 'UNIT', code: 'chai', label: 'chai', sortOrder: 9 },
  { groupCategory: 'UNIT', code: 'goi', label: 'gói', sortOrder: 10 },
  { groupCategory: 'UNIT', code: 'phan', label: 'phần', sortOrder: 11 },
  { groupCategory: 'UNIT', code: 'cai', label: 'cái', sortOrder: 12 },
  { groupCategory: 'UNIT', code: 'thung', label: 'thùng', sortOrder: 13 },
]

const seedInitialMasterCodes = async () => {
  try {
    if (db.sequelize.getDialect() === 'postgres') {
      try {
        await db.sequelize.query(`SELECT setval('master_codes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master_codes));`)
      } catch (seqError) {
        // Ignore sequence error
      }
    }

    let createdCount = 0
    for (const item of initialMasterCodes) {
      const exists = await db.MasterCode.findOne({
        where: { groupCategory: item.groupCategory, code: item.code },
      })
      if (!exists) {
        await db.MasterCode.create({
          groupCategory: item.groupCategory,
          code: item.code,
          label: item.label,
          sortOrder: item.sortOrder,
          isActive: true,
        })
        createdCount++
      }
    }

    if (db.sequelize.getDialect() === 'postgres') {
      try {
        await db.sequelize.query(`SELECT setval('master_codes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master_codes));`)
      } catch (seqError) {
        // Ignore sequence error
      }
    }

    if (createdCount > 0) {
      console.log(`✅ Seeded ${createdCount} new MasterCode records into database!`)
    }
  } catch (error) {
    console.error('Error seeding initial master codes data:', error)
  }
}

const getMasterCodes = async (groupCategory?: string) => {
  try {
    await seedInitialMasterCodes()

    const whereCondition: any = { isActive: true }
    if (groupCategory) {
      whereCondition.groupCategory = groupCategory
    }

    const items = await db.MasterCode.findAll({
      where: whereCondition,
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    })

    return items.map((item: any) => ({
      id: item.id,
      groupCategory: item.groupCategory,
      code: item.code,
      label: item.label,
      sortOrder: item.sortOrder,
    }))
  } catch (error) {
    console.warn('⚠️ DB query failed, returning in-memory master code fallback:', error)
    let filtered = initialMasterCodes
    if (groupCategory) {
      filtered = filtered.filter((item) => item.groupCategory === groupCategory)
    }
    return filtered.map((item, idx) => ({
      id: idx + 1,
      groupCategory: item.groupCategory,
      code: item.code,
      label: item.label,
      sortOrder: item.sortOrder,
    }))
  }
}

export default {
  getMasterCodes,
  seedInitialMasterCodes,
}
