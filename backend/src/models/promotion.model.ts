import { Model, DataTypes, Sequelize } from 'sequelize'

class Promotion extends Model {
  public id!: number
  public code!: string
  public name!: string
  public description?: string
  public discountType!: 'PERCENT' | 'FIXED_AMOUNT'
  public discountValue!: number
  public minOrderAmount!: number
  public maxDiscountAmount?: number | null
  public startDate!: Date
  public endDate!: Date
  public usageLimit?: number | null
  public usedCount!: number
  public status!: 'active' | 'inactive' | 'expired'
  public createdBy?: number
  public isDeleted!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    if (models.Order) {
      Promotion.hasMany(models.Order, {
        foreignKey: 'promotionId',
        as: 'orders',
      })
    }
    if (models.User) {
      Promotion.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      })
    }
  }

  static initModel(sequelize: Sequelize) {
    Promotion.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        discountType: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'FIXED_AMOUNT',
        },
        discountValue: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        minOrderAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        maxDiscountAmount: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        usageLimit: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        usedCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'active',
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
        modelName: 'Promotion',
        tableName: 'promotions',
        timestamps: true,
      }
    )
    return Promotion
  }
}

export default Promotion
