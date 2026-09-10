'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('master_codes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      groupCategory: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      label: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      await queryInterface.addIndex('master_codes', ['groupCategory'])
    } catch (e) {}
    try {
      await queryInterface.addIndex('master_codes', ['code'])
    } catch (e) {}
  },

  down: async (queryInterface) => {
    // Dùng cascade: true để tự động xóa các ràng buộc khóa ngoại (FK) liên kết, tránh lỗi phụ thuộc khi rollback/undo
    await queryInterface.dropTable('master_codes', { cascade: true })
  },
}
