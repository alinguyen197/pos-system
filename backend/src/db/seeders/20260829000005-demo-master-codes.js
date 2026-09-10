'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()
    await queryInterface.bulkInsert(
      'master_codes',
      [
        // Common Filters
        { id: 1, groupCategory: 'COMMON_FILTER', code: 'all', label: 'Tất cả', sortOrder: 0, isActive: true, createdAt: now, updatedAt: now },

        // Product Categories
        { id: 2, groupCategory: 'PRODUCT_CATEGORY', code: 'coffee', label: 'Cà phê', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
        { id: 3, groupCategory: 'PRODUCT_CATEGORY', code: 'tea', label: 'Trà', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
        { id: 4, groupCategory: 'PRODUCT_CATEGORY', code: 'cake', label: 'Bánh ngọt', sortOrder: 3, isActive: true, createdAt: now, updatedAt: now },

        // Ingredient Categories
        { id: 5, groupCategory: 'INGREDIENT_CATEGORY', code: 'coffee_beans', label: 'Cà phê hạt', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
        { id: 6, groupCategory: 'INGREDIENT_CATEGORY', code: 'milk_cream', label: 'Sữa & Kem', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
        { id: 7, groupCategory: 'INGREDIENT_CATEGORY', code: 'syrup_sugar', label: 'Siro & Đường', sortOrder: 3, isActive: true, createdAt: now, updatedAt: now },
        { id: 8, groupCategory: 'INGREDIENT_CATEGORY', code: 'packaging', label: 'Đóng gói', sortOrder: 4, isActive: true, createdAt: now, updatedAt: now },

        // Stock Status
        { id: 9, groupCategory: 'STOCK_STATUS', code: 'safe', label: 'An toàn', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
        { id: 10, groupCategory: 'STOCK_STATUS', code: 'need_import', label: 'Cần nhập', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
        { id: 11, groupCategory: 'STOCK_STATUS', code: 'near_empty', label: 'Gần hết', sortOrder: 3, isActive: true, createdAt: now, updatedAt: now },
        { id: 12, groupCategory: 'STOCK_STATUS', code: 'very_low', label: 'Rất thấp', sortOrder: 4, isActive: true, createdAt: now, updatedAt: now },
        { id: 13, groupCategory: 'STOCK_STATUS', code: 'out_of_stock', label: 'Đã hết', sortOrder: 5, isActive: true, createdAt: now, updatedAt: now },

        // Product Status
        { id: 14, groupCategory: 'PRODUCT_STATUS', code: 'in_business', label: 'Đang kinh doanh', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
        { id: 15, groupCategory: 'PRODUCT_STATUS', code: 'suspended', label: 'Tạm ngừng', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },

        // User Roles
        { id: 16, groupCategory: 'USER_ROLE', code: 'admin', label: 'Quản trị viên', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
        { id: 17, groupCategory: 'USER_ROLE', code: 'manager', label: 'Quản lý cửa hàng', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
        { id: 18, groupCategory: 'USER_ROLE', code: 'staff', label: 'Nhân viên thu ngân / Pha chế', sortOrder: 3, isActive: true, createdAt: now, updatedAt: now },
        { id: 19, groupCategory: 'USER_ROLE', code: 'viewer', label: 'Người xem', sortOrder: 4, isActive: true, createdAt: now, updatedAt: now },

        // Units of Measurement (Đơn vị tính)
        { id: 20, groupCategory: 'UNIT', code: 'ly', label: 'ly', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
        { id: 21, groupCategory: 'UNIT', code: 'kg', label: 'kg', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
        { id: 22, groupCategory: 'UNIT', code: 'g', label: 'g', sortOrder: 3, isActive: true, createdAt: now, updatedAt: now },
        { id: 23, groupCategory: 'UNIT', code: 'lit', label: 'lít', sortOrder: 4, isActive: true, createdAt: now, updatedAt: now },
        { id: 24, groupCategory: 'UNIT', code: 'ml', label: 'ml', sortOrder: 5, isActive: true, createdAt: now, updatedAt: now },
        { id: 25, groupCategory: 'UNIT', code: 'coc', label: 'cốc', sortOrder: 6, isActive: true, createdAt: now, updatedAt: now },
        { id: 26, groupCategory: 'UNIT', code: 'hop', label: 'hộp', sortOrder: 7, isActive: true, createdAt: now, updatedAt: now },
        { id: 27, groupCategory: 'UNIT', code: 'lon', label: 'lon', sortOrder: 8, isActive: true, createdAt: now, updatedAt: now },
        { id: 28, groupCategory: 'UNIT', code: 'chai', label: 'chai', sortOrder: 9, isActive: true, createdAt: now, updatedAt: now },
        { id: 29, groupCategory: 'UNIT', code: 'goi', label: 'gói', sortOrder: 10, isActive: true, createdAt: now, updatedAt: now },
        { id: 30, groupCategory: 'UNIT', code: 'phan', label: 'phần', sortOrder: 11, isActive: true, createdAt: now, updatedAt: now },
        { id: 31, groupCategory: 'UNIT', code: 'cai', label: 'cái', sortOrder: 12, isActive: true, createdAt: now, updatedAt: now },
        { id: 32, groupCategory: 'UNIT', code: 'thung', label: 'thùng', sortOrder: 13, isActive: true, createdAt: now, updatedAt: now },
      ],
      { ignoreDuplicates: true }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('master_codes', null, {})
  },
}
