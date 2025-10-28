import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AIScriptResult } from '@shared/types'
import type { AssistantMessage } from '@shared/chat'

export const useAiScriptStore = defineStore('aiScript', () => {
  const isOpen = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<AIScriptResult | null>(null)
  const sourceMessage = ref<AssistantMessage | null>(null)
  const sourceMessageId = ref<string | null>(null)

  const openPanel = (message: AssistantMessage) => {
    sourceMessage.value = message
    sourceMessageId.value = message.id
    isOpen.value = true
  }

  const showLoading = (message: AssistantMessage) => {
    openPanel(message)
    loading.value = true
    error.value = null
    result.value = null
  }

  const setResult = (data: AIScriptResult) => {
    result.value = data
    loading.value = false
    error.value = null
  }

  const setError = (message: string) => {
    error.value = message
    loading.value = false
    result.value = null
  }

  const close = () => {
    isOpen.value = false
    loading.value = false
    error.value = null
    result.value = null
    sourceMessage.value = null
    sourceMessageId.value = null
  }

  const setOpen = (value: boolean) => {
    if (!value) {
      close()
    } else if (sourceMessage.value) {
      isOpen.value = true
    }
  }

  return {
    isOpen,
    loading,
    error,
    result,
    sourceMessage,
    sourceMessageId,
    showLoading,
    setResult,
    setError,
    close,
    setOpen
  }
})
