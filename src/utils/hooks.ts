import { useEffect, useRef, useState } from 'react';

export function usePrevious<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function useAwaitOrDefault<T>(promise: Promise<T>, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue);
  useEffect(() => {
    promise.then(setValue);
  }, [promise]);
  return value;
}
