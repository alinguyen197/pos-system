import dotenv from 'dotenv'
dotenv.config()

import express, { Application } from 'express'
import path from 'path'
import initWebRoutes from './routes'
import cors from 'cors'
import { connectDB } from './config/connectDB'
import { errorHandler } from './middlewares/errorHandler'

const PORT = process.env.PORT || 4000

const app: Application = express()
app.use(cors({ origin: true, credentials: true })) // Cấu hình CORS

// Middleware để parse JSON request body (hỗ trợ base64 image upload)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Phục vụ tĩnh thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

initWebRoutes(app) // Khởi tạo các route từ src/routes/index.ts

connectDB() // Kết nối database

// Sử dụng middleware xử lý tất cả các lỗi chung
app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
