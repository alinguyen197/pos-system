import { Sequelize, Op } from 'sequelize'
import User from './user.model'
import RefreshToken from './refreshToken.model'
import Otp from './otp.model'
import Category from './category.model'
import Product from './product.model'
import StockItem from './stockItem.model'
import MasterCode from './masterCode.model'
import ProductRecipe from './productRecipe.model'
import Order from './order.model'
import OrderItem from './orderItem.model'
import StockImport from './stockImport.model'

const env = process.env.NODE_ENV || 'development'
// nếu env là development thì config sẽ lấy từ development trong database.ts
const config = require('../config/database.ts')[env]

// có 2 cách để khởi tạo Sequelize: sử dụng URL hoặc sử dụng các tham số riêng lẻ
// ví dụ url: postgres://user:pass@localhost:5432/dbname
const sequelize = config.url
  ? new Sequelize(config.url, config)
  : new Sequelize(config.database, config.username, config.password, config)

// Sequelize dùng để khai báo kiểu dữ liệu
// sequelize là kết nối database : sequelize.define(...) , sequelize.query(...) , sequelize.sync()

const db = {
  Sequelize,
  sequelize,
  Op,
  User: User.initModel(sequelize),
  RefreshToken: RefreshToken.initModel(sequelize),
  Otp: Otp.initModel(sequelize),
  Category: Category.initModel(sequelize),
  Product: Product.initModel(sequelize),
  StockItem: StockItem.initModel(sequelize),
  MasterCode: MasterCode.initModel(sequelize),
  ProductRecipe: ProductRecipe.initModel(sequelize),
  Order: Order.initModel(sequelize),
  OrderItem: OrderItem.initModel(sequelize),
  StockImport: StockImport.initModel(sequelize),
}
// Setup associations
Object.values(db).forEach((model: any) => {
  if (model.associate) {
    model.associate(db)
  }
})

export default db
