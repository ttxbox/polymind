<template>
  <Dialog :open="showDialog" @update:open="$emit('update:showDialog', $event)">
    <DialogContent class="max-w-lg bg-card border-border">
      <DialogHeader>
        <DialogTitle class="text-foreground">{{ t('agents.import.dialog.title') }}</DialogTitle>
        <DialogDescription class="text-muted-foreground">
          {{ t('agents.import.dialog.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="import-url" class="text-foreground">{{ t('agents.import.dialog.urlLabel') }}</Label>
          <Input
            id="import-url"
            v-model="importUrl"
            :placeholder="t('agents.import.dialog.urlPlaceholder')"
            class="w-full border-border bg-background text-foreground"
            @keyup.enter="handleImport"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="handleCancel"
          :disabled="isImporting"
          class="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {{ t('agents.import.dialog.cancel') }}
        </Button>
        <Button
          @click="handleImport"
          :disabled="isImporting || !importUrl.trim()"
          class="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Icon v-if="isImporting" icon="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
          {{ isImporting ? t('agents.import.dialog.importing') : t('agents.import.dialog.import') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import { usePresenter } from '@/composables/usePresenter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const { toast } = useToast()
const { t } = useI18n()

interface Props {
  showDialog: boolean
}

interface Emits {
  (e: 'update:showDialog', value: boolean): void
  (e: 'imported'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const importUrl = ref('')
const isImporting = ref(false)

// 监听对话框显示状态变化，重置表单
watch(() => props.showDialog, (newVal) => {
  if (!newVal) {
    importUrl.value = ''
    isImporting.value = false
  }
})

// 校验URL是否合法
const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  const trimmedUrl = url.trim()
  
  if (!trimmedUrl) {
    return { isValid: false, error: 'invalidUrl' }
  }

  try {
    const urlObj = new URL(trimmedUrl)
    // 检查协议是否为http或https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { isValid: false, error: 'invalidUrlFormat' }
    }
    return { isValid: true }
  } catch {
    return { isValid: false, error: 'invalidUrlFormat' }
  }
}


// 导入智能体
const handleImport = async () => {
  const validation = validateUrl(importUrl.value)
  
  if (!validation.isValid) {
    toast({
      title: t('agents.import.error.title'),
      description: t(`agents.import.error.${validation.error}`),
      variant: 'destructive',
      duration: 5000
    })
    return
  }

  isImporting.value = true

  try {
    const configPresenter = usePresenter('configPresenter')
    
    // 调用后端导入方法获取agent数据
    const agent = await configPresenter.importAgentFromUrl(importUrl.value.trim())
    
    // 显示成功消息
    toast({
      title: t('agents.import.success.title'),
      description: t('agents.import.success.description', { name: agent.name }),
      variant: 'default',
      duration: 3000
    })
    
    // 关闭对话框并重置状态
    emit('update:showDialog', false)
    emit('imported')
  } catch (error) {
    console.error('Failed to import agent:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    toast({
      title: t('agents.import.error.title'),
      description: t('agents.import.error.failed', { error: errorMessage }),
      variant: 'destructive',
      duration: 5000
    })
  } finally {
    isImporting.value = false
  }
}

// 取消导入
const handleCancel = () => {
  emit('update:showDialog', false)
}
</script>