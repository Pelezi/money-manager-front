<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Transaction Manager</h1>
        
        <!-- Filters -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.startDate"
                  label="Start Date"
                  type="date"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.endDate"
                  label="End Date"
                  type="date"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.type"
                  :items="['EXPENSE', 'INCOME']"
                  label="Type"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.subcategoryId"
                  :items="subcategories"
                  item-title="name"
                  item-value="id"
                  label="Subcategory"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-btn color="primary" @click="loadTransactions" class="mr-2">
                  Apply Filters
                </v-btn>
                <v-btn @click="resetFilters">
                  Reset
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Add Transaction Button -->
        <v-btn color="primary" class="mb-4" @click="openCreateDialog">
          <v-icon left>mdi-plus</v-icon>
          Add Transaction
        </v-btn>

        <!-- Transactions Table -->
        <v-card>
          <v-data-table
            :headers="headers"
            :items="transactions"
            :loading="loading"
            item-value="id"
          >
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            <template v-slot:item.amount="{ item }">
              {{ formatCurrency(item.amount) }}
            </template>
            <template v-slot:item.type="{ item }">
              <v-chip :color="item.type === 'EXPENSE' ? 'red' : 'green'" size="small">
                {{ item.type }}
              </v-chip>
            </template>
            <template v-slot:item.subcategory="{ item }">
              {{ item.subcategory?.name }}
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="editTransaction(item)" />
              <v-btn icon="mdi-delete" size="small" variant="text" @click="deleteTransactionConfirm(item)" />
            </template>
          </v-data-table>
        </v-card>

        <!-- Create/Edit Dialog -->
        <v-dialog v-model="dialog" max-width="600">
          <v-card>
            <v-card-title>{{ editMode ? 'Edit' : 'Create' }} Transaction</v-card-title>
            <v-card-text>
              <v-form ref="formRef">
                <v-text-field
                  v-model="form.description"
                  label="Description"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                />
                <v-text-field
                  v-model.number="form.amount"
                  label="Amount"
                  type="number"
                  :rules="[v => !!v || 'Required', v => v > 0 || 'Must be positive']"
                  variant="outlined"
                />
                <v-text-field
                  v-model="form.date"
                  label="Date"
                  type="date"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                />
                <v-select
                  v-model="form.type"
                  :items="['EXPENSE', 'INCOME']"
                  label="Type"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                  @update:model-value="loadSubcategoriesByType"
                />
                <v-select
                  v-model="form.subcategoryId"
                  :items="dialogSubcategories"
                  item-title="name"
                  item-value="id"
                  label="Subcategory"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="dialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="saveTransaction">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="400">
          <v-card>
            <v-card-title>Confirm Delete</v-card-title>
            <v-card-text>
              Are you sure you want to delete this transaction?
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="deleteDialog = false">Cancel</v-btn>
              <v-btn color="error" @click="deleteTransactionConfirmed">Delete</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import type { Transaction, Subcategory, TransactionType } from '@/types/api'

definePageMeta({
  layout: 'dashboard'
})

const { getTransactions, createTransaction, updateTransaction, deleteTransaction } = useTransactions()
const { getSubcategories } = useSubcategories()

const transactions = ref<Transaction[]>([])
const subcategories = ref<Subcategory[]>([])
const dialogSubcategories = ref<Subcategory[]>([])
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const formRef = ref()
const transactionToDelete = ref<Transaction | null>(null)

const filters = ref({
  startDate: '',
  endDate: '',
  type: null as TransactionType | null,
  subcategoryId: ''
})

const form = ref<Partial<Transaction>>({
  description: '',
  amount: 0,
  date: '',
  type: 'EXPENSE',
  subcategoryId: ''
})

const headers = [
  { title: 'Date', value: 'date', sortable: true },
  { title: 'Description', value: 'description' },
  { title: 'Amount', value: 'amount', align: 'end' as const },
  { title: 'Type', value: 'type' },
  { title: 'Subcategory', value: 'subcategory' },
  { title: 'Actions', value: 'actions', sortable: false, align: 'end' as const }
]

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const loadTransactions = async () => {
  loading.value = true
  const { data, error } = await getTransactions(filters.value)
  if (data.value) {
    transactions.value = data.value
  }
  loading.value = false
}

const loadSubcategories = async () => {
  const { data } = await getSubcategories()
  if (data.value) {
    subcategories.value = data.value
  }
}

const loadSubcategoriesByType = async () => {
  if (form.value.type) {
    const { data } = await getSubcategories({ type: form.value.type })
    if (data.value) {
      dialogSubcategories.value = data.value
    }
  }
}

const resetFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    type: null,
    subcategoryId: ''
  }
  loadTransactions()
}

const openCreateDialog = () => {
  editMode.value = false
  form.value = {
    description: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'EXPENSE',
    subcategoryId: ''
  }
  loadSubcategoriesByType()
  dialog.value = true
}

const editTransaction = (item: Transaction) => {
  editMode.value = true
  form.value = { ...item }
  loadSubcategoriesByType()
  dialog.value = true
}

const saveTransaction = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  if (editMode.value && form.value.id) {
    await updateTransaction(form.value.id, form.value)
  } else {
    await createTransaction(form.value)
  }
  
  dialog.value = false
  loadTransactions()
}

const deleteTransactionConfirm = (item: Transaction) => {
  transactionToDelete.value = item
  deleteDialog.value = true
}

const deleteTransactionConfirmed = async () => {
  if (transactionToDelete.value?.id) {
    await deleteTransaction(transactionToDelete.value.id)
    deleteDialog.value = false
    loadTransactions()
  }
}

onMounted(() => {
  loadTransactions()
  loadSubcategories()
})
</script>
