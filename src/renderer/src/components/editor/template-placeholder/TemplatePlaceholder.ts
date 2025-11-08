import { Node, mergeAttributes } from '@tiptap/core'

export interface TemplatePlaceholderOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    templatePlaceholder: {
      /**
       * Insert a template placeholder
       */
      insertTemplatePlaceholder: (placeholder: string) => ReturnType
    }
  }
}

// 通用的颜色映射，按顺序使用颜色，超出范围后从头开始循环
const colorClasses = [
  'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
  'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
  'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
  'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
  'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
  'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200',
  'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200',
  'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
  'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200',
  'bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200'
]

// 存储已使用的占位符类型和对应的颜色索引
const placeholderColorMap = new Map<string, number>()
let currentColorIndex = 0

// 根据占位符类型获取颜色类，按顺序分配颜色
const getPlaceholderColorClass = (placeholder: string): string => {
  // 从占位符中提取类型（去掉方括号）
  const type = placeholder.replace(/[\[\]]/g, '')

  const colorIndex = currentColorIndex
  placeholderColorMap.set(type, colorIndex)
  currentColorIndex = (currentColorIndex + 1) % colorClasses.length

  return colorClasses[colorIndex]
}

export const TemplatePlaceholder = Node.create<TemplatePlaceholderOptions>({
  name: 'templatePlaceholder',

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'template-placeholder'
      }
    }
  },

  addAttributes() {
    return {
      placeholder: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-placeholder'),
        renderHTML: (attributes) => {
          return {
            'data-placeholder': attributes.placeholder
          }
        }
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-placeholder]'
      }
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const colorClass = getPlaceholderColorClass(node.attrs.placeholder)

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-placeholder': node.attrs.placeholder,
        class: `template-placeholder px-1 py-0 rounded border cursor-pointer text-xs ${colorClass}`,
        contenteditable: 'false'
      }),
      node.attrs.placeholder
    ]
  },

  addCommands() {
    return {
      insertTemplatePlaceholder:
        (placeholder) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { placeholder }
          })
        }
    }
  }
})
