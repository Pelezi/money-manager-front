<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="pa-6 mb-6">
          <v-card-title class="text-h3 mb-4">
            Welcome to Budget Manager
          </v-card-title>
          
          <v-card-text>
            <p class="text-h6 mb-4">Hello, {{ user?.name || user?.email }}!</p>
            <p class="mb-4">Manage your finances with ease.</p>
          </v-card-text>
        </v-card>

        <v-row>
          <v-col cols="12" md="6" lg="3">
            <v-card class="pa-4 text-center" hover @click="$router.push('/transactions')">
              <v-icon size="64" color="primary" class="mb-4">mdi-receipt</v-icon>
              <v-card-title class="text-h6">Transactions</v-card-title>
              <v-card-text>Track and manage all your income and expenses</v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6" lg="3">
            <v-card class="pa-4 text-center" hover @click="$router.push('/categories')">
              <v-icon size="64" color="primary" class="mb-4">mdi-folder</v-icon>
              <v-card-title class="text-h6">Categories</v-card-title>
              <v-card-text>Organize your transactions with categories</v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6" lg="3">
            <v-card class="pa-4 text-center" hover @click="$router.push('/budget-spreadsheet')">
              <v-icon size="64" color="primary" class="mb-4">mdi-table</v-icon>
              <v-card-title class="text-h6">Budget Spreadsheet</v-card-title>
              <v-card-text>Plan your monthly budgets like a spreadsheet</v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6" lg="3">
            <v-card class="pa-4 text-center" hover @click="$router.push('/annual-review')">
              <v-icon size="64" color="primary" class="mb-4">mdi-chart-line</v-icon>
              <v-card-title class="text-h6">Annual Review</v-card-title>
              <v-card-text>Visualize and analyze your yearly performance</v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/useUserStore'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

definePageMeta({
  layout: 'dashboard'
})

const userStore = useUserStore()
const router = useRouter()
const { user } = storeToRefs(userStore)
</script>

<style scoped>
.v-card:hover {
  cursor: pointer;
  transform: translateY(-4px);
  transition: transform 0.2s;
}
</style>
