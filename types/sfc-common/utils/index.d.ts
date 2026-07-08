declare module 'sfc-common/utils' {
  import DOMUtilsType from 'sfc-common/utils/DOMUtils'

  export const DOMUtils: typeof DOMUtilsType
  export class LoadingManager {
    beginLoading(): void
    closeLoading(): void
    getLoadingRef(): any
  }
  export * from 'sfc-common/utils/MethodInterceptor'
  export * from 'sfc-common/utils/StringFormatter'
  export * from 'sfc-common/utils/StringUtils'
  export * from 'sfc-common/utils/FormUtils'
  export * from 'sfc-common/utils/FileUtils'
  export * from 'sfc-common/utils/DateUtils'
}
