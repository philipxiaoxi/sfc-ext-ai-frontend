/**
 * AI 聊天通用前端工具定义。
 *
 * 定义可通过 `REGISTER_TOOL` 注册的动态工具，每个工具包含：
 * - 元数据（name / description / parameters）：发送给服务端供 LLM 识别
 * - handler：收到 `TOOL_CALL_REQ` 时自动执行，结果通过 `TOOL_ACK` 返回
 *
 * 使用方式：
 * ```ts
 * import { askUserTool, openLinkForLinkTool } from '../core/CommonTools'
 *
 * session.registerTool(askUserTool)
 * session.registerTool(openLinkForLinkTool)
 * ```
 *
 * @see AiChatSession.registerTool
 */

import SfcUtils from 'sfc-common/utils/SfcUtils'
import type { ToolRegistration } from './ChatProtocol'

/**
 * ask_user 工具：当 LLM 需要用户决策或确认时，向用户提问并收集回答。
 *
 * - 参数 `questions`：问题字符串数组，依次弹出输入框
 * - 多问题时标题会显示 `(1/N)` 进度标识
 * - 返回 JSON 对象，key 为问题原文，value 为用户回答
 */
export const askUserTool: ToolRegistration = {
  name: 'ask_user',
  description: '当需要用户进行决策或确认时，向用户提出一个或多个问题并等待用户回答，或单纯用于询问用户',
  parameters: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        description: '向用户提问的问题列表，按顺序依次提问',
        items: {
          type: 'string'
        }
      }
    },
    required: ['questions']
  },
  handler: async(args) => {
    const questions: string[] = args.questions ?? []
    const answers: Record<string, string> = {}
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      let title = 'AI 助手需要确认'
      if (questions.length > 1) {
        title += ` (${i + 1}/${questions.length})`
      }
      const answer = await SfcUtils.prompt({
        title,
        label: q,
        autofocus: true,
        extraDialogOptions: {
          persistent: true
        }
      })
      answers[q] = answer || '用户未回答'
    }
    return JSON.stringify(answers)
  }
}

/**
 * open_link_for_link 工具：在浏览器新标签页中打开指定链接。
 *
 * - 参数 `url`：需要打开的链接地址
 * - 返回打开结果描述
 */
export const openLinkForUser: ToolRegistration = {
  name: 'open_link_for_user',
  description: '让用户的浏览器打开一个url，通过该工具可以将文件下载地址或网页链接推送给用户打开',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: '需要打开的链接地址。可接受\'/\'开头的路径用于直接访问当前的网盘服务器接口或地址'
      }
    },
    required: ['url']
  },
  handler: async(args) => {
    const url: string = args.url
    if (!url) {
      return JSON.stringify({ error: '缺少 url 参数' })
    }
    try {
      // 弹出确认对话框让用户决定是否打开链接
      await SfcUtils.confirm(
        `AI助手将为您打开链接：\n${url}\n\n是否确认？`,
        '打开链接确认',
        { cancelToReject: true }
      )
      window.open(url, '_blank')
      return JSON.stringify({ success: true, message: `已打开链接: ${url}` })
    } catch {
      return JSON.stringify({ success: false, message: '用户取消了打开链接' })
    }
  }
}
