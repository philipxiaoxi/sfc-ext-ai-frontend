import { WebSocketService } from 'sfc-common'
import type { ChatRequest, LlmResponse, ToolParameterSchema, ToolHandler, ToolCallReqPayload, ToolRegistration } from './ChatProtocol'

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
   * 关闭底层 WebSocket 连接。
   *
   * 调用后当前会话将不可用，需重新调用 {@link AiChatService.connect} 建立新连接。
   * 会触发 onClose 回调，并将 chatSession 置为 null。
   */
  close(): void

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

  /**
   * 注册一个动态工具及其实现函数。
   *
   * 向服务端发送 `REGISTER_TOOL` 注册工具元数据，同时在本地保存 handler，
   * 当服务端下发 `TOOL_CALL_REQ` 时自动执行 handler 并回复 `TOOL_ACK`。
   *
   * 工具调用期间会向 {@link onMessage} 同步合成 `TOOL_CALL_START` / `TOOL_CALL_END`
   * 事件，供 UI 层展示工具调用状态。
   *
   * @param registration 工具注册信息，包含 name / description / parameters / handler
   *
   * @example
   * ```ts
   * session.registerTool({
   *   name: 'ask_user',
   *   description: '当需要用户进行决策或确认时，向用户提出一个问题并等待用户回答',
   *   parameters: {
   *     type: 'object',
   *     properties: {
   *       question: { type: 'string', description: '向用户提问的问题' }
   *     },
   *     required: ['question']
   *   },
   *   handler: async (args) => {
   *     const answer = await SfcUtils.prompt({ title: '确认', label: args.question })
   *     return JSON.stringify({ 问题: answer })
   *   }
   * })
   * ```
   */
  registerTool(registration: ToolRegistration): Promise<void>
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

  /** 已注册的动态工具名称 → 实现函数映射 */
  private toolHandlers: Map<string, ToolHandler> = new Map()

  /** 等待服务端确认的工具注册（REGISTER_TOOL_ACK） */
  private pendingRegistrations: Map<string, {
    resolve: () => void
    reject: (reason: Error) => void
    timer: ReturnType<typeof setTimeout>
  }> = new Map()

  /**
   * @param ws 已建立连接的 WebSocket 实例
   */
  constructor(ws: WebSocket) {
    this.ws = ws

    // 统一接收 JSON 消息，反序列化为 LlmResponse 后派发给注册的 handler
    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const response: LlmResponse = JSON.parse(event.data)
        // 拦截 REGISTER_TOOL_ACK：匹配待确认的注册并 resolve Promise
        if (response.type === 'REGISTER_TOOL_ACK') {
          const name = response.data
          const entry = this.pendingRegistrations.get(name)
          if (entry) {
            clearTimeout(entry.timer)
            entry.resolve()
            this.pendingRegistrations.delete(name)
          }
          return // 已消费，不再转发给外部 handler
        }
        // 拦截 TOOL_CALL_REQ：若为已注册的动态工具，自动执行 handler 并回复 TOOL_ACK
        if (response.type === 'TOOL_CALL_REQ') {
          const toolHandler = this.toolHandlers.get(response.data.name)
          if (toolHandler) {
            this.handleToolCallReq(response.data, toolHandler)
            return // 已处理，不再转发给外部 handler
          }
        }
        this.handler?.(response)
      } catch (e) {
        console.error('[AiChatSession] 消息反序列化失败:', e, event.data)
      }
    }

    // 连接关闭时派发给注册的 closeHandler，并 reject 所有待确认的注册
    this.ws.onclose = (event: CloseEvent) => {
      // Reject 所有等待 REGISTER_TOOL_ACK 的 Promise
      this.pendingRegistrations.forEach(entry => {
        clearTimeout(entry.timer)
        entry.reject(new Error('WebSocket 连接已关闭'))
      })
      this.pendingRegistrations.clear()
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

  close(): void {
    this.ws.close()
  }

  registerTool(registration: ToolRegistration): Promise<void> {
    return new Promise((resolve, reject) => {
      // 设置超时，防止服务端不响应导致 Promise 一直 pending
      const timer = setTimeout(() => {
        this.pendingRegistrations.delete(registration.name)
        reject(new Error(`工具注册超时: ${registration.name}`))
      }, 10000)

      // 将 resolve/reject 存入 map，待 REGISTER_TOOL_ACK 到达时处理
      this.pendingRegistrations.set(registration.name, { resolve, reject, timer })

      // 向服务端注册工具元数据
      this.send({
        type: 'REGISTER_TOOL',
        data: {
          name: registration.name,
          description: registration.description,
          parameters: JSON.stringify(registration.parameters)
        }
      })

      // 本地保存 handler，供 TOOL_CALL_REQ 到达时自动执行
      this.toolHandlers.set(registration.name, registration.handler)
    })
  }

  // ──────────── 私有方法 ────────────

  /**
   * 处理 TOOL_CALL_REQ：执行 handler 并回复 TOOL_ACK。
   *
   * 执行前后分别向外部 handler 合成 TOOL_CALL_START / TOOL_CALL_END 事件，
   * 供 UI 层展示工具调用状态。
   */
  private async handleToolCallReq(payload: ToolCallReqPayload, toolHandler: ToolHandler): Promise<void> {

    // 1) 解析参数并执行 handler
    let result: string
    try {
      const args = JSON.parse(payload.arguments)
      result = await toolHandler(args)
    } catch (e) {
      console.error(`[AiChatSession] 工具 ${payload.name} 执行失败:`, e)
      result = `工具执行失败: ${e}`
    }

    // 2) 发送 TOOL_ACK 将结果交回服务端
    this.send({
      type: 'TOOL_ACK',
      data: {
        id: payload.id,
        name: payload.name,
        arguments: JSON.parse(payload.arguments),
        result
      }
    })
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
