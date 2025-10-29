<template>
  <Dialog :open="showDialog" @update:open="$emit('update:showDialog', $event)">
    <DialogContent class="max-w-lg max-h-[80vh] overflow-hidden flex flex-col bg-card">
      <DialogHeader>
        <DialogTitle class="text-foreground">{{ t('agents.create.dialog.title') }}</DialogTitle>
        <DialogDescription class="text-muted-foreground">
          {{ t('agents.create.dialog.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto py-4 px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 智能体名称 -->
        <div class="space-y-2 md:col-span-2">
          <Label for="agent-name" class="text-foreground">{{ t('agents.create.dialog.nameLabel') }}</Label>
          <Input
            id="agent-name"
            v-model="agentForm.name"
            :placeholder="t('agents.create.dialog.namePlaceholder')"
            class="w-full bg-background text-foreground"
          />
          <p class="text-xs text-muted-foreground">
            {{ t('agents.create.dialog.nameHelper') }}
          </p>
        </div>

        <!-- 智能体描述 -->
        <div class="space-y-2 md:col-span-2">
          <Label for="agent-description" class="text-foreground">{{ t('agents.create.dialog.descriptionLabel') }}</Label>
          <textarea
            id="agent-description"
            v-model="agentForm.description"
            :placeholder="t('agents.create.dialog.descriptionPlaceholder')"
            class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            rows="2"
          />
          <p class="text-xs text-muted-foreground">
            {{ t('agents.create.dialog.descriptionHelper') }}
          </p>
        </div>

        <!-- 智能体分类 -->
        <div class="space-y-2">
          <Label for="agent-category" class="text-foreground">{{ t('agents.create.dialog.categoryLabel') }}</Label>
          <Select v-model="agentForm.category" class="">
            <SelectTrigger id="agent-category">
              <SelectValue :placeholder="t('agents.create.dialog.categoryPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="category in categories"
                :key="category.value"
                :value="category.value"
              >
                {{ t(category.labelKey) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            {{ t('agents.create.dialog.categoryHelper') }}
          </p>
        </div>

        <!-- 版本信息 -->
        <div class="space-y-2">
          <Label for="agent-version" class="text-foreground">{{ t('agents.create.dialog.versionLabel') }}</Label>
          <Input
            id="agent-version"
            v-model="agentForm.version"
            :placeholder="t('agents.create.dialog.versionPlaceholder')"
            class="w-full bg-background text-foreground"
          />
          <p class="text-xs text-muted-foreground">
            {{ t('agents.create.dialog.versionHelper') }}
          </p>
        </div>

        <!-- 提供商信息 -->
        <div class="space-y-2 md:col-span-2">
          <Label class="text-foreground">{{ t('agents.create.dialog.providerLabel') }}</Label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="space-y-2">
              <Label for="agent-provider" class="text-xs text-muted-foreground">{{ t('agents.create.dialog.providerNameLabel') }}</Label>
              <Input
                id="agent-provider"
                v-model="agentForm.provider"
                :placeholder="t('agents.create.dialog.providerPlaceholder')"
                class="w-full bg-background text-foreground"
              />
            </div>
            <div class="space-y-2">
              <Label for="agent-provider-url" class="text-xs text-muted-foreground">{{ t('agents.create.dialog.providerUrlLabel') }}</Label>
              <Input
                id="agent-provider-url"
                v-model="agentForm.providerUrl"
                :placeholder="t('agents.create.dialog.providerUrlPlaceholder')"
                class="w-full bg-background text-foreground"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t('agents.create.dialog.providerHelper') }}
          </p>
        </div>

        <!-- MCP服务器配置 -->
        <div class="space-y-2 md:col-span-2">
          <Label for="agent-mcp-servers" class="text-foreground">{{ t('agents.create.dialog.mcpServersLabel') }}</Label>
          <Select>
            <SelectTrigger id="agent-mcp-servers" class="w-full">
              <SelectValue :placeholder="mcpStore.serverList.length > 0 ? `${agentForm.mcpServers.length} selected` : t('agents.create.dialog.noMcpServers')" />
            </SelectTrigger>
            <SelectContent>
              <div v-if="mcpStore.serverList.length === 0" class="p-2 text-sm text-muted-foreground text-center">
                {{ t('agents.create.dialog.noMcpServers') }}
              </div>
              <div v-else class="divide-y">
                <div
                  v-for="server in mcpStore.serverList"
                  :key="server.name"
                  class="p-2 hover:bg-accent flex items-center w-full cursor-pointer"
                  @click="toggleMcpServer(server.name, !agentForm.mcpServers.includes(server.name))"
                >
                  <div class="flex-1 flex items-center">
                    <span class="mr-2">{{ server.icons }}</span>
                    <span
                      v-if="server.type === 'inmemory'"
                      class="text-sm"
                    >{{ getLocalizedServerName(server.name) }}</span>
                    <span v-else class="text-sm">{{ server.name }}</span>
                  </div>
                  <Checkbox
                    :id="`mcp-server-${server.name}`"
                    :checked="agentForm.mcpServers.includes(server.name)"
                    class="pointer-events-none"
                  />
                </div>
              </div>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            {{ t('agents.create.dialog.mcpServersHelper') }}
          </p>
        </div>

        <!-- 技能配置 -->
        <div class="space-y-3 md:col-span-2">
          <Label class="text-foreground">{{ t('agents.create.dialog.skillsLabel') }}</Label>
          
          <!-- JSON 输入区域 -->
          <div class="space-y-2">
            <textarea
              v-model="skillsJsonInput"
              :placeholder="skillsJsonPlaceholder"
              class="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
              rows="4"
            />
            <div class="flex justify-between items-center">
              <p class="text-xs text-muted-foreground">
                {{ t('agents.create.dialog.skillsHelper') }}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="parseSkillsJson"
                :disabled="!skillsJsonInput.trim()"
                class="text-xs"
              >
                <Icon icon="lucide:check" class="w-3 h-3 mr-1" />
                {{ t('agents.create.dialog.parseSkills') }}
              </Button>
            </div>
          </div>
          
          <!-- 技能预览 -->
          <div v-if="agentForm.skills.length > 0" class="space-y-2">
            <div class="text-sm font-medium text-foreground">{{ t('agents.create.dialog.skillsPreview') }}</div>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <div
                v-for="(skill, index) in agentForm.skills"
                :key="index"
                class="flex items-center gap-2 p-3 border rounded-md bg-background"
              >
                <div class="flex-1">
                  <div class="text-sm font-medium text-foreground">{{ skill.name }}</div>
                  <div v-if="skill.description" class="text-xs text-muted-foreground mt-1">{{ skill.description }}</div>
                  <div v-if="skill.tags && skill.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="tag in skill.tags"
                      :key="tag"
                      class="inline-block px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="removeSkill(index)"
                  class="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Icon icon="lucide:trash-2" class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <DialogFooter class="flex-shrink-0">
        <Button
          variant="outline"
          @click="handleCancel"
          :disabled="isCreating"
          class="text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {{ t('agents.create.dialog.cancel') }}
        </Button>
        <Button
          @click="handleCreate"
          :disabled="isCreating || !isFormValid"
          class="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Icon v-if="isCreating" icon="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
          {{ isCreating ? t('agents.create.dialog.creating') : t('agents.create.dialog.create') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import { usePresenter } from '@/composables/usePresenter'
import { useMcpStore } from '@/stores/mcp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const { toast } = useToast()
const { t } = useI18n()
const mcpStore = useMcpStore()

interface Props {
  showDialog: boolean
}

interface Emits {
  (e: 'update:showDialog', value: boolean): void
  (e: 'created'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 表单数据
const agentForm = ref({
  name: '',
  description: '',
  category: 'my',
  provider: '',
  providerUrl: '',
  version: '1.0.0',
  mcpServers: [] as string[],
  skills: [] as Array<{
    id: string
    name: string
    description: string
    tags: string[]
    examples: string[]
    imputModes: string[]
    ouputModes: string[]
  }>
})

const isCreating = ref(false)
const skillsJsonInput = ref('')

// 技能配置占位符
const skillsJsonPlaceholder = `[{"name": "Data Analysis", "description": "Process and analyze data", "tags": ["data", "analysis"], "examples": ["Analyze sales data"], "imputModes": ["text"], "ouputModes": ["text"]}]`

// 分类选项
const categories = [
  { value: 'my', labelKey: 'agents.categories.my' },
  { value: 'development', labelKey: 'agents.categories.development' },
  { value: 'productivity', labelKey: 'agents.categories.productivity' },
  { value: 'analytics', labelKey: 'agents.categories.analytics' },
  { value: 'research', labelKey: 'agents.categories.research' },
  { value: 'design', labelKey: 'agents.categories.design' },
  { value: 'support', labelKey: 'agents.categories.support' }
]

// 监听对话框显示状态变化，重置表单
watch(() => props.showDialog, (newVal) => {
  if (!newVal) {
    resetForm()
    isCreating.value = false
  }
})

// 表单验证
const isFormValid = computed(() => {
  return agentForm.value.name.trim() !== '' &&
         agentForm.value.description.trim() !== '' &&
         agentForm.value.version.trim() !== ''
})

// 重置表单
const resetForm = () => {
  agentForm.value = {
    name: '',
    description: '',
    category: 'my',
    provider: '',
    providerUrl: '',
    version: '1.0.0',
    mcpServers: [],
    skills: []
  }
  skillsJsonInput.value = ''
}

// 解析JSON技能数据
const parseSkillsJson = () => {
  try {
    if (!skillsJsonInput.value.trim()) {
      return
    }
    
    const skillsData = JSON.parse(skillsJsonInput.value)
    
    // 验证并解析技能数据
    const parsedSkills = parseSkillsData(skillsData)
    
    if (parsedSkills.length === 0) {
      toast({
        title: t('agents.create.error.title'),
        description: t('agents.create.error.invalidSkillsFormat'),
        variant: 'destructive',
        duration: 5000
      })
      return
    }
    
    // 清空现有技能并添加新技能
    agentForm.value.skills = parsedSkills
    
    toast({
      title: t('agents.create.success.title'),
      description: t('agents.create.success.skillsImported', { count: parsedSkills.length }),
      variant: 'default',
      duration: 3000
    })
  } catch (error) {
    console.error('Failed to parse skills JSON:', error)
    toast({
      title: t('agents.create.error.title'),
      description: t('agents.create.error.invalidSkillsFormat'),
      variant: 'destructive',
      duration: 5000
    })
  }
}

// 解析技能数据
const parseSkillsData = (data: any): Array<{
  id: string
  name: string
  description: string
  tags: string[]
  examples: string[]
  imputModes: string[]
  ouputModes: string[]
}> => {
  if (!Array.isArray(data)) {
    return []
  }
  
  return data
    .filter(skill => skill && typeof skill === 'object')
    .map(skill => ({
      id: skill.id || generateSkillId(skill.name || 'skill'),
      name: skill.name || '',
      description: skill.description || '',
      tags: Array.isArray(skill.tags) ? skill.tags : [],
      examples: Array.isArray(skill.examples) ? skill.examples : [],
      imputModes: Array.isArray(skill.imputModes) ? skill.imputModes : [],
      ouputModes: Array.isArray(skill.ouputModes) ? skill.ouputModes : []
    }))
    .filter(skill => skill.name.trim() !== '')
}

// 移除技能
const removeSkill = (index: number) => {
  agentForm.value.skills.splice(index, 1)
}

// 获取内置服务器的本地化名称
const getLocalizedServerName = (serverName: string) => {
  return t(`mcp.inmemory.${serverName}.name`, serverName)
}

// 切换MCP服务器选择
const toggleMcpServer = (serverName: string, checked: boolean) => {
  if (checked) {
    if (!agentForm.value.mcpServers.includes(serverName)) {
      agentForm.value.mcpServers.push(serverName)
    }
  } else {
    const index = agentForm.value.mcpServers.indexOf(serverName)
    if (index > -1) {
      agentForm.value.mcpServers.splice(index, 1)
    }
  }
}

// 创建智能体
const handleCreate = async () => {
  if (!isFormValid.value) {
    toast({
      title: t('agents.create.error.title'),
      description: t('agents.create.error.invalidForm'),
      variant: 'destructive',
      duration: 5000
    })
    return
  }

  isCreating.value = true

  try {
    const configPresenter = usePresenter('configPresenter')
    
    
    // 创建智能体对象
    const agent: any = {
      id: generateAgentId(agentForm.value.name),
      name: agentForm.value.name.trim(),
      description: agentForm.value.description.trim(),
      icon: 'lucide:bot',
      category: agentForm.value.category,
      installed: false,
      version: agentForm.value.version.trim(),
      skills: agentForm.value.skills.filter(skill => skill.name.trim() !== ''),
      mcpServers: agentForm.value.mcpServers,
      config: {}
    }

    // 只有当提供商信息存在时才添加provider对象
    const providerName = agentForm.value.provider.trim()
    const providerUrl = agentForm.value.providerUrl.trim()
    if (providerName) {
      agent.provider = {
        organization: providerName,
        url: providerUrl
      }
    }

    // 添加智能体
    await configPresenter.addAgent(agent)
    
    toast({
      title: t('agents.create.success.title'),
      description: t('agents.create.success.description', { name: agent.name }),
      variant: 'default',
      duration: 3000
    })
    
    // 关闭对话框并重置状态
    emit('update:showDialog', false)
    emit('created')
  } catch (error) {
    console.error('Failed to create agent:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    toast({
      title: t('agents.create.error.title'),
      description: t('agents.create.error.failed', { error: errorMessage }),
      variant: 'destructive',
      duration: 5000
    })
  } finally {
    isCreating.value = false
  }
}

// 生成智能体ID
const generateAgentId = (name: string): string => {
  // 将名称转换为小写，替换空格为连字符，并添加随机后缀避免冲突
  const baseId = name.toLowerCase().replace(/\s+/g, '-')
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseId}-${randomSuffix}`
}

// 生成技能ID
const generateSkillId = (name: string): string => {
  const baseId = name.toLowerCase().replace(/\s+/g, '-')
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `skill-${baseId}-${randomSuffix}`
}

// 取消创建
const handleCancel = () => {
  emit('update:showDialog', false)
}
</script>