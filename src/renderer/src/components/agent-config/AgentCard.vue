<template>
  <div class="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
    <!-- 头部：图标和标题 -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon :icon="agent.icon" class="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 class="font-semibold text-foreground">{{ agent.name }}</h3>
          <p class="text-xs text-muted-foreground">v{{ agent.version }}</p>
        </div>
      </div>
      
      <!-- 安装状态标签 -->
      <Badge
        :variant="agent.installed ? 'default' : 'outline'"
        class="text-xs"
      >
        {{ agent.installed ? t('agents.agentCard.installed') : t('agents.agentCard.notInstalled') }}
      </Badge>
    </div>

    <!-- 描述 -->
    <p class="text-sm text-muted-foreground mb-3 line-clamp-2">
      {{ agent.description }}
    </p>

    <!-- 特性标签 -->
    <div class="flex flex-wrap gap-1 mb-3">
      <Badge
        v-for="feature in agent.skills.slice(0, 3)"
        :key="feature"
        variant="secondary"
        class="text-xs"
      >
        {{ feature }}
      </Badge>
      <Badge
        v-if="agent.skills.length > 3"
        variant="outline"
        class="text-xs"
      >
        +{{ agent.skills.length - 3 }}
      </Badge>
    </div>

    <!-- 统计信息 -->
    <div class="flex items-center justify-between text-xs text-muted-foreground mb-4">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1">
          <Icon icon="lucide:star" class="w-3 h-3" />
          <span>{{ agent.rating }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon icon="lucide:download" class="w-3 h-3" />
          <span>{{ formatDownloads(agent.downloads) }}</span>
        </div>
      </div>
      <span class="text-xs">by {{ agent.author }}</span>
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-2">
      <Button
        v-if="!agent.installed"
        size="sm"
        class="flex-1"
        @click="$emit('install', agent)"
      >
        <Icon icon="lucide:download" class="w-4 h-4 mr-1" />
        {{ t('agents.agentCard.install') }}
      </Button>
      <Button
        v-else
        size="sm"
        variant="outline"
        class="flex-1"
        @click="$emit('configure', agent)"
      >
        <Icon icon="lucide:settings" class="w-4 h-4 mr-1" />
        {{ t('agents.agentCard.configure') }}
      </Button>
      
      <Button
        size="sm"
        variant="ghost"
        @click="showDetails(agent)"
      >
        <Icon icon="lucide:info" class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast/use-toast'
import { useI18n } from 'vue-i18n'

const { toast } = useToast()
const { t } = useI18n()

// 定义Props
interface Agent {
  id: string
  name: string
  description: string
  icon: string
  category: string
  installed: boolean
  version: string
  author: string
  rating: number
  downloads: number
  skills: string[]
  config?: Record<string, any>
}

interface Props {
  agent: Agent
}

defineProps<Props>()

// 定义事件
defineEmits<{
  install: [agent: Agent]
  configure: [agent: Agent]
}>()

// 格式化下载量显示
const formatDownloads = (downloads: number): string => {
  if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(1)}k`
  }
  return downloads.toString()
}

// 显示详细信息
const showDetails = (agent: Agent) => {
  toast({
    title: agent.name,
    description: t('agents.agentCard.viewDetails', { name: agent.name }),
    variant: 'default'
  })
  
  // 这里可以打开模态框显示更多信息
  console.log('显示智能体详情:', agent)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>