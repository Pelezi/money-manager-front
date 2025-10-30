<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="pa-6">
          <v-card-title class="text-h3 mb-4">
            Dashboard
          </v-card-title>
          
          <v-card-text>
            <p class="text-h6 mb-4">Welcome, {{ user?.name || user?.email }}!</p>
            <p class="mb-4">You are now logged in.</p>
            
            <v-btn color="error" @click="handleLogout">
              Logout
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/useUserStore'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'


const userStore = useUserStore()
const router = useRouter()
const { user } = storeToRefs(userStore)

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>
