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
          <div class="d-flex align-center pa-3 ga-2">
            <!-- 标题区域，点击可收起侧边栏 -->
            <div
              class="d-flex align-center ga-2 chat-header-collapse"
              @click="drawerOpen = false"
            >
              <VIcon icon="mdi-robot" color="primary" size="24" />
              <span class="text-subtitle-1 font-weight-bold">{{ conversationTitle }}</span>
            </div>
            <VSpacer />
            <!-- Chat 模式下的操作按钮 -->
            <template v-if="viewMode === 'chat'">
              <VBtn
                icon="mdi-plus"
                density="comfortable"
                variant="text"
                size="small"
                title="开启新会话"
                @click.stop="startNewSession"
              />
              <VBtn
                icon="mdi-format-list-bulleted"
                density="comfortable"
                variant="text"
                size="small"
                title="查看历史会话"
                @click.stop="openHistoryPanel"
              />
            </template>
            <VBtn
              icon="mdi-chevron-right"
              density="comfortable"
              variant="text"
              size="small"
              title="收起"
              @click="drawerOpen = false"
            />
          </div>
          <div class="ai-messages flex-grow-1 overflow-y-auto px-4 py-4 d-flex flex-column">
            <div
              v-if="messages.length === 0"
              class="flex-grow-1 d-flex flex-column text-medium-emphasis"
            >
              <!-- 列表模式：顶部显示最近对话列表 -->
              <template v-if="viewMode === 'list'">
                <ConversationList
                  :conversations="conversations"
                  :loading="conversationsLoading"
                  @select="enterConversation"
                />
              </template>
              <!-- 空状态占位 -->
              <div class="flex-grow-1 d-flex flex-column align-center justify-center">
                <VIcon icon="mdi-robot-outline" size="48" class="mb-3" />
                <span class="text-body-2">有什么可以帮助你的吗？</span>
              </div>
            </div>

            <!-- 对话消息列表 -->
            <div
              v-for="(msg, i) in messages"
              :key="i"
              :class="['d-flex ga-3 mb-4', msg.role === 'user' ? 'flex-row-reverse' : '']"
            >
              <!-- 显示 AI助手 或 用户 的聊天头像 -->
              <div v-if="msg.role !== 'tool' && msg.role !== 'done'" class="message-avatar flex-shrink-0">
                <UserAvatar
                  v-if="msg.role == 'user'"
                  :size="32"
                  :uid="uid"
                />
                <VAvatar
                  v-else
                  size="32"
                  variant="tonal"
                >
                  <VIcon
                    color="primary"
                    icon="mdi-robot"
                    size="18"
                  />
                </VAvatar>
              </div>
              
              <!-- 工具调用消息 -->
              <div v-if="msg.role === 'tool'" class="ml-12">
                <div class="d-flex align-center tip toggle-args" @click="toggleArgs(i)">
                  <VIcon
                    :icon="expandedArgs[i] ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                    size="14"
                    class="mr-1"
                  />
                  <VIcon icon="mdi-wrench-outline" class="mr-1" size="14" />
                  <span class="mr-1">{{ msg.name }}</span>
                  <VIcon
                    v-if="msg.status === 'pending'"
                    icon="mdi-loading mdi-spin"
                    color="primary"
                    class="mr-2"
                    size="14"
                  />
                  <span v-if="msg.result !== undefined" class="ml-1">✓</span>
                </div>
                <div v-show="expandedArgs[i]" class="mt-1">
                  <pre class="tool-args-pre tip pa-2 ma-0">IN: {{ msg.arguments }} <br>OUT: {{ msg.result }}</pre>
                </div>
              </div>

              <!-- DONE 信息 -->
              <div v-else-if="msg.role === 'done'" class="d-flex justify-center ml-12">
                <span class="tip" style="font-size: 12px;">{{ msg.modelId }} · {{ formatElapsedTime(msg.time) }}</span>
              </div>

              <!-- AI助手 或 用户对话内容消息 -->
              <div
                v-if="msg.role !== 'tool' && msg.role !== 'done'"
                :class="[
                  'message-bubble px-4 py-2',
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary rounded-lg rounded-br-0'
                    : 'bg-surface text-on-surface rounded-lg rounded-bl-0'
                ]"
              >
                <template v-if="msg.role === 'ai'">
                  <!-- 思维链 -->
                  <div
                    v-if="msg.reasoningContent !== undefined"
                  >
                    <div
                      class="d-flex align-center ga-1 thinking-toggle thinking-bubble"
                      @click="toggleThinking(i)"
                    >
                      <VIcon
                        :icon="expandedThinking[i] ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                        size="16"
                      />
                      <div class="text-caption font-weight-medium tip">
                        Thinking
                      </div>
                    </div>
                    <div v-show="expandedThinking[i]">
                      <div class="thinking-bubble px-1 py-1 text-on-surface">
                        <MarkdownView :content="msg.reasoningContent" class="thinking-markdown" />
                      </div>
                      
                    </div>
                  </div>
                  <MarkdownView
                    v-if="msg.content"
                    :content="msg.content"
                    class="ai-markdown"
                  />
                </template>
                <template v-else-if="msg.role == 'user'">
                  {{ msg.content }}
                </template>
              </div>
            </div>

            <!-- 历史会话面板浮层（chat 模式下覆盖显示） -->
            <div
              v-if="viewMode === 'chat' && showHistoryPanel"
              class="history-panel d-flex flex-column"
            >
              <div class="d-flex align-center pa-3 ga-2 history-panel-header">
                <VBtn
                  variant="text"
                  size="small"
                  @click="closeHistoryPanel"
                >
                  <VIcon icon="mdi-arrow-left" class="mr-1" size="18" />
                  返回当前会话
                </VBtn>
                <VSpacer />
                <span class="text-subtitle-2 font-weight-medium">历史会话</span>
              </div>
              <div class="flex-grow-1 overflow-y-auto px-2 pb-2">
                <ConversationList
                  :conversations="conversations"
                  :loading="conversationsLoading"
                  @select="enterConversation"
                />
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
import { ref, computed, onMounted, onUnmounted, watch, Teleport, reactive } from 'vue'
import type { ChatMessage, ToolMessage, ProviderWithModelsVo, AiConversation, ConversationHistoryVo } from '../model'
import { MarkdownView, UserAvatar } from 'sfc-common/components'
import ConversationList from './ConversationList.vue'
import { aiChatService, AiChatSession } from '../core/AiChatService'
import { askUserTool, openLinkForUser } from '../core/CommonTools'
import { QueryApi, ConversationApi } from '../api'
import SfcUtils from 'sfc-common/utils/SfcUtils'

const drawerOpen = ref(false)
const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const providersWithModels = ref<ProviderWithModelsVo[]>([])
const selectedModelId = ref<number | null>(null)
const conversationTitle = ref('AI 助手')
const expandedThinking = ref(reactive({} as Record<number, boolean>))
const expandedArgs = ref(reactive({} as Record<number, boolean>))

/** 当前视图模式：list（对话列表） | chat（聊天界面） */
const viewMode = ref<'list' | 'chat'>('list')
/** chat 模式下是否打开历史会话浮层面板 */
const showHistoryPanel = ref(false)
/** 当前活跃的对话 ID（null 表示无活跃对话） */
const activeConversationId = ref<string | null>(null)
/** 对话列表数据 */
const conversations = ref<AiConversation[]>([])
/** 对话列表是否正在加载 */
const conversationsLoading = ref(false)

function toggleThinking(index: number) {
  expandedThinking.value[index] = !expandedThinking.value[index]
}

function toggleArgs(index: number) {
  expandedArgs.value[index] = !expandedArgs.value[index]
}

/**
 * 格式化调用耗时（毫秒）为可读字符串。
 *
 * - `< 60s` → `14.5s`（保留一位小数）
 * - `>= 60s` 且 `< 1h` → `32m12s`（分钟+整数秒）
 * - `>= 1h` → `1h6m`（小时+分钟）
 */
function formatElapsedTime(ms: number): string {
  const totalSec = ms / 1000
  if (totalSec < 60) {
    return `${parseFloat(totalSec.toFixed(1))}s`
  }
  const hours = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = Math.floor(totalSec % 60)
  if (hours > 0) {
    return `${hours}h${mins}m`
  }
  return `${mins}m${secs}s`
}

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

const uid = computed(() => getContext().session.value.user.id)

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
  // 同时加载最近的对话列表
  loadConversations()
}

/**
 * 从后端加载当前用户的对话列表。
 */
async function loadConversations() {
  conversationsLoading.value = true
  try {
    const res = await SfcUtils.request(ConversationApi.getList())
    conversations.value = (res.data as any).data || []
  } catch (e) {
    console.error('加载对话列表失败', e)
  } finally {
    conversationsLoading.value = false
  }
}

/**
 * 断开当前 WebSocket 连接并重置会话状态。
 */
function disconnectSession() {
  if (chatSession) {
    chatSession.close()
    chatSession = null
  }
  sessionReadyResolve = null
}

/**
 * 进入指定对话：断开旧 WS → 加载历史消息 → 切换到 chat 模式。
 * WS 连接将在用户发送消息时按需建立。
 */
async function enterConversation(conv: AiConversation) {
  // 如果已经在当前对话中，仅关闭历史面板
  if (conv.conversationId === activeConversationId.value) {
    showHistoryPanel.value = false
    return
  }

  // 断开当前 WS 连接
  disconnectSession()

  // 清空消息并设置当前对话 ID
  messages.value = []
  activeConversationId.value = conv.conversationId
  conversationTitle.value = conv.title || 'AI 助手'

  // 加载历史消息
  try {
    const res = await SfcUtils.request(ConversationApi.getMessages(conv.conversationId))
    const data: ConversationHistoryVo = (res.data as any).data
    if (data?.messages) {
      for (const histMsg of data.messages) {
        if (histMsg.role === 'user' || histMsg.role === 'ai') {
          messages.value.push({
            role: histMsg.role,
            content: histMsg.content || '',
            ...(histMsg.reasoningContent ? { reasoningContent: histMsg.reasoningContent } : {})
          })
        } else if (histMsg.role === 'tool') {
          messages.value.push({
            role: 'tool',
            id: histMsg.id!,
            name: histMsg.name!,
            arguments: histMsg.arguments!,
            result: histMsg.result,
            status: histMsg.status === 'pending' ? 'pending' : 'done'
          })
        }
      }
    }
  } catch (e) {
    console.error('加载历史消息失败', e)
    SfcUtils.snackbar('加载历史消息失败')
  }

  // 切换到 chat 模式并关闭历史面板
  viewMode.value = 'chat'
  showHistoryPanel.value = false
}

/**
 * 开启新会话：断开 WS → 清空消息 → 重置状态 → 切换到 chat 模式。
 */
function startNewSession() {
  disconnectSession()
  messages.value = []
  activeConversationId.value = null
  chatSessionId = ''
  conversationTitle.value = 'AI 助手'
  viewMode.value = 'chat'
  showHistoryPanel.value = false
}

/**
 * 打开历史会话浮层面板（不断开当前 WS）。
 */
function openHistoryPanel() {
  showHistoryPanel.value = true
  if (conversations.value.length === 0) {
    loadConversations()
  }
}

/**
 * 关闭历史会话浮层面板，返回当前对话。
 */
function closeHistoryPanel() {
  showHistoryPanel.value = false
}

let chatSession: AiChatSession | null = null
let chatSessionId: string
let sessionReadyResolve: (() => void) | null = null

async function ensureSession(sessionId?: string) {
  if (chatSession) {
    return chatSession
  }
  chatSession = await aiChatService.connect()

  // 创建一个 Promise，工具全部注册完成后 resolve
  const sessionReady = new Promise<void>(resolve => {
    sessionReadyResolve = resolve
  })

  chatSession.onMessage(async resp => {
    if (resp.type == 'TEXT') {
      // 思考内容 或 正文响应
      const aiMsg = ensureAiMsg()
      const { content, reasoningContent } = resp.data
      if (reasoningContent != null) {
        if (!aiMsg.reasoningContent) {
          aiMsg.reasoningContent = ''
        }
        aiMsg.reasoningContent += reasoningContent
      }
      if (content != null) {
        aiMsg.content += content
      }
    } else if (resp.type == 'TOOL_CALL_START') {
      // 通知开始调用工具（内建工具 或 动态注册工具均由服务层合成此事件）
      const payload = resp.data
      messages.value.push({ role: 'tool', id: payload.id, name: payload.name, arguments: payload.arguments, status: 'pending' })
    } else if (resp.type == 'TOOL_CALL_END') {
      // 通知工具调用完成
      const payload = resp.data
      const idx = messages.value.findIndex(m => m.role === 'tool' && m.id === payload.id)
      if (idx >= 0) {
        const msg = messages.value[idx] as ToolMessage
        msg.result = payload.result
        msg.status = 'done'
      }
    } else if (resp.type == 'ERROR') {
      // 出错
      SfcUtils.snackbar(resp.data.message)
    } else if (resp.type == 'DONE') {
      // LLM 完成响应
      const { modelId, time } = resp.data
      if (modelId != null && time != null) {
        messages.value.push({ role: 'done', modelId, time })
      }
    } else if (resp.type == 'SESSION_ACK') {
      // 会话建立确认
      chatSessionId = resp.data.sessionId
      // 会话建立后注册通用工具，让 LLM 可通过前端工具与用户交互
      await chatSession?.registerTool(askUserTool)
      await chatSession?.registerTool(openLinkForUser)
      // 所有工具注册完成，通知 ensureSession 继续
      sessionReadyResolve?.()
    } else if (resp.type == 'TITLE_UPDATE') {
      // 收到标题更新消息，匹配当前会话则更新显示的标题
      if (resp.data.conversationId === chatSessionId) {
        conversationTitle.value = resp.data.title
      }
    }
  })
  chatSession.onClose(() => {
    SfcUtils.alert('AI 聊天连接已断开')
    chatSession = null
  })

  // 发送 START_SESSION 开启会话，若提供了 sessionId 则恢复已有会话
  chatSession.start(sessionId)

  // 等待工具注册完成后再返回，确保后续 CHAT 消息发送时工具已就绪
  await sessionReady
  return chatSession
}

function ensureAiMsg() {
  const lastMsg = messages.value[messages.value.length - 1]
  if (lastMsg && lastMsg.role === 'ai') {
    return lastMsg
  }
  // 最后一条是用户消息或没有消息，创建一条新的空 AI 消息用于流式追加
  const aiMsg: ChatMessage = { role: 'ai', content: '' }
  messages.value.push(aiMsg)
  // 新消息默认展开 Thinking
  if (!expandedThinking.value) {
    expandedThinking.value = reactive({})
  }
  expandedThinking.value[messages.value.length - 1] = true
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

function onInputEnter(e: KeyboardEvent) {
  if (e.isComposing) return
  sendMessage()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || selectedModelId.value == null) return

  // 如果在列表模式，自动开启新会话
  if (viewMode.value === 'list') {
    startNewSession()
  }
  // 如果历史面板打开，关闭它
  if (showHistoryPanel.value) {
    closeHistoryPanel()
  }

  inputText.value = ''

  messages.value.push({ role: 'user', content: text })

  // 传入当前对话 ID（如有），让 WS 恢复已有会话
  const s = await ensureSession(activeConversationId.value ?? undefined)
  s.send({
    type: 'CHAT',
    data: {
      content: text,
      modelId: selectedModelId.value!
    }
  })
  // 产生一条空AI回复以便在对话框中显示出来，让用户认为AI在等待
  ensureAiMsg()
}
</script>

<script lang="ts">
import { defineComponent } from 'vue'
import { getContext } from 'sfc-common'

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

.message-bubble + .message-bubble {
  margin-bottom: 12px;
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

.thinking-bubble {
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgba(var(--v-theme-secondary), 0.15);
  border-left: 3px solid rgba(var(--v-theme-primary), 0.2);
}

.thinking-toggle {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.thinking-toggle:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.thinking-markdown :deep(.markdown) {
  font-size: 13px;
  max-height: 120px;
  overflow: auto;
}

.thinking-markdown :deep(.markdown > *) {
  margin: 4px 0;
}

.thinking-markdown :deep(.markdown-code) {
  margin: 4px 0;
}

.toggle-args {
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.toggle-args:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.args-preview {
  max-width: 200px;
  display: inline-block;
  vertical-align: bottom;
}

.tool-args-pre {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow: auto;
  font-size: 10px;
}

/* ────────── 历史会话面板浮层 ────────── */

.history-panel {
  position: absolute;
  inset: 0;
  z-index: 10;
  background-color: rgb(var(--v-theme-surface));
  border-radius: inherit;
}

.history-panel-header {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
