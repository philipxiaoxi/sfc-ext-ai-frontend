import type { IdType } from 'sfc-common/model'

/** 聊天消息 */
export type ChatMessage = ToolMessage | TextMessage | DoneInfo | SystemMessage

/** 工具消息 */
export type ToolMessage = {
  role: 'tool',

  /** 工具调用唯一 id，用于关联 TOOL_CALL_START 与 TOOL_CALL_END */
  id: string

  /** 工具名称 */
  name: string

  /** 调用参数 */
  arguments: string

  /** 调用结果（TOOL_CALL_START 时不存在，TOOL_CALL_END 时设置） */
  result?: string

  /**
   * 工具调用状态：
   * - `pending` — 进行中
   * - `SUCCESS` — 执行成功
   * - `ERROR` — 执行失败，见 {@link errorMessage}
   * - `CANCELLED` — 被用户中断
   */
  status: 'pending' | 'SUCCESS' | 'ERROR' | 'CANCELLED'

  /** 错误信息（`ERROR` 或 `CANCELLED` 时有值） */
  errorMessage?: string
}

/** 对话消息 */
export type TextMessage = {
  /** 角色：'user' | 'ai' */
  role: 'user' | 'ai'
  /** 消息内容（AI 消息为累积的 markdown 文本） */
  content: string
  /** 思维链内容（LLM 思考期间输出，作为独立消息展示，与 content 互斥） */
  reasoningContent?: string
}

/** DONE 完成信息 */
export type DoneInfo = {
  role: 'done'
  /** 模型 ID（模型标识字符串，如 `deepseek-v4-flash`） */
  modelId: IdType
  /** 调用耗时（毫秒） */
  time: number
  /** 停止原因：'已完成' | '已停止' */
  reason?: string
}

/** 系统提示消息（如授权模式切换确认） */
export type SystemMessage = {
  role: 'system'
  /** 提示内容，如 "授权模式已切换为: 完全授权" */
  content: string
}

/** 聊天请求体 */
export interface ChatRequest {
  message: string
}

/** LLM 适配器信息 */
export interface AdapterInfo {
  /** 适配器标识 */
  id: string
  /** 显示名称 */
  name: string
  /** 图标标识（Material Icon / URL / base64） */
  icon: string
}

/** LLM 提供商 */
export interface LlmProvider {
  /** 主键 ID */
  id?: number
  /** 数据所属人 */
  uid?: number
  /** 提供商名称 */
  name: string
  /** 适配器标识 */
  adapter: string
  /** 请求地址 */
  baseUrl: string
  /** API 密钥 */
  apiKey: string
  /** 模型列表请求地址（可选） */
  modelListUrl?: string
  /** 自定义请求头（JSON 格式 key: value） */
  customHeader?: string
  /** 创建时间 */
  createAt?: Date
  /** 更新时间 */
  updateAt?: Date
}

/** 提供商响应 VO（不含敏感信息） */
export interface ProviderVo {
  /** 主键 ID */
  id: number
  /** 提供商名称 */
  name: string
  /** 适配器标识 */
  adapter: string
}

/** 提供商及其关联模型列表 */
export interface ProviderWithModelsVo {
  /** 提供商信息 */
  provider: ProviderVo
  /** 关联的模型列表 */
  models: LlmModel[]
}

/** AI 对话记录（对应后端 AiConversation PO） */
export interface AiConversation {
  /** 会话 ID（对应 WebSocket 协议的 sessionId） */
  conversationId: string
  /** 对话标题（由 LLM 自动生成） */
  title: string
  /** 创建时间 */
  createAt?: string
  /** 更新时间 */
  updateAt?: string
}

/** 对话历史响应 VO */
export interface ConversationHistoryVo {
  /** 会话 ID */
  conversationId: string
  /** 对话标题 */
  title: string
  /** 历史消息列表（按发生顺序排列） */
  messages: HistoryMessageVo[]
}

/** 历史消息 VO（对应后端 HistoryMessageVo，兼容前端 ChatMessage 联合类型） */
export interface HistoryMessageVo {
  /** 角色：user / ai / tool */
  role: 'user' | 'ai' | 'tool'
  /** 消息文本内容（user / ai） */
  content?: string
  /** 推理思考内容（ai） */
  reasoningContent?: string
  /** 工具调用 ID（tool） */
  id?: string
  /** 工具名称（tool） */
  name?: string
  /** 工具参数 JSON 字符串（tool） */
  arguments?: string
  /** 工具执行结果（tool） */
  result?: string
  /** 工具调用状态：pending / done / SUCCESS / ERROR / CANCELLED（tool） */
  status?: string
  /** 错误信息（tool，ERROR 或 CANCELLED 时有值） */
  errorMessage?: string
}

/** 权限审批请求（UI 显示用） */
export interface PermissionRequest {
  /** 工具调用 ID */
  toolCallId: string
  /** 工具名称 */
  toolName: string
  /** 用途说明 */
  purpose: string
  /** 工具参数 */
  arguments: Record<string, any>
}

/** LLM 模型 */
export interface LlmModel {
  /** 主键 ID */
  id?: number
  /** 数据所属人 */
  uid?: number
  /** 关联的提供商 ID */
  llmProviderId: number
  /** 模型标识 */
  modelId: string
  /** 最大上下文长度 */
  contextLength?: number
  /** 思考模式 */
  reasoning?: string
  /** 创建时间 */
  createAt?: Date
  /** 更新时间 */
  updateAt?: Date
}

/** 敏感工具调用状态（对应后端 SensitiveToolCallStatus 枚举） */
export type SensitiveToolCallStatus = 'AUTO_EXECUTED' | 'APPROVED_EXECUTED' | 'REJECTED'

/** 敏感工具调用记录（对应后端 SensitiveToolCallRecord PO） */
export interface SensitiveToolCallRecord {
  /** 主键 ID */
  id?: number
  /** 发起调用的用户 ID */
  uid?: number
  /** 发起调用的用户名 */
  username?: string
  /** 发起调用的 AI 会话 ID */
  conversationId?: string
  /** 敏感工具名称 */
  toolName: string
  /** 工具用途说明 */
  purpose?: string
  /** 工具调用参数（JSON 字符串） */
  arguments?: string
  /** 调用状态：AUTO_EXECUTED 自动执行 / APPROVED_EXECUTED 批准执行 / REJECTED 已拒绝 */
  status: SensitiveToolCallStatus
  /** 是否执行成功（REJECTED 恒为 false） */
  success?: boolean
  /** 工具执行结果或错误信息 */
  result?: string
  /** 创建时间 */
  createAt?: string | number
  /** 更新时间 */
  updateAt?: string | number
}

/** 敏感工具调用记录分页查询参数 */
export interface SensitiveToolCallQueryParam {
  /** 页码，从 0 开始 */
  page?: number
  /** 每页大小 */
  size?: number
  /** 用户 ID 筛选（可选） */
  uid?: number
  /** 工具名称模糊筛选（可选） */
  toolName?: string
  /** 开始时间（毫秒时间戳，可选） */
  startTime?: number
  /** 结束时间（毫秒时间戳，可选） */
  endTime?: number
}


