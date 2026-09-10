import { Model, DataTypes, Sequelize } from 'sequelize'

class Category extends Model {
  public id!: number
  public name!: string
  public description?: string
  public sortOrder!: number
  public isActive!: boolean
  public isDeleted!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    Category.hasMany(models.Product, {
      foreignKey: 'categoryId',
      as: 'products',
    })
  }

  static initModel(sequelize: Sequelize) {
    Category.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        sortOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
        modelName: 'Category',
        tableName: 'categories',
        timestamps: true,
      }
    )
    return Category
  }
}

export default Category
