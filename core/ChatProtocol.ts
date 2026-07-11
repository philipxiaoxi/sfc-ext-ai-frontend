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
export type UserMessageType = 'START_SESSION' | 'CHAT' | 'TOOL_ACK' | 'STOP'

// ────────────────────────── 服务端消息类型 ──────────────────────────

/** 服务端消息类型枚举（对应后端 LlmMessageType） */
export type LlmMessageType =
  | 'SESSION_ACK'
  | 'TOOL_CALL'
  | 'TOOL_CALL_REQ'
  | 'THINKING_START'
  | 'THINKING_END'
  | 'TEXT'
  | 'DONE'
  | 'ERROR'

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
  /** 文本回复内容 */
  content: string
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
  | { type: 'TOOL_ACK'; data?: any }
  | { type: 'STOP' }

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
  | { type: 'THINKING_START' }
  | { type: 'THINKING_END' }
  | { type: 'TOOL_CALL' }
  | { type: 'TOOL_CALL_REQ' }
  | { type: 'DONE'; data: DonePayload }
  | { type: 'ERROR'; data: ErrorPayload }
