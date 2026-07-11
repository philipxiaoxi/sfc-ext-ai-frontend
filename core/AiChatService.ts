import { WebSocketService } from 'sfc-common'
import type { ChatRequest, LlmResponse } from './ChatProtocol'

// ────────────────────────── 接口定义 ──────────────────────────

/**
 * AI 聊天会话接口。
 *
 * 封装底层 WebSocket 连接，对外提供类型安全的 send / onMessage 接口，
 * 内部自动完成对象序列化（发送）与反序列化（接收）。
 *
 * 会话生命周期：
 * 1. connect() — 建立 WebSocket 连接
 * 2. start()   — 发送 START_SESSION 开启会话（协议要求的首条消息）
 * 3. send()    — 发送聊天消息等请求
 * 4. stop()    — 停止当前响应
 * 5. 连接关闭 / 异常时由 WebSocket 自身生命周期管理
 */
export interface AiChatSession {

  /**
   * 发送一条请求消息给服务端。
   *
   * @param request 类型安全的请求对象，type 字段自动推导 data 的 payload 类型
   *
   * @example
   * ```ts
   * session.send({ type: 'START_SESSION', data: {} })
   * session.send({ type: 'CHAT', data: { modelId: 1, content: '你好' } })
   * session.send({ type: 'STOP' })
   * ```
   */
  send(request: ChatRequest): void

  /**
   * 注册消息回调。每次服务端推送消息时都会调用此函数。
   *
   * @param handler 收到消息后的回调函数，参数为反序列化后的 LlmResponse 对象
   *
   * @example
   * ```ts
   * session.onMessage((msg) => {
   *   switch (msg.type) {
   *     case 'TEXT':
   *       console.log('AI 回复:', msg.data.content)
   *       break
   *     case 'DONE':
   *       console.log('响应结束:', msg.data.reason)
   *       break
   *     case 'ERROR':
   *       console.error('错误:', msg.data.message)
   *       break
   *   }
   * })
   * ```
   */
  onMessage(handler: (msg: LlmResponse) => void): void

  /**
   * 开启会话。
   *
   * 发送 START_SESSION 消息，这是 WebSocket 连接建立后的第一条消息，
   * 且每个连接仅允许发送一次。
   *
   * @param sessionId 可选的会话 ID，不传则由服务端生成 UUID
   */
  start(sessionId?: string): void

  /**
   * 停止当前 LLM 响应。
   *
   * 发送 STOP 消息，服务端会停止正在进行的流式生成并回复 DONE。
   */
  stop(): void

  /**
   * 注册连接关闭回调。当 WebSocket 连接关闭时调用此函数。
   *
   * @param handler 连接关闭后的回调函数，可选参数为关闭事件对象
   *
   * @example
   * ```ts
   * session.onClose((event) => {
   *   console.log('连接已关闭, code:', event.code)
   * })
   * ```
   */
  onClose(handler: (event: CloseEvent) => void): void
}

/**
 * AI 聊天 WebSocket 服务接口。
 *
 * 提供建立连接的方法，返回 {@link AiChatSession} 实例供后续交互。
 *
 * @example
 * ```ts
 * import { aiChatService } from 'sfc-ext-ai/AiChatService'
 *
 * const session = await aiChatService.connect()
 * session.start()
 * session.send({ type: 'CHAT', data: { modelId: 1, content: '你好' } })
 * ```
 */
export interface AiChatService {
  /**
   * 连接 AI 聊天 WebSocket 服务。
   *
   * 底层使用 {@link WebSocketService.createNativeWebSocket} 建立连接，
   * Promise 在 WebSocket 握手完成后 resolve。
   *
   * @param url  可选，WebSocket 端点路径，默认 '/api/ai/wschat'
   * @returns    建立连接后的 AiChatSession 实例
   */
  connect(url?: string): Promise<AiChatSession>
}

// ────────────────────────── 内部实现 ──────────────────────────

/**
 * AiChatSession 的默认实现。
 */
class AiChatSessionImpl implements AiChatSession {
  /** 底层原生 WebSocket 实例 */
  private ws: WebSocket

  /** 当前注册的消息处理函数 */
  private handler: ((msg: LlmResponse) => void) | null = null

  /** 当前注册的连接关闭回调函数 */
  private closeHandler: ((event: CloseEvent) => void) | null = null

  /**
   * @param ws 已建立连接的 WebSocket 实例
   */
  constructor(ws: WebSocket) {
    this.ws = ws

    // 统一接收 JSON 消息，反序列化为 LlmResponse 后派发给注册的 handler
    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const response: LlmResponse = JSON.parse(event.data)
        this.handler?.(response)
      } catch (e) {
        console.error('[AiChatSession] 消息反序列化失败:', e, event.data)
      }
    }

    // 连接关闭时派发给注册的 closeHandler
    this.ws.onclose = (event: CloseEvent) => {
      this.closeHandler?.(event)
    }
  }

  send(request: ChatRequest): void {
    const raw = { type: request.type, data: (request as any).data }
    this.ws.send(JSON.stringify(raw))
  }

  onMessage(handler: (msg: LlmResponse) => void): void {
    this.handler = handler
  }

  onClose(handler: (event: CloseEvent) => void): void {
    this.closeHandler = handler
  }

  start(sessionId?: string): void {
    this.send({ type: 'START_SESSION', data: sessionId ? { sessionId } : {} })
  }

  stop(): void {
    this.send({ type: 'STOP' })
  }
}

/**
 * AiChatService 默认实例。
 *
 * 直接通过 `aiChatService.connect()` 使用，无需手动创建。
 */
export const aiChatService: AiChatService = {
  async connect(url?: string): Promise<AiChatSession> {
    const ws = await WebSocketService.createNativeWebSocket({
      url: url ?? '/api/ai/wschat',
      onError(e) {
        console.error('[AiChatService] WebSocket 连接失败:', e)
      }
    })
    return new AiChatSessionImpl(ws)
  }
}
