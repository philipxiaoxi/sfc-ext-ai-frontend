import AiChatDialog from './components/AiChatDialog.vue'
import LlmProviderManager from './components/LlmProviderManager.vue'

window.bootContext.addProcessor({
  taskName: '注册AI助手',
  execute(app) {
    // 注册 LLM 提供商管理组件到全局，可在模板中通过 <LlmProviderManager> 使用
    app.component(LlmProviderManager.name as string, LlmProviderManager)
  },
  /** 使用项目标准的 dyncmount 动态挂载，自带 vuetify 上下文 */
  onFinish() {
    try {
      // 在 body 末尾独立挂载浮动按钮和对话框
      const container = document.createElement('div')
      container.id = 'ai-assistant-root'
      document.body.appendChild(container)

      // dyncmount 内部通过 buildApp 创建 Vue 实例，已注册 vuetify/router
      window.SfcUtils.dyncmount(AiChatDialog, {
        wrapVApp: false,
        tempDOMHandler(dom) {
          // 去掉默认的全屏 fixed 覆盖样式，改为正常流布局
          dom.style.position = 'static'
          dom.style.width = 'auto'
          dom.style.height = 'auto'
          // 从 body 移入自定义容器
          container.appendChild(dom)
        },
      })
    } catch (error) {
      console.error(error)
    }
  }
})
