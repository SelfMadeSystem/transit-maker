import { useEffect, useRef, useState } from 'react';

export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  smallStep = step / 10,
  ...props
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  smallStep?: number | null;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState<string>(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (event.shiftKey && smallStep !== null) {
        onChange(Math.min(max, value + smallStep));
      } else {
        onChange(Math.min(max, value + step));
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (event.shiftKey && smallStep !== null) {
        onChange(Math.max(min, value - smallStep));
      } else {
        onChange(Math.max(min, value - step));
      }
    }
  }

  function handleBlur() {
    if (inputRef.current) {
      const number = parseFloat(inputRef.current.value);
      if (!isNaN(number)) {
        onChange(Math.min(max, Math.max(min, number)));
      } else {
        setInputValue(value.toString());
      }
    }
  }

  return (
    <input
      {...props}
      ref={inputRef}
      type="number"
      value={inputValue}
      onChange={event => {
        const inputValue = event.target.value;
        setInputValue(inputValue);
        const number = parseFloat(inputValue);
        if (!isNaN(number)) {
          onChange(Math.min(max, Math.max(min, number)));
        }
      }}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}
