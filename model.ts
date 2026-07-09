/** 聊天消息 */
export interface ChatMessage {
  /** 角色：'user' | 'ai' */
  role: 'user' | 'ai'
  /** 消息内容（AI 消息为累积的 markdown 文本） */
  content: string
}

/** 聊天请求体 */
export interface ChatRequest {
  message: string
}

/** LLM 提供商协议类型 */
export type ProtocolType = 'OpenAI' | 'Anthropic'

/** LLM 提供商 */
export interface LlmProvider {
  /** 主键 ID */
  id?: number
  /** 数据所属人 */
  uid?: number
  /** 提供商名称 */
  name: string
  /** 协议类型 */
  protocolType: ProtocolType
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


