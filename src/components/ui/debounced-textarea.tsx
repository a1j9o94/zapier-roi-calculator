import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "./textarea";

interface DebouncedTextareaProps
  extends Omit<React.ComponentProps<typeof Textarea>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

/**
 * Textarea component that debounces onChange calls.
 * Uses local state while typing, syncs to parent after delay.
 * Prevents Convex real-time updates from overwriting user input.
 */
export function DebouncedTextarea({
  value: externalValue,
  onChange,
  debounceMs = 500,
  ...props
}: DebouncedTextareaProps) {
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
    (newValue: string) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
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
    <Textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
