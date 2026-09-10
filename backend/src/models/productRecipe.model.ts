import { Model, DataTypes, Sequelize } from 'sequelize'

class ProductRecipe extends Model {
  public id!: number
  public productId!: number
  public stockItemId!: number
  public amount!: number
  public unit!: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    ProductRecipe.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
      onDelete: 'CASCADE',
    })
    ProductRecipe.belongsTo(models.StockItem, {
      foreignKey: 'stockItemId',
      as: 'ingredient',
      onDelete: 'CASCADE',
    })
  }

  static initModel(sequelize: Sequelize) {
    ProductRecipe.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        productId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        stockItemId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        amount: {
          type: DataTypes.DOUBLE,
          allowNull: true,
          defaultValue: 1,
        },
        unit: {
          type: DataTypes.STRING(20),
          allowNull: true,
          defaultValue: 'ml',
        },
      },
      {
        sequelize,
        modelName: 'ProductRecipe',
        tableName: 'product_recipes',
        timestamps: true,
      }
    )
    return ProductRecipe
  }
}

export default ProductRecipe
