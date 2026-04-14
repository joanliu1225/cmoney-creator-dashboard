import { ref, computed } from 'vue'
import creatorsData from '@/data/creators.json'

// Available creator IDs
const allCreatorIds = Object.keys(creatorsData) as string[]

// Current selected creator
const currentCreatorId = ref(allCreatorIds[0] || '29475')

// Get data for current creator
const currentCreator = computed(() => {
  return (creatorsData as Record<string, any>)[currentCreatorId.value] || null
})

export function useCreatorStore() {
  return {
    allCreatorIds,
    currentCreatorId,
    currentCreator,
    setCreator(id: string) {
      if (allCreatorIds.includes(id)) {
        currentCreatorId.value = id
      }
    },
  }
}
