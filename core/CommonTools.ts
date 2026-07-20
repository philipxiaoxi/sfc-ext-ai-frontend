/**
 * AI 聊天通用前端工具定义。
 *
 * 定义可通过 `REGISTER_TOOL` 注册的动态工具，每个工具包含：
 * - 元数据（name / description / parameters）：发送给服务端供 LLM 识别
 * - handler：收到 `TOOL_CALL_REQ` 时自动执行，结果通过 `TOOL_ACK` 返回
 *
 * 使用方式：
 * ```ts
 * import { askUserTool, openLinkForLinkTool, getCurrentUserPath } from '../core/CommonTools'
 *
 * session.registerTool(askUserTool)
 * session.registerTool(openLinkForLinkTool)
 * session.registerTool(getCurrentUserPath)
 * ```
 *
 * @see AiChatSession.registerTool
 */

import SfcUtils from 'sfc-common/utils/SfcUtils'
import { StringUtils } from 'sfc-common/utils/StringUtils'
import type { ToolRegistration } from './ChatProtocol'
import { getContext, openFileDialog } from 'sfc-common'
import { DefaultFileSystemHandler } from 'sfc-common'
import { ref } from 'vue'
import { EventNameConstants } from 'sfc-common/core/constans/EventName'

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
        },
        cancelToReject: false
      })
      answers[q] = answer || '用户未回答'
    }
    return JSON.stringify(answers)
  }
}

export const requireUserUpload: ToolRegistration = {
  name: 'require_user_upload',
  description: '要求用户上传一个文件。通过该工具会弹出上传对话框让用户上传文件。',
  parameters: {
    type: 'object',
    properties: {
      disk: {
        type: 'string',
        description: '让用户上传的网盘位置。"private"表示用户的私人网盘，"public"表示公共网盘'
      },
      path: {
        type: 'string',
        description: '文件上传后所在的目录路径。/作为开头和路径分割字符'
      }
    },
    required: ['disk', 'path']
  },
  handler: async(args) => {
    const uid = args.disk == 'public' ? '0' : getContext().session.value.user.id
    const handler = new DefaultFileSystemHandler(ref(uid))
    try {
      const f = await openFileDialog()
      const savePath = await SfcUtils.loadingDialogTask({ msg: '上传中' }, async() => {
        return await handler.uploadDirect(args.path, f[0])
      })
      return '文件上传到了: ' + savePath
    } catch(e) {
      return '用户未上传文件: ' + e
    }
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

/**
 * get_current_user_path 工具：获取当前用户在网盘中的位置信息。
 *
 * 返回内容：
 * - `diskArea`：网盘区域，`'public'` 表示公共网盘、`'private'` 表示私人网盘、`'不在网盘路径中'` 表示当前不在网盘浏览页面
 * - `diskPath`：当前所在网盘路径（以 `/` 开头），当不在网盘路径中时为空字符串
 */
export const getCurrentUserPath: ToolRegistration = {
  name: 'get_current_user_path',
  description: '获取当前用户在网盘中的位置信息，包括所在的网盘区域（公共网盘/私人网盘）和路径',
  parameters: {
    type: 'object',
    properties: {}
  },
  handler: async() => {
    const route = getContext().routeInfo.value.curr
    if (!route) {
      return JSON.stringify({ diskArea: '不在网盘路径中', diskPath: '' })
    }
    const path = route.path
    let diskArea = '不在网盘路径中'
    let diskPath = ''

    if (path === '/public' || path.startsWith('/public/')) {
      diskArea = 'public'
      diskPath = path === '/public' ? '/' : path.substring('/public'.length)
    } else if (path === '/private' || path.startsWith('/private/')) {
      diskArea = 'private'
      diskPath = path === '/private' ? '/' : path.substring('/private'.length)
    }
    return JSON.stringify({ diskArea, diskPath })
  }
}

/**
 * goto_disk_path 工具：切换当前用户在网盘中的路径。
 *
 * 接受网盘区域和路径参数，调用 Vue Router 导航到对应路由。
 * - 参数 `disk`：网盘区域，`"public"` 表示公共网盘，`"private"` 表示私人网盘
 * - 参数 `path`：网盘路径，以 `/` 开头和作为路径分隔符，`"/"` 表示根目录
 */
export const gotoDiskPath: ToolRegistration = {
  name: 'goto_disk_path',
  description: '切换当前用户在网盘中的路径，导航到指定的网盘区域和目录。该工具需要流程或用户主动要求时调用。认为需要调用时可询问用户是否需要切换路径。',
  parameters: {
    type: 'object',
    properties: {
      disk: {
        type: 'string',
        description: '网盘区域，"public"表示公共网盘，"private"表示私人网盘'
      },
      path: {
        type: 'string',
        description: '网盘路径，以/作为开头和路径分隔符，如"/"表示根目录'
      }
    },
    required: ['disk', 'path']
  },
  handler: async(args) => {
    const disk: string = args.disk
    const path: string = args.path
    if (disk !== 'public' && disk !== 'private') {
      return JSON.stringify({ error: 'disk 参数必须是 "public" 或 "private"' })
    }
    const router = getContext().routeInfo.value.router
    if (!router) {
      return JSON.stringify({ error: '路由实例不可用' })
    }
    // 构建路由路径：根路径为 /public 或 /private，子路径使用 appendPath 拼接
    const base = '/' + disk
    const routePath = path && path !== '/' ? StringUtils.appendPath(base, path) : base
    router.push(routePath)
    return JSON.stringify({ success: true, message: `已导航到 ${routePath}` })
  }
}

/**
 * refresh_file_list 工具：刷新当前网盘路径下的文件列表。
 *
 * 触发当前所在网盘页面的文件列表刷新，适用于 AI 执行了文件操作后需要刷新列表的场景。
 *
 * - 可选参数 `path`：指定需要刷新的路径，只有当前路径匹配时才刷新；不传则始终刷新
 * - 路径比较前会做归一化（移除末尾 `/`、折叠连续的 `//`）
 * - 通过事件总线通知当前网盘浏览器刷新文件列表
 * - 返回刷新结果描述
 */
export const refreshFileList: ToolRegistration = {
  name: 'refresh_file_list',
  description: '刷新当前网盘路径下的文件列表，适用于AI执行了文件操作后需要刷新列表的场景',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '可选，指定需要刷新的网盘路径（以/开头）。传此参数时仅当当前所在路径匹配时才执行刷新；不传则始终刷新当前路径'
      }
    }
  },
  handler: async(args) => {
    const path: string | undefined = args.path
    getContext().eventBus.value.emit(EventNameConstants.REFRESH_FILE_LIST, { path })
    return JSON.stringify({ success: true, message: '已刷新文件列表' })
  }
}
