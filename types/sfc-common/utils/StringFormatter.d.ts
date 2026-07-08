declare module 'sfc-common/utils/StringFormatter' {
  export namespace StringFormatter {
    export function toSize(size: any, B?: boolean): string
    export function toDate(inputDate: number | string | Date, toSecond?: boolean): string
    export function formatDate(inputDate: number | string | Date, format?: string): string
    export function fillLength(str: string | number, len: number, position?: 'left' | 'right', char?: string): string
  }

  export { StringFormatter }
}
