import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getContext } from 'sfc-common'
import type { LlmModel, LlmProvider } from './model'

/**
 * SSE 流式聊天 API。
 * 后端以十进制 Unicode 码点形式逐字推送，前端用 String.fromCodePoint 还原，
 * 避免 \n 等字符被 SSE 协议的行分隔机制吞掉。
 * @param message 用户输入的消息
 * @param onMessage 每收到一个字符时的回调
 * @param onDone 流结束时的回调
 * @param onError 出错时的回调
 */
export function chatStream(
  message: string,
  onMessage: (char: string) => void,
  onDone: () => void,
  onError: (err: any) => void,
): AbortController {
  const controller = new AbortController()

  let finished = false
  const safeDone = () => {
    if (!finished) {
      finished = true
      onDone()
    }
  }
  const safeError = (err: any) => {
    if (!finished) {
      finished = true
      onError(err)
    }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getContext().session.value.token
  if (token && token.length > 0) {
    headers.Token = token
  }

  fetchEventSource('/api/ai-assistant/chat', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ message }),
    signal: controller.signal,

    async onopen(response) {
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/event-stream')) {
        const text = await response.text()
        let msg = '请求失败'
        try {
          const json = JSON.parse(text)
          msg = json.msg || msg
        } catch { /* 非 JSON 保留默认提示 */ }
        throw new Error(msg)
      }
    },

    onmessage(event) {
      if (event.data === '[DONE]') {
        safeDone()
        controller.abort()
        return
      }
      const cp = parseInt(event.data, 10)
      if (!isNaN(cp)) {
        onMessage(String.fromCodePoint(cp))
      }
    },

    onclose() {
      safeDone()
    },

    onerror(err) {
      if (err.name === 'AbortError') {
        return
      }
      safeError(err)
    },
  }).catch(() => {
    // fetchEventSource 的 error 已由 onerror 处理
  })

  return controller
}

// ────────────────────────── LLM 提供商 API ──────────────────────────

/** 提供商 API 前缀 */
const providerPrefix = '/ai/provider'

/** LLM 提供商相关 API */
export namespace ProviderApi {
  /**
   * 获取当前用户的 LLM 提供商列表
   */
  export function getList(): Promise<any> {
    return window.SfcUtils.request({
      url: `${providerPrefix}/list`,
      method: 'get'
    }).then(res => res.data)
  }

  /**
   * 根据 ID 获取提供商
   * @param id 提供商 ID
   */
  export function get(id: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${providerPrefix}/get`,
      method: 'get',
      params: { id }
    }).then(res => res.data)
  }

  /**
   * 新增或修改提供商
   * @param provider 提供商数据
   */
  export function save(provider: LlmProvider): Promise<any> {
    return window.SfcUtils.request({
      url: `${providerPrefix}/save`,
      method: 'post',
      data: provider,
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.data)
  }

  /**
   * 删除提供商
   * @param id 提供商 ID
   */
  export function remove(id: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${providerPrefix}/delete`,
      method: 'post',
      params: { id }
    }).then(res => res.data)
  }
}

// ────────────────────────── LLM 模型 API ──────────────────────────

/** 模型 API 前缀 */
const modelPrefix = '/ai/model'

/** LLM 模型相关 API */
export namespace ModelApi {
  /**
   * 获取模型列表，可按提供商 ID 过滤
   * @param providerId 可选，提供商 ID
   */
  export function getList(providerId?: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/list`,
      method: 'get',
      params: providerId != null ? { providerId } : {}
    }).then(res => res.data)
  }

  /**
   * 根据 ID 获取模型
   * @param id 模型 ID
   */
  export function get(id: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/get`,
      method: 'get',
      params: { id }
    }).then(res => res.data)
  }

  /**
   * 新增或修改模型
   * @param model 模型数据
   */
  export function save(model: LlmModel): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/save`,
      method: 'post',
      data: model,
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.data)
  }

  /**
   * 删除模型
   * @param id 模型 ID
   */
  export function remove(id: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/delete`,
      method: 'post',
      params: { id }
    }).then(res => res.data)
  }

  /**
   * 根据提供商 ID 删除所有关联模型
   * @param providerId 提供商 ID
   */
  export function removeByProviderId(providerId: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/deleteByProviderId`,
      method: 'post',
      params: { providerId }
    }).then(res => res.data)
  }
}
