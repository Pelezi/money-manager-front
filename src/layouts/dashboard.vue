<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-title>My App</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-account-circle"></v-btn>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/useUserStore'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { decodeJwt } from '@/utils/jwt'

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

onMounted(() => {
  if (!user.value && typeof window !== 'undefined') {
    const raw = sessionStorage.getItem('token') || ''
    if (raw) userStore.setUser(decodeJwt(raw) || null)
  }
})
</script>
