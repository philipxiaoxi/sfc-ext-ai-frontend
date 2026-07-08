declare module 'sfc-common/utils/SfcUtils' {
  import type { Component, ComponentPublicInstance, App } from 'vue'

  export interface DyncComponentHandler<T = {}> {
    unmount(): void
    getComponentInst(): ComponentPublicInstance & T
    getApp(): App<Element>
    getRoot(): ComponentPublicInstance
  }

  export interface MountOption {
    wrapVApp?: boolean
    vappProps?: any
    tempDOMHandler?: (dom: HTMLElement) => void
    children?: any
    props?: any
    onMounted?: () => void
  }

  export function dyncmount<T = {}>(component: Component, mountOption?: MountOption): DyncComponentHandler<T>

  export function snackbar(message: any): void

  export function openComponentDialog(component: Component, options?: any): any

  const SfcUtils: {
    dyncmount: typeof dyncmount
    snackbar: typeof snackbar
    openComponentDialog: typeof openComponentDialog
    axios: any
    [key: string]: any
  }

  export default SfcUtils
  export { SfcUtils }
}
