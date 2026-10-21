<template>
  <div class="ask-user-dialog">
    <div
      v-for="(question, qi) in questions"
      :key="qi"
      class="ask-user-question"
    >
      <!-- 问题文本：多个问题时带序号，允许换行避免长问题被截断 -->
      <div class="ask-user-question__title text-subtitle-1 font-weight-bold text-wrap text-break">
        <span v-if="questions.length > 1" class="ask-user-question__index text-medium-emphasis mr-1">{{ qi + 1 }}.</span>{{ question.question }}
      </div>

      <!-- 选项列表：仅当该问题存在选项时展示，通过 VList 展示每个选项的 title 与 subtitle -->
      <VList
        v-if="question.options?.length"
        :selected="selectedOptions[qi]"
        selectable
        :select-strategy="question.multiSelect ? 'independent' : 'single-independent'"
        density="comfortable"
        class="ask-user-question__options mt-2"
        @update:selected="onSelectedChange(qi, $event)"
      >
        <VListItem
          v-for="(option, oi) in question.options"
          :key="oi"
          :value="oi"
          :title="option.title"
          :subtitle="option.subtitle"
          class="ask-user-question__option"
        >
          <!-- 前置选择控件：多选为复选框、单选为单选框，复用 VList 提供的选中状态与切换方法 -->
          <template #prepend="{ isSelected, select }">
            <VListItemAction start>
              <VCheckboxBtn v-if="question.multiSelect" :model-value="isSelected" @update:model-value="select" />
              <VRadio v-else :model-value="isSelected" @update:model-value="select" />
            </VListItemAction>
          </template>
        </VListItem>
      </VList>

      <!-- 手动输入：无论是否存在选项，都始终展示在每个问题的最下面 -->
      <VTextField
        :model-value="manualInputs[qi]"
        label="手动输入回答"
        :hint="getInputHint(question)"
        :persistent-hint="!!getInputHint(question)"
        clearable
        class="ask-user-question__input mt-2"
        @update:model-value="onManualInputChange(qi, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/** 组件 props 定义 */
const props = defineProps({
  /** 需要向用户提问的问题列表，每个问题可包含选项与多选标记 */
  questions: {
    type: Array as PropType<AskUserQuestion[]>,
    default: () => []
  }
})

/** 每个问题已选中的选项下标（单选至多一个，多选可有多个），下标与 questions 一一对应 */
const selectedOptions = ref<number[][]>(props.questions.map(() => []))

/** 每个问题手动输入框中的内容，下标与 questions 一一对应 */
const manualInputs = ref<string[]>(props.questions.map(() => ''))

/**
 * 将 VList 抛出的选中值归一化为选项下标数组。
 * @param value VList 的 update:selected 事件值（可能是任意类型）
 * @returns 仅包含数字下标的数组
 */
function normalizeSelected(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is number => typeof item === 'number')
}

/**
 * 处理选项选中状态变化。
 *
 * 单选模式下与手动输入互斥：一旦选中某个选项，就清空该问题的手动输入内容。
 *
 * @param questionIndex 问题下标
 * @param value VList 抛出的选中值
 */
function onSelectedChange(questionIndex: number, value: unknown) {
  const nextSelected = normalizeSelected(value)
  selectedOptions.value[questionIndex] = nextSelected
  // 单选：选中选项后清空手动输入，保证答案只有一种来源
  if (!props.questions[questionIndex]?.multiSelect && nextSelected.length > 0) {
    manualInputs.value[questionIndex] = ''
  }
}

/**
 * 处理手动输入内容变化。
 *
 * 单选模式下与选项互斥：一旦输入了非空内容，就取消该问题已选中的选项。
 *
 * @param questionIndex 问题下标
 * @param value 输入框的新值（clearable 清空时可能为 null）
 */
function onManualInputChange(questionIndex: number, value: string | null) {
  const nextInput = value ?? ''
  manualInputs.value[questionIndex] = nextInput
  // 单选：用户手动输入后取消已选选项，保证答案只有一种来源
  if (!props.questions[questionIndex]?.multiSelect && nextInput.trim() !== '') {
    selectedOptions.value[questionIndex] = []
  }
}

/**
 * 获取手动输入框的提示文案，用于说明选项与手动输入之间的关系。
 * @param question 当前问题
 * @returns 提示文案，无选项时返回空字符串（不展示提示）
 */
function getInputHint(question: AskUserQuestion): string {
  if (!question.options?.length) return ''
  return question.multiSelect
    ? '可多选选项，也可补充手动输入内容（会一并提交）'
    : '选择选项或手动输入回答，二者只需其一'
}

/**
 * 获取每个问题的答案，供 ask_user 工具的 handler 读取。
 *
 * - 单选：手动输入内容优先；否则返回选中选项的 title；都没有则返回空字符串
 * - 多选：返回选中选项 title 数组（按选项顺序排列），手动输入内容追加在数组末尾
 *
 * @returns 与 questions 下标一一对应的答案数组
 */
function getAnswers(): AskUserAnswerValue[] {
  return props.questions.map((question, qi) => {
    // 已选选项的 title，按选项在原始列表中的顺序排列
    const selectedTitles = [...(selectedOptions.value[qi] ?? [])]
      .sort((a, b) => a - b)
      .map(oi => question.options?.[oi]?.title)
      .filter((title): title is string => !!title)
    const manualInput = (manualInputs.value[qi] ?? '').trim()

    // 多选：选项与手动输入可以共存，手动输入作为额外答案追加到数组末尾
    if (question.multiSelect) {
      return manualInput ? [...selectedTitles, manualInput] : selectedTitles
    }
    // 单选：选项与手动输入互斥，手动输入优先
    return manualInput || selectedTitles[0] || ''
  })
}

defineExpose({ getAnswers })
</script>

<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'
import type { AskUserQuestion, AskUserAnswerValue } from '../core/CommonTools'

export default defineComponent({
  name: 'AskUserDialog'
})
</script>

<style lang="scss" scoped>
.ask-user-dialog {
  /* 多个问题之间用分割线区隔，避免长列表下问题粘连 */
  .ask-user-question + .ask-user-question {
    border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    margin-top: 16px;
    padding-top: 16px;
  }

  /* 问题文本允许自动换行，长问题不会被截断 */
  .ask-user-question__title {
    line-height: 1.5;
  }

  /* 覆盖 Vuetify 列表项标题/副标题默认的单行省略与行数钳制，确保所有选项内容完整显示 */
  .ask-user-question__options {
    :deep(.v-list-item-title),
    :deep(.v-list-item-subtitle) {
      display: block;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      -webkit-line-clamp: unset;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    /* 副标题换行后与标题保持少量间距，提升可读性 */
    :deep(.v-list-item-subtitle) {
      margin-top: 2px;
      line-height: 1.4;
    }
  }
}
</style>
