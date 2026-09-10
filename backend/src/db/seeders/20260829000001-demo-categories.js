'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'categories',
      [
        {
          id: 1,
          name: 'Cà phê',
          description: 'Các món cà phê pha phin, pha máy',
          sortOrder: 1,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Trà',
          description: 'Trà hoa quả, trà sữa, matcha',
          sortOrder: 2,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          name: 'Bánh ngọt',
          description: 'Bánh ngọt ăn kèm đồ uống',
          sortOrder: 3,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {})
  },
}
