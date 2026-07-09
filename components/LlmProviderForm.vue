<template>
  <base-form
    ref="formRef"
    :model-value="formData"
    :submit-action="submit"
    :auto-loading="true"
  >
    <!-- 基本信息 -->
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="formData.name"
          label="提供商名称"
          :rules="validators.name"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-select
          v-model="formData.protocolType"
          label="协议类型"
          :items="protocolTypeOptions"
          :rules="validators.protocolType"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="formData.baseUrl"
          label="请求地址"
          :rules="validators.baseUrl"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="formData.apiKey"
          label="API 密钥"
          type="password"
          :rules="validators.apiKey"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="formData.modelListUrl"
          label="模型列表请求地址"
          placeholder="可选，默认使用请求地址"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="formData.customHeader"
          label="自定义请求头"
          placeholder="可选，JSON 格式，如 {&quot;Authorization&quot;:&quot;Bearer xxx&quot;}"
        />
      </v-col>
    </v-row>

    <!-- 模型管理 -->
    <v-divider class="my-3" />
    <div class="d-flex align-center mb-2">
      <span class="text-subtitle-1 font-weight-medium">模型</span>
      <v-spacer />
      <v-btn
        color="primary"
        size="small"
        icon="mdi-plus"
        @click="openModelForm(null)"
      />
    </div>
    <v-list v-if="models.length > 0" density="compact" class="border rounded pa-0">
      <v-list-item
        v-for="(model, idx) in models"
        :key="idx"
        density="compact"
      >
        <template #prepend>
          <v-icon icon="mdi-brain" class="mr-2" />
        </template>
        <v-list-item-title>
          {{ model.modelId }}
          <template v-if="model.contextLength">
            <v-chip size="x-small" class="ml-1">
              {{ formatContextLength(model.contextLength) }}
            </v-chip>
          </template>
          <template v-if="model.reasoning">
            <v-chip
              size="x-small"
              class="ml-1"
              color="primary"
            >
              {{ model.reasoning }}
            </v-chip>
          </template>
        </v-list-item-title>
        <template #append>
          <v-btn
            class="mr-2"
            icon="mdi-pencil"
            density="comfortable"
            variant="text"
            style="font-size: .8rem"
            @click="openModelForm(model)"
          />
          <v-btn
            icon="mdi-delete"
            density="comfortable"
            variant="text"
            color="error"
            style="font-size: .8rem"
            @click="removeModel(idx)"
          />
        </template>
      </v-list-item>
    </v-list>
    <v-alert
      v-else
      type="info"
      variant="tonal"
      density="compact"
      text="暂无关联模型，请点击'+'添加"
      class="mt-1"
    />
  </base-form>
</template>

<script setup lang="ts">
import { CommonForm, defineForm } from 'sfc-common'
import { Validators } from 'sfc-common'
import type { SelectOption } from 'sfc-common/model'
import type { LlmModel, LlmProvider } from '../model'
import { ProviderApi, ModelApi } from '../api'
import LlmModelFormVue from './LlmModelForm.vue'

const formRef = ref() as Ref<CommonForm>

const props = defineProps({
  /** 编辑时传入的初始提供商数据，新增时传 null */
  initValue: {
    type: Object as PropType<LlmProvider | null>,
    default: null
  },
  /** 用户 ID */
  uid: {
    type: Number,
    default: undefined
  }
})

const emits = defineEmits<{
  (e: 'submit'): void
}>()

/** 协议类型选项 */
const protocolTypeOptions: SelectOption[] = [
  { title: 'OpenAI', value: 'OpenAI' },
  { title: 'Anthropic', value: 'Anthropic' }
]

/** 当前已添加的模型列表（未持久化，随提供商一起保存） */
const models = ref<LlmModel[]>([])

/**
 * 将上下文长度数值格式化为可读的 K/M 单位
 * @param val 原始上下文长度值（单位: token）
 */
function formatContextLength(val: number | undefined | null): string {
  if (val == null) return ''
  if (val >= 1_000_000) {
    const m = val / 1_000_000
    return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M'
  }
  if (val >= 1000) {
    const k = val / 1000
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'K'
  }
  return `${val} ctx`
}

/**
 * 打开模型新增/编辑对话框
 * @param model 编辑时传入已有模型，新增传 null
 */
function openModelForm(model: LlmModel | null) {
  const dialog = window.SfcUtils.openComponentDialog(LlmModelFormVue, {
    title: model ? '编辑模型' : '添加模型',
    props: {
      initValue: model,
      providerId: props.initValue?.id ?? 0,
      uid: props.uid
    },
    extraDialogOptions: {
      maxWidth: '500px'
    },
    async onConfirm() {
      const form = dialog.getInstAsForm()
      const res = await form.submit({ showError: false })
      if (!res.success) {
        window.SfcUtils.snackbar(res.err?.message || '保存模型失败')
        return false
      }
      // 模型已通过 API 保存，重新加载模型列表
      await loadModels()
      return true
    }
  })
}

/**
 * 从列表中移除模型（同时调用后端删除）
 * @param idx 模型在列表中的索引
 */
async function removeModel(idx: number) {
  const model = models.value[idx]
  await window.SfcUtils.confirm(`确定要删除模型"${model.modelId}"吗？`, '删除确认')
  if (!model.id) {
    models.value.splice(idx, 1)
    return
  }
  try {
    await ModelApi.remove(model.id)
    models.value.splice(idx, 1)
    window.SfcUtils.snackbar('模型已删除')
  } catch (err: any) {
    window.SfcUtils.snackbar(err || '删除模型失败')
  }
}

/**
 * 加载当前提供商的模型列表
 */
async function loadModels() {
  if (!props.initValue?.id) {
    // 新增模式下，模型尚未持久化，由本地列表管理
    return
  }
  try {
    const res = await ModelApi.getList(props.initValue.id)
    models.value = (res as any).data || []
  } catch {
    // 静默处理
  }
}

/**
 * 提交保存提供商
 */
const submit = async() => {
  const provider = { ...formData } as LlmProvider
  // 新增模式：先保存提供商获得 ID
  if (!provider.id) {
    const res = await ProviderApi.save(provider)
    const saved = (res as any).data || res
    provider.id = saved.id
  }
  // 保存本地未持久化的模型
  for (const model of models.value) {
    if (!model.id) {
      model.llmProviderId = provider.id!
      try {
        await ModelApi.save(model)
      } catch {
        // 单个模型保存失败继续
      }
    }
  }
  const res = await ProviderApi.save(provider)
  emits('submit')
  return res
}

const formInst = defineForm({
  actions: {
    submit
  },
  formData: {
    name: '',
    protocolType: 'OpenAI' as const,
    baseUrl: '',
    apiKey: '',
    modelListUrl: '',
    customHeader: '',
    uid: props.uid
  } as LlmProvider,
  formRef: formRef,
  validators: {
    name: [
      Validators.notNull('提供商名称不能为空')
    ],
    protocolType: [
      Validators.notNull('请选择协议类型')
    ],
    baseUrl: [
      Validators.notNull('请求地址不能为空')
    ],
    apiKey: [
      Validators.notNull('API 密钥不能为空')
    ]
  },
  throwError: true
})

const { formData, actions, validators, loadingRef, loadingManager } = formInst

// 编辑模式：回填初始值
if (props.initValue) {
  Object.assign(formData, props.initValue)
  // 加载已有模型
  loadModels()
}

defineExpose(formInst)
</script>

<script lang="ts">
import { defineComponent, Ref, ref, PropType } from 'vue'

export default defineComponent({
  name: 'LlmProviderForm'
})
</script>
