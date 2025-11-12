<template>
  <div class="w-60 max-w-60 h-full bg-background border-r flex flex-col">


    <!-- 分类筛选 -->
    <div class="flex-1 p-4 overflow-y-auto">
      <div class="space-y-2">
        <div
          v-for="category in categories"
          :key="category.id"
          class="flex items-center p-2 rounded-md cursor-pointer transition-colors"
          :class="{
            'bg-slate-200 dark:bg-accent': activeCategory === category.id,
            'hover:bg-accent': activeCategory !== category.id
          }"
          @click="handleCategoryClick(category.id)"
        >
          <div class="flex items-center gap-3 flex-1">
            <Icon 
              :icon="getCategoryIcon(category.id)" 
              class="w-4 h-4" 
            />
            <span class="text-sm font-medium">{{ category.name }}</span>
          </div>
          <Badge 
            v-if="category.id !== 'all'" 
            variant="secondary" 
            class="text-xs"
          >
            {{ getCategoryCount(category.id) }}
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Badge } from '@/components/ui/badge'

interface Category {
  id: string
  name: string
}

interface Props {
  categories: Category[]
  activeCategory: string
  agents: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:activeCategory': [categoryId: string]
}>()

// 获取分类图标
const getCategoryIcon = (categoryId: string) => {
  const icons: Record<string, string> = {
    my: 'lucide:user',
    all: 'lucide:grid',
    development: 'lucide:code',
    productivity: 'lucide:edit-3',
    analytics: 'lucide:bar-chart-3',
    research: 'lucide:search',
    design: 'lucide:palette',
    support: 'lucide:headphones'
  }
  return icons[categoryId] || 'lucide:circle'
}

// 获取分类数量
const getCategoryCount = (categoryId: string) => {
  if (categoryId === 'all') return props.agents.length
  return props.agents.filter(agent => agent.category === categoryId).length
}

// 处理分类点击
const handleCategoryClick = (categoryId: string) => {
  emit('update:activeCategory', categoryId)
}
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style>