import { CommonRequest } from 'sfc-common/model'
import type { LlmModel, LlmProvider, ProviderWithModelsVo } from './model'

// ────────────────────────── LLM 提供商 API ──────────────────────────

/** 提供商 API 前缀 */
const providerPrefix = '/ai/provider'

/** LLM 提供商相关 API */
export namespace ProviderApi {
  /**
   * 获取当前用户的 LLM 提供商列表
   */
  export function getList(): Promise<any> {
    return window.SfcUtils.request({
      url: `${providerPrefix}/list`,
      method: 'get'
    }).then(res => res.data)
  }

  /**
   * 根据 ID 获取提供商
   * @param id 提供商 ID
   */
  export function get(id: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${providerPrefix}/get`,
      method: 'get',
      params: { id }
    }).then(res => res.data)
  }

  /**
   * 新增或修改提供商
   * @param provider 提供商数据
   */
  export function save(provider: LlmProvider): Promise<any> {
    return window.SfcUtils.request({
      url: `${providerPrefix}/save`,
      method: 'post',
      data: provider,
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.data)
  }

  /**
   * 删除提供商
   * @param id 提供商 ID
   */
  export function remove(id: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${providerPrefix}/delete`,
      method: 'post',
      params: { id }
    }).then(res => res.data)
  }
}

// ────────────────────────── LLM 模型 API ──────────────────────────

/** 模型 API 前缀 */
const modelPrefix = '/ai/model'

/** LLM 模型相关 API */
export namespace ModelApi {
  /**
   * 获取模型列表，可按提供商 ID 过滤
   * @param providerId 可选，提供商 ID
   */
  export function getList(providerId?: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/list`,
      method: 'get',
      params: providerId != null ? { providerId } : {}
    }).then(res => res.data)
  }

  /**
   * 根据 ID 获取模型
   * @param id 模型 ID
   */
  export function get(id: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/get`,
      method: 'get',
      params: { id }
    }).then(res => res.data)
  }

  /**
   * 新增或修改模型
   * @param model 模型数据
   */
  export function save(model: LlmModel): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/save`,
      method: 'post',
      data: model,
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.data)
  }

  /**
   * 删除模型
   * @param id 模型 ID
   */
  export function remove(id: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/delete`,
      method: 'post',
      params: { id }
    }).then(res => res.data)
  }

  /**
   * 根据提供商 ID 删除所有关联模型
   * @param providerId 提供商 ID
   */
  export function removeByProviderId(providerId: number): Promise<any> {
    return window.SfcUtils.request({
      url: `${modelPrefix}/deleteByProviderId`,
      method: 'post',
      params: { providerId }
    }).then(res => res.data)
  }
}

// ────────────────────────── 组合查询 API ──────────────────────────

/** 查询 API 前缀 */
const queryPrefix = '/ai/query'

/** 组合查询相关 API */
export namespace QueryApi {
  /**
   * 查询所有公共和当前用户的模型提供商及其关联模型列表
   */
  export function getProvidersWithModels(): CommonRequest<ProviderWithModelsVo[]> {
    return {
      url: `${queryPrefix}/providersWithModels`,
      method: 'get'
    }
  }
}
