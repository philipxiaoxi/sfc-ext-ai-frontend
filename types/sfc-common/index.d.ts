declare module 'sfc-common' {
  import { ToRefs } from 'vue'
  import { AppContext } from 'sfc-common/core/context/type'

  export function getContext(): ToRefs<AppContext>

  import { AppContext } from 'sfc-common/core/context/type'

  export * from 'sfc-common/core/context/type'
  export * from 'sfc-common/core/context/fileAttributeExtension'
  export * from 'sfc-common/model'
}
