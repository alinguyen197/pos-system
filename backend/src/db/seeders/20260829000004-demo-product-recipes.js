'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'product_recipes',
      [
        {
          id: 1,
          productId: 1,
          stockItemId: 1,
          amount: 18,
          unit: 'g',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          productId: 1,
          stockItemId: 4,
          amount: 40,
          unit: 'ml',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_recipes', null, {})
  },
}
