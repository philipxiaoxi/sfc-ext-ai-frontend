<template>
  <VList
    v-if="conversations.length > 0"
    class="conversation-list"
    density="compact"
  >
    <VListItem
      v-for="conv in displayedConversations"
      :key="conv.conversationId"
      :title="conv.title || '新对话'"
      class="conversation-list-item"
      @click="$emit('select', conv)"
    >
      <template #prepend>
        <VIcon icon="mdi-chat-outline" size="20" />
      </template>
      <template #subtitle>
        <span class="text-caption text-medium-emphasis">
          {{ formatTime(conv.updateAt) }}
        </span>
      </template>
    </VListItem>

    <!-- 展开/收起按钮 -->
    <VListItem
      v-if="conversations.length > 3"
      class="conversation-toggle-item"
      @click="showAll = !showAll"
    >
      <template #title>
        <span class="text-caption font-weight-medium">
          <VIcon
            :icon="showAll ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="16"
            class="mr-1"
          />
          {{ showAll ? '收起' : '展开全部' }}
        </span>
      </template>
    </VListItem>

    <!-- 加载中状态 -->
    <VListItem
      v-if="loading"
      class="justify-center"
    >
      <template #title>
        <div class="d-flex align-center ga-2 text-medium-emphasis">
          <VIcon icon="mdi-loading mdi-spin" size="16" />
          <span class="text-caption">加载中...</span>
        </div>
      </template>
    </VListItem>
  </VList>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AiConversation } from '../model'

const props = withDefaults(defineProps<{
  /** 对话列表数据 */
  conversations: AiConversation[]
  /** 是否正在加载 */
  loading?: boolean
}>(), {
  loading: false
})

const emit = defineEmits<{
  /** 用户选中某条对话 */
  select: [conv: AiConversation]
}>()

const showAll = ref(false)

/** 根据展开状态派发展示的对话列表（默认仅显示前 3 条） */
const displayedConversations = computed(() =>
  showAll.value ? props.conversations : props.conversations.slice(0, 3)
)

/**
 * 格式化 ISO 时间字符串为简短的可读格式。
 *
 * - < 1 分钟 → "刚刚"
 * - < 1 小时 → "N 分钟前"
 * - < 24 小时 → "N 小时前"
 * - < 7 天 → "N 天前"
 * - 否则 → "MM-DD"
 */
function formatTime(timeStr?: string): string {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin} 分钟前`

    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} 小时前`

    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay} 天前`

    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${month}-${day}`
  } catch {
    return timeStr
  }
}
</script>

<style scoped>
.conversation-list {
  background: transparent;
  border-radius: 8px;
}

.conversation-list-item {
  border-radius: 6px;
  margin: 2px 0;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.conversation-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.conversation-toggle-item {
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

.conversation-toggle-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
