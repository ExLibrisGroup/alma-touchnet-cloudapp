export const Utils = {
  /** Checks if object is empty */
  isEmptyObject: (obj: Object) => Object.keys(obj).length === 0 && obj.constructor === Object,

}