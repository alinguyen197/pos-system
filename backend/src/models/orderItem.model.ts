import { Model, DataTypes, Sequelize } from 'sequelize'

class OrderItem extends Model {
  public id!: number
  public orderId!: number
  public productId!: number
  public quantity!: number
  public unitPrice!: number
  public subtotal!: number
  public note?: string
  public product?: any
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order',
    })
    OrderItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    })
  }

  static initModel(sequelize: Sequelize) {
    OrderItem.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        orderId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        productId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        unitPrice: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        subtotal: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        note: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'OrderItem',
        tableName: 'order_items',
        timestamps: true,
      }
    )
    return OrderItem
  }
}

export default OrderItem
