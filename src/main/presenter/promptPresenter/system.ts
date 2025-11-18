import { presenter } from '@/presenter'
import type { PromptComponent, CustomModePrompts } from './types'
import { formatLanguage } from '../../../shared/language'
import {
  getSystemInfoSection,
  getObjectiveSection,
  getSharedToolUseSection,
  addCustomInstructions,
  markdownFormattingSection
} from './sections'

// Helper function to get prompt component, filtering out empty objects
export function getPromptComponent(
  customModePrompts: CustomModePrompts | undefined,
  mode: string
): PromptComponent | undefined {
  const component = customModePrompts?.[mode]
  // Return undefined if component is empty
  if (component == null) {
    return undefined
  }
  return component
}

async function generatePrompt(
  cwd?: string,
  globalCustomInstructions?: string,
  language?: string,
  IgnoreInstructions?: string,
  useBuiltInToolsEnabled?: boolean
): Promise<string> {
  const promptSections = [markdownFormattingSection()]

  if (useBuiltInToolsEnabled) {
    promptSections.push(`${getSharedToolUseSection()}`)
  }

  promptSections.push(getSystemInfoSection(), getObjectiveSection())

  const customInstructions = await addCustomInstructions(
    '',
    globalCustomInstructions || '',
    cwd || '',
    '',
    {
      language: language ?? formatLanguage(presenter.configPresenter.getLanguage()),
      IgnoreInstructions
    }
  )

  promptSections.push(customInstructions)

  const basePrompt = `

		${promptSections.join(`

		`)}
	`

  return basePrompt
}

export const SYSTEM_PROMPT = async (
  cwd?: string,
  globalCustomInstructions?: string,
  language?: string,
  IgnoreInstructions?: string,
  useBuiltInToolsEnabled?: boolean
): Promise<string> => {
  return generatePrompt(
    cwd,
    globalCustomInstructions,
    language,
    IgnoreInstructions,
    useBuiltInToolsEnabled
  )
}
