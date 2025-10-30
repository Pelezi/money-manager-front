<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Category Manager</h1>

        <!-- Type Tabs -->
        <v-tabs v-model="activeTab" class="mb-4">
          <v-tab value="EXPENSE">Expenses</v-tab>
          <v-tab value="INCOME">Income</v-tab>
        </v-tabs>

        <!-- Two-panel view -->
        <v-row>
          <!-- Categories Panel -->
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title class="d-flex justify-space-between align-center">
                <span>Categories</span>
                <v-btn color="primary" size="small" @click="openCategoryDialog">
                  <v-icon left>mdi-plus</v-icon>
                  Add
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="category in filteredCategories"
                    :key="category.id"
                    :class="{ 'bg-blue-50': selectedCategory?.id === category.id }"
                    @click="selectCategory(category)"
                  >
                    <v-list-item-title>{{ category.name }}</v-list-item-title>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        @click.stop="editCategory(category)"
                      />
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        @click.stop="deleteCategoryConfirm(category)"
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Subcategories Panel -->
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title class="d-flex justify-space-between align-center">
                <span>Subcategories</span>
                <v-btn
                  color="primary"
                  size="small"
                  :disabled="!selectedCategory"
                  @click="openSubcategoryDialog"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Add
                </v-btn>
              </v-card-title>
              <v-card-text>
                <div v-if="!selectedCategory" class="text-center text-grey pa-4">
                  Select a category to view subcategories
                </div>
                <v-list v-else>
                  <v-list-item
                    v-for="subcategory in filteredSubcategories"
                    :key="subcategory.id"
                  >
                    <v-list-item-title>{{ subcategory.name }}</v-list-item-title>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        @click.stop="editSubcategory(subcategory)"
                      />
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        @click.stop="deleteSubcategoryConfirm(subcategory)"
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Category Dialog -->
        <v-dialog v-model="categoryDialog" max-width="500">
          <v-card>
            <v-card-title>{{ editCategoryMode ? 'Edit' : 'Create' }} Category</v-card-title>
            <v-card-text>
              <v-form ref="categoryFormRef">
                <v-text-field
                  v-model="categoryForm.name"
                  label="Category Name"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="categoryDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="saveCategory">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Subcategory Dialog -->
        <v-dialog v-model="subcategoryDialog" max-width="500">
          <v-card>
            <v-card-title>{{ editSubcategoryMode ? 'Edit' : 'Create' }} Subcategory</v-card-title>
            <v-card-text>
              <v-form ref="subcategoryFormRef">
                <v-text-field
                  v-model="subcategoryForm.name"
                  label="Subcategory Name"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="subcategoryDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="saveSubcategory">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Delete Dialogs -->
        <v-dialog v-model="deleteCategoryDialog" max-width="400">
          <v-card>
            <v-card-title>Confirm Delete</v-card-title>
            <v-card-text>
              Are you sure you want to delete this category? This will also delete all subcategories.
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="deleteCategoryDialog = false">Cancel</v-btn>
              <v-btn color="error" @click="deleteCategoryConfirmed">Delete</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="deleteSubcategoryDialog" max-width="400">
          <v-card>
            <v-card-title>Confirm Delete</v-card-title>
            <v-card-text>
              Are you sure you want to delete this subcategory?
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="deleteSubcategoryDialog = false">Cancel</v-btn>
              <v-btn color="error" @click="deleteSubcategoryConfirmed">Delete</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Category, Subcategory, TransactionType } from '@/types/api'

definePageMeta({
  layout: 'dashboard'
})

const { getCategories, createCategory, updateCategory, deleteCategory } = useCategories()
const { getSubcategories, createSubcategory, updateSubcategory, deleteSubcategory } = useSubcategories()

const activeTab = ref<TransactionType>('EXPENSE')
const categories = ref<Category[]>([])
const subcategories = ref<Subcategory[]>([])
const selectedCategory = ref<Category | null>(null)

const categoryDialog = ref(false)
const subcategoryDialog = ref(false)
const deleteCategoryDialog = ref(false)
const deleteSubcategoryDialog = ref(false)

const editCategoryMode = ref(false)
const editSubcategoryMode = ref(false)

const categoryFormRef = ref()
const subcategoryFormRef = ref()

const categoryForm = ref<Partial<Category>>({ name: '', type: 'EXPENSE' })
const subcategoryForm = ref<Partial<Subcategory>>({ name: '', type: 'EXPENSE', categoryId: '' })

const categoryToDelete = ref<Category | null>(null)
const subcategoryToDelete = ref<Subcategory | null>(null)

const filteredCategories = computed(() => {
  return categories.value.filter(c => c.type === activeTab.value)
})

const filteredSubcategories = computed(() => {
  if (!selectedCategory.value) return []
  return subcategories.value.filter(s => s.categoryId === selectedCategory.value?.id)
})

const loadCategories = async () => {
  const { data } = await getCategories()
  if (data.value) {
    categories.value = data.value
  }
}

const loadSubcategories = async () => {
  const { data } = await getSubcategories()
  if (data.value) {
    subcategories.value = data.value
  }
}

const selectCategory = (category: Category) => {
  selectedCategory.value = category
}

const openCategoryDialog = () => {
  editCategoryMode.value = false
  categoryForm.value = { name: '', type: activeTab.value }
  categoryDialog.value = true
}

const editCategory = (category: Category) => {
  editCategoryMode.value = true
  categoryForm.value = { ...category }
  categoryDialog.value = true
}

const saveCategory = async () => {
  const { valid } = await categoryFormRef.value.validate()
  if (!valid) return

  if (editCategoryMode.value && categoryForm.value.id) {
    await updateCategory(categoryForm.value.id, categoryForm.value)
  } else {
    await createCategory(categoryForm.value)
  }

  categoryDialog.value = false
  loadCategories()
}

const deleteCategoryConfirm = (category: Category) => {
  categoryToDelete.value = category
  deleteCategoryDialog.value = true
}

const deleteCategoryConfirmed = async () => {
  if (categoryToDelete.value?.id) {
    await deleteCategory(categoryToDelete.value.id)
    if (selectedCategory.value?.id === categoryToDelete.value.id) {
      selectedCategory.value = null
    }
    deleteCategoryDialog.value = false
    loadCategories()
    loadSubcategories()
  }
}

const openSubcategoryDialog = () => {
  if (!selectedCategory.value) return
  editSubcategoryMode.value = false
  subcategoryForm.value = {
    name: '',
    type: activeTab.value,
    categoryId: selectedCategory.value.id
  }
  subcategoryDialog.value = true
}

const editSubcategory = (subcategory: Subcategory) => {
  editSubcategoryMode.value = true
  subcategoryForm.value = { ...subcategory }
  subcategoryDialog.value = true
}

const saveSubcategory = async () => {
  const { valid } = await subcategoryFormRef.value.validate()
  if (!valid) return

  if (editSubcategoryMode.value && subcategoryForm.value.id) {
    await updateSubcategory(subcategoryForm.value.id, subcategoryForm.value)
  } else {
    await createSubcategory(subcategoryForm.value)
  }

  subcategoryDialog.value = false
  loadSubcategories()
}

const deleteSubcategoryConfirm = (subcategory: Subcategory) => {
  subcategoryToDelete.value = subcategory
  deleteSubcategoryDialog.value = true
}

const deleteSubcategoryConfirmed = async () => {
  if (subcategoryToDelete.value?.id) {
    await deleteSubcategory(subcategoryToDelete.value.id)
    deleteSubcategoryDialog.value = false
    loadSubcategories()
  }
}

onMounted(() => {
  loadCategories()
  loadSubcategories()
})
</script>
