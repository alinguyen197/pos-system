import { Model, DataTypes, Sequelize } from 'sequelize'

class Expenditure extends Model {
  public id!: number
  public expenseCode!: string
  public category!: string
  public title!: string
  public amount!: number
  public expenseDate!: Date
  public paymentMethod!: string
  public recipient?: string
  public imageUrl?: string
  public note?: string
  public createdBy?: number
  public isDeleted!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static associate(models: any) {
    if (models.User) {
      Expenditure.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      })
    }
  }

  static initModel(sequelize: Sequelize) {
    Expenditure.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        expenseCode: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        category: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'other',
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        amount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        expenseDate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        paymentMethod: {
          type: DataTypes.STRING(30),
          allowNull: false,
          defaultValue: 'cash',
        },
        recipient: {
          type: DataTypes.STRING(150),
          allowNull: true,
        },
        imageUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
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
        modelName: 'Expenditure',
        tableName: 'expenditures',
        timestamps: true,
      }
    )
    return Expenditure
  }
}

export default Expenditure
