declare module 'sfc-common/core/context/type' {
  import { Session } from 'sfc-common/model'
  import { SystemFeature } from 'sfc-common/model'
  import { EventBus } from 'sfc-common/core/context/index'
  import { FileAttributeExtension } from 'sfc-common/core/context/fileAttributeExtension'

  export interface RouteInfo {
    curr?: any
    prev?: any
    router?: any
  }

  export interface VisiableWindows {
    uploadList: boolean
    [otherKey: string]: boolean
  }

  export interface FileOpenHandler {
    title: string | (() => string)
    icon: string
    matcher: (ctx: any, files: any) => boolean
    sort: number
    id: string
    action: (ctx: any, files: any) => Promise<any> | void
    isDefault?: boolean
  }

  export type FileClipBoardType = 'cut' | 'copy'

  export interface FileClipBoard {
    path: string
    files: any[]
    type: FileClipBoardType
    otherAttr?: any
  }

  export interface BgOption {
    enabled?: boolean
    url?: string
    operacity?: number
    size?: 'auto' | 'contain' | 'cover'
    enabledCardEffect?: boolean
    globalGassValue?: number
    cardOpacity?: number
    cardGassValue?: number
    enabledDrawerEffect?: boolean
    drawerGassValue?: number
    drawerOpacity?: number
  }

  export interface AppContextMenu {
    mainMenu: any
    fileListMenu: any[]
    fileBrowserBtn: any[]
    boxMenu: any[]
  }

  export interface AppContext {
    appTitle: string
    theme: string
    originTheme: string
    menu: AppContextMenu
    defaultAvatar: string
    session: Session
    eventBus: EventBus
    feature: SystemFeature
    routeInfo: RouteInfo
    visiableWindows: VisiableWindows
    fileOpenHandler: FileOpenHandler[]
    fileClipBoard: FileClipBoard
    bg: { main?: BgOption }
    fileAttributeSections: FileAttributeExtension[]
    [otherKey: string]: any
  }
}
