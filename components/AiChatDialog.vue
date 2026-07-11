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
        class="chat-drawer"
      >
        <div class="d-flex flex-column h-100">
          <div
            class="d-flex align-center pa-3 ga-2 chat-header-collapse"
            @click="drawerOpen = false"
          >
            <div class="d-flex align-center ga-2">
              <VIcon icon="mdi-robot" color="primary" size="24" />
              <span class="text-subtitle-1 font-weight-bold">AI 助手</span>
            </div>
            <VSpacer />
            <VBtn
              icon="mdi-chevron-right"
              density="comfortable"
              variant="text"
              size="small"
              title="收起"
            />
          </div>
          <div class="ai-messages flex-grow-1 overflow-y-auto px-4 py-4 d-flex flex-column">
            <div
              v-if="messages.length === 0"
              class="flex-grow-1 d-flex flex-column align-center justify-center text-medium-emphasis"
            >
              <VIcon icon="mdi-robot-outline" size="48" class="mb-3" />
              <span class="text-body-2">有什么可以帮助你的吗？</span>
            </div>
            <div
              v-for="(msg, i) in messages"
              :key="i"
              :class="['d-flex ga-3 mb-4', msg.role === 'user' ? 'flex-row-reverse' : '']"
            >
              <div class="message-avatar flex-shrink-0">
                <VAvatar
                  :color="msg.role === 'ai' ? 'primary' : 'grey-lighten-1'"
                  size="32"
                  variant="tonal"
                >
                  <VIcon
                    :icon="msg.role === 'ai' ? 'mdi-robot' : 'mdi-account'"
                    size="18"
                  />
                </VAvatar>
              </div>
              <div
                :class="[
                  'message-bubble px-4 py-2',
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary rounded-lg rounded-br-0'
                    : 'bg-surface text-on-surface rounded-lg rounded-bl-0'
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
          <div class="pa-3">
            <div class="d-flex ga-2 align-end">
              <VTextField
                v-model="inputText"
                density="comfortable"
                hide-details
                placeholder="输入消息..."
                variant="outlined"
                class="flex-grow-1"
                @keydown.enter="onInputEnter"
              />
              <VMenu
                location="top end"
                offset="8"
                :close-on-content-click="false"
              >
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon="mdi-cog-outline"
                    size="40"
                    variant="flat"
                    color="default"
                  />
                </template>
                <VCard
                  min-width="280"
                  max-width="320"
                >
                  <VCardText class="pa-3">
                    <VSelect
                      v-model="selectedModelId"
                      :items="modelOptions"
                      item-title="label"
                      item-value="value"
                      label="选择模型"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </VCardText>
                </VCard>
              </VMenu>
              <VBtn
                :disabled="!inputText.trim() || selectedModelId == null"
                color="primary"
                size="40"
                variant="flat"
                @click="sendMessage"
              >
                <VIcon icon="mdi-arrow-up" />
              </VBtn>
            </div>
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

function onInputEnter(e: KeyboardEvent) {
  if (e.isComposing) return
  sendMessage()
}

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
.chat-drawer {
  top: 56px !important;
  height: calc(100% - 56px) !important;
}

.chat-header-collapse {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chat-header-collapse:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

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
  display: flex;
  align-items: flex-start;
}

.message-bubble {
  max-width: 75%;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.ai-messages {
  scroll-behavior: smooth;
}

.ai-markdown :deep(.markdown) {
  padding: 4px 0;
  font-size: 14px;
}

.ai-markdown :deep(.markdown > *) {
  margin: 4px 0;
}

.ai-markdown :deep(.markdown-code) {
  margin: 4px 0;
}
</style>
