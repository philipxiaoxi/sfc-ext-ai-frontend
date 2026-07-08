declare module 'sfc-common/utils/FormUtils' {
  export interface CommonForm {
    validate: () => Promise<any>
    getFormData: () => any
    submit: (opt?: any) => Promise<any>
    getId: () => string
    getFormManager: () => any
    getFormLoadingManager: () => any
    getFormLoadingRef: () => any
  }

  export function defineBaseForm(opt: any): CommonForm
  export function defineForm<V extends any, F extends object, A extends object>(opt: any): any
  export function deconstructForm(form: any): CommonForm
  export class FormManager {
    [key: string]: any
  }
  export interface SubmitOpt {
    ignoreValidate?: boolean
    errorHandler?: ((...e: any) => Promise<any> | undefined | null) | null
    showError?: boolean
    popError?: boolean
  }
  export interface FormSubmitResult {
    success: boolean
    err?: Error
    data?: any
  }
}
