'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sellingPrice: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      costPrice: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'ly',
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Đang kinh doanh',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      await queryInterface.addIndex('products', ['code'])
    } catch (e) {}
    try {
      await queryInterface.addIndex('products', ['categoryId'])
    } catch (e) {}
  },

  down: async (queryInterface) => {
    // Dùng cascade: true để tự động xóa các ràng buộc khóa ngoại (FK) liên kết, tránh lỗi phụ thuộc khi rollback/undo
    await queryInterface.dropTable('products', { cascade: true })
  },
}
