function isObject(obj: unknown): boolean {
  return obj && typeof obj == "object" && !Array.isArray(obj);
}

export function mergeObject<T extends object, U extends object>(
  target: T,
  ...sources: U[]
) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source as Record<keyof T & keyof U, unknown>) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeObject(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeObject(target, ...sources);
}
