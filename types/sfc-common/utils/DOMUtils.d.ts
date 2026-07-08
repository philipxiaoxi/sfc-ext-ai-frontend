declare module 'sfc-common/utils/DOMUtils' {
  const DOMUtils: {
    getAbsoluteOffsetTop(childElement: HTMLElement, parentElement: HTMLElement): number
    getAbsoluteOffsetLeft(childElement: HTMLElement, parentElement: HTMLElement): number
    getElParentByClass(elem: HTMLElement, className: string): HTMLElement | null
    getElParent(elem: HTMLElement, mather: (el: HTMLElement) => boolean): HTMLElement | null
    getElAllParent(elem: HTMLElement, mather: (el: HTMLElement) => boolean): HTMLElement[]
    isCollide(el: HTMLElement, el2: HTMLElement): boolean
  }

  export default DOMUtils
}
