'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'stock_items',
      [
        {
          id: 1,
          code: 'NL-001',
          name: 'Cà phê Robusta Hạt',
          category: 'Cà phê hạt',
          quantity: 15.5,
          minQuantity: 5.0,
          unit: 'kg',
          costPerUnit: 180000,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          code: 'NL-002',
          name: 'Cà phê Arabica Hạt',
          category: 'Cà phê hạt',
          quantity: 1.5,
          minQuantity: 5.0,
          unit: 'kg',
          costPerUnit: 260000,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          code: 'NL-003',
          name: 'Sữa tươi thanh trùng 1L',
          category: 'Sữa & Kem',
          quantity: 2,
          minQuantity: 10,
          unit: 'hộp',
          costPerUnit: 34000,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          code: 'NL-004',
          name: 'Sữa đặc Ngôi Sao',
          category: 'Sữa & Kem',
          quantity: 24,
          minQuantity: 12,
          unit: 'lon',
          costPerUnit: 22000,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 5,
          code: 'NL-005',
          name: 'Siro Đào Monin 700ml',
          category: 'Siro & Đường',
          quantity: 0.4,
          minQuantity: 2.0,
          unit: 'chai',
          costPerUnit: 210000,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('stock_items', null, {})
  },
}
