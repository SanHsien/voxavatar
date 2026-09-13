import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Node 25 enables Web Storage by default. Started without `--localstorage-file`
 * it leaves `globalThis.localStorage` as a null-prototype object with no
 * methods, and that stub shadows the Storage jsdom installs -- so every
 * localStorage assertion fails with "setItem is not a function" on Node 25 while
 * passing on the Node 24 CI runs. package.json accepts `>=24`, which includes
 * 25, so the suite restores a working Storage instead of relying on the
 * runtime's.
 */
const isUsableStorage = (candidate: unknown): candidate is Storage =>
  typeof (candidate as Storage | undefined)?.setItem === 'function';

const createMemoryStorage = (): Storage => {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => [...entries.keys()][index] ?? null,
    getItem: (key: string) => entries.get(String(key)) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(String(key), String(value));
    },
    removeItem: (key: string) => {
      entries.delete(String(key));
    },
    clear: () => {
      entries.clear();
    },
  } as Storage;
};

if (!isUsableStorage(globalThis.localStorage)) {
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
  if (typeof window !== 'undefined' && !isUsableStorage(window.localStorage)) {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });
  }
}

afterEach(() => {
  cleanup();
});
