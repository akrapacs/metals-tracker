import { useState, useEffect, Dispatch, SetStateAction } from "react";

// akrapacs.github.io is shared with other projects (e.g. token-tracker), so keys must be namespaced
const KEY_PREFIX = 'metals-tracker:';

const getItem = <T> (key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  const saved = localStorage.getItem(key);
  if (!saved) {
    return defaultValue;
  }
  try {
    return JSON.parse(saved) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export const useLocalStorage = <T> (key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] => {
  const storageKey = `${KEY_PREFIX}${key}`;

  const [value, setValue] = useState<T>(() => {
    return getItem(storageKey, defaultValue);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
  }, [storageKey, value]);

  return [value, setValue];
};
