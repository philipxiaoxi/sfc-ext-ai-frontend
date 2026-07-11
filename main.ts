import SfcUtils from 'sfc-common/utils/SfcUtils/index.js'
import AiChatDialog from './components/AiChatDialog.vue'
import LlmProviderManager from './components/LlmProviderManager.vue'

window.bootContext.addProcessor({
  taskName: '注册AI助手',
  execute(app) {
    app.component(LlmProviderManager.name as string, LlmProviderManager)
  },
  onFinish() {
    SfcUtils.dyncmount(AiChatDialog, {
      tempDOMHandler(dom) {
        dom.style.width = '0'
        dom.style.height = '0'
        dom.style.overflow = 'visible'
      },
    })
  }
})
