declare module 'sfc-common/utils/MethodInterceptor' {
  export type ObjectKey<T> = Exclude<keyof T, number | symbol>

  export interface InterceptorHandler<T extends Object> {
    (targetInvoker: Function, args: any[], name: ObjectKey<T>): any
  }

  export type InvalidStrategy = 'undefined' | 'error' | 'reject' | 'resolve'

  export interface ThrottleOptions {
    delay?: number
    afterExecute?: boolean
    mather?: (name: string, args: any[]) => boolean
    invalidStrategy?: InvalidStrategy
    alawayDelay?: boolean
  }

  export namespace MethodInterceptor {
    export function wrapFun<T extends Function>(target: T): { invoke: T }
    export function cacheReturnValue<T extends (...args: any[]) => any>(func: T): T
    export function createProxy<T extends Object>(target: T, handler: InterceptorHandler<T>): T
    export function createAutoLoadingProxy<T extends Object>(target: T, loading: any): T
    export function createAutoCatch<T extends Object>(target: T, throwError?: boolean): T
    export function createThrottleProxyFunc<R, T extends (...args: any[]) => R>(targetFunc: T, opt?: ThrottleOptions): T
    export function createThrottleProxy<T extends Object>(target: T, opt?: ThrottleOptions): T
    export function createAsyncActionProxy<T extends Object>(target: T, throwErr: boolean, manager: any): T
  }

  export = MethodInterceptor
}
