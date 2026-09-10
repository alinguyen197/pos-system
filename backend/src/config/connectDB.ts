import db from '../models'
import masterCodeService from '../services/masterCodeService'

/**
 * Đồng bộ các cấu trúc DDL tùy chỉnh, tự động thêm các cột còn thiếu
 * và reset lại Sequence ID tự tăng cho PostgreSQL khi khởi động server.
 */
export const syncAllPostgresSequences = async () => {
  if (db.sequelize.getDialect() === 'postgres') {
    try {
      // Tự động tạo bảng product_recipes và bổ sung các cột cần thiết nếu chưa có trong DB
      await db.sequelize.query(`CREATE TABLE IF NOT EXISTS product_recipes (
        id SERIAL PRIMARY KEY,
        "productId" INTEGER NOT NULL,
        "stockItemId" INTEGER NOT NULL,
        amount DOUBLE PRECISION DEFAULT 1,
        unit VARCHAR(20) DEFAULT 'ml',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`)
      await db.sequelize.query(`ALTER TABLE product_recipes ADD COLUMN IF NOT EXISTS amount DOUBLE PRECISION DEFAULT 1;`)
      await db.sequelize.query(`ALTER TABLE product_recipes ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'ml';`)
      await db.sequelize.query(`ALTER TABLE stock_items DROP COLUMN IF EXISTS "purchaseUnit";`)
      await db.sequelize.query(`ALTER TABLE stock_items DROP COLUMN IF EXISTS "conversionRate";`)
      await db.sequelize.query(`ALTER TABLE product_recipes DROP COLUMN IF EXISTS "quantityNeeded";`)
      await db.sequelize.query(`ALTER TABLE product_recipes ALTER COLUMN amount DROP NOT NULL;`)
    } catch (tblErr) {
      // Bỏ qua nếu bảng đã tồn tại hoặc đã xử lý DDL
    }

    // Đồng bộ lại Sequence ID cho toàn bộ 10 bảng (tránh lỗi duplicate key khi insert sau khi seed)
    const tables = [
      'users',
      'products',
      'categories',
      'stock_items',
      'master_codes',
      'product_recipes',
      'orders',
      'order_items',
      'otp_codes',
      'refresh_tokens',
    ]
    for (const table of tables) {
      try {
        await db.sequelize.query(`SELECT setval('${table}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "${table}"));`)
      } catch (err) {
        // Ignore table sequence error
      }
    }
  }
}

/**
 * Hàm khởi tạo kết nối CSDL khi chạy `npm run start`.
 * LƯU Ý CHO DEVELOPER:
 * - Khi chạy `npm run start`, hàm này sẽ TỰ ĐỘNG TẠO TOÀN BỘ CÁC BẢNG (nếu chưa có)
 *   thông qua `syncAllPostgresSequences()` và `db.sequelize.sync()`.
 * - Do đó, ở môi trường Local Development, bạn KHÔNG BẮT BUỘC phải chạy `npm run db:migrate` bằng tay.
 */
export const connectDB = async () => {
  try {
    await db.sequelize.authenticate() // 1. Kiểm tra kết nối CSDL
    console.log('✅ Database connected!')

    // 2. Đồng bộ lại schema & DDL cột trước khi sync Sequelize models
    await syncAllPostgresSequences()

    // 3. TỰ ĐỘNG TẠO BẢNG: Quét tất cả Models trong src/models/ và tạo bảng tương ứng nếu chưa tồn tại
    await db.sequelize.sync()
    console.log('✅ Database synchronized tables successfully!')

    // 4. Tự động seed dữ liệu MasterCode (bao gồm nhóm UNIT) vào DB khi startup
    await masterCodeService.seedInitialMasterCodes()
    console.log('✅ Master code seed data (including UNIT) synchronized into database!')
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error)
  }
}
