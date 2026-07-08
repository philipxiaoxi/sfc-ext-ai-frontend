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
