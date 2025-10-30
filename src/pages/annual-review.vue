<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <h1 class="text-h4">Annual Review</h1>
          <v-select
            v-model="selectedYear"
            :items="years"
            label="Year"
            variant="outlined"
            density="compact"
            style="width: 120px"
            @update:model-value="loadData"
          />
        </div>

        <!-- Summary Cards -->
        <v-row class="mb-6">
          <v-col cols="12" md="3">
            <v-card class="pa-4">
              <div class="text-caption text-grey">Total Income</div>
              <div class="text-h5 text-green">{{ formatCurrency(summary.totalIncome) }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="pa-4">
              <div class="text-caption text-grey">Total Expenses</div>
              <div class="text-h5 text-red">{{ formatCurrency(summary.totalExpenses) }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="pa-4">
              <div class="text-caption text-grey">Net</div>
              <div class="text-h5" :class="summary.net >= 0 ? 'text-green' : 'text-red'">
                {{ formatCurrency(summary.net) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="pa-4">
              <div class="text-caption text-grey">Savings Rate</div>
              <div class="text-h5 text-blue">{{ summary.savingsRate.toFixed(1) }}%</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Charts -->
        <v-row class="mb-6">
          <v-col cols="12" md="8">
            <v-card>
              <v-card-title>Monthly Trends</v-card-title>
              <v-card-text>
                <apexchart
                  type="line"
                  height="350"
                  :options="lineChartOptions"
                  :series="lineChartSeries"
                />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card>
              <v-card-title>Expense Breakdown</v-card-title>
              <v-card-text>
                <apexchart
                  type="pie"
                  height="350"
                  :options="pieChartOptions"
                  :series="pieChartSeries"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mb-6">
          <v-col cols="12">
            <v-card>
              <v-card-title>Budget vs Actual Comparison</v-card-title>
              <v-card-text>
                <apexchart
                  type="bar"
                  height="400"
                  :options="barChartOptions"
                  :series="barChartSeries"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Performance Table -->
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Category Performance</v-card-title>
              <v-card-text>
                <v-data-table
                  :headers="performanceHeaders"
                  :items="performanceData"
                  :items-per-page="10"
                >
                  <template v-slot:item.budgeted="{ item }">
                    {{ formatCurrency(item.budgeted) }}
                  </template>
                  <template v-slot:item.actual="{ item }">
                    {{ formatCurrency(item.actual) }}
                  </template>
                  <template v-slot:item.difference="{ item }">
                    <span :class="item.difference >= 0 ? 'text-green' : 'text-red'">
                      {{ formatCurrency(Math.abs(item.difference)) }}
                      {{ item.difference >= 0 ? '✓' : '✗' }}
                    </span>
                  </template>
                  <template v-slot:item.percentage="{ item }">
                    <v-progress-linear
                      :model-value="item.percentage"
                      :color="item.percentage > 100 ? 'red' : item.percentage > 90 ? 'orange' : 'green'"
                      height="20"
                    >
                      {{ item.percentage.toFixed(0) }}%
                    </v-progress-linear>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { BudgetComparison, TransactionAggregation } from '@/types/api'

definePageMeta({
  layout: 'dashboard'
})

const apexchart = VueApexCharts

const { getBudgetComparison } = useBudgets()
const { getAggregatedTransactions } = useTransactions()

const selectedYear = ref(new Date().getFullYear())
const monthlyComparisons = ref<BudgetComparison[][]>([])
const expenseAggregations = ref<TransactionAggregation[]>([])
const incomeAggregations = ref<TransactionAggregation[]>([])

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const summary = computed(() => {
  const totalIncome = incomeAggregations.value.reduce((sum, agg) => sum + agg.total, 0)
  const totalExpenses = expenseAggregations.value.reduce((sum, agg) => sum + agg.total, 0)
  const net = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0

  return {
    totalIncome,
    totalExpenses,
    net,
    savingsRate
  }
})

const lineChartSeries = computed(() => {
  const budgetedData: number[] = []
  const actualData: number[] = []

  for (let i = 0; i < 12; i++) {
    const comparisons = monthlyComparisons.value[i] || []
    budgetedData.push(comparisons.reduce((sum, c) => sum + c.budgeted, 0))
    actualData.push(comparisons.reduce((sum, c) => sum + c.actual, 0))
  }

  return [
    { name: 'Budgeted', data: budgetedData },
    { name: 'Actual', data: actualData }
  ]
})

const lineChartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: true }
  },
  xaxis: {
    categories: months
  },
  yaxis: {
    labels: {
      formatter: (value: number) => formatCurrency(value)
    }
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  colors: ['#1976d2', '#43a047']
}))

const pieChartSeries = computed(() => {
  return expenseAggregations.value.map(agg => agg.total)
})

const pieChartOptions = computed(() => ({
  chart: {
    type: 'pie'
  },
  labels: expenseAggregations.value.map(agg => agg.categoryName),
  legend: {
    position: 'bottom'
  }
}))

const barChartSeries = computed(() => {
  const categories = new Map<string, { budgeted: number; actual: number }>()
  
  monthlyComparisons.value.forEach(monthData => {
    monthData.forEach(comp => {
      const existing = categories.get(comp.categoryName) || { budgeted: 0, actual: 0 }
      existing.budgeted += comp.budgeted
      existing.actual += comp.actual
      categories.set(comp.categoryName, existing)
    })
  })

  const budgetedData: number[] = []
  const actualData: number[] = []
  
  Array.from(categories.values()).forEach(cat => {
    budgetedData.push(cat.budgeted)
    actualData.push(cat.actual)
  })

  return [
    { name: 'Budgeted', data: budgetedData },
    { name: 'Actual', data: actualData }
  ]
})

const barChartOptions = computed(() => {
  const categoryNames = Array.from(
    new Set(
      monthlyComparisons.value.flat().map(comp => comp.categoryName)
    )
  )

  return {
    chart: {
      type: 'bar'
    },
    plotOptions: {
      bar: {
        horizontal: false,
        dataLabels: {
          position: 'top'
        }
      }
    },
    xaxis: {
      categories: categoryNames
    },
    yaxis: {
      labels: {
        formatter: (value: number) => formatCurrency(value)
      }
    },
    colors: ['#1976d2', '#43a047']
  }
})

const performanceHeaders = [
  { title: 'Category', value: 'categoryName' },
  { title: 'Subcategory', value: 'subcategoryName' },
  { title: 'Budgeted', value: 'budgeted', align: 'end' },
  { title: 'Actual', value: 'actual', align: 'end' },
  { title: 'Difference', value: 'difference', align: 'end' },
  { title: 'Usage', value: 'percentage', align: 'end' }
]

const performanceData = computed(() => {
  const allComparisons = monthlyComparisons.value.flat()
  const aggregated = new Map<string, BudgetComparison>()

  allComparisons.forEach(comp => {
    const key = `${comp.subcategoryId}`
    const existing = aggregated.get(key)
    
    if (existing) {
      existing.budgeted += comp.budgeted
      existing.actual += comp.actual
      existing.difference = existing.budgeted - existing.actual
    } else {
      aggregated.set(key, { ...comp, difference: comp.budgeted - comp.actual })
    }
  })

  return Array.from(aggregated.values()).map(comp => ({
    ...comp,
    percentage: comp.budgeted > 0 ? (comp.actual / comp.budgeted) * 100 : 0
  }))
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const loadData = async () => {
  const startDate = `${selectedYear.value}-01-01`
  const endDate = `${selectedYear.value}-12-31`

  // Load monthly comparisons
  const comparisonPromises = Array.from({ length: 12 }, (_, i) =>
    getBudgetComparison({ year: selectedYear.value, month: i + 1, type: 'EXPENSE' })
  )

  const comparisonResults = await Promise.all(comparisonPromises)
  monthlyComparisons.value = comparisonResults.map(res => res.data.value || [])

  // Load aggregated transactions
  const [expenseRes, incomeRes] = await Promise.all([
    getAggregatedTransactions({ startDate, endDate, type: 'EXPENSE' }),
    getAggregatedTransactions({ startDate, endDate, type: 'INCOME' })
  ])

  if (expenseRes.data.value) expenseAggregations.value = expenseRes.data.value
  if (incomeRes.data.value) incomeAggregations.value = incomeRes.data.value
}

onMounted(() => {
  loadData()
})
</script>
