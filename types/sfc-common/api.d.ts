declare module 'sfc-common/api' {
  const API: {
    user: any
    sys: any
    file: any
    resource: any
    breakpoint: any
    task: any
    collection: any
    share: any
    wrap: any
    admin: any
    mountPoint: any
    desktop: any
    comment: any
    plugin: any
    asyncTask: any
    proxy: any
    oauth: any
    archive: any
    getDefaultPrefix(): string
  }

  export default API
}
