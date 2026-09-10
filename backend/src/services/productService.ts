import db from '../models'
import { parseError, MASTER_CODES, buildListQuery, buildPaginationResponse } from '../utils'

/**
 * Quy đổi đơn vị recipe về đơn vị kho để tính chi phí
 * Ví dụ: amount=20, recipeUnit='g', stockUnit='kg' → costFactor = 20/1000 = 0.02
 */
const getRecipeCostFactor = (amount: number, recipeUnit: string, stockUnit: string): number => {
  const amt = Number(amount) || 0
  if (amt <= 0) return 0

  const rUnit = (recipeUnit || '').toString().toLowerCase().trim()
  const sUnit = (stockUnit || '').toString().toLowerCase().trim()

  if (rUnit === sUnit) return amt

  // g -> kg
  if ((rUnit === 'g' || rUnit === 'gram' || rUnit === 'gr') && (sUnit === 'kg' || sUnit === 'kilogram')) {
    return amt / 1000
  }
  // ml -> lít
  if ((rUnit === 'ml' || rUnit === 'milliliter') && (sUnit === 'lít' || sUnit === 'lit' || sUnit === 'l')) {
    return amt / 1000
  }
  // kg -> g
  if ((rUnit === 'kg' || rUnit === 'kilogram') && (sUnit === 'g' || sUnit === 'gram' || sUnit === 'gr')) {
    return amt * 1000
  }
  // lít -> ml
  if ((rUnit === 'lít' || rUnit === 'lit' || rUnit === 'l') && (sUnit === 'ml' || sUnit === 'milliliter')) {
    return amt * 1000
  }

  return amt
}

const initialCategories = [
  { name: 'Cà phê', code: MASTER_CODES.PRODUCT_CATEGORY.COFFEE, description: 'Các món cà phê pha phin, pha máy', sortOrder: 1 },
  { name: 'Trà', code: MASTER_CODES.PRODUCT_CATEGORY.TEA, description: 'Trà hoa quả, trà sữa, matcha', sortOrder: 2 },
  { name: 'Bánh ngọt', code: MASTER_CODES.PRODUCT_CATEGORY.CAKE, description: 'Bánh ngọt ăn kèm đồ uống', sortOrder: 3 },
]

const initialProducts = [
  {
    code: 'SP-001',
    name: 'Cà phê Robusta Đậm Đà',
    categoryCode: MASTER_CODES.PRODUCT_CATEGORY.COFFEE,
    categoryName: 'Cà phê',
    sellingPrice: 29000,
    costPrice: 8500,
    unit: 'ly',
    statusCode: MASTER_CODES.PRODUCT_STATUS.IN_BUSINESS,
    status: 'Đang kinh doanh',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5s3vZRGHW-l9un_Pku9yhvejdxLJD-OPfHm88Lc0T2AN7J6Os0hUMTGwyEIsYWrXV2BRsx0QeEy1vBfkKG4Mx8WSlQ00T_yhtFDukz-1LSmzY566Oum2kVS2Hl0b_ZQ_kOW0NbJx7c0MfdZkoGMZKdnW_Hsxp3GolG21jiq5uOA8-hVgLYaoRT3O1xtw1gEFUY3yB1jxBkPXnzvI-CFwBu3Ngx7OT8_SKrA4yzA_cYxiBBS5DM9aV',
  },
  {
    code: 'SP-002',
    name: 'Cà phê Arabica Thơm Nhẹ',
    categoryCode: MASTER_CODES.PRODUCT_CATEGORY.COFFEE,
    categoryName: 'Cà phê',
    sellingPrice: 35000,
    costPrice: 11200,
    unit: 'ly',
    statusCode: MASTER_CODES.PRODUCT_STATUS.IN_BUSINESS,
    status: 'Đang kinh doanh',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqEoSpO7sabLc4VV632hOk0CGaeFX1Cg501iVi1Ar2nqAafWnOjymGymigHF_hBts_uw-3tGp-wXoB4vaFm5DIzZVVXr6T3ZWgFlq4aD5nRl5qZnUUBNC4_VOQEmypnM-p08qPrBOJ9rfrAnA24KUrfZE0HyR4KSwkatSIT5_mWD8b2MaBxqqKHFTtup3Q9oUxb0ApPGPcbRNqgVgTjAF7cF8I2SZG52NOUJFL9C2LleJ0Wm1InJvB',
  },
  {
    code: 'SP-003',
    name: 'Bạc xỉu Sài Gòn',
    categoryCode: MASTER_CODES.PRODUCT_CATEGORY.COFFEE,
    categoryName: 'Cà phê',
    sellingPrice: 32000,
    costPrice: 9800,
    unit: 'ly',
    statusCode: MASTER_CODES.PRODUCT_STATUS.IN_BUSINESS,
    status: 'Đang kinh doanh',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5s3vZRGHW-l9un_Pku9yhvejdxLJD-OPfHm88Lc0T2AN7J6Os0hUMTGwyEIsYWrXV2BRsx0QeEy1vBfkKG4Mx8WSlQ00T_yhtFDukz-1LSmzY566Oum2kVS2Hl0b_ZQ_kOW0NbJx7c0MfdZkoGMZKdnW_Hsxp3GolG21jiq5uOA8-hVgLYaoRT3O1xtw1gEFUY3yB1jxBkPXnzvI-CFwBu3Ngx7OT8_SKrA4yzA_cYxiBBS5DM9aV',
  },
  {
    code: 'SP-004',
    name: 'Trà Đào Cam Sả 500ml',
    categoryCode: MASTER_CODES.PRODUCT_CATEGORY.TEA,
    categoryName: 'Trà',
    sellingPrice: 39000,
    costPrice: 12000,
    unit: 'ly',
    statusCode: MASTER_CODES.PRODUCT_STATUS.IN_BUSINESS,
    status: 'Đang kinh doanh',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEtTm6pTGbLow16KABXdZLsrIwGzBRg4tmDvFE1rgWFsLEYX1mcgn-Oy0kaBXX2dE6pZSDnoLLhJT4sgkqRY96E8Bk-72tMP-dEdf6hzqIF162y_5gOxXp5dPWaIh-_VzL0iRW4fskgiuQNC_FcO4557wktZUMOVCTNRscpMAhmA7kL6ZTo4qJ9Lg6naecRht5RdpFki-9oJZgpfzyuEIqGJn-WYxozNQapNFPPyEANR4v4JDcWehF',
  },
  {
    code: 'SP-005',
    name: 'Matcha Latte Thượng Hạng',
    categoryCode: MASTER_CODES.PRODUCT_CATEGORY.TEA,
    categoryName: 'Trà',
    sellingPrice: 45000,
    costPrice: 15500,
    unit: 'ly',
    statusCode: MASTER_CODES.PRODUCT_STATUS.SUSPENDED,
    status: 'Tạm ngừng',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSWAbRm_EQsNzK83sJ9di8hFEK-Updg1TJJTlYEVySdSDxA0xIcT6GJVMUBE3urK0iBwXu4VRQCFNjQiPmEypHoa1uZfXspNczwUXOnMvryvPD7tPMEP_dW7CGj__ZR2PcEs1k-iShPtGftXRhtcIEWVrKdSBmowp55hL2bri-KYNmaHGTEgxtWvhfTaTSRQZxYgAB9btYosrNFj8KaqHMB-q1cktZknQl3GsaDGvFYMQi5Z9uXs2p',
  },
]

const seedInitialData = async () => {
  try {
    const categoryCount = await db.Category.count()
    if (categoryCount === 0) {
      for (const cat of initialCategories) {
        await db.Category.create(cat)
      }
    }

    const productCount = await db.Product.count()
    if (productCount === 0) {
      const categoriesMap: Record<string, number> = {}
      const dbCategories = await db.Category.findAll()
      dbCategories.forEach((c: any) => {
        categoriesMap[c.name] = c.id
      })

      for (const prod of initialProducts) {
        await db.Product.create({
          code: prod.code,
          name: prod.name,
          categoryId: categoriesMap[prod.categoryName] || null,
          sellingPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
          unit: prod.unit,
          status: prod.status,
          imageUrl: prod.imageUrl,
          isActive: true,
          isDeleted: false,
        })
      }
    }
  } catch (error) {
    console.error('Error seeding initial product data:', error)
  }
}

const getProducts = async (queryParamsOrBody: any = {}) => {
  try {
    await seedInitialData()

    const searchConditions = queryParamsOrBody.searchConditions || {
      category: queryParamsOrBody.category,
      keyword: queryParamsOrBody.keyword || queryParamsOrBody.search,
    }
    const sortConditions = queryParamsOrBody.sortConditions || []
    const page = Number(queryParamsOrBody.page || queryParamsOrBody.pagination?.page) || 1
    const pageSize = Number(queryParamsOrBody.pageSize || queryParamsOrBody.pagination?.pageSize) || 10
    const offset = (page - 1) * pageSize

    let rawSortCol = 'id'
    let sortDir = 'ASC'
    if (sortConditions && sortConditions.length > 0) {
      rawSortCol = sortConditions[0].sortBy || 'id'
      sortDir = (sortConditions[0].sortOrder || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    } else if (queryParamsOrBody.sortBy) {
      rawSortCol = queryParamsOrBody.sortBy
      sortDir = (queryParamsOrBody.sortOrder || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    }

    const validColumns: Record<string, string> = {
      id: 'id',
      code: 'code',
      name: 'name',
      price: 'sellingPrice',
      sellingprice: 'sellingPrice',
      sellingPrice: 'sellingPrice',
      cost: 'costPrice',
      costprice: 'costPrice',
      costPrice: 'costPrice',
      status: 'status',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }

    let orderClause: any[] = [['id', 'DESC']]
    if (rawSortCol === 'category') {
      orderClause = [[{ model: db.Category, as: 'category' }, 'name', sortDir]]
    } else if (validColumns[rawSortCol]) {
      orderClause = [[validColumns[rawSortCol], sortDir]]
    }

    const whereCondition: any = { isDeleted: false }

    const rawKeyword =
      searchConditions.keyword ||
      queryParamsOrBody.keyword ||
      queryParamsOrBody.search ||
      queryParamsOrBody.q ||
      ''
    const keyword = String(rawKeyword).trim()

    if (keyword) {
      const searchPattern = `%${keyword}%`
      whereCondition[db.Op.or] = [
        { name: { [db.Op.iLike || db.Op.like]: searchPattern } },
        { code: { [db.Op.iLike || db.Op.like]: searchPattern } },
      ]
    }

    const includeCondition: any = [
      {
        model: db.Category,
        as: 'category',
        attributes: ['id', 'name'],
        required: false,
      },
      {
        model: db.ProductRecipe,
        as: 'recipes',
        required: false,
        include: [{ model: db.StockItem, as: 'ingredient', required: false }],
      },
    ]

    const categoryFilter = searchConditions.category || queryParamsOrBody.category
    if (categoryFilter && categoryFilter !== MASTER_CODES.FILTER.ALL && categoryFilter !== 'all') {
      const categoryMap: Record<string, string> = {
        [MASTER_CODES.PRODUCT_CATEGORY.COFFEE]: 'Cà phê',
        [MASTER_CODES.PRODUCT_CATEGORY.TEA]: 'Trà',
        [MASTER_CODES.PRODUCT_CATEGORY.CAKE]: 'Bánh ngọt',
      }
      const matchName = categoryMap[categoryFilter] || categoryFilter
      includeCondition[0].where = { name: matchName }
      includeCondition[0].required = true
    }

    const { count, rows } = await db.Product.findAndCountAll({
      where: whereCondition,
      include: includeCondition,
      order: orderClause,
      offset,
      limit: pageSize,
      distinct: true,
    })

    const formattedProducts = rows.map((p: any) => {
      const selling = Number(p.sellingPrice) || 0
      const cost = Number(p.costPrice) || 0
      const marginVal = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) + '%' : '0%'

      const recipeItems = (p.recipes || []).map((r: any) => ({
        id: r.id,
        stockItemId: r.stockItemId,
        ingredientName: r.ingredient ? r.ingredient.name : '',
        amount: r.amount,
        unitCost: r.ingredient ? r.ingredient.costPerUnit : 0,
        unit: r.unit || (r.ingredient ? r.ingredient.unit : ''),  // unit người dùng nhập trong recipe (recipeUnit)
        stockUnit: r.ingredient ? r.ingredient.unit : '',          // đơn vị kho của nguyên liệu
      }))

      return {
        id: p.code || `SP-${p.id}`,
        dbId: p.id,
        name: p.name,
        category: p.category ? p.category.name : 'Cà phê',
        categoryCode: p.category?.name === 'Trà' ? MASTER_CODES.PRODUCT_CATEGORY.TEA : p.category?.name === 'Bánh ngọt' ? MASTER_CODES.PRODUCT_CATEGORY.CAKE : MASTER_CODES.PRODUCT_CATEGORY.COFFEE,
        price: `${selling.toLocaleString('vi-VN')} ₫`,
        cost: `${cost.toLocaleString('vi-VN')} ₫`,
        rawPrice: selling,
        rawCost: cost,
        margin: marginVal,
        statusCode: p.status === 'Tạm ngừng' ? MASTER_CODES.PRODUCT_STATUS.SUSPENDED : MASTER_CODES.PRODUCT_STATUS.IN_BUSINESS,
        status: p.status,
        img: p.imageUrl,
        unit: p.unit,
        recipeItems,
      }
    })

    return {
      items: formattedProducts,
      pagination: buildPaginationResponse(count, page, pageSize),
    }
  } catch (error) {
    console.error('Error fetching products from DB:', error)
    throw parseError(error)
  }
}

const getProductById = async (id: string | number) => {
  try {
    const product = await db.Product.findOne({
      where: { id, isDeleted: false },
      include: [
        { model: db.Category, as: 'category' },
        {
          model: db.ProductRecipe,
          as: 'recipes',
          include: [{ model: db.StockItem, as: 'ingredient' }],
        },
      ],
    })
    return product
  } catch (error) {
    throw parseError(error)
  }
}

const createProduct = async (data: any) => {
  try {
    if (db.sequelize.getDialect() === 'postgres') {
      try {
        await db.sequelize.query(`SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));`)
        await db.sequelize.query(`SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));`)
        await db.sequelize.query(`SELECT setval('product_recipes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_recipes));`)
      } catch (seqErr) {
        // Ignore sequence error
      }
    }

    if (!data.name || !String(data.name).trim()) {
      throw new Error('Vui lòng nhập tên sản phẩm')
    }
    const checkPrice = Number(data.sellingPrice ?? data.price)
    if (isNaN(checkPrice) || checkPrice <= 0) {
      throw new Error('Giá bán sản phẩm phải lớn hơn 0')
    }
    if (!data.recipeItems || !Array.isArray(data.recipeItems) || data.recipeItems.length === 0) {
      throw new Error('Vui lòng thêm ít nhất 1 nguyên liệu trong công thức BOM sản phẩm')
    }
    for (const r of data.recipeItems) {
      if (!r.amount || Number(r.amount) <= 0) {
        throw new Error('Định lượng nguyên liệu trong công thức BOM phải lớn hơn 0')
      }
    }

    let categoryId = data.categoryId
    if (!categoryId && data.category) {
      let categoryRecord = await db.Category.findOne({ where: { name: data.category } })
      if (!categoryRecord) {
        const catCode = data.category.toLowerCase().replace(/\s+/g, '_')
        categoryRecord = await db.Category.create({
          name: data.category,
          code: catCode,
          description: `Danh mục ${data.category}`,
          sortOrder: 99,
        })
      }
      categoryId = categoryRecord.id
    }

    let code = data.code
    if (!code) {
      const maxIdProduct = await db.Product.findOne({ order: [['id', 'DESC']] })
      const nextNum = (maxIdProduct ? maxIdProduct.id : 0) + 1
      code = `SP-${String(nextNum).padStart(3, '0')}`
    }

    let sellingPrice = Number(data.sellingPrice ?? data.price) || 0
    let costPrice = Number(data.costPrice ?? data.cost) || 0

    if (data.recipeItems && Array.isArray(data.recipeItems) && data.recipeItems.length > 0) {
      let sumCost = 0
      for (const r of data.recipeItems) {
        let sId = r.stockItemId
        let stockItem = null
        if (typeof sId === 'number' || (!isNaN(Number(sId)) && Number(sId) > 0)) {
          stockItem = await db.StockItem.findByPk(sId)
        }
        if (!stockItem) {
          stockItem = await db.StockItem.findOne({ where: { code: String(sId) } })
        }
        if (!stockItem) {
          stockItem = await db.StockItem.findOne({ where: { name: String(sId) } })
        }
        if (stockItem) {
          // Áp dụng unit conversion: 20g cà phê với kho đơn vị kg → costFactor = 0.02 kg
          const costFactor = getRecipeCostFactor(Number(r.amount) || 0, r.unit || stockItem.unit, stockItem.unit)
          sumCost += costFactor * (stockItem.costPerUnit || 0)
        }
      }
      if (sumCost > 0 || data.costPrice === undefined) {
        costPrice = Math.round(sumCost * 100) / 100
      }
    }

    const newProduct = await db.Product.create({
      code,
      name: data.name,
      categoryId,
      sellingPrice,
      costPrice,
      unit: data.unit || 'ly',
      status: data.status || 'Đang kinh doanh',
      imageUrl: data.imageUrl || data.img || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5s3vZRGHW-l9un_Pku9yhvejdxLJD-OPfHm88Lc0T2AN7J6Os0hUMTGwyEIsYWrXV2BRsx0QeEy1vBfkKG4Mx8WSlQ00T_yhtFDukz-1LSmzY566Oum2kVS2Hl0b_ZQ_kOW0NbJx7c0MfdZkoGMZKdnW_Hsxp3GolG21jiq5uOA8-hVgLYaoRT3O1xtw1gEFUY3yB1jxBkPXnzvI-CFwBu3Ngx7OT8_SKrA4yzA_cYxiBBS5DM9aV',
      isActive: true,
      isDeleted: false,
    })

    if (data.recipeItems && Array.isArray(data.recipeItems)) {
      for (const r of data.recipeItems) {
        let sId = r.stockItemId
        let stockItem = null
        if (typeof sId === 'number' || (!isNaN(Number(sId)) && Number(sId) > 0)) {
          stockItem = await db.StockItem.findByPk(sId)
        }
        if (!stockItem) {
          stockItem = await db.StockItem.findOne({ where: { code: String(sId) } })
        }
        if (!stockItem) {
          stockItem = await db.StockItem.findOne({ where: { name: String(sId) } })
        }
        if (stockItem) {
          const amt = Number(r.amount) || 1
          const itemUnit = r.unit || stockItem.unit || 'g'
          await db.ProductRecipe.create({
            productId: newProduct.id,
            stockItemId: stockItem.id,
            amount: amt,
            unit: itemUnit,
          })
        }
      }
    }

    return newProduct
  } catch (error) {
    throw parseError(error)
  }
}

const updateProduct = async (id: string | number, data: any) => {
  try {
    let product = null
    if (typeof id === 'number' || !isNaN(Number(id))) {
      product = await db.Product.findByPk(id)
    }
    if (!product) {
      product = await db.Product.findOne({ where: { code: String(id), isDeleted: false } })
    }
    if (!product) throw new Error('Không tìm thấy sản phẩm')

    if (data.name !== undefined && !String(data.name).trim()) {
      throw new Error('Vui lòng nhập tên sản phẩm')
    }
    if (data.sellingPrice !== undefined) {
      const checkPrice = Number(data.sellingPrice)
      if (isNaN(checkPrice) || checkPrice <= 0) {
        throw new Error('Giá bán sản phẩm phải lớn hơn 0')
      }
    }
    if (data.recipeItems !== undefined) {
      if (!Array.isArray(data.recipeItems) || data.recipeItems.length === 0) {
        throw new Error('Vui lòng thêm ít nhất 1 nguyên liệu trong công thức BOM sản phẩm')
      }
      for (const r of data.recipeItems) {
        if (!r.amount || Number(r.amount) <= 0) {
          throw new Error('Định lượng nguyên liệu trong công thức BOM phải lớn hơn 0')
        }
      }
    }

    let categoryId = data.categoryId
    if (!categoryId && data.category) {
      let categoryRecord = await db.Category.findOne({ where: { name: data.category } })
      if (!categoryRecord) {
        const catCode = data.category.toLowerCase().replace(/\s+/g, '_')
        categoryRecord = await db.Category.create({
          name: data.category,
          code: catCode,
          description: `Danh mục ${data.category}`,
          sortOrder: 99,
        })
      }
      categoryId = categoryRecord.id
    }

    let sumCost = 0
    let hasRecipeUpdate = false

    if (data.recipeItems && Array.isArray(data.recipeItems)) {
      hasRecipeUpdate = true
      await db.ProductRecipe.destroy({ where: { productId: product.id } })

      for (const r of data.recipeItems) {
        let sId = r.stockItemId
        let stockItem = await db.StockItem.findByPk(sId)
        if (!stockItem) {
          stockItem = await db.StockItem.findOne({ where: { code: String(sId) } })
        }
        if (!stockItem) {
          stockItem = await db.StockItem.findOne({ where: { name: String(sId) } })
        }
        if (stockItem) {
          const amt = Number(r.amount) || 1
          const itemUnit = r.unit || stockItem.unit || 'g'
          // Áp dụng unit conversion: 20g cà phê với kho đơn vị kg → costFactor = 0.02 kg
          const costFactor = getRecipeCostFactor(amt, itemUnit, stockItem.unit)
          sumCost += costFactor * (stockItem.costPerUnit || 0)
          await db.ProductRecipe.create({
            productId: product.id,
            stockItemId: stockItem.id,
            amount: amt,
            unit: itemUnit,
          })
        }
      }
    }

    const updateFields: any = {}
    if (data.name !== undefined) updateFields.name = data.name
    if (categoryId !== undefined) updateFields.categoryId = categoryId
    if (data.sellingPrice !== undefined || data.price !== undefined) updateFields.sellingPrice = Number(data.sellingPrice ?? data.price) || 0
    
    if (hasRecipeUpdate) {
      updateFields.costPrice = Math.round(sumCost * 100) / 100
    } else if (data.costPrice !== undefined || data.cost !== undefined) {
      updateFields.costPrice = Number(data.costPrice ?? data.cost) || 0
    }

    if (data.unit !== undefined) updateFields.unit = data.unit
    if (data.status !== undefined) updateFields.status = data.status
    if (data.imageUrl !== undefined || data.img !== undefined) updateFields.imageUrl = data.imageUrl || data.img

    await product.update(updateFields)
    return product
  } catch (error) {
    throw parseError(error)
  }
}

const deleteProduct = async (id: string | number) => {
  try {
    let product = null
    if (typeof id === 'number' || !isNaN(Number(id))) {
      product = await db.Product.findByPk(id)
    }
    if (!product) {
      product = await db.Product.findOne({ where: { code: String(id), isDeleted: false } })
    }
    if (!product) throw new Error('Không tìm thấy sản phẩm')

    await product.update({ isDeleted: true })
    return { success: true }
  } catch (error) {
    throw parseError(error)
  }
}

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedInitialData,
}
