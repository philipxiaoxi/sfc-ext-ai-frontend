<template>
  <div class="ai-assistant-wrapper">
    <!-- 浮动按钮 -->
    <VBtn
      class="ai-fab"
      color="primary"
      elevation="8"
      icon="mdi-robot"
      size="56"
      @click="open = !open"
    />

    <!-- 对话框面板 -->
    <VCard v-show="open" class="ai-dialog">
      <VCardTitle class="ai-dialog-header d-flex align-center pa-4">
        <VIcon start icon="mdi-robot" />
        <span class="text-h6">AI 助手</span>
        <VSpacer />
        <VBtn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="open = false"
        />
      </VCardTitle>

      <!-- 模型选择 -->
      <div class="px-4 pb-2">
        <VSelect
          v-model="selectedModelId"
          :items="modelOptions"
          item-title="label"
          item-value="value"
          density="compact"
          variant="plain"
          placeholder="选择模型"
          hide-details
        />
      </div>

      <VDivider />

      <!-- 消息列表 -->
      <VCardText class="ai-messages pa-4">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="['message-row', msg.role === 'user' ? 'message-user' : 'message-ai']"
        >
          <div v-if="msg.role === 'ai'" class="message-avatar">
            <VIcon color="primary" icon="mdi-robot" />
          </div>
          <div v-else class="message-avatar">
            <VIcon color="grey" icon="mdi-account" />
          </div>
          <div
            :class="['message-bubble', msg.role === 'user' ? 'bubble-user' : 'bubble-ai']"
          >
            <!-- AI 消息复用宿主成熟的 MarkdownView 组件渲染 markdown（含代码高亮、复制按钮等） -->
            <MarkdownView
              v-if="msg.role === 'ai'"
              :content="msg.content"
              class="ai-markdown"
            />
            <!-- 用户消息按纯文本展示，Vue 模板插值自带转义，避免 XSS -->
            <template v-else>
              {{ msg.content }}
            </template>
          </div>
        </div>
      </VCardText>

      <VDivider />

      <!-- 输入区域 -->
      <VCardActions class="ai-input-area pa-4">
        <VTextField
          v-model="inputText"
          class="ai-input"
          density="compact"
          hide-details
          placeholder="输入消息..."
          variant="outlined"
          @keydown.enter="sendMessage"
        />
        <VBtn
          :disabled="!inputText.trim() || selectedModelId == null"
          color="primary"
          icon="mdi-send"
          size="40"
          variant="flat"
          @click="sendMessage"
        />
      </VCardActions>
    </VCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ChatMessage, ProviderWithModelsVo } from '../model'
import { MarkdownView } from 'sfc-common/components'
import { aiChatService, AiChatSession } from '../core/AiChatService'
import { QueryApi } from '../api'
import SfcUtils from 'sfc-common/utils/SfcUtils'


const open = ref(false)
const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const providersWithModels = ref<ProviderWithModelsVo[]>([])
const selectedModelId = ref<number | null>(null)

const modelOptions = computed(() => {
  const options: { label: string; value: number }[] = []
  for (const pm of providersWithModels.value) {
    for (const model of pm.models) {
      options.push({
        label: `${pm.provider.name} / ${model.modelId}`,
        value: model.id!
      })
    }
  }
  return options
})

onMounted(() => {
  loadModels()
})

async function loadModels() {
  try {
    const data = (await SfcUtils.request(QueryApi.getProvidersWithModels())).data.data
    providersWithModels.value = data
    if (data.length > 0 && data[0].models.length > 0) {
      selectedModelId.value = data[0].models[0].id!
    }
  } catch (e) {
    console.error('加载模型列表失败', e)
  }
}

let chatSession: AiChatSession | null = null
let chatSessionId: string
async function ensureSession() {
  if (chatSession) {
    return chatSession
  }
  chatSession = await aiChatService.connect()
  chatSession.onMessage(resp => {
    const aiMsg = ensureAiMsg()
    if (resp.type == 'TEXT') {
      aiMsg.content += resp.data.content
    } else if (resp.type == 'ERROR') {
      SfcUtils.snackbar(resp.data.message)
    } else if (resp.type == 'SESSION_ACK') {
      chatSessionId = resp.data.sessionId
    }
  })
  chatSession.onClose(() => {
    SfcUtils.alert('AI 聊天连接已断开')
    chatSession = null
    isStarted = false
  })
  return chatSession
}

function ensureAiMsg() {
  let aiMsg = messages.value.findLast(e => e.role == 'ai')
  if (aiMsg) {
    return aiMsg
  }
  aiMsg = { role: 'ai', content: '' }
  messages.value.push(aiMsg)
  return aiMsg
}

/** 发送消息并开始 WebSocket 流式接收 */
let isStarted = false
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || selectedModelId.value == null) return

  inputText.value = ''

  // 添加用户消息
  messages.value.push({ role: 'user', content: text })

  // 添加空的 AI 消息占位
  messages.value.push({ role: 'ai', content: '' })

  const s = await ensureSession()
  if (!isStarted) {
    s.start(chatSessionId)
    isStarted = true
  }
  s.send({
    type: 'CHAT',
    data: {
      content: text,
      modelId: selectedModelId.value!
    }
  })
}
</script>

<style scoped>
.ai-assistant-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.ai-fab {
  transition: transform 0.2s ease;
  z-index: 10000;
}

.ai-fab:hover {
  transform: scale(1.08);
}

.ai-dialog {
  /* 没有 VApp 包裹时手动注入 light 主题 CSS 变量 */
  --v-theme-surface: 255, 255, 255;
  --v-theme-on-surface: 0, 0, 0;
  --v-theme-surface-variant: 247, 248, 249;
  --v-theme-on-surface-variant: 66, 66, 66;
  --v-theme-primary: 24, 103, 192;
  --v-theme-on-primary: 255, 255, 255;
  --v-theme-background: 255, 255, 255;
  --v-theme-on-background: 0, 0, 0;
  --v-theme-outline: 115, 115, 115;

  position: absolute;
  bottom: 68px;
  right: 0;
  width: 400px;
  max-height: min(600px, 70vh);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.ai-dialog-header {
  flex-shrink: 0;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.bubble-user {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-bottom-right-radius: 4px;
}

.bubble-ai {
  background-color: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  border-bottom-left-radius: 4px;
  padding: 0;
  overflow: hidden;
}

.ai-markdown :deep(.markdown) {
  padding: 8px 12px;
  font-size: 14px;
}

.ai-markdown :deep(.markdown > *) {
  margin: 4px 0;
}

.ai-markdown :deep(.markdown-code) {
  margin: 4px 0;
}

.ai-input-area {
  flex-shrink: 0;
  gap: 8px;
}

.ai-input {
  flex: 1;
}
</style>
