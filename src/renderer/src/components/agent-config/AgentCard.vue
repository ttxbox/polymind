<template>
  <div
    class="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
    @click="showDetails(agent)"
  >
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
      <span class="text-xs flex items-center">
        by
        <a
          v-if="agent.provider?.url"
          :href="agent.provider.url"
          target="_blank"
          class="text-primary hover:underline cursor-pointer max-w-[120px] truncate ml-1"
          @click.stop
          :title="agent.provider?.organization || 'Unknown'"
        >
          {{ agent.provider?.organization || 'Unknown' }}
        </a>
        <span
          v-else
          class="max-w-[120px] truncate ml-1"
          :title="agent.provider?.organization || 'Unknown'"
        >
          {{ agent.provider?.organization || 'Unknown' }}
        </span>
      </span>
    </div>

    <!-- 描述 -->
    <p class="text-sm text-muted-foreground mb-3 line-clamp-2">
      {{ agent.description }}
    </p>

    <!-- 特性标签 -->
    <div class="flex flex-wrap gap-1 mb-3">
      <Badge
        v-for="skill in agent.skills.slice(0, 3)"
        :key="skill.id"
        variant="secondary"
        class="text-xs"
      >
        {{ skill.name }}
      </Badge>
      <Badge
        v-if="agent.skills.length > 3"
        variant="outline"
        class="text-xs"
      >
        +{{ agent.skills.length - 3 }}
      </Badge>
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

import { Agent } from '@shared/presenter'

interface Props {
  agent: Agent
}

defineProps<Props>()

// 定义事件
defineEmits<{
  install: [agent: Agent]
  configure: [agent: Agent]
}>()

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