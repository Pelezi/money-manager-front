import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRootStore = defineStore('root', () => {
  const matrixId = ref<string>('')

  function setMatrixId(id: string) {
    matrixId.value = id
  }

  return { matrixId, setMatrixId }
})
