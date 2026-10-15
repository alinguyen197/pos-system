import db from '../models'
import { Op } from 'sequelize'
import { buildPaginationResponse } from '../utils'
import { BadRequestError, NotFoundError } from '../exceptions'

export interface CreatePromotionPayload {
  code: string
  name: string
  description?: string
  discountType?: 'PERCENT' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  startDate: string | Date
  endDate: string | Date
  usageLimit?: number | null
  status?: 'active' | 'inactive'
  createdBy?: number
}

export interface UpdatePromotionPayload extends Partial<CreatePromotionPayload> {}

export interface GetPromotionsQuery {
  page?: number | string
  limit?: number | string
  search?: string
  status?: string
  discountType?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Lấy danh sách khuyến mãi có phân trang & tìm kiếm & thống kê KPI
 */
const getPromotions = async (query: GetPromotionsQuery) => {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10))
  const offset = (page - 1) * limit
  const search = (query.search || '').trim()
  const status = query.status
  const discountType = query.discountType
  const sortBy = query.sortBy || 'createdAt'
  const sortOrder = (query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

  const whereClause: any = {
    isDeleted: false,
  }

  if (search) {
    whereClause[Op.or] = [
      { code: { [Op.iLike]: `%${search}%` } },
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ]
  }

  const now = new Date()

  if (status && status !== 'all') {
    if (status === 'active') {
      whereClause.status = 'active'
      whereClause.startDate = { [Op.lte]: now }
      whereClause.endDate = { [Op.gte]: now }
    } else if (status === 'expired') {
      whereClause[Op.or] = [
        { status: 'expired' },
        { endDate: { [Op.lt]: now } },
      ]
    } else if (status === 'upcoming') {
      whereClause.startDate = { [Op.gt]: now }
      whereClause.status = 'active'
    } else {
      whereClause.status = status
    }
  }

  if (discountType && discountType !== 'all') {
    whereClause.discountType = discountType
  }

  const { rows, count } = await db.Promotion.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
      },
    ],
  })

  // Thống kê nhanh KPI
  const allPromos = await db.Promotion.findAll({
    where: { isDeleted: false },
    attributes: ['id', 'status', 'startDate', 'endDate', 'usedCount', 'discountValue', 'discountType'],
  })

  let totalActive = 0
  let totalUpcoming = 0
  let totalExpired = 0

  allPromos.forEach((p: any) => {
    const sDate = new Date(p.startDate)
    const eDate = new Date(p.endDate)
    if (p.status === 'inactive') {
      // Inactive
    } else if (now > eDate) {
      totalExpired++
    } else if (now < sDate) {
      totalUpcoming++
    } else {
      totalActive++
    }
  })

  // Tính tổng số tiền đã giảm cho khách từ bảng orders
  const ordersWithDiscount = await db.Order.findAll({
    where: {
      isDeleted: false,
      discountAmount: { [Op.gt]: 0 },
    },
    attributes: ['discountAmount'],
  })
  const totalDiscountProvided = ordersWithDiscount.reduce(
    (sum: number, o: any) => sum + (Number(o.discountAmount) || 0),
    0
  )

  const pagination = buildPaginationResponse(page, limit, count)

  return {
    items: rows,
    pagination,
    kpi: {
      totalActive,
      totalUpcoming,
      totalExpired,
      totalCampaigns: count,
      totalDiscountProvided,
    },
  }
}

/**
 * Lấy chi tiết 1 khuyến mãi theo ID
 */
const getPromotionById = async (id: number | string) => {
  const promo = await db.Promotion.findOne({
    where: { id, isDeleted: false },
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
      },
    ],
  })
  if (!promo) {
    throw new NotFoundError('Không tìm thấy chiến dịch khuyến mãi')
  }
  return promo
}

/**
 * Tạo mới chiến dịch khuyến mãi
 */
const createPromotion = async (payload: CreatePromotionPayload) => {
  const cleanCode = (payload.code || '').trim().toUpperCase()
  if (!cleanCode) {
    throw new BadRequestError('Mã khuyến mãi không được để trống')
  }
  if (!payload.name || !payload.name.trim()) {
    throw new BadRequestError('Tên chiến dịch khuyến mãi không được để trống')
  }

  const existing = await db.Promotion.findOne({
    where: {
      code: cleanCode,
      isDeleted: false,
    },
  })
  if (existing) {
    throw new BadRequestError(`Mã khuyến mãi "${cleanCode}" đã tồn tại trên hệ thống`)
  }

  const discountType = payload.discountType || 'FIXED_AMOUNT'
  const discountValue = Number(payload.discountValue) || 0
  if (discountValue <= 0) {
    throw new BadRequestError('Giá trị giảm giá phải lớn hơn 0')
  }
  if (discountType === 'PERCENT' && discountValue > 100) {
    throw new BadRequestError('Mức giảm theo phần trăm không được vượt quá 100%')
  }

  const startDate = new Date(payload.startDate || new Date())
  const endDate = new Date(payload.endDate)
  if (isNaN(endDate.getTime())) {
    throw new BadRequestError('Thời gian kết thúc không hợp lệ')
  }
  if (endDate <= startDate) {
    throw new BadRequestError('Thời gian kết thúc phải lớn hơn thời gian bắt đầu')
  }

  const minOrderAmount = Number(payload.minOrderAmount) || 0
  const maxDiscountAmount =
    payload.maxDiscountAmount !== undefined && payload.maxDiscountAmount !== null
      ? Number(payload.maxDiscountAmount)
      : null
  const usageLimit =
    payload.usageLimit !== undefined && payload.usageLimit !== null && Number(payload.usageLimit) > 0
      ? Number(payload.usageLimit)
      : null

  const newPromo = await db.Promotion.create({
    code: cleanCode,
    name: payload.name.trim(),
    description: payload.description || '',
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    startDate,
    endDate,
    usageLimit,
    usedCount: 0,
    status: payload.status || 'active',
    createdBy: payload.createdBy || null,
    isDeleted: false,
  })

  return newPromo
}

/**
 * Cập nhật chiến dịch khuyến mãi
 */
const updatePromotion = async (id: number | string, payload: UpdatePromotionPayload) => {
  const promo = await db.Promotion.findOne({ where: { id, isDeleted: false } })
  if (!promo) {
    throw new NotFoundError('Không tìm thấy chiến dịch khuyến mãi cần cập nhật')
  }

  if (payload.code) {
    const cleanCode = payload.code.trim().toUpperCase()
    if (cleanCode !== promo.code) {
      const existing = await db.Promotion.findOne({
        where: {
          code: cleanCode,
          id: { [Op.ne]: id },
          isDeleted: false,
        },
      })
      if (existing) {
        throw new BadRequestError(`Mã khuyến mãi "${cleanCode}" đã được sử dụng ở chiến dịch khác`)
      }
      promo.code = cleanCode
    }
  }

  if (payload.name) promo.name = payload.name.trim()
  if (payload.description !== undefined) promo.description = payload.description
  if (payload.discountType) promo.discountType = payload.discountType

  if (payload.discountValue !== undefined) {
    const val = Number(payload.discountValue)
    if (val <= 0) throw new BadRequestError('Giá trị giảm phải lớn hơn 0')
    if (promo.discountType === 'PERCENT' && val > 100) {
      throw new BadRequestError('Giảm % không được vượt quá 100%')
    }
    promo.discountValue = val
  }

  if (payload.minOrderAmount !== undefined) {
    promo.minOrderAmount = Math.max(0, Number(payload.minOrderAmount) || 0)
  }

  if (payload.maxDiscountAmount !== undefined) {
    promo.maxDiscountAmount =
      payload.maxDiscountAmount !== null && Number(payload.maxDiscountAmount) > 0
        ? Number(payload.maxDiscountAmount)
        : null
  }

  if (payload.startDate) promo.startDate = new Date(payload.startDate)
  if (payload.endDate) {
    const end = new Date(payload.endDate)
    if (end <= new Date(promo.startDate)) {
      throw new BadRequestError('Ngày kết thúc phải lớn hơn ngày bắt đầu')
    }
    promo.endDate = end
  }

  if (payload.usageLimit !== undefined) {
    promo.usageLimit =
      payload.usageLimit !== null && Number(payload.usageLimit) > 0 ? Number(payload.usageLimit) : null
  }

  if (payload.status) promo.status = payload.status

  await promo.save()
  return promo
}

/**
 * Bật / Tắt trạng thái khuyến mãi (Active <-> Inactive)
 */
const togglePromotionStatus = async (id: number | string) => {
  const promo = await db.Promotion.findOne({ where: { id, isDeleted: false } })
  if (!promo) {
    throw new NotFoundError('Không tìm thấy chiến dịch khuyến mãi')
  }

  promo.status = promo.status === 'active' ? 'inactive' : 'active'
  await promo.save()
  return promo
}

/**
 * Xóa mềm chiến dịch khuyến mãi
 */
const deletePromotion = async (id: number | string) => {
  const promo = await db.Promotion.findOne({ where: { id, isDeleted: false } })
  if (!promo) {
    throw new NotFoundError('Không tìm thấy chiến dịch khuyến mãi cần xóa')
  }

  promo.isDeleted = true
  await promo.save()
  return { id: promo.id, message: 'Đã xóa chiến dịch khuyến mãi thành công' }
}

/**
 * Lấy danh sách các voucher đang kích hoạt & còn hạn dùng để hiển thị trên POS
 */
const getActivePromotions = async () => {
  const now = new Date()
  const promotions = await db.Promotion.findAll({
    where: {
      isDeleted: false,
      status: 'active',
      startDate: { [Op.lte]: now },
      endDate: { [Op.gte]: now },
      [Op.or]: [
        { usageLimit: null },
        db.Sequelize.literal('"usedCount" < "usageLimit"'),
      ],
    },
    order: [['minOrderAmount', 'ASC'], ['createdAt', 'DESC']],
    attributes: [
      'id',
      'code',
      'name',
      'description',
      'discountType',
      'discountValue',
      'minOrderAmount',
      'maxDiscountAmount',
      'startDate',
      'endDate',
      'usageLimit',
      'usedCount',
    ],
  })
  return promotions
}

/**
 * Validate mã giảm giá từ giao diện POS
 */
const validatePromotion = async (code: string, subtotal: number) => {
  const cleanCode = (code || '').trim().toUpperCase()
  if (!cleanCode) {
    throw new BadRequestError('Vui lòng nhập mã giảm giá')
  }

  const now = new Date()
  const promo = await db.Promotion.findOne({
    where: {
      code: cleanCode,
      isDeleted: false,
    },
  })

  if (!promo) {
    throw new BadRequestError(`Mã giảm giá "${cleanCode}" không tồn tại`)
  }

  if (promo.status === 'inactive') {
    throw new BadRequestError(`Mã giảm giá "${cleanCode}" đang tạm dừng áp dụng`)
  }

  if (now < new Date(promo.startDate)) {
    const startStr = new Date(promo.startDate).toLocaleDateString('vi-VN')
    throw new BadRequestError(`Mã "${cleanCode}" chỉ bắt đầu áp dụng từ ngày ${startStr}`)
  }

  if (now > new Date(promo.endDate)) {
    const endStr = new Date(promo.endDate).toLocaleDateString('vi-VN')
    throw new BadRequestError(`Mã "${cleanCode}" đã hết hạn từ ngày ${endStr}`)
  }

  if (promo.usageLimit !== null && promo.usageLimit !== undefined && promo.usedCount >= promo.usageLimit) {
    throw new BadRequestError(`Mã "${cleanCode}" đã hết số lượt sử dụng tối đa (${promo.usageLimit} lượt)`)
  }

  const currentSubtotal = Math.max(0, Number(subtotal) || 0)
  if (currentSubtotal < promo.minOrderAmount) {
    const shortage = promo.minOrderAmount - currentSubtotal
    throw new BadRequestError(
      `Đơn hàng chưa đạt mức tối thiểu ${promo.minOrderAmount.toLocaleString('vi-VN')} ₫ để áp dụng mã "${cleanCode}" (còn thiếu ${shortage.toLocaleString('vi-VN')} ₫)`
    )
  }

  // Tính số tiền giảm giá
  let discountAmount = 0
  if (promo.discountType === 'PERCENT') {
    discountAmount = Math.round((currentSubtotal * promo.discountValue) / 100)
    if (promo.maxDiscountAmount && promo.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, promo.maxDiscountAmount)
    }
  } else {
    // FIXED_AMOUNT
    discountAmount = Math.min(promo.discountValue, currentSubtotal)
  }

  const finalAmount = Math.max(0, currentSubtotal - discountAmount)

  return {
    valid: true,
    promotionId: promo.id,
    code: promo.code,
    name: promo.name,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    minOrderAmount: promo.minOrderAmount,
    maxDiscountAmount: promo.maxDiscountAmount,
    discountAmount,
    finalAmount,
    message:
      promo.discountType === 'PERCENT'
        ? `Áp dụng thành công mã ${promo.code}: Giảm ${promo.discountValue}% (-${discountAmount.toLocaleString('vi-VN')} ₫)`
        : `Áp dụng thành công mã ${promo.code}: Giảm ${discountAmount.toLocaleString('vi-VN')} ₫`,
  }
}

/**
 * Seed dữ liệu khuyến mãi ban đầu nếu bảng rỗng
 */
const seedInitialPromotions = async () => {
  try {
    const count = await db.Promotion.count()
    if (count === 0) {
      const now = new Date()
      const future = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 năm
      await db.Promotion.bulkCreate([
        {
          code: 'CHAOHAN2026',
          name: 'Chào Hè Rực Rỡ 2026',
          description: 'Giảm 20% cho đơn hàng từ 80.000 ₫ (Tối đa 30.000 ₫)',
          discountType: 'PERCENT',
          discountValue: 20,
          minOrderAmount: 80000,
          maxDiscountAmount: 30000,
          startDate: now,
          endDate: future,
          usageLimit: 200,
          usedCount: 15,
          status: 'active',
          isDeleted: false,
        },
        {
          code: 'GIAM10K',
          name: 'Ưu đãi Khách mới',
          description: 'Giảm trực tiếp 10.000 ₫ cho đơn hàng từ 40.000 ₫',
          discountType: 'FIXED_AMOUNT',
          discountValue: 10000,
          minOrderAmount: 40000,
          maxDiscountAmount: null,
          startDate: now,
          endDate: future,
          usageLimit: 500,
          usedCount: 38,
          status: 'active',
          isDeleted: false,
        },
        {
          code: 'FREESHIP',
          name: 'Hỗ trợ Phí Vận chuyển',
          description: 'Giảm 15.000 ₫ phí giao hàng cho đơn từ 60.000 ₫',
          discountType: 'FIXED_AMOUNT',
          discountValue: 15000,
          minOrderAmount: 60000,
          maxDiscountAmount: null,
          startDate: now,
          endDate: future,
          usageLimit: null,
          usedCount: 12,
          status: 'active',
          isDeleted: false,
        },
        {
          code: 'VIPLOVE',
          name: 'Tri Ân Khách Hàng Thân Thiết',
          description: 'Giảm 15% không giới hạn cho đơn từ 120.000 ₫',
          discountType: 'PERCENT',
          discountValue: 15,
          minOrderAmount: 120000,
          maxDiscountAmount: null,
          startDate: now,
          endDate: future,
          usageLimit: 100,
          usedCount: 5,
          status: 'active',
          isDeleted: false,
        },
      ])
      console.log('✅ Seeded initial promotions successfully!')
    }
  } catch (err) {
    // Ignore if already seeded or error
  }
}

export default {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  getActivePromotions,
  validatePromotion,
  seedInitialPromotions,
}
