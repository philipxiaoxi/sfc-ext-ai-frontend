<template>
  <div class="ai-chat-dialog">
    <VBtn
      class="ai-fab"
      color="primary"
      elevation="8"
      icon="mdi-robot-outline"
      size="56"
      @click="drawerOpen = !drawerOpen"
    />

    <Teleport to="main">
      <v-navigation-drawer
        v-model="drawerOpen"
        location="right"
        :width="480"
      >
        <div class="d-flex justify-space-between pa-2">
          <span class="text-title-large">AI 助手</span>
          <VBtn
            icon="mdi-close"
            density="compact"
            variant="text"
            @click="drawerOpen = false"
          />
        </div>
        <div class="px-4 pb-2">
          <VSelect
            v-model="selectedModelId"
            :items="modelOptions"
            item-title="label"
            item-value="value"
            density="compact"
            variant="underlined"
            placeholder="选择模型"
            hide-details
          />
        </div>
        <VDivider />
        <div class="ai-messages pa-4 flex-grow-1 overflow-y-auto">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            :class="['d-flex ga-2 mb-3', msg.role === 'user' ? 'flex-row-reverse' : '']"
          >
            <div class="message-avatar flex-shrink-0">
              <VIcon
                :icon="msg.role === 'ai' ? 'mdi-robot' : 'mdi-account'"
                :color="msg.role === 'ai' ? 'primary' : 'grey'"
              />
            </div>
            <div
              :class="[
                'message-bubble px-3 py-2',
                msg.role === 'user'
                  ? 'bg-primary text-on-primary rounded-lg rounded-be-0'
                  : 'bg-surface-variant text-on-surface-variant rounded-lg rounded-bs-0 overflow-hidden'
              ]"
            >
              <MarkdownView
                v-if="msg.role === 'ai'"
                :content="msg.content"
                class="ai-markdown"
              />
              <template v-else>
                {{ msg.content }}
              </template>
            </div>
          </div>
        </div>
        <VDivider />
        <div class="pa-4">
          <div class="d-flex ga-2">
            <VTextField
              v-model="inputText"
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
          </div>
        </div>
      </v-navigation-drawer>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, Teleport } from 'vue'
import type { ChatMessage, ProviderWithModelsVo } from '../model'
import { MarkdownView } from 'sfc-common/components'
import { aiChatService, AiChatSession } from '../core/AiChatService'
import { QueryApi } from '../api'
import SfcUtils from 'sfc-common/utils/SfcUtils'

const drawerOpen = ref(false)
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

watch(drawerOpen, (open) => {
  const el = document.querySelector('main')
  if (el) {
    el.style.setProperty('padding-right', open ? '480px' : '')
  }
})

onUnmounted(() => {
  document.querySelector('main')?.style.removeProperty('padding-right')
})

let isStarted = false
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || selectedModelId.value == null) return

  inputText.value = ''

  messages.value.push({ role: 'user', content: text })

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

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AiChatDialog'
})
</script>

<style scoped>
.ai-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000;
  transition: transform 0.2s ease;
}

.ai-fab:hover {
  transform: scale(1.08);
}

.message-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-bubble {
  max-width: 75%;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
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
</style>
