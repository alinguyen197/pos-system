'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stock_items', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Cà phê hạt',
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      minQuantity: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      costPerUnit: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    })

    try {
      await queryInterface.addIndex('stock_items', ['code'])
    } catch (e) {}
  },

  down: async (queryInterface) => {
    // Dùng cascade: true để tự động xóa các ràng buộc khóa ngoại (FK) liên kết, tránh lỗi phụ thuộc khi rollback/undo
    await queryInterface.dropTable('stock_items', { cascade: true })
  },
}
