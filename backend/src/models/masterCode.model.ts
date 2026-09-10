import { Model, DataTypes, Sequelize } from 'sequelize'

class MasterCode extends Model {
  public id!: number
  public groupCategory!: string
  public code!: string
  public label!: string
  public sortOrder!: number
  public isActive!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    // No direct FK needed
  }

  static initModel(sequelize: Sequelize) {
    MasterCode.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        groupCategory: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        label: {
          type: DataTypes.STRING(100),
          allowNull: false,
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
      },
      {
        sequelize,
        modelName: 'MasterCode',
        tableName: 'master_codes',
        timestamps: true,
      }
    )
    return MasterCode
  }
}

export default MasterCode
