import { Model, DataTypes, Sequelize } from 'sequelize'

class StockImport extends Model {
  public id!: number
  public importCode!: string
  public supplier!: string
  public warehouse!: string
  public importDate!: Date
  public totalAmount!: number
  public itemCount!: number
  public note?: string
  public createdBy?: number
  public itemsData?: any
  public isDeleted!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    if (models.User) {
      StockImport.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      })
    }
  }

  static initModel(sequelize: Sequelize) {
    StockImport.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        importCode: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        supplier: {
          type: DataTypes.STRING(150),
          allowNull: true,
          defaultValue: 'Nhà cung cấp lẻ',
        },
        warehouse: {
          type: DataTypes.STRING(150),
          allowNull: true,
          defaultValue: 'Kho tổng',
        },
        importDate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        totalAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        itemCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        note: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        createdBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        itemsData: {
          type: DataTypes.JSON,
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
        modelName: 'StockImport',
        tableName: 'stock_imports',
        timestamps: true,
      }
    )
    return StockImport
  }
}

export default StockImport
