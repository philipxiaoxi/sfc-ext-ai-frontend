<template>
  <div class="sensitive-tool-call-record">
    <!-- 筛选工具栏 -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filter.uid"
              label="用户ID"
              type="number"
              hide-details
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filter.toolName"
              label="工具名称"
              hide-details
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filter.startTime"
              label="开始日期"
              type="date"
              hide-details
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filter.endTime"
              label="结束日期"
              type="date"
              hide-details
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn color="primary" prepend-icon="mdi-magnify" @click="search">
              查询
            </v-btn>
            <v-btn class="ml-2" prepend-icon="mdi-refresh" @click="reset">
              重置
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 记录列表 -->
    <v-card>
      <v-data-table-server
        :headers="headers"
        :items="records"
        :loading="loading"
        :items-length="totalCount"
        item-key="id"
        :items-per-page="pageRequest.size"
        :items-per-page-options="pageSizeOptions"
        items-per-page-text="每页大小"
        density="compact"
        disable-sort
        hover
        :mobile="null"
        mobile-breakpoint="md"
        @update:options="loadRecords"
      >
        <template #item.createAt="scope">
          {{ formatTime(scope.value) }}
        </template>
        <template #item.status="scope">
          <v-chip size="small" :color="getStatusOption(scope.value).color">
            {{ getStatusOption(scope.value).text }}
          </v-chip>
        </template>
        <template #item.success="scope">
          <v-icon
            v-if="scope.item.status === 'REJECTED'"
            icon="mdi-cancel"
            color="grey"
            title="未执行"
          />
          <v-icon
            v-else-if="scope.value"
            icon="mdi-check-circle"
            color="success"
            title="执行成功"
          />
          <v-icon
            v-else
            icon="mdi-alert-circle"
            color="error"
            title="执行失败"
          />
        </template>
        <template #item.actions="scope">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            @click="openDetail(scope.item)"
          >
            查看详情
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 记录详情对话框 -->
    <v-dialog v-model="detailVisible" max-width="760">
      <v-card v-if="currentRecord">
        <v-card-title class="d-flex align-center">
          敏感工具调用详情
          <v-spacer />
          <v-chip size="small" :color="STATUS_OPTIONS[currentRecord.status].color">
            {{ STATUS_OPTIONS[currentRecord.status].text }}
          </v-chip>
        </v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item>
              <v-list-item-title class="detail-label">
                用户
              </v-list-item-title>
              <v-list-item-subtitle>{{ currentRecord.username || '-' }} (UID: {{ currentRecord.uid ?? '-' }})</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="detail-label">
                工具名称
              </v-list-item-title>
              <v-list-item-subtitle>{{ currentRecord.toolName }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-if="currentRecord.purpose">
              <v-list-item-title class="detail-label">
                用途
              </v-list-item-title>
              <v-list-item-subtitle>{{ currentRecord.purpose }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-if="currentRecord.conversationId">
              <v-list-item-title class="detail-label">
                会话ID
              </v-list-item-title>
              <v-list-item-subtitle class="break-text">
                {{ currentRecord.conversationId }}
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="detail-label">
                调用时间
              </v-list-item-title>
              <v-list-item-subtitle>{{ formatTime(currentRecord.createAt) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-divider class="my-2" />
          <div class="detail-label mb-1">
            调用参数
          </div>
          <pre class="detail-code">{{ formatJson(currentRecord.arguments) }}</pre>
          <template v-if="currentRecord.result">
            <div class="detail-label my-1 mt-3">
              执行结果
            </div>
            <pre class="detail-code">{{ currentRecord.result }}</pre>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="detailVisible = false">
            关闭
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { CommonPageInfo, PageableRequest } from 'sfc-common/model'
import { LoadingManager, MethodInterceptor, StringFormatter } from 'sfc-common'
import type { SensitiveToolCallQueryParam, SensitiveToolCallRecord, SensitiveToolCallStatus } from '../model'
import { SensitiveToolCallRecordApi } from '../api'

/** 加载状态管理器 */
const lm = new LoadingManager()
const loading = lm.getLoadingRef()

/** 记录列表 */
const records = ref<SensitiveToolCallRecord[]>([])

/** 总记录数 */
const totalCount = ref(0)

/** 分页请求参数（后端页码从 0 开始） */
const pageRequest = reactive({ page: 0, size: 20 } as PageableRequest)

/** 每页大小选项 */
const pageSizeOptions = [10, 20, 50, 100].map(e => ({ value: e, title: '' + e }))

/** 筛选条件 */
const filter = reactive({
  /** 用户 ID 筛选 */
  uid: '',
  /** 工具名称模糊筛选 */
  toolName: '',
  /** 开始日期（yyyy-MM-dd） */
  startTime: '',
  /** 结束日期（yyyy-MM-dd） */
  endTime: ''
})

/** 详情对话框可见性 */
const detailVisible = ref(false)

/** 当前查看的记录 */
const currentRecord = ref<SensitiveToolCallRecord | null>(null)

/** 状态显示配置 */
const STATUS_OPTIONS: Record<SensitiveToolCallStatus, { text: string, color: string }> = {
  AUTO_EXECUTED: { text: '自动执行', color: 'info' },
  APPROVED_EXECUTED: { text: '批准执行', color: 'primary' },
  REJECTED: { text: '已拒绝', color: 'warning' }
}

/**
 * 获取状态对应的显示配置（表格插槽传入值为 any，通过此方法做类型收窄）
 * @param status 调用状态
 */
function getStatusOption(status: SensitiveToolCallStatus): { text: string, color: string } {
  return STATUS_OPTIONS[status]
}

/** 表格列定义 */
const headers = [
  { title: '调用时间', key: 'createAt', width: '200px', nowrap: true },
  { title: '用户', key: 'username', minWidth: '120px' },
  { title: '工具名称', key: 'toolName', minWidth: '140px' },
  { title: '用途', key: 'purpose' },
  { title: '状态', key: 'status', width: '110px' },
  { title: '执行结果', key: 'success', width: '100px' },
  { title: '操作', key: 'actions', width: '110px', sortable: false }
]

/**
 * 构建分页查询参数，将日期筛选转换为毫秒时间戳范围。
 * 开始日期固定为当天 00:00:00，结束日期固定为当天 23:59:59。
 */
function buildQueryParam(): SensitiveToolCallQueryParam {
  const param: SensitiveToolCallQueryParam = { page: pageRequest.page, size: pageRequest.size }
  if (filter.uid) {
    param.uid = Number(filter.uid)
  }
  if (filter.toolName) {
    param.toolName = filter.toolName
  }
  if (filter.startTime) {
    const begin = new Date(filter.startTime)
    begin.setHours(0, 0, 0, 0)
    param.startTime = begin.getTime()
  }
  if (filter.endTime) {
    const end = new Date(filter.endTime)
    end.setHours(23, 59, 59, 999)
    param.endTime = end.getTime()
  }
  return param
}

/** 数据加载动作集合 */
const actions = MethodInterceptor.createAsyncActionProxy({
  /**
   * 加载记录列表
   */
  async loadList() {
    const res = await window.SfcUtils.request(SensitiveToolCallRecordApi.getRecords(buildQueryParam()))
    const pageInfo = res.data.data as CommonPageInfo<SensitiveToolCallRecord>
    records.value = pageInfo.content
    totalCount.value = pageInfo.totalCount
  }
}, true, lm)

/**
 * 表格分页选项变化时加载数据（服务端分页）
 * @param param 表格分页选项
 */
async function loadRecords(param: { page: number, itemsPerPage: number }) {
  pageRequest.page = param.page - 1
  pageRequest.size = param.itemsPerPage
  await actions.loadList()
}

/**
 * 按当前筛选条件查询，重置到第一页
 */
function search() {
  pageRequest.page = 0
  actions.loadList()
}

/**
 * 重置筛选条件并重新加载
 */
function reset() {
  filter.uid = ''
  filter.toolName = ''
  filter.startTime = ''
  filter.endTime = ''
  search()
}

/**
 * 格式化时间显示
 * @param time 时间值（时间戳或日期字符串）
 */
function formatTime(time?: string | number): string {
  return time == null ? '-' : StringFormatter.toDate(time, true)
}

/**
 * 格式化 JSON 字符串为易读的多行文本
 * @param json 原始 JSON 字符串
 */
function formatJson(json?: string): string {
  if (!json) {
    return '-'
  }
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}

/**
 * 打开记录详情对话框
 * @param record 选中的记录
 */
function openDetail(record: SensitiveToolCallRecord) {
  currentRecord.value = record
  detailVisible.value = true
}

onMounted(() => {
  // 组件挂载时先加载一次列表（VDataTableServer 首次渲染不一定会触发 update:options）
  actions.loadList()
})
</script>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SensitiveToolCallRecord'
})
</script>

<style scoped lang="scss">
.detail-label {
  font-size: 13px;
  color: rgb(var(--v-theme-primary));
}

.detail-code {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.break-text {
  word-break: break-all;
}
</style>
