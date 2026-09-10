import { Model, DataTypes, Sequelize } from 'sequelize'

class Product extends Model {
  public id!: number
  public categoryId!: number
  public code!: string
  public name!: string
  public description?: string
  public sellingPrice!: number
  public costPrice!: number
  public unit!: string
  public imageUrl?: string
  public status!: string
  public isActive!: boolean
  public isDeleted!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    Product.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category',
    })
    Product.hasMany(models.ProductRecipe, {
      foreignKey: 'productId',
      as: 'recipes',
    })
  }

  static initModel(sequelize: Sequelize) {
    Product.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        categoryId: {
          type: DataTypes.INTEGER,
          allowNull: true,
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
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        sellingPrice: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        costPrice: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        unit: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'ly',
        },
        imageUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'Đang kinh doanh',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        modelName: 'Product',
        tableName: 'products',
        timestamps: true,
      }
    )
    return Product
  }
}

export default Product
