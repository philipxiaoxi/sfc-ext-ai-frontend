declare module 'sfc-common/model' {
  import { App } from 'vue'

  export type IdType = number | string

  export interface BootProcessor {
    execute?: (app: App<Element>, handler: BootContextHandler) => Promise<any> | void
    taskName: string
    onFinish?: (app: App<Element>, handler: BootContextHandler) => void
    [other: string]: any
  }

  export interface BootContextHandler {
    setBootTaskTitle(title: string): void
    logError(msg: string): void
    logWarning(msg: string): void
    logInfo(msg: string): void
    updateProgress(max: number, value: number): void
    setInterruptMsg(msg: string): void
  }

  export interface BootContext {
    addProcessor(executor: BootProcessor): BootContext
    start(app: App<Element>): Promise<any>
  }

  export type UserRole = 'admin' | 'normal' | 'public'

  export interface SessionUser {
    id: number
    name: string
    role: UserRole
    email?: string
    quota: number
  }

  export interface Session {
    token: string
    user: SessionUser
    setToken(token: string): void
    loadToken(): void
    setUserInfo(userObj: any): void
    logout(): Promise<any>
  }

  export interface SelectOption {
    title: string
    value: any
    action?: () => any
  }

  export interface AuditModel {
    id: IdType
    uid: IdType
    updateAt: string
    createAt: string
  }

  export interface ResourceRequest {
    path: string
    name: string
    mtime?: number
    ctime?: number
    targetId: IdType
    protocol: string
    isThumbnail?: boolean
    isCache?: boolean
    md5?: string
    [key: string]: any
    params?: { [key: string]: any }
  }

  export type ConfigNodeInputType = 'switch' | 'select' | 'multi-select' | 'radio' | 'checkbox' | 'text' | 'form' | 'template'
  export type RawType = number | string | boolean

  export interface ConfigNodeModel {
    name: string
    title: string
    value: any
    mask?: boolean
    defaultValue: RawType
    originValue: RawType
    hide?: boolean
    describe?: string
    readonly?: boolean
    disabled?: boolean
    inputType: ConfigNodeInputType
    options?: SelectOption[]
    nodes?: ConfigNodeModel[]
    icon?: string
    template?: string | any
    required?: boolean
    params?: { [key: string]: any }
    isRow?: boolean
    valueNameMapping?: { [key: string]: string }
  }

  export interface PluginConfigNodeInfo {
    name: string
    alias: string
    icon: string
    version: string
    groups: ConfigNodeModel[]
  }

  export interface PluginInfo {
    name: string
    alias: string
    icon: string
    loadType: 'MERGE'
    describe: string
    author: string
    email: string
    version: string
    apiVersion: string
    autoLoad: string[]
    status: 0 | 1 | 2
    isJar?: boolean
    url?: string
    upgradeVersion?: string
  }

  export interface PluginInfoVo extends PluginInfo {
    tempId: IdType
  }

  export interface NameValueType<T = any> {
    name: string
    value: T
  }

  export interface TimestampRecord<T> {
    timestamp: string
    data: T
  }

  export interface FileSystemStatus {
    area: 'public' | 'private'
    dirCount: string
    fileCount: string
    free: string
    path: string
    sysUsed: string
    total: string
    used: string
    otherAttributes?: ConfigNodeModel[]
  }

  export interface SystemOverview {
    fileSystemStatus: FileSystemStatus[]
    systemStatus: ConfigNodeModel[]
  }

  export interface CommonProgress {
    loaded: number
    total: number
    lastUpdateTime: number
    speed: number
  }

  export interface ArchiveEngine {
    name: string
    [key: string]: any
  }

  export interface SystemFeature {
    archiveEngineList: ArchiveEngine[]
    breakpointUrl: string
    enableEmailReg: boolean
    enableRegCode: boolean
    thumbType: string[]
    version: string
    darkTheme: boolean
    isUseCommonUpload: boolean
    [otherKey: string]: any
  }

  export interface FileInfo {
    [key: string]: any
  }

  export interface FileListContext {
    [key: string]: any
  }

  export interface ApiRequest<T = any> {
    url: string
    method?: string
    params?: any
    data?: any
    [key: string]: any
  }

  export interface JsonResult<T = any> {
    code: number
    msg: string
    data: T
  }
}
