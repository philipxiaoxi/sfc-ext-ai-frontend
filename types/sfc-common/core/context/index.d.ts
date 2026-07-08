declare module 'sfc-common/core/context' {
  import { ToRefs } from 'vue'
  import { AppContext } from 'sfc-common/core/context/type'

  export function getContext(): ToRefs<AppContext>

  export interface EventBus {
    on(event: string, callback: (...args: any[]) => void): void
    off(event: string, callback: (...args: any[]) => void): void
    emit(event: string, ...args: any[]): void
    [key: string]: any
  }

  export class DefaultEventBus implements EventBus {
    on(event: string, callback: (...args: any[]) => void): void
    off(event: string, callback: (...args: any[]) => void): void
    emit(event: string, ...args: any[]): void
  }

  export type { EventBus }

  export * from 'sfc-common/core/context/type'
  export * from 'sfc-common/core/context/fileAttributeExtension'
}
