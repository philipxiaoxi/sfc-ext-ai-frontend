/**
 * AI 聊天 WebSocket 消息协议类型定义。
 *
 * 映射后端 com.sfc.ai.model.chat.message 包中的 Java 类型：
 * - UserRequest / LlmResponse 作为消息信封
 * - UserMessageType / LlmMessageType 作为消息类型枚举
 * - 各 Payload 类作为消息体
 *
 * @see WebSocketService.createNativeWebSocket
 */

import { IdType } from 'sfc-common/model'

// ────────────────────────── 用户消息类型 ──────────────────────────

/** 用户消息类型枚举（对应后端 UserMessageType） */
export type UserMessageType = 'START_SESSION' | 'CHAT' | 'TOOL_ACK' | 'STOP' | 'REGISTER_TOOL'

// ────────────────────────── 服务端消息类型 ──────────────────────────

/** 服务端消息类型枚举（对应后端 LlmMessageType） */
export type LlmMessageType =
  | 'SESSION_ACK'
  | 'TOOL_CALL'
  | 'TOOL_CALL_START'
  | 'TOOL_CALL_END'
  | 'TOOL_CALL_REQ'
  | 'THINKING_START'
  | 'THINKING_END'
  | 'TEXT'
  | 'DONE'
  | 'ERROR'
  | 'TITLE_UPDATE'
  | 'REGISTER_TOOL_ACK'

// ────────────────────────── 请求 Payload ──────────────────────────

/** START_SESSION 消息 payload */
export interface StartSessionPayload {
  /** 可选的会话 ID，不传则由服务端生成 UUID */
  sessionId?: string
}

/** SESSION_ACK 消息 payload */
export interface SessionAckPayload {
  /** 服务端确认的会话 ID */
  sessionId: string
}

/** CHAT 消息 payload */
export interface ChatPayload {
  /** 模型 ID（对应 LlmModel.id） */
  modelId: IdType
  /** 聊天消息内容 */
  content: string
}

// ────────────────────────── 响应 Payload ──────────────────────────

/** TEXT 消息 payload */
export interface TextPayload {
  /** 文本回复内容（LLM 思考结束后输出，与 reasoningContent 互斥） */
  content: string | null
  /** 思维链内容（LLM 思考期间输出，与 content 互斥） */
  reasoningContent?: string | null
}

/** ERROR 消息 payload */
export interface ErrorPayload {
  /** 错误描述 */
  message: string
}

/** DONE 消息 payload */
export interface DonePayload {
  /** 停止原因 */
  reason: string
  /** 模型 ID（模型标识字符串，如 `deepseek-v4-flash`） */
  modelId?: IdType
  /** 调用耗时（毫秒） */
  time?: number
}

/** Tool Call 告知消息 payload（已废弃，由 TOOL_CALL_START + TOOL_CALL_END 替代） */
export interface ToolCallPayload {
  /** 工具名称 */
  name: string

  /** 参数 json 格式，反序列化后为 Record<string, any> */
  arguments: string

  /** 工具调用结果 */
  result: string
}

/** TITLE_UPDATE 消息 payload */
export interface TitleUpdatePayload {
  /** LLM 自动生成的标题 */
  title: string
  /** 会话 ID，对应 SESSION_ACK 返回的 sessionId */
  conversationId: string
}

/** TOOL_CALL_START 消息 payload */
export interface ToolCallStartPayload {
  /** 工具调用唯一 id，用于关联 TOOL_CALL_START 与 TOOL_CALL_END */
  id: string

  /** 工具名称 */
  name: string

  /** 工具参数（JSON 格式字符串） */
  arguments: string
}

/** TOOL_CALL_END 消息 payload */
export interface ToolCallEndPayload {
  /** 工具调用唯一 id，与 TOOL_CALL_START 的 id 对应 */
  id: string

  /** 工具名称 */
  name: string

  /** 工具执行结果 */
  result: string

  /**
   * 工具调用执行状态。
   * - `SUCCESS` — 执行成功
   * - `ERROR` — 执行失败，见 {@link errorMessage}
   * - `CANCELLED` — 被用户中断
   */
  status: 'SUCCESS' | 'ERROR' | 'CANCELLED'

  /** 错误信息（`ERROR` 或 `CANCELLED` 时有值） */
  errorMessage?: string
}

/**
 * JSON Schema 工具参数定义。
 *
 * 提供给 {@link AiChatSession.registerTool} 使用，方法内部会自动序列化为 JSON 字符串，
 * 调用方无需手动 `JSON.stringify`。
 */
export interface ToolParameterSchemaProperty {
  type: string
  description?: string
  /** 当 type 为 'array' 时，描述数组元素的 schema */
  items?: ToolParameterSchemaProperty
}

export interface ToolParameterSchema {
  type: 'object'
  properties: Record<string, ToolParameterSchemaProperty>
  required?: string[]
}

/**
 * 动态工具的实现函数类型。
 *
 * 接收解析后的参数对象，返回工具执行结果字符串。
 * 支持同步和异步两种模式。
 *
 * @param args 解析后的工具参数（key-value 对象）
 * @returns 工具执行结果，将作为 TOOL_ACK 的 result 字段发送给服务端
 */
export type ToolHandler = (args: Record<string, any>) => string | Promise<string>

/** REGISTER_TOOL 消息 payload */
export interface RegisterToolPayload {
  /** 工具名称，在当前会话中唯一 */
  name: string
  /** 工具描述，供 LLM 理解工具用途 */
  description: string
  /** JSON Schema 格式的参数字符串 */
  parameters: string
}

/**
 * 动态工具注册信息。
 *
 * 提供给 {@link AiChatSession.registerTool} 使用，将工具元数据与实现函数封装为一个对象。
 */
export interface ToolRegistration {
  /** 工具名称，在当前会话中唯一 */
  name: string
  /** 工具描述，供 LLM 理解工具用途 */
  description: string
  /** JSON Schema 格式的参数定义（传入对象，内部自动序列化） */
  parameters: ToolParameterSchema
  /** 工具实现函数，接收解析后的参数对象，返回结果字符串 */
  handler: ToolHandler
}

/** TOOL_CALL_REQ 消息 payload */
export interface ToolCallReqPayload {
  /** 工具调用唯一 ID，用于关联 TOOL_CALL_REQ 与 TOOL_ACK */
  id: string
  /** 工具名称 */
  name: string
  /** 工具参数（JSON 格式字符串） */
  arguments: string
}

/** TOOL_ACK 消息 payload */
export interface ToolAckPayload {
  /** 与 TOOL_CALL_REQ 的 id 一致 */
  id: string
  /** 工具函数名称 */
  name: string
  /** 调用参数（与 TOOL_CALL_REQ 中的参数一致） */
  arguments: Record<string, any>
  /** 工具执行结果 */
  result: string
}


// ────────────────────────── 请求消息（客户端 → 服务端） ──────────────────────────

/**
 * 用户发送给后端的 WebSocket 请求消息（判别联合体）。
 *
 * 根据 type 字段自动推导 data 的 payload 类型：
 * ```ts
 * send({ type: 'CHAT', data: { modelId: 1, content: '你好' } })
 * //                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 被推导为 ChatPayload
 * ```
 */
export type ChatRequest =
  | { type: 'START_SESSION'; data?: StartSessionPayload }
  | { type: 'CHAT'; data: ChatPayload }
  | { type: 'TOOL_ACK'; data: ToolAckPayload }
  | { type: 'STOP' }
  | { type: 'REGISTER_TOOL'; data: RegisterToolPayload }

// ────────────────────────── 响应消息（服务端 → 客户端） ──────────────────────────

/**
 * 服务端回复的 WebSocket 响应消息（判别联合体）。
 *
 * 使用 switch/case 对 type 缩窄后，data 字段自动推导为对应 payload 类型：
 * ```ts
 * switch (msg.type) {
 *   case 'TEXT':  msg.data.content  // 推导为 TextPayload
 *   case 'ERROR': msg.data.message  // 推导为 ErrorPayload
 *   case 'DONE':  msg.data.reason   // 推导为 DonePayload
 * }
 * ```
 */
export type LlmResponse =
  | { type: 'SESSION_ACK'; data: SessionAckPayload }
  | { type: 'TEXT'; data: TextPayload }
  | { type: 'TOOL_CALL'; data: ToolCallPayload }
  | { type: 'TOOL_CALL_START'; data: ToolCallStartPayload }
  | { type: 'TOOL_CALL_END'; data: ToolCallEndPayload }
  | { type: 'TOOL_CALL_REQ'; data: ToolCallReqPayload }
  | { type: 'REGISTER_TOOL_ACK'; data: string }
  | { type: 'DONE'; data: DonePayload }
  | { type: 'ERROR'; data: ErrorPayload }
  | { type: 'TITLE_UPDATE'; data: TitleUpdatePayload }
