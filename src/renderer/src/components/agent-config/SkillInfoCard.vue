<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
import { computed, ref, nextTick, onMounted, watch } from 'vue'
import { Skill } from '@shared/presenter'

interface Props {
  skill: Skill
}

const props = defineProps<Props>()
const { t } = useI18n()
const isDescriptionExpanded = ref(false)
const descriptionRef = ref<HTMLElement>()
const needsExpansion = ref(false)

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
const watchDescription = computed(() => props.skill.description)
watch(watchDescription, () => {
  checkTextOverflow()
})
</script>

<template>
  <div
    class="bg-card border border-border rounded-lg p-3 transition-all duration-200 hover:shadow-sm hover:border-primary/50"
  >
    <!-- 头部：技能名称 -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-2 flex-1 min-w-0">
        <!-- 技能图标 -->
        <div class="text-base flex-shrink-0">
          <Icon icon="lucide:zap" class="w-4 h-4 text-primary" />
        </div>

        <!-- 名称 -->
        <h3 class="text-sm font-semibold truncate flex-1">
          {{ skill.name }}
        </h3>
      </div>
    </div>

    <!-- 技能描述 -->
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
        {{ skill.description }}
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