import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./input";

interface DebouncedInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  value: string | number;
  onChange: (value: string | number) => void;
  debounceMs?: number;
  type?: string;
}

/**
 * Input component that debounces onChange calls.
 * Uses local state while typing, syncs to parent after delay.
 * Prevents Convex real-time updates from overwriting user input.
 */
export function DebouncedInput({
  value: externalValue,
  onChange,
  debounceMs = 500,
  type = "text",
  ...props
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(externalValue);
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExternalValue = useRef(externalValue);

  // Sync external value to local when not focused and value actually changed externally
  useEffect(() => {
    if (!isFocused && externalValue !== lastExternalValue.current) {
      setLocalValue(externalValue);
      lastExternalValue.current = externalValue;
    }
  }, [externalValue, isFocused]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedOnChange = useCallback(
    (newValue: string | number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
        lastExternalValue.current = newValue;
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue =
      type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Immediately sync on blur if there's a pending change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      if (localValue !== lastExternalValue.current) {
        onChange(localValue);
        lastExternalValue.current = localValue;
      }
    }
  };

  return (
    <Input
      {...props}
      type={type}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
