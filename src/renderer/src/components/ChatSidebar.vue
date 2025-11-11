<template>
  <div
    class="w-full h-full overflow-hidden flex flex-col bg-background border-r chat-sidebar"
  >
    <!-- 标签页切换 -->
    <div class="flex-none border-b">
      <div class="flex">
        <button
          :key="'agents'"
          :class="[
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'agents'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          ]"
          @click="activeTab = 'agents'"
        >
          {{ t('agents.sidebar.tabs.agents') }}
        </button>
        <button
          :key="'history'"
          :class="[
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          ]"
          @click="activeTab = 'history'"
        >
          {{ t('agents.sidebar.tabs.history') }}
        </button>
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="flex-1 overflow-hidden">
      <!-- Agent选项标签页 -->
      <div v-show="activeTab === 'agents'" class="h-full">
        <AgentOptions class="h-full" />
      </div>

      <!-- 历史记录标签页 -->
      <div v-show="activeTab === 'history'" class="h-full">
        <ThreadsView class="h-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ThreadsView from './ThreadsView.vue'
import AgentOptions from './AgentOptions.vue'

const { t } = useI18n()

// 当前激活的标签页
const activeTab = ref('agents')

// 暴露切换标签页的方法
const switchToTab = (tabId: string) => {
  activeTab.value = tabId
}

// 暴露方法给模板
defineExpose({
  switchToTab
})
</script>

<style scoped>
/* 自定义样式可以根据需要添加 */
</style>