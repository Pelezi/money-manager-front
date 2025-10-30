<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <h1 class="text-h4">Budget Spreadsheet</h1>
          <div>
            <v-select
              v-model="selectedYear"
              :items="years"
              label="Year"
              variant="outlined"
              density="compact"
              style="width: 120px"
              class="d-inline-block mr-2"
              @update:model-value="loadData"
            />
            <v-btn color="primary" @click="openAnnualDialog">
              <v-icon left>mdi-calendar-multiple</v-icon>
              Annual Budget Tool
            </v-btn>
          </div>
        </div>

        <!-- Type Tabs -->
        <v-tabs v-model="activeTab" class="mb-4">
          <v-tab value="EXPENSE">Expenses</v-tab>
          <v-tab value="INCOME">Income</v-tab>
        </v-tabs>

        <!-- Spreadsheet -->
        <div class="overflow-x-auto">
          <table class="budget-spreadsheet">
            <thead>
              <tr>
                <th class="sticky-col">Category</th>
                <th class="sticky-col-2">Subcategory</th>
                <th v-for="month in months" :key="month.value">{{ month.label }}</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="category in filteredCategories" :key="category.id">
                <tr v-for="(subcategory, idx) in getCategorySubcategories(category.id)" :key="subcategory.id">
                  <td v-if="idx === 0" :rowspan="getCategorySubcategories(category.id).length" class="sticky-col category-cell">
                    {{ category.name }}
                  </td>
                  <td class="sticky-col-2">{{ subcategory.name }}</td>
                  <td v-for="month in months" :key="month.value" class="budget-cell">
                    <div
                      class="editable-cell"
                      :class="getCellClass(subcategory.id, month.value)"
                      @click="editCell(subcategory.id, month.value)"
                      @mouseenter="showTooltip(subcategory.id, month.value, $event)"
                      @mouseleave="hideTooltip"
                    >
                      <span v-if="editingCell?.subcategoryId === subcategory.id && editingCell?.month === month.value">
                        <input
                          ref="cellInputRef"
                          v-model.number="editingValue"
                          type="number"
                          class="cell-input"
                          @blur="saveCellValue"
                          @keyup.enter="saveCellValue"
                          @keyup.escape="cancelEdit"
                        />
                      </span>
                      <span v-else>
                        {{ formatCurrency(getCellValue(subcategory.id, month.value)) }}
                      </span>
                    </div>
                  </td>
                  <td class="total-cell">
                    {{ formatCurrency(getSubcategoryTotal(subcategory.id)) }}
                  </td>
                </tr>
              </template>
              <tr class="total-row">
                <td colspan="2" class="sticky-col">Total</td>
                <td v-for="month in months" :key="month.value">
                  {{ formatCurrency(getMonthTotal(month.value)) }}
                </td>
                <td>{{ formatCurrency(getGrandTotal()) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tooltip -->
        <div
          v-if="tooltip.show"
          class="budget-tooltip"
          :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
        >
          <div><strong>Budget:</strong> {{ formatCurrency(tooltip.budgeted) }}</div>
          <div><strong>Actual:</strong> {{ formatCurrency(tooltip.actual) }}</div>
          <div><strong>Difference:</strong> {{ formatCurrency(tooltip.difference) }}</div>
        </div>

        <!-- Annual Budget Dialog -->
        <v-dialog v-model="annualDialog" max-width="600">
          <v-card>
            <v-card-title>Create Annual Budget</v-card-title>
            <v-card-text>
              <v-form ref="annualFormRef">
                <v-select
                  v-model="annualForm.subcategoryId"
                  :items="filteredSubcategories"
                  item-title="name"
                  item-value="id"
                  label="Subcategory"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                />
                <v-text-field
                  v-model.number="annualForm.totalAmount"
                  label="Total Annual Amount"
                  type="number"
                  :rules="[v => !!v || 'Required', v => v > 0 || 'Must be positive']"
                  variant="outlined"
                />
                <v-radio-group v-model="annualForm.distributionMethod" label="Distribution Method">
                  <v-radio label="Equal (divide by 12)" value="equal" />
                  <v-radio label="Custom per month" value="custom" />
                </v-radio-group>

                <div v-if="annualForm.distributionMethod === 'custom'" class="monthly-amounts">
                  <v-text-field
                    v-for="month in months"
                    :key="month.value"
                    v-model.number="annualForm.monthlyAmounts[month.value]"
                    :label="month.label"
                    type="number"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  />
                </div>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="annualDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="createAnnualBudget">Create</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Budget, Category, Subcategory, TransactionType, BudgetComparison } from '@/types/api'

definePageMeta({
  layout: 'dashboard'
})

const { getBudgets, createBudget, updateBudget, getBudgetComparison } = useBudgets()
const { getCategories } = useCategories()
const { getSubcategories } = useSubcategories()

const activeTab = ref<TransactionType>('EXPENSE')
const selectedYear = ref(new Date().getFullYear())
const categories = ref<Category[]>([])
const subcategories = ref<Subcategory[]>([])
const budgets = ref<Budget[]>([])
const comparisons = ref<Map<string, BudgetComparison>>(new Map())

const editingCell = ref<{ subcategoryId: string; month: number } | null>(null)
const editingValue = ref(0)
const cellInputRef = ref<HTMLInputElement[]>([])

const annualDialog = ref(false)
const annualFormRef = ref()
const annualForm = ref({
  subcategoryId: '',
  totalAmount: 0,
  distributionMethod: 'equal',
  monthlyAmounts: {} as Record<number, number>
})

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  budgeted: 0,
  actual: 0,
  difference: 0
})

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})

const months = [
  { label: 'Jan', value: 1 },
  { label: 'Feb', value: 2 },
  { label: 'Mar', value: 3 },
  { label: 'Apr', value: 4 },
  { label: 'May', value: 5 },
  { label: 'Jun', value: 6 },
  { label: 'Jul', value: 7 },
  { label: 'Aug', value: 8 },
  { label: 'Sep', value: 9 },
  { label: 'Oct', value: 10 },
  { label: 'Nov', value: 11 },
  { label: 'Dec', value: 12 }
]

const filteredCategories = computed(() => {
  return categories.value.filter(c => c.type === activeTab.value)
})

const filteredSubcategories = computed(() => {
  return subcategories.value.filter(s => s.type === activeTab.value)
})

const getCategorySubcategories = (categoryId: string) => {
  return subcategories.value.filter(s => s.categoryId === categoryId && s.type === activeTab.value)
}

const getCellValue = (subcategoryId: string, month: number) => {
  const budget = budgets.value.find(
    b => b.subcategoryId === subcategoryId && b.month === month && b.year === selectedYear.value
  )
  return budget?.amount || 0
}

const getCellClass = (subcategoryId: string, month: number) => {
  const key = `${subcategoryId}-${month}`
  const comparison = comparisons.value.get(key)
  
  if (!comparison || comparison.budgeted === 0) return ''
  
  const percentage = (comparison.actual / comparison.budgeted) * 100
  
  if (comparison.actual > comparison.budgeted) return 'over-budget'
  if (percentage > 90) return 'warning-budget'
  return 'good-budget'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const getSubcategoryTotal = (subcategoryId: string) => {
  return months.reduce((sum, month) => sum + getCellValue(subcategoryId, month.value), 0)
}

const getMonthTotal = (month: number) => {
  return filteredSubcategories.value.reduce(
    (sum, sub) => sum + getCellValue(sub.id!, month),
    0
  )
}

const getGrandTotal = () => {
  return months.reduce((sum, month) => sum + getMonthTotal(month.value), 0)
}

const editCell = (subcategoryId: string, month: number) => {
  editingCell.value = { subcategoryId, month }
  editingValue.value = getCellValue(subcategoryId, month)
  nextTick(() => {
    const input = cellInputRef.value[0]
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const saveCellValue = async () => {
  if (!editingCell.value) return

  const existingBudget = budgets.value.find(
    b =>
      b.subcategoryId === editingCell.value?.subcategoryId &&
      b.month === editingCell.value?.month &&
      b.year === selectedYear.value
  )

  const budgetData = {
    subcategoryId: editingCell.value.subcategoryId,
    month: editingCell.value.month,
    year: selectedYear.value,
    amount: editingValue.value,
    type: activeTab.value
  }

  if (existingBudget) {
    await updateBudget(existingBudget.id!, budgetData)
  } else {
    await createBudget(budgetData)
  }

  editingCell.value = null
  loadData()
}

const cancelEdit = () => {
  editingCell.value = null
}

const showTooltip = async (subcategoryId: string, month: number, event: MouseEvent) => {
  const { data } = await getBudgetComparison({
    year: selectedYear.value,
    month,
    type: activeTab.value
  })

  const comparison = data.value?.find(c => c.subcategoryId === subcategoryId)
  
  if (comparison) {
    tooltip.value = {
      show: true,
      x: event.pageX + 10,
      y: event.pageY + 10,
      budgeted: comparison.budgeted,
      actual: comparison.actual,
      difference: comparison.difference
    }
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}

const openAnnualDialog = () => {
  annualForm.value = {
    subcategoryId: '',
    totalAmount: 0,
    distributionMethod: 'equal',
    monthlyAmounts: {}
  }
  annualDialog.value = true
}

const createAnnualBudget = async () => {
  const { valid } = await annualFormRef.value.validate()
  if (!valid) return

  const promises = []
  
  if (annualForm.value.distributionMethod === 'equal') {
    const monthlyAmount = annualForm.value.totalAmount / 12
    for (const month of months) {
      const budgetData = {
        subcategoryId: annualForm.value.subcategoryId,
        month: month.value,
        year: selectedYear.value,
        amount: monthlyAmount,
        type: activeTab.value
      }
      promises.push(createBudget(budgetData))
    }
  } else {
    for (const month of months) {
      const amount = annualForm.value.monthlyAmounts[month.value] || 0
      if (amount > 0) {
        const budgetData = {
          subcategoryId: annualForm.value.subcategoryId,
          month: month.value,
          year: selectedYear.value,
          amount,
          type: activeTab.value
        }
        promises.push(createBudget(budgetData))
      }
    }
  }

  await Promise.all(promises)
  annualDialog.value = false
  loadData()
}

const loadData = async () => {
  const [categoriesRes, subcategoriesRes, budgetsRes] = await Promise.all([
    getCategories(),
    getSubcategories(),
    getBudgets({ year: selectedYear.value, type: activeTab.value })
  ])

  if (categoriesRes.data.value) categories.value = categoriesRes.data.value
  if (subcategoriesRes.data.value) subcategories.value = subcategoriesRes.data.value
  if (budgetsRes.data.value) budgets.value = budgetsRes.data.value

  // Load comparisons for all months
  const comparisonPromises = months.map(month =>
    getBudgetComparison({ year: selectedYear.value, month: month.value, type: activeTab.value })
  )
  
  const comparisonResults = await Promise.all(comparisonPromises)
  const newComparisons = new Map<string, BudgetComparison>()
  
  comparisonResults.forEach((result, idx) => {
    if (result.data.value) {
      result.data.value.forEach(comp => {
        const key = `${comp.subcategoryId}-${months[idx].value}`
        newComparisons.set(key, comp)
      })
    }
  })
  
  comparisons.value = newComparisons
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.budget-spreadsheet {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.budget-spreadsheet th,
.budget-spreadsheet td {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
}

.budget-spreadsheet th {
  background: #f5f5f5;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
  font-weight: 500;
}

.sticky-col-2 {
  position: sticky;
  left: 150px;
  background: white;
  z-index: 5;
}

.category-cell {
  background: #f9fafb;
  font-weight: 600;
}

.budget-cell {
  text-align: right;
  padding: 0 !important;
}

.editable-cell {
  padding: 8px 12px;
  cursor: pointer;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.editable-cell:hover {
  background: #f5f5f5;
}

.cell-input {
  width: 100%;
  border: 2px solid #1976d2;
  padding: 4px 8px;
  text-align: right;
  outline: none;
}

.good-budget {
  background: #e8f5e9;
}

.warning-budget {
  background: #fff3e0;
}

.over-budget {
  background: #ffebee;
}

.total-cell {
  background: #f5f5f5;
  font-weight: 600;
  text-align: right;
}

.total-row {
  background: #f0f0f0;
  font-weight: 700;
}

.total-row td {
  text-align: right;
}

.budget-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1000;
  pointer-events: none;
}

.budget-tooltip div {
  margin: 4px 0;
}

.monthly-amounts {
  max-height: 400px;
  overflow-y: auto;
}
</style>
