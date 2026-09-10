'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      orderNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      orderDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'completed',
      },
      totalAmount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      discountAmount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      finalAmount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      paymentMethod: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'cash',
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
      await queryInterface.addIndex('orders', ['orderNumber'])
    } catch (e) {}
    try {
      await queryInterface.addIndex('orders', ['orderDate'])
    } catch (e) {}
  },

  down: async (queryInterface) => {
    // Dùng cascade: true để tự động xóa các ràng buộc khóa ngoại (FK) liên kết, tránh lỗi phụ thuộc khi rollback/undo
    await queryInterface.dropTable('orders', { cascade: true })
  },
}
