'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Download,
  Star,
  User,
  Tag,
  Loader2,
  RefreshCw,
  Bot,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useChatStore } from '@/lib/store'
import { wittyHubService } from '@/services/wittyhub-service'
import { agentService } from '@/services/agent-service'
import { modelService } from '@/services/model-service'
import { WittyHubAgent, ModelConfig, SandboxType, AdapterType } from '@/lib/types'

export function WittyHubPage() {
  const [agents, setAgents] = useState<WittyHubAgent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)
  const [importingAgentId, setImportingAgentId] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<WittyHubAgent | null>(null)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [models, setModels] = useState<ModelConfig[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const { toast } = useToast()
  const addAgent = useChatStore(state => state.addAgent)
  const setCurrentAgent = useChatStore(state => state.setCurrentAgent)

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(agents.map(agent => agent.category).filter(Boolean))
    )
    return [
      { label: '全部分类', value: 'all' },
      ...uniqueCategories.map(c => ({ label: c, value: c })),
    ]
  }, [agents])

  const filteredAgents = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return agents.filter(agent => {
      const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory
      const matchesSearch =
        !keyword ||
        agent.name.toLowerCase().includes(keyword) ||
        agent.description.toLowerCase().includes(keyword) ||
        agent.author.toLowerCase().includes(keyword) ||
        agent.tags.some(tag => tag.toLowerCase().includes(keyword))
      return matchesCategory && matchesSearch
    })
  }, [agents, searchTerm, selectedCategory])

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / pageSize))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, agents.length])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const pagedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredAgents.slice(startIndex, startIndex + pageSize)
  }, [currentPage, filteredAgents, pageSize])

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    if (importDialogOpen) {
      fetchModels()
    }
  }, [importDialogOpen])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await wittyHubService.listAgents(0, 100)
      setAgents(response.agents)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to fetch wittyhub agents:', error)
      toast({
        title: '加载失败',
        description: '无法获取 WittyHub 智能体列表，请检查配置或稍后重试。',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchModels = async () => {
    try {
      setLoadingModels(true)
      const data = await modelService.getModels()
      setModels(data)
      if (data.length > 0 && !selectedModelId) {
        const defaultModel = data.find(m => m.isDefault) || data[0]
        setSelectedModelId(defaultModel.id)
      }
    } catch (err) {
      console.error('Failed to fetch models:', err)
    } finally {
      setLoadingModels(false)
    }
  }

  const handleImportClick = (agent: WittyHubAgent) => {
    setSelectedAgent(agent)
    setImportDialogOpen(true)
  }

  const handleImportAgent = async () => {
    if (!selectedAgent) return

    if (!selectedModelId) {
      toast({
        title: '错误',
        description: '请选择模型配置',
        variant: 'destructive',
      })
      return
    }

    try {
      setImportingAgentId(selectedAgent.agent_id)

      const newAgent = await agentService.importAgentFromHub({
        git_url: `wittyhub://${selectedAgent.agent_id}`,
        sandbox_type: SandboxType.LOCAL_PROCESS,
        adapter_type: AdapterType.OPENCLAW,
        idle_timeout_seconds: 300,
        model_id: selectedModelId,
      })

      addAgent(newAgent)
      setCurrentAgent(newAgent.id)

      toast({
        title: '导入成功',
        description: `智能体 "${selectedAgent.name}" 已成功导入。`,
      })

      setImportDialogOpen(false)
      setSelectedAgent(null)
    } catch (error) {
      console.error('Failed to import agent from wittyhub:', error)
      toast({
        title: '导入失败',
        description: '导入智能体失败，请稍后重试。',
        variant: 'destructive',
      })
    } finally {
      setImportingAgentId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardHeader className="gap-1">
          <div className="space-y-1">
            <CardTitle>WittyHub 智能体市场</CardTitle>
            <CardDescription>从 WittyHub 发现并导入优质智能体。</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MarketplaceSummary label="智能体总数" value={`${total}`} />
            <MarketplaceSummary label="已加载" value={`${agents.length}`} />
          </div>
        </CardHeader>
      </Card>

      <Card className="border border-border">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full max-w-xl gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 shrink-0">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="搜索智能体名称、描述、作者或标签"
                  className="pl-9"
                />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAgents} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <EmptyState text="正在加载智能体列表..." />
          ) : filteredAgents.length === 0 ? (
            <EmptyState text="暂无匹配的智能体。" />
          ) : (
            <div className="space-y-4">
              <PaginationBar
                total={filteredAgents.length}
                currentPage={currentPage}
                totalPages={totalPages}
                onPrev={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              />

              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                {pagedAgents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onImport={() => handleImportClick(agent)}
                    importing={importingAgentId === agent.agent_id}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>导入智能体</AlertDialogTitle>
            <AlertDialogDescription>
              即将从 WittyHub 导入 "{selectedAgent?.name}"，请选择模型配置。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {selectedAgent && (
              <div className="space-y-2 p-3 border border-border rounded-md bg-muted/30">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedAgent.name}</span>
                  {selectedAgent.verified && (
                    <Badge variant="outline" className="text-xs">
                      已验证
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selectedAgent.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedAgent.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {selectedAgent.star_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {selectedAgent.download_count}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="modelSelect" className="text-sm font-medium">
                模型配置 <span className="text-destructive">*</span>
              </label>
              {!loadingModels && models.length === 0 ? (
                <div className="p-4 border border-input rounded-md bg-muted/50">
                  <span className="text-sm text-muted-foreground">暂无模型配置，请先添加模型</span>
                </div>
              ) : (
                <Select
                  value={selectedModelId}
                  onValueChange={setSelectedModelId}
                  disabled={loadingModels || importingAgentId !== null}
                >
                  <SelectTrigger id="modelSelect" className="w-full">
                    {loadingModels ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        加载中...
                      </div>
                    ) : (
                      <SelectValue placeholder="请选择模型配置" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {importingAgentId && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span
                    className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  ></span>
                  <span
                    className="w-2 h-2 rounded-full bg-primary/30 animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  ></span>
                </div>
                <span>正在导入智能体，此过程可能需要1-2分钟，请耐心等待...</span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={importingAgentId !== null}>取消</AlertDialogCancel>
            <Button
              disabled={importingAgentId !== null || models.length === 0}
              onClick={handleImportAgent}
            >
              {importingAgentId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  导入中...
                </>
              ) : (
                '确认导入'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AgentCard({
  agent,
  onImport,
  importing,
}: {
  agent: WittyHubAgent
  onImport: () => void
  importing: boolean
}) {
  return (
    <div className="relative flex min-h-48 flex-col rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow">
      {agent.homepage_url && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-7 px-2 text-muted-foreground hover:text-foreground hidden sm:flex"
          onClick={() => window.open(agent.homepage_url, '_blank')}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      )}
      <div className="mb-3 flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold leading-5 truncate">{agent.name}</p>
            {agent.verified && <Shield className="h-3.5 w-3.5 text-green-500 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {agent.version}
            <span className="hidden sm:inline"> • {agent.author}</span>
          </p>
        </div>
      </div>

      <div className="flex-1">
        <p className="min-h-10 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {agent.description || '暂无描述'}
        </p>

        {agent.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {agent.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                <Tag className="h-2.5 w-2.5 mr-1" />
                {tag}
              </Badge>
            ))}
            {agent.tags.length > 2 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{agent.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {agent.star_count}
          </span>
          <span className="flex items-center gap-1 hidden sm:inline">
            <Download className="h-3 w-3" />
            {agent.download_count}
          </span>
          {agent.category && (
            <Badge
              variant="outline"
              className="text-xs font-normal hidden md:inline max-w-[120px] truncate"
            >
              {agent.category}
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={onImport} disabled={importing} className="h-7">
          {importing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              导入中
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 mr-1" />
              导入
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function MarketplaceSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex h-8 items-center gap-2 rounded-md border border-border/70 bg-muted/10 px-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold leading-none">{value}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{text}</div>
}

function PaginationBar({
  total,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: {
  total: number
  currentPage: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">共 {total} 个智能体</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={currentPage <= 1}>
          上一页
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={currentPage >= totalPages}>
          下一页
        </Button>
      </div>
    </div>
  )
}
