<template>
  <!-- Agent 配置详情对话框 -->
  <Dialog :open="showAgentSettings" @update:open="$emit('update:showAgentSettings', $event)">
    <DialogContent class="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon v-if="selectedAgent?.icon" :icon="selectedAgent.icon" class="w-4 h-4 text-primary" />
          </div>
          {{ selectedAgent?.name }}
        </DialogTitle>
        <DialogDescription>
          {{ selectedAgent?.description }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto py-4 space-y-6">
        <!-- 基本信息 -->
        <div class="space-y-4">
          <h3 class="font-semibold text-sm text-foreground">{{ t('agents.agentCard.details.basicInfo') }}</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">{{ t('agents.agentCard.details.version') }}:</span>
              <span class="ml-2 text-foreground">v{{ selectedAgent?.version }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-muted-foreground">{{ t('agents.agentCard.details.provider') }}:</span>
                <a
                  v-if="selectedAgent?.provider?.url"
                  :href="selectedAgent.provider.url"
                  target="_blank"
                  class="text-primary hover:underline cursor-pointer max-w-[120px] truncate ml-1"
                  @click.stop
                  :title="selectedAgent.provider.url"
                >
                  {{ selectedAgent.provider?.organization || 'Unknown' }}
                </a>
                <span
                  v-else
                  class="max-w-[120px] truncate ml-1"
                  :title="selectedAgent?.provider?.organization || 'Unknown'"
                >
                  {{ selectedAgent?.provider?.organization || 'Unknown' }}
                </span>
            </div>
          </div>
        </div>

        <!-- 技能列表 -->
        <div v-if="selectedAgent?.skills && selectedAgent.skills.length > 0" class="space-y-3">
          <h3 class="font-semibold text-sm text-foreground">{{ t('agents.agentCard.details.skills') }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SkillInfoCard
              v-for="skill in selectedAgent.skills"
              :key="skill.id"
              :skill="skill"
            />
          </div>
        </div>

        <!-- MCP 服务器 -->
        <div v-if="selectedAgent?.mcpServers && selectedAgent.mcpServers.length > 0" class="space-y-3">
          <h3 class="font-semibold text-sm text-foreground">{{ t('agents.agentCard.details.mcpServers') }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <McpServerInfoCard
              v-for="serverName in selectedAgent.mcpServers"
              :key="serverName"
              :server="getMcpServerInfo(serverName)"
              :is-built-in="isMcpServerBuiltIn(serverName)"
            />
          </div>
        </div>
      </div>

      
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useMcpStore } from '@/stores/mcp'

// Dialog 组件
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

// MCP 组件
import McpServerInfoCard from './McpServerInfoCard.vue'

// 技能组件
import SkillInfoCard from './SkillInfoCard.vue'

import { Agent } from '@shared/presenter'

interface Props {
  showAgentSettings: boolean
  selectedAgent: Agent | null
}

interface Emits {
  (e: 'close'): void
  (e: 'update:showAgentSettings', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const mcpStore = useMcpStore()


// 获取 MCP server 配置
const mcpServersConfig = computed(() => mcpStore.config.mcpServers)

// 检查是否为内置服务器
const isMcpServerBuiltIn = (serverName: string): boolean => {
  const serverConfig = mcpServersConfig.value[serverName]
  return serverConfig?.type === 'inmemory'
}

// 获取 MCP server 信息
const getMcpServerInfo = (serverName: string) => {
  const serverConfig = mcpServersConfig.value[serverName]
  const serverStatus = mcpStore.serverStatuses[serverName] || false
  const isDefault = mcpStore.config.defaultServers.includes(serverName)
  
  return {
    name: serverName,
    icons: serverConfig?.icons || '',
    descriptions: serverConfig?.descriptions || '',
    command: serverConfig?.command || '',
    args: serverConfig?.args || [],
    isRunning: serverStatus,
    isDefault: isDefault,
    type: serverConfig?.type || 'unknown',
    baseUrl: serverConfig?.baseUrl || '',
    errorMessage: ''
  }
}

</script>