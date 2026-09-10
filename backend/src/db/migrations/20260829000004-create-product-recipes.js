'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_recipes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      stockItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'stock_items',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 1,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
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
      await queryInterface.addIndex('product_recipes', ['productId'])
    } catch (e) {}
    try {
      await queryInterface.addIndex('product_recipes', ['stockItemId'])
    } catch (e) {}
  },

  down: async (queryInterface) => {
    // Dùng cascade: true để tự động xóa các ràng buộc khóa ngoại (FK) liên kết, tránh lỗi phụ thuộc khi rollback/undo
    await queryInterface.dropTable('product_recipes', { cascade: true })
  },
}
