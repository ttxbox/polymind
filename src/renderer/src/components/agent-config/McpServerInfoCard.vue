<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
import { computed, ref, nextTick, onMounted, watch } from 'vue'

interface ServerInfo {
  name: string
  icons: string
  descriptions: string
  type?: string
  isRunning?: boolean
  isDefault?: boolean
}

interface Props {
  server: ServerInfo
  isBuiltIn?: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()
const isDescriptionExpanded = ref(false)
const descriptionRef = ref<HTMLElement>()
const needsExpansion = ref(false)

// 获取本地化服务器名称
const getLocalizedServerName = (serverName: string) => {
  return t(`mcp.inmemory.${serverName}.name`, serverName)
}

// 获取本地化服务器描述
const getLocalizedServerDesc = (serverName: string, fallbackDesc: string) => {
  return t(`mcp.inmemory.${serverName}.desc`, fallbackDesc)
}

// 获取完整描述
const fullDescription = computed(() => {
  return props.isBuiltIn
    ? getLocalizedServerDesc(props.server.name, props.server.descriptions)
    : props.server.descriptions
})

// 检查文本是否溢出
const checkTextOverflow = async () => {
  await nextTick()
  if (!descriptionRef.value) return

  const element = descriptionRef.value
  // 检查是否有文本溢出（scrollHeight > clientHeight）
  needsExpansion.value = element.scrollHeight > element.clientHeight
}

// 监听描述变化，重新检查是否需要展开
onMounted(() => {
  checkTextOverflow()
})

// 当描述内容变化时重新检查
const watchDescription = computed(() => fullDescription.value)
watch(watchDescription, () => {
  checkTextOverflow()
})
</script>

<template>
  <div
    class="bg-card border border-border rounded-lg p-3 transition-all duration-200 hover:shadow-sm hover:border-primary/50"
  >
    <!-- 头部：图标和名称 -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-2 flex-1 min-w-0">
        <!-- 服务器图标 -->
        <div class="text-base flex-shrink-0">{{ server.icons }}</div>

        <!-- 名称 -->
        <h3 class="text-sm font-semibold truncate flex-1">
          {{ isBuiltIn ? getLocalizedServerName(server.name) : server.name }}
        </h3>
      </div>
    </div>

    <!-- 类型和标识 -->
    <div class="flex items-center space-x-2 mb-2">
      <!-- 服务器类型 -->
      <Badge variant="outline" class="text-xs h-4 px-1.5">
        {{ server.type === 'http' ? 'HTTP' : 'Local' }}
      </Badge>
    </div>

    <!-- 描述 -->
    <!-- 描述 -->
      <div class="mb-2">
        <p
          ref="descriptionRef"
          class="text-xs text-secondary-foreground cursor-pointer overflow-hidden leading-5 break-all"
          :class="[
            !isDescriptionExpanded ? 'line-clamp-1' : '',
            needsExpansion ? 'hover:text-foreground transition-colors' : ''
          ]"
          style="min-height: 1rem"
          @click="needsExpansion && (isDescriptionExpanded = !isDescriptionExpanded)"
        >
          {{ fullDescription }}
        </p>
        <Button
          variant="link"
          size="sm"
          class="h-auto p-0 text-xs mt-1 hover:no-underline gap-1"
          :class="[needsExpansion ? 'opacity-100' : 'opacity-0 pointer-events-none']"
          @click="isDescriptionExpanded = !isDescriptionExpanded"
        >
          <Icon
            :icon="isDescriptionExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="h-3 w-3"
          />
          {{ isDescriptionExpanded ? t('common.collapse') : t('common.expand') }}
        </Button>
      </div>
  </div>
</template>