import type { IdType } from 'sfc-common/model'

/** 聊天消息 */
export type ChatMessage = ToolMessage | TextMessage | DoneInfo

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

  /** 工具调用状态：pending 进行中，done 已完成 */
  status: 'pending' | 'done'
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
  /** 工具调用状态：pending / done（tool） */
  status?: string
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


