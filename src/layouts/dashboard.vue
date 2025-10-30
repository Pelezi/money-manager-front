<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>Budget Manager</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-account-circle" @click="handleLogout"></v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app>
      <v-list>
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" to="/dashboard"></v-list-item>
        <v-list-item prepend-icon="mdi-receipt" title="Transactions" to="/transactions"></v-list-item>
        <v-list-item prepend-icon="mdi-folder" title="Categories" to="/categories"></v-list-item>
        <v-list-item prepend-icon="mdi-table" title="Budget Spreadsheet" to="/budget-spreadsheet"></v-list-item>
        <v-list-item prepend-icon="mdi-chart-line" title="Annual Review" to="/annual-review"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { decodeJwt } from '@/utils/jwt'

const drawer = ref(true)
const userStore = useUserStore()
const router = useRouter()
const { user } = storeToRefs(userStore)

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (!user.value && typeof window !== 'undefined') {
    const raw = sessionStorage.getItem('token') || ''
    if (raw) userStore.setUser(decodeJwt(raw) || null)
  }
})
</script>
