<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Select from 'primevue/select'
import { fetchIngredients } from '@/api/ingredient.api'
import { fetchMasterCodes } from '@/api/masterCode.api'
import { createStockImport } from '@/api/stockImport.api'
import { useAppToast } from '@/composables/useAppToast'

const router = useRouter()
const { showSuccess, showError, showWarning } = useAppToast()

const supplier = ref('')
const warehouse = ref('')
const note = ref('')
const importDate = ref(new Date().toISOString().slice(0, 16))

const isSubmitting = ref(false)
const errorMessage = ref('')

interface AvailableIngredient {
  id: string
  dbId?: number
  name: string
  category: string
  unit: string
  defaultCost: number
}

const availableIngredients = ref<AvailableIngredient[]>([])
const unitOptions = ref<string[]>(['kg', 'g', 'lít', 'ml', 'bình', 'chai', 'lon', 'hộp', 'gói', 'bịch', 'thùng', 'ly', 'cái', 'phần', 'cốc'])

// Add Item Form State
const selectedIngId = ref('')
const addUnit = ref('kg')
const addQty = ref<number>(1)
const addUnitPrice = ref<number>(0)
const addTotalPrice = ref<number>(0)
const priceInputMode = ref<'unit' | 'total'>('total') // 'unit' or 'total'

// --- Pack Mode (Nhập theo quy cách đóng gói) ---
const isPackMode = ref(false)
const packSize = ref<number>(1)      // Dung tích/cân nặng mỗi đơn vị đóng gói (VD: 2.1 kg/bình)
const packCount = ref<number>(1)     // Số lượng đơn vị mua (VD: 2 bình)
const packUnit = ref('bình')         // Loại đóng gói (bình, hộp, lon, gói...)

const packUnitOptions = ['bình', 'hộp', 'lon', 'gói', 'thùng', 'chai', 'bịch', 'túi', 'thùng', 'cái', 'bao', 'kg', 'lít']

// Tổng số lượng kho khi dùng pack mode = packSize * packCount
const packTotalQty = computed(() => {
  const s = Number(packSize.value) || 0
  const c = Number(packCount.value) || 0
  return Math.round(s * c * 1000) / 1000
})

// Sync addQty from packTotalQty khi pack mode bật
watch([packSize, packCount], () => {
  if (isPackMode.value) {
    addQty.value = packTotalQty.value
    // Recalculate prices
    if (priceInputMode.value === 'total') {
      if (addTotalPrice.value > 0 && addQty.value > 0) {
        addUnitPrice.value = Math.round((addTotalPrice.value / addQty.value) * 100) / 100
      }
    } else {
      if (addUnitPrice.value > 0) {
        addTotalPrice.value = Math.round(addQty.value * addUnitPrice.value)
      }
    }
  }
})

const togglePackMode = () => {
  isPackMode.value = !isPackMode.value
  if (isPackMode.value) {
    // Khi bật pack mode, sync addQty từ pack calculation
    addQty.value = packTotalQty.value
  }
}
// -----------------------------------------------

const loadData = async () => {
  try {
    const [res, unitCodes] = await Promise.all([
      fetchIngredients({ pageSize: 1000 }),
      fetchMasterCodes('UNIT'),
    ])

    if (unitCodes && unitCodes.length > 0) {
      const setUnits = new Set([...unitOptions.value, ...unitCodes.map((u) => u.label)])
      unitOptions.value = Array.from(setUnits)
    }

    const ingredientsData = res.items || []
    if (ingredientsData.length > 0) {
      availableIngredients.value = ingredientsData.map((ing) => ({
        id: ing.id,
        dbId: ing.dbId,
        name: ing.name,
        category: ing.category,
        unit: ing.unit || 'kg',
        defaultCost: ing.rawCost || 0,
      }))
      if (availableIngredients.value.length > 0 && !selectedIngId.value) {
        selectedIngId.value = availableIngredients.value[0].id
        onSelectIngredient(availableIngredients.value[0].id)
      }
    }
  } catch (error) {
    console.error('Error loading stock import available ingredients:', error)
  }
}

onMounted(() => {
  loadData()
})

const onSelectIngredient = (ingId: string) => {
  const ing = availableIngredients.value.find((i) => i.id === ingId)
  if (!ing) return
  addUnit.value = ing.unit || 'kg'
  if (ing.defaultCost > 0) {
    addUnitPrice.value = ing.defaultCost
    const qty = isPackMode.value ? packTotalQty.value : (addQty.value || 1)
    addTotalPrice.value = Math.round(qty * ing.defaultCost)
  } else {
    addUnitPrice.value = 0
    addTotalPrice.value = 0
  }
}

watch(selectedIngId, (newId) => {
  if (newId) onSelectIngredient(newId)
})

// Auto-sync when changing addQty (chỉ khi không phải pack mode)
const onQtyChange = () => {
  if (isPackMode.value) return
  const qty = Number(addQty.value) || 0
  if (qty <= 0) return

  if (priceInputMode.value === 'total') {
    if (addTotalPrice.value > 0) {
      addUnitPrice.value = Math.round((addTotalPrice.value / qty) * 100) / 100
    }
  } else {
    if (addUnitPrice.value > 0) {
      addTotalPrice.value = Math.round(qty * addUnitPrice.value)
    }
  }
}

// When user inputs Unit Price
const onUnitPriceInput = () => {
  priceInputMode.value = 'unit'
  const qty = isPackMode.value ? packTotalQty.value : (Number(addQty.value) || 1)
  const price = Number(addUnitPrice.value) || 0
  addTotalPrice.value = Math.round(qty * price)
}

// When user inputs Total Price
const onTotalPriceInput = () => {
  priceInputMode.value = 'total'
  const qty = isPackMode.value ? packTotalQty.value : (Number(addQty.value) || 1)
  const total = Number(addTotalPrice.value) || 0
  if (qty > 0) {
    addUnitPrice.value = Math.round((total / qty) * 100) / 100
  }
}

interface ImportRow {
  ingredient: AvailableIngredient
  unit: string
  qty: number
  unitPrice: number
  totalPrice: number
  // Pack mode info (for display only)
  packInfo?: string
}

const importItems = ref<ImportRow[]>([])

const addImportItem = () => {
  const ing = availableIngredients.value.find((i) => i.id === selectedIngId.value)
  if (!ing) {
    showWarning('Vui lòng chọn nguyên liệu')
    return
  }

  // Xác định qty thực tế
  const qty = isPackMode.value ? packTotalQty.value : Number(addQty.value)
  if (!qty || qty <= 0) {
    showWarning('Vui lòng nhập số lượng nhập hợp lệ (> 0)')
    return
  }

  const total = Number(addTotalPrice.value) || 0
  const unitP = Number(addUnitPrice.value) || (qty > 0 ? total / qty : 0)

  if (total <= 0 && unitP <= 0) {
    showWarning('Vui lòng nhập đơn giá hoặc tổng tiền hàng')
    return
  }

  const finalUnitPrice = unitP > 0 ? unitP : Math.round((total / qty) * 100) / 100
  const finalTotalPrice = total > 0 ? total : Math.round(qty * finalUnitPrice)

  // Pack mode info string for display
  let packInfo: string | undefined = undefined
  if (isPackMode.value) {
    packInfo = `${packCount.value} ${packUnit.value} × ${packSize.value} ${addUnit.value}`
  }

  importItems.value.push({
    ingredient: ing,
    unit: addUnit.value || ing.unit,
    qty,
    unitPrice: finalUnitPrice,
    totalPrice: finalTotalPrice,
    packInfo,
  })

  // Reset partial form for next addition
  if (isPackMode.value) {
    packCount.value = 1
    packSize.value = 1
  } else {
    addQty.value = 1
  }
  addTotalPrice.value = 0
  addUnitPrice.value = 0
}

const updateRowQty = (row: ImportRow) => {
  const q = Number(row.qty) || 0
  if (q > 0) {
    row.totalPrice = Math.round(q * (row.unitPrice || 0))
  }
}

const updateRowUnitPrice = (row: ImportRow) => {
  const p = Number(row.unitPrice) || 0
  const q = Number(row.qty) || 0
  row.totalPrice = Math.round(q * p)
}

const updateRowTotalPrice = (row: ImportRow) => {
  const t = Number(row.totalPrice) || 0
  const q = Number(row.qty) || 0
  if (q > 0) {
    row.unitPrice = Math.round((t / q) * 100) / 100
  }
}

const removeItem = (idx: number) => {
  importItems.value.splice(idx, 1)
}

const totalAmount = computed(() => {
  return importItems.value.reduce((sum, item) => sum + (Number(item.totalPrice) || (item.qty * item.unitPrice)), 0)
})

const formatCurrency = (val: number) => {
  return (Number(val) || 0).toLocaleString('vi-VN') + ' ₫'
}

// Computed qty display for the "Formula Preview" chip
const previewQty = computed(() => {
  return isPackMode.value ? packTotalQty.value : (Number(addQty.value) || 0)
})

const handleSave = async () => {
  if (importItems.value.length === 0) {
    const msg = 'Vui lòng thêm ít nhất 1 nguyên liệu vào đơn nhập'
    errorMessage.value = msg
    showWarning(msg)
    return
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''

    await createStockImport({
      supplier: supplier.value,
      warehouse: warehouse.value,
      importDate: importDate.value,
      note: note.value,
      items: importItems.value.map((i) => ({
        ingredientId: i.ingredient.id,
        dbId: i.ingredient.dbId,
        unit: i.unit,
        qty: Number(i.qty) || 0,
        unitPrice: Number(i.unitPrice) || 0,
        totalAmount: Number(i.totalPrice) || 0,
      })),
    })

    showSuccess('Đã tạo phiếu nhập kho và cập nhật tồn kho thành công!')
    router.push('/ingredients')
  } catch (error: any) {
    console.error('Error saving stock import:', error)
    const msg = error?.response?.data?.message || error?.message || 'Lỗi khi lưu phiếu nhập kho'
    errorMessage.value = msg
    showError(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="stock-import-create-page flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-6 max-w-6xl mx-auto pb-10">
    <!-- Header Title & Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2D7CC]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Tạo đơn nhập kho mới</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Lập phiếu nhập kho nguyên liệu từ nhà cung cấp, linh hoạt ĐVT và tự động tính đơn giá vốn</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="router.back()"
          type="button"
          :disabled="isSubmitting"
          class="h-10 px-4 bg-[#F2ECE4] hover:bg-[#E8DFD5] text-[#42493d] font-semibold text-xs rounded-xl border border-[#c1c9b9]/60 transition disabled:opacity-50 cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          @click="handleSave"
          :disabled="isSubmitting"
          class="h-10 px-5 bg-[#8E3E2F] hover:bg-[#6E281C] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span v-if="!isSubmitting" class="material-symbols-outlined text-lg">check</span>
          <span v-else class="material-symbols-outlined text-lg animate-spin">refresh</span>
          <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu đơn nhập' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="p-4 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl text-xs font-semibold text-[#ba1a1a] flex items-center gap-2">
      <span class="material-symbols-outlined text-lg">error</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Main Bento Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- General Info Card -->
      <div class="bg-white rounded-2xl p-6 border border-[#E2D7CC] shadow-sm flex flex-col gap-4">
        <h2 class="text-base font-bold font-display text-[#1e1b1b] border-b border-[#E2D7CC] pb-3">Thông tin phiếu nhập</h2>

        <div class="space-y-4">
          <!-- Supplier (Text Input) -->
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Nhà cung cấp</label>
            <input
              v-model="supplier"
              type="text"
              placeholder="Ví dụ: NCC Cholimex, Vinamilk, Metro..."
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 transition"
            />
          </div>

          <!-- Warehouse (Text Input) -->
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Kho nhập</label>
            <input
              v-model="warehouse"
              type="text"
              placeholder="Ví dụ: Kho Tổng - Q1, Kho Phụ - Q3..."
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 transition"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Thời gian nhập *</label>
            <input
              v-model="importDate"
              type="datetime-local"
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Ghi chú phiếu nhập</label>
            <textarea
              v-model="note"
              rows="3"
              placeholder="Nhập ghi chú thêm (ví dụ: Số hoá đơn VAT, ghi chú giao hàng...)"
              class="w-full px-3.5 py-2.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            ></textarea>
          </div>
        </div>

        <!-- Total Cost Summary Badge -->
        <div class="mt-auto p-4 bg-[#F9F6F0] rounded-xl border border-[#E2D7CC] flex justify-between items-center">
          <span class="text-xs font-bold text-[#42493d]">Tổng tiền đơn nhập:</span>
          <span class="text-xl font-bold font-display text-[#326824]">{{ formatCurrency(totalAmount) }}</span>
        </div>
      </div>

      <!-- Ingredient Items List Table Card -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E2D7CC] shadow-sm flex flex-col gap-4">
        <div class="flex justify-between items-center border-b border-[#E2D7CC] pb-3">
          <div>
            <h2 class="text-base font-bold font-display text-[#1e1b1b]">Thêm nguyên liệu vào đơn</h2>
            <p class="text-[11px] text-[#72796c] mt-0.5">Nhập số lượng & tổng tiền mua để hệ thống tự động tính đơn giá vốn</p>
          </div>
          <span class="text-xs font-semibold text-[#8E3E2F] bg-[#F2ECE4] px-3 py-1 rounded-lg">Đã chọn: {{ importItems.length }} mục</span>
        </div>

        <!-- Add Item Selector & Calculator Box -->
        <div class="p-4 bg-[#faf5f4] rounded-xl border border-[#E2D7CC] space-y-3">

          <!-- Pack Mode Toggle Banner -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sm text-[#8E3E2F]">inventory_2</span>
              <span class="text-[11px] font-bold text-[#42493d] uppercase tracking-wide">Chế độ nhập</span>
            </div>
            <button
              type="button"
              @click="togglePackMode"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer"
              :class="isPackMode
                ? 'bg-[#8E3E2F] text-white shadow-sm'
                : 'bg-white border border-[#c1c9b9]/70 text-[#42493d] hover:border-[#8E3E2F]/50'"
            >
              <span class="material-symbols-outlined text-sm">{{ isPackMode ? 'package_2' : 'straighten' }}</span>
              <span>{{ isPackMode ? 'Nhập theo quy cách đóng gói' : 'Nhập trực tiếp số lượng' }}</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <!-- Select Ingredient -->
            <div class="sm:col-span-6">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Nguyên liệu *</label>
              <Select
                v-model="selectedIngId"
                :options="availableIngredients"
                optionLabel="name"
                optionValue="id"
                filter
                placeholder="Tìm & chọn nguyên liệu..."
                class="w-full h-10 text-xs font-medium"
              />
            </div>

            <!-- Import Unit -->
            <div class="sm:col-span-3">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">ĐVT kho</label>
              <Select
                v-model="addUnit"
                :options="unitOptions"
                editable
                filter
                placeholder="ĐVT"
                class="w-full h-10 text-xs font-medium"
              />
            </div>

            <!-- Direct Qty (when NOT pack mode) -->
            <div v-if="!isPackMode" class="sm:col-span-3">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Số lượng *</label>
              <input
                v-model.number="addQty"
                @input="onQtyChange"
                type="number"
                step="any"
                min="0.001"
                placeholder="Ví dụ: 4.2"
                class="w-full h-10 px-3 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-bold text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
              />
            </div>

            <!-- Pack Mode Fields -->
            <template v-if="isPackMode">
              <!-- Pack qty placeholder to fill the 3rd column -->
              <div class="sm:col-span-3">
                <!-- empty on purpose, pack fields below take a new row -->
              </div>
            </template>
          </div>

          <!-- Pack Mode: quy cách đóng gói row -->
          <div v-if="isPackMode" class="p-3 bg-[#fff8e1] rounded-xl border border-[#ffe082] space-y-2">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="material-symbols-outlined text-sm text-[#f57f17]">package_2</span>
              <span class="text-[11px] font-bold text-[#f57f17] uppercase tracking-wide">Quy cách đóng gói</span>
              <span class="text-[10px] text-[#a68a00] ml-1">— Nhập số đơn vị mua và dung tích/cân nặng mỗi đơn vị, hệ thống tự tính tổng vào kho</span>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <!-- Pack count: số lượng mua -->
              <div>
                <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Số lượng mua *</label>
                <input
                  v-model.number="packCount"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Ví dụ: 2"
                  class="w-full h-10 px-3 bg-white border border-[#ffe082] rounded-xl text-xs font-bold text-[#1e1b1b] outline-none focus:border-[#f57f17] focus:ring-2 focus:ring-[#f57f17]/20"
                />
              </div>

              <!-- Pack unit: loại đóng gói -->
              <div>
                <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Loại đóng gói</label>
                <Select
                  v-model="packUnit"
                  :options="packUnitOptions"
                  editable
                  placeholder="bình, hộp, lon..."
                  class="w-full h-10 text-xs font-medium"
                />
              </div>

              <!-- Pack size: dung tích/cân nặng mỗi đơn vị -->
              <div>
                <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Quy cách ({{ addUnit }}/{{ packUnit }})</label>
                <input
                  v-model.number="packSize"
                  type="number"
                  step="any"
                  min="0.001"
                  :placeholder="`Ví dụ: 2.1`"
                  class="w-full h-10 px-3 bg-white border border-[#ffe082] rounded-xl text-xs font-bold text-[#1e1b1b] outline-none focus:border-[#f57f17] focus:ring-2 focus:ring-[#f57f17]/20"
                />
              </div>
            </div>

            <!-- Pack calculation result -->
            <div class="flex items-center gap-2 mt-1 p-2 bg-white rounded-lg border border-[#ffe082]">
              <span class="material-symbols-outlined text-sm text-[#f57f17]">calculate</span>
              <span class="text-[11px] text-[#42493d]">
                <strong class="text-[#1e1b1b]">{{ packCount }} {{ packUnit }}</strong>
                × <strong class="text-[#1e1b1b]">{{ packSize }} {{ addUnit }}/{{ packUnit }}</strong>
                =
                <strong class="text-[#326824] text-sm">{{ packTotalQty }} {{ addUnit }}</strong>
                <span class="text-[#72796c] ml-1">(sẽ được nhập vào kho)</span>
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <!-- Total Price / Thành tiền -->
            <div class="sm:col-span-5">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">
                Tổng tiền mua (VNĐ) <span class="text-[#8E3E2F] font-normal lowercase">(ví dụ 57.000)</span>
              </label>
              <input
                v-model.number="addTotalPrice"
                @input="onTotalPriceInput"
                type="number"
                min="0"
                placeholder="57,000"
                class="w-full h-10 px-3 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-bold text-[#326824] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
              />
            </div>

            <!-- Unit Price / Đơn giá tính ra -->
            <div class="sm:col-span-4">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">
                Đơn giá tính ra (₫/{{ addUnit }})
              </label>
              <input
                v-model.number="addUnitPrice"
                @input="onUnitPriceInput"
                type="number"
                min="0"
                placeholder="27,143"
                class="w-full h-10 px-3 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-semibold text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
              />
            </div>

            <!-- Add Button -->
            <div class="sm:col-span-3">
              <button
                @click="addImportItem"
                type="button"
                class="w-full h-10 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <span class="material-symbols-outlined text-base">add</span>
                <span>Thêm vào đơn</span>
              </button>
            </div>
          </div>

          <!-- Formula Preview Chip -->
          <div v-if="previewQty > 0 && (addTotalPrice > 0 || addUnitPrice > 0)" class="flex items-center gap-2 text-[11px] text-[#72796c] bg-white px-3 py-1.5 rounded-lg border border-[#E2D7CC]">
            <span class="material-symbols-outlined text-sm text-[#8E3E2F]">calculate</span>
            <span>
              Quy cách tính:
              <strong>{{ previewQty }} {{ addUnit }}</strong>
              × <strong>{{ formatCurrency(addUnitPrice) }}</strong>
              = <strong class="text-[#326824]">{{ formatCurrency(addTotalPrice) }}</strong>
            </span>
          </div>
        </div>

        <!-- Table of Import Items -->
        <div class="overflow-x-auto border border-[#E2D7CC] rounded-xl">
          <table class="w-full text-left text-xs text-[#1e1b1b]">
            <thead class="bg-[#F5EFE8] text-[#42493d] font-semibold uppercase tracking-wider border-b border-[#E2D7CC]">
              <tr>
                <th class="py-3 px-3 w-10 text-center">STT</th>
                <th class="py-3 px-3">Tên nguyên liệu</th>
                <th class="py-3 px-3 w-28 text-center">ĐVT kho</th>
                <th class="py-3 px-3 w-28 text-center">Số lượng</th>
                <th class="py-3 px-3 w-32 text-right">Đơn giá vốn (₫)</th>
                <th class="py-3 px-3 w-36 text-right">Thành tiền (₫)</th>
                <th class="py-3 px-2 w-12 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody v-if="importItems.length > 0" class="divide-y divide-[#F2ECE4]">
              <tr v-for="(item, idx) in importItems" :key="idx" class="hover:bg-[#F5EFE8]/50 transition">
                <td class="py-3 px-3 text-center font-bold text-[#72796c]">{{ idx + 1 }}</td>
                <td class="py-3 px-3">
                  <div class="font-bold text-[#1e1b1b]">{{ item.ingredient.name }}</div>
                  <div class="text-[10px] text-[#72796c]">{{ item.ingredient.id }} • {{ item.ingredient.category }}</div>
                  <!-- Pack info badge -->
                  <div v-if="item.packInfo" class="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[#a68a00] bg-[#fff8e1] px-1.5 py-0.5 rounded-md border border-[#ffe082]">
                    <span class="material-symbols-outlined text-xs">package_2</span>
                    {{ item.packInfo }}
                  </div>
                </td>
                <td class="py-3 px-3 text-center">
                  <input
                    v-model="item.unit"
                    type="text"
                    class="w-20 px-2 py-1 bg-white border border-[#c1c9b9]/70 rounded-lg text-center font-semibold text-xs outline-none focus:border-[#8E3E2F]"
                  />
                </td>
                <td class="py-3 px-3 text-center">
                  <input
                    v-model.number="item.qty"
                    @input="updateRowQty(item)"
                    type="number"
                    step="any"
                    min="0.001"
                    class="w-20 px-2 py-1 bg-white border border-[#c1c9b9]/70 rounded-lg text-center font-bold text-xs outline-none focus:border-[#8E3E2F]"
                  />
                </td>
                <td class="py-3 px-3 text-right">
                  <input
                    v-model.number="item.unitPrice"
                    @input="updateRowUnitPrice(item)"
                    type="number"
                    step="any"
                    min="0"
                    class="w-24 px-2 py-1 bg-white border border-[#c1c9b9]/70 rounded-lg text-right font-medium text-xs outline-none focus:border-[#8E3E2F]"
                  />
                </td>
                <td class="py-3 px-3 text-right">
                  <input
                    v-model.number="item.totalPrice"
                    @input="updateRowTotalPrice(item)"
                    type="number"
                    step="any"
                    min="0"
                    class="w-28 px-2 py-1 bg-white border border-[#c1c9b9]/70 rounded-lg text-right font-bold text-xs text-[#326824] outline-none focus:border-[#8E3E2F]"
                  />
                </td>
                <td class="py-3 px-2 text-center">
                  <button @click="removeItem(idx)" type="button" class="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md transition cursor-pointer" title="Xóa dòng này">
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="7" class="py-8 text-center text-[#72796c]">
                  <span class="material-symbols-outlined text-3xl text-[#c1c9b9] block mb-1">add_shopping_cart</span>
                  <span class="text-xs font-semibold">Chưa có nguyên liệu nào trong đơn nhập</span>
                  <p class="text-[11px] text-[#72796c] mt-0.5">Vui lòng chọn nguyên liệu và bấm "+ Thêm vào đơn" ở phía trên</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./StockImportCreate.scss"></style>
