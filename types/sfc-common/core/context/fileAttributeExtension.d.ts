declare module 'sfc-common/core/context/fileAttributeExtension' {
  import type { Component } from 'vue'

  export interface FileAttributeSectionItem {
    title: string
    component: Component | string
    props?: Record<string, any>
    defaultExpanded?: boolean
  }

  export interface FileAttributeExtension {
    id: string
    resolve: (ctx: any) => FileAttributeSectionItem | null | undefined
  }

  export function registerFileAttributeSection(extension: FileAttributeExtension): void
}
