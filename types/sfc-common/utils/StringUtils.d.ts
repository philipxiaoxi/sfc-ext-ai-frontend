declare module 'sfc-common/utils/StringUtils' {
  export interface RandomStrOption {
    withNumber: boolean
  }

  export namespace StringUtils {
    export function isEmail(email: string): boolean
    export function getRandomStr(len: number, opt?: RandomStrOption): string
    export function generateShareText(shareInfo: any): string
    export function generateShareLink(shareInfo: any): string
    export function encodeURLPath(input: string): string
    export function appendPath(...path: string[]): string
    export function resolveUrlRelativePath(basePath: string, pattern: string): string
    export function parseJSON(json?: string): any
    export function decodeURLPath(url: string): string
  }

  export { StringUtils }
}
