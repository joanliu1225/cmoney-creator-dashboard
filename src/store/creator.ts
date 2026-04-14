import { ref, computed } from 'vue'
import creatorsData from '@/data/creators.json'

// Creator display names
const creatorNames: Record<string, string> = {
  '29475': '林恩如-超簡單投資法',
  '348444': 'Sara Wang',
  '3158198': '肌肉書僮',
}

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
    creatorNames,
    currentCreatorId,
    currentCreator,
    setCreator(id: string) {
      if (allCreatorIds.includes(id)) {
        currentCreatorId.value = id
      }
    },
  }
}
