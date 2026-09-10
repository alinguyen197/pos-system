import { Application } from 'express'
import authRouters from './authRouters'
import userRouters from './userRouters'
import productRouters from './productRouters'
import ingredientRouters from './ingredientRouters'
import masterCodeRouters from './masterCodeRouters'
import stockImportRouters from './stockImportRouters'
import uploadRouters from './uploadRouters'
import orderRouters from './orderRouters'
import dashboardRouters from './dashboardRouters'
import reportRouters from './reportRouters'

const initWebRoutes = (app: Application) => {
  app.use('/api/auth', authRouters)
  app.use('/api/user', userRouters)
  app.use('/api/products', productRouters)
  app.use('/api/ingredients', ingredientRouters)
  app.use('/api/master-codes', masterCodeRouters)
  app.use('/api/stock-imports', stockImportRouters)
  app.use('/api/upload', uploadRouters)
  app.use('/api/orders', orderRouters)
  app.use('/api/dashboard', dashboardRouters)
  app.use('/api/reports', reportRouters)
}

export default initWebRoutes

