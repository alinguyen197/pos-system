import { Model, DataTypes, Sequelize } from 'sequelize'

class StockItem extends Model {
  public id!: number
  public code!: string
  public name!: string
  public category!: string
  public unit!: string
  public quantity!: number
  public minQuantity!: number
  public costPerUnit!: number
  public isDeleted!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    StockItem.hasMany(models.ProductRecipe, {
      foreignKey: 'stockItemId',
      as: 'recipes',
    })
  }

  static initModel(sequelize: Sequelize) {
    StockItem.init(
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
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        category: {
          type: DataTypes.STRING(100),
          allowNull: false,
          defaultValue: 'Cà phê hạt',
        },
        unit: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        quantity: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        minQuantity: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        costPerUnit: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        modelName: 'StockItem',
        tableName: 'stock_items',
        timestamps: true,
      }
    )
    return StockItem
  }
}

export default StockItem
