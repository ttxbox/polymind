<template>
  <Sheet :open="isOpen" @update:open="aiScriptStore.setOpen">
    <SheetContent
      side="right"
      class="flex h-full w-full max-w-[520px] flex-col border-l border-border p-0"
    >
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <div class="flex flex-col text-left">
          <SheetTitle class="text-base font-semibold">
            {{ t('thread.toolbar.AIScript') }}
          </SheetTitle>
          <SheetDescription class="text-xs text-muted-foreground">
            {{ t('thread.aiScript.description') }}
          </SheetDescription>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-4">
        <div
          v-if="loading"
          class="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
        >
          <Icon icon="lucide:loader-2" class="h-6 w-6 animate-spin" />
          <span>{{ t('thread.toolbar.AIScriptLoading') }}</span>
        </div>

        <div
          v-else-if="error"
          class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <div class="flex items-center gap-2 font-medium">
            <Icon icon="lucide:alert-triangle" class="h-4 w-4" />
            {{ t('thread.toolbar.AIScriptError') }}
          </div>
          <p class="mt-1 text-xs text-destructive/80">{{ error }}</p>
        </div>

        <div v-else-if="result" class="space-y-5 text-sm leading-relaxed">
          <div class="rounded-lg border bg-muted/40 p-3">
            <div class="flex flex-col gap-1 text-xs text-muted-foreground">
              <div class="flex items-center gap-2">
                <Icon icon="lucide:message-square" class="h-3.5 w-3.5" />
                <span>{{ t('thread.aiScript.sourceMessage') }}</span>
              </div>
              <div class="pl-5 text-muted-foreground/80">
                 <div v-if="sourceMessage" class="truncate">
                  provider: {{ sourceMessage.model_provider }}
                </div>
                <div v-if="sourceMessage" class="truncate">
                  model: {{ sourceMessage?.model_name || 'Assistant' }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="result.objectiveSummary" class="space-y-1">
            <div class="text-xs font-medium uppercase text-muted-foreground">
              {{ t('thread.toolbar.AIScriptObjective') }}
            </div>
            <div class="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              {{ result.objectiveSummary }}
            </div>
          </div>

          <template v-if="result.resultType === 'shell_script' && result.shellScript">
             <div v-if="result.shellScript.instructions" class="space-y-1">
                <div class="text-xs font-medium uppercase text-muted-foreground">
                  {{ t('thread.toolbar.AIScriptInstructions') }}
                </div>
                <div class="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {{ result.shellScript.instructions }}
                </div>
            </div>

            <div class="space-y-2 rounded-lg border bg-background/60 p-3">
              <div class="flex items-center justify-between gap-3">
                <div class="text-xs font-medium uppercase text-muted-foreground">
                  {{ t('thread.toolbar.AIScriptScriptLabel') }}
                </div>
                <div class="flex items-center gap-2">
                  <Button variant="outline" size="xs" @click="copyText(result.shellScript.script)">
                    <Icon icon="lucide:copy" class="mr-1.5 h-3 w-3" />
                    {{ t('thread.toolbar.AIScriptCopyScript') }}
                  </Button>
                </div>
              </div>

              <div class="rounded-md border bg-muted/20 p-3">
                <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed">
<code>{{ result.shellScript.script }}</code>
</pre>
              </div>
            </div>
          </template>

          <template v-else-if="result.resultType === 'report' && result.report">
            <div class="space-y-2 rounded-lg border bg-background/60 p-3">
              <div class="flex items-center justify-between gap-3">
                <div class="text-xs font-medium uppercase text-muted-foreground">
                  {{ t('thread.toolbar.AIScriptReportLabel') }}
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  @click="copyText(result.report.contentMarkdown || result.report.summary || '')"
                >
                  <Icon icon="lucide:copy" class="mr-1.5 h-3 w-3" />
                  {{ t('thread.toolbar.AIScriptCopyReport') }}
                </Button>
              </div>
              <div class="rounded-md border bg-muted/30 p-3 text-sm">
                <MarkdownRenderer
                  :content="result.report.contentMarkdown || result.report.summary || ''"
                />
              </div>
            </div>
          </template>

          <div v-if="result.notes" class="space-y-1">
            <div class="text-xs font-medium uppercase text-muted-foreground">
              {{ t('thread.toolbar.AIScriptNotes') }}
            </div>
            <div class="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              {{ result.notes }}
            </div>
          </div>
        </div>

        <div v-else class="text-xs text-muted-foreground/80">
          {{ t('thread.aiScript.emptyHint') }}
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Icon } from '@iconify/vue'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAiScriptStore } from '@/stores/aiScript'
import { useI18n } from 'vue-i18n'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'
import { useToast } from '@/components/ui/toast/use-toast'

const { t } = useI18n()
const aiScriptStore = useAiScriptStore()
const { isOpen, loading, error, result, sourceMessage } = storeToRefs(aiScriptStore)
const { toast } = useToast()


const copyText = (content: string) => {
  if (!content) return
  window.api.copyText(content)
  toast({ description: t('common.copySuccess') })
}
</script>
