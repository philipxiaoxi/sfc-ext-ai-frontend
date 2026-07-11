/** 聊天消息 */
export type ChatMessage = ToolMessage | TextMessage

/** 工具消息 */
export type ToolMessage = {
  role: 'tool',

  /** 工具名称 */
  name: string

  /** 调用参数 */
  arguments: string

  /** 调用结果 */
  result: string
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


