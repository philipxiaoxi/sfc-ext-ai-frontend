import type { Ref } from 'vue'

/**
 * `useAutoScroll` 的配置选项。
 */
export interface UseAutoScrollOptions {
  /**
   * 底部阈值（像素），当容器滚动位置距离底部小于此值时视为"在底部附近"。默认 360。
   */
  threshold?: number
  /**
   * 平滑滚动的节流间隔（毫秒）。默认 200。
   */
  throttleMs?: number
}

/**
 * 封装消息列表/滚动容器的自动滚动逻辑。
 *
 * @param containerRef  可滚动容器的模板引用
 * @param options       配置选项
 * @returns 提供 `scrollToBottom`、`isNearBottom`、`autoScrollIfNearBottom` 三个方法
 *
 * @example
 * ```ts
 * const container = ref<HTMLElement | null>(null)
 * const { scrollToBottom, isNearBottom, autoScrollIfNearBottom } = useAutoScroll(container)
 * ```
 */
export function useAutoScroll(
  containerRef: Ref<HTMLElement | null>,
  options?: UseAutoScrollOptions
) {
  const threshold = options?.threshold ?? 360
  const throttleMs = options?.throttleMs ?? 200
  let lastAutoScrollTime = 0

  /**
   * 将容器滚动到底部（无动画）。
   */
  function scrollToBottom() {
    const el = containerRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }

  /**
   * 判断用户是否在容器底部附近（容许 `threshold` 像素偏差）。
   */
  function isNearBottom(): boolean {
    const el = containerRef.value
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
  }

  /**
   * 若用户在底部附近，则平滑滚动到底部（受 `throttleMs` 节流控制）。
   */
  function autoScrollIfNearBottom() {
    const now = Date.now()
    if (now - lastAutoScrollTime < throttleMs) return
    if (isNearBottom()) {
      const el = containerRef.value
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      }
    }
    lastAutoScrollTime = now
  }

  return {
    scrollToBottom,
    isNearBottom,
    autoScrollIfNearBottom
  }
}
