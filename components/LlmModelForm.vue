<template>
  <base-form
    ref="formRef"
    :model-value="formData"
    :submit-action="submit"
    :auto-loading="true"
  >
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="formData.modelId"
          label="模型标识"
          :rules="validators.modelId"
          placeholder="例如: deepseek-v4-flash"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="contextLengthK"
          label="最大上下文长度(单位: k)"
          type="number"
          :rules="validators.contextLength"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="formData.reasoning"
          label="思考模式"
          placeholder="例如: max、low、none"
        />
      </v-col>
    </v-row>
  </base-form>
</template>

<script setup lang="ts">
import { CommonForm, defineForm } from 'sfc-common'
import { Validators } from 'sfc-common'
import { computed } from 'vue'
import type { LlmModel } from '../model'
import { ModelApi } from '../api'

const formRef = ref() as Ref<CommonForm>

const props = defineProps({
  /** 编辑时传入的初始模型数据，新增时传 null */
  initValue: {
    type: Object as PropType<LlmModel | null>,
    default: null
  },
  /** 所属提供商 ID */
  providerId: {
    type: Number,
    required: true
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

/**
 * 提交保存模型
 */
const submit = async() => {
  const res = await ModelApi.save(formData as LlmModel)
  emits('submit')
  return res
}

const formInst = defineForm({
  actions: {
    submit
  },
  formData: {
    modelId: '',
    contextLength: null as number | null,
    reasoning: '',
    llmProviderId: props.providerId,
    uid: props.uid
  } as LlmModel,
  formRef: formRef,
  validators: {
    modelId: [
      Validators.notNull('模型标识不能为空')
    ],
    contextLength: [
      Validators.minNum(0)
    ]
  },
  throwError: true
})

const { formData, actions, validators, loadingRef, loadingManager } = formInst

/**
 * 以 k 为单位的上下文长度双向绑定。
 * 显示时除以 1000，输入时乘以 1000 映射到 formData.contextLength。
 */
const contextLengthK = computed({
  get(): number | null {
    if (formData.contextLength == null) return null
    return Math.round(formData.contextLength / 1000)
  },
  set(val: any) {
    const num = Number(val)
    formData.contextLength = isNaN(num) ? undefined : num * 1000
  }
})

// 编辑模式：回填初始值
if (props.initValue) {
  Object.assign(formData, props.initValue)
}

defineExpose(formInst)
</script>

<script lang="ts">
import { defineComponent, Ref, ref, PropType } from 'vue'

export default defineComponent({
  name: 'LlmModelForm'
})
</script>
