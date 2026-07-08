import { BootContext, BootProcessor } from 'sfc-common/model'
import { ToRefs } from 'vue'
import { AppContext } from 'sfc-common/core/context/type'
import SfcUtils from 'sfc-common/utils/SfcUtils'
import API from 'sfc-common/api'
import * as components from 'sfc-common/components'
import * as SfcCommon from 'sfc-common'
import { getContext } from 'sfc-common/core/context'
import { FileAttributeExtension } from 'sfc-common/core/context/fileAttributeExtension'
import * as FormUtils from 'sfc-common/utils/FormUtils'
import DOMUtils from 'sfc-common/utils/DOMUtils'
import * as MethodInterceptor from 'sfc-common/utils/MethodInterceptor'
import { StringFormatter } from 'sfc-common/utils/StringFormatter'
import { StringUtils } from 'sfc-common/utils/StringUtils'

declare global {
  interface Window {
    context: ToRefs<AppContext>
    getContext: typeof getContext,
    Vue: any,
    SfcUtils: typeof SfcUtils,
    API: typeof API,
    app: any,
    bootContext: BootContext,
    FormUtils: typeof FormUtils,
    components: typeof components,
    Components: typeof components,
    DOMUtils: typeof DOMUtils,
    MethodInterceptor: typeof MethodInterceptor,
    StringFormatter: typeof StringFormatter,
    StringUtils: typeof StringUtils,
    SfcCommon: typeof SfcCommon,
    echarts: any,
    monaco: any,
    qs: any,
    DPlayer: any,
    registerFileAttributeSection: (extension: FileAttributeExtension) => void
  }
}
