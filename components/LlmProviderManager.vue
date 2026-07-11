<template>
  <div class="llm-provider-manager">
    <!-- 工具栏 -->
    <div class="mb-6">
      <v-btn
        color="primary"
        class="mr-2"
        prepend-icon="mdi-plus"
        @click="openProviderForm(null)"
      >
        新增提供商
      </v-btn>
      <v-btn
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="loadProviders"
      >
        刷新
      </v-btn>
    </div>

    <!-- 提供商列表 -->
    <v-card v-if="providers.length > 0">
      <v-list lines="two" class="pa-0">
        <template v-for="(provider, idx) in providers" :key="provider.id">
          <v-divider v-if="idx > 0" />
          <v-list-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal" size="40">
                <v-icon icon="mdi-server" />
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-medium">
              {{ provider.name }}
              <v-chip
                size="x-small"
                variant="outlined"
                class="ml-2"
                color="primary"
              >
                <template v-if="getAdapterInfo(provider.adapter)">
                  <CommonIcon :icon="getAdapterInfo(provider.adapter)!.icon" size="16" class="mr-1" />
                  {{ getAdapterInfo(provider.adapter)!.name }}
                </template>
                <template v-else>
                  {{ provider.adapter }}
                </template>
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption mt-1">
              <div>{{ provider.baseUrl }}</div>
              <div v-if="provider.modelListUrl" class="mt-1">
                模型列表地址: {{ provider.modelListUrl }}
              </div>
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                icon="mdi-pencil"
                density="comfortable"
                variant="text"
                @click="openProviderForm(provider)"
              />
              <v-btn
                icon="mdi-delete"
                density="comfortable"
                variant="text"
                color="error"
                @click="deleteProvider(provider)"
              />
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <!-- 空状态 -->
    <v-card v-else class="pa-6">
      <div class="text-center text-grey">
        <v-icon icon="mdi-database-off" size="48" class="mb-2" />
        <div class="text-body-1">
          暂无 LLM 提供商
        </div>
        <div class="text-caption mt-1">
          点击"新增提供商"按钮添加
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { AdapterInfo, LlmProvider } from '../model'
import { AdapterApi, ProviderApi } from '../api'
import LlmProviderFormVue from './LlmProviderForm.vue'

const props = defineProps({
  /** 用户 ID */
  uid: {
    type: Number,
    default: undefined
  }
})

const loading = ref(false)
const providers = ref<LlmProvider[]>([])

/** 适配器列表 */
const adapterOptions = ref<AdapterInfo[]>([])

/**
 * 根据适配器 ID 查找对应的适配器信息
 * @param id 适配器 ID
 */
function getAdapterInfo(id: string): AdapterInfo | undefined {
  return adapterOptions.value.find(a => a.id === id)
}

/**
 * 加载适配器列表
 */
async function loadAdapters() {
  try {
    const res = await window.SfcUtils.request(AdapterApi.getList())
    adapterOptions.value = res.data.data
  } catch {
    adapterOptions.value = []
  }
}

/**
 * 加载提供商列表
 */
async function loadProviders() {
  loading.value = true
  try {
    const res = await ProviderApi.getList()
    providers.value = (res as any).data || []
  } catch (err: any) {
    window.SfcUtils.snackbar(err.msg || '加载提供商列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 打开提供商新增/编辑对话框
 * @param provider 编辑时传入已有提供商，新增传 null
 */
function openProviderForm(provider: LlmProvider | null) {
  const dialog = window.SfcUtils.openComponentDialog(LlmProviderFormVue, {
    title: provider ? '编辑提供商' : '新增提供商',
    props: {
      initValue: provider,
      uid: props.uid
    },
    async onConfirm() {
      const form = dialog.getInstAsForm()
      const res = await form.submit({ showError: false })
      if (!res.success) {
        window.SfcUtils.snackbar(res.err?.message || '保存提供商失败')
        return false
      }
      await loadProviders()
      return true
    }
  })
}

/**
 * 删除提供商
 * @param provider 要删除的提供商
 */
async function deleteProvider(provider: LlmProvider) {
  if (!provider.id) return
  await window.SfcUtils.confirm(`确定要删除提供商"${provider.name}"吗？`, '删除确认')

  try {
    await ProviderApi.remove(provider.id)
    window.SfcUtils.snackbar('提供商已删除')
    await loadProviders()
  } catch (err: any) {
    window.SfcUtils.snackbar(err.msg || '删除提供商失败')
  }
}

onMounted(() => {
  loadAdapters()
  loadProviders()
})
</script>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'LlmProviderManager'
})
</script>
