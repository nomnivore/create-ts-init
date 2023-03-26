function isObject(obj: unknown): obj is object {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

export type MergedObject<T, U> = T & U;
export type MergeableObject = Record<string, unknown>;

export function mergeObject<
  T extends MergeableObject,
  U extends MergeableObject
>(target: T, ...sources: U[]): MergedObject<T, U> {
  if (!sources.length) return target as T & U;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source as Record<keyof T & keyof U, unknown>) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeObject<T, MergeableObject>(
          target[key] as T,
          source[key] as MergeableObject
        );
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeObject(target, ...sources);
}
