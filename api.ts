import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getContext } from 'sfc-common'

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
