'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('expenditures', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      expenseCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'other',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      expenseDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      paymentMethod: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'cash',
      },
      recipient: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
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
      await queryInterface.addIndex('expenditures', ['expenseCode'])
    } catch (e) {}
    try {
      await queryInterface.addIndex('expenditures', ['expenseDate'])
    } catch (e) {}
    try {
      await queryInterface.addIndex('expenditures', ['category'])
    } catch (e) {}
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('expenditures', { cascade: true })
  },
}
