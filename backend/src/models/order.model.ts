import { Model, DataTypes, Sequelize } from 'sequelize'

class Order extends Model {
  public id!: number
  public orderNumber!: string
  public orderDate!: Date
  public status!: string
  public totalAmount!: number
  public discountAmount!: number
  public finalAmount!: number
  public paymentMethod!: string
  public note?: string
  public createdBy?: number
  public isDeleted!: boolean
  public items?: any[]
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'items',
    })
    Order.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    })
  }

  static initModel(sequelize: Sequelize) {
    Order.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        orderNumber: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        orderDate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'completed',
        },
        totalAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        discountAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        finalAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        paymentMethod: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'cash',
        },
        note: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        createdBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        modelName: 'Order',
        tableName: 'orders',
        timestamps: true,
      }
    )
    return Order
  }
}

export default Order
