export interface Clonable {
  clone(): Clonable;
}

export type ClonableType =
  | Clonable
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<ClonableType>
  | { [key: string]: ClonableType };

export function clone<T extends ClonableType>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (value instanceof Array) {
    return value.map(clone) as T;
  }
  if (value instanceof Object) {
    if ('clone' in value && typeof value.clone === 'function') {
      return value.clone() as T;
    }
    const obj = { ...value } as { [key: string]: ClonableType };
    for (const key in obj) {
      obj[key] = clone(obj[key]);
    }
    return obj as T;
  }
  return value;
}
