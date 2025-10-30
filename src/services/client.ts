// src/services/client.ts
import axiosLib from 'axios'
import type { AxiosInstance } from 'axios'
import { useRootStore } from '../stores/root.store'

let $axios: AxiosInstance

export function initializeAxios(axiosInstance: AxiosInstance) {
  $axios = axiosInstance
}

export function nodeAxios(): AxiosInstance {
  if (!$axios) {
    $axios = axiosLib.create({
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  const rootStore = useRootStore()
  $axios.defaults.baseURL = import.meta.env.VITE_API_HOST_NODE
  $axios.defaults.headers.common['matrix_id'] = rootStore.matrixId
  return $axios
}

export function axios(): AxiosInstance {
  if (!$axios) {
    $axios = axiosLib.create({
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  const rootStore = useRootStore()
  $axios.defaults.baseURL = import.meta.env.VITE_API_HOST
  $axios.defaults.headers.common['matrix_id'] = rootStore.matrixId
  return $axios
}