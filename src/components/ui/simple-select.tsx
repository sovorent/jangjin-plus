"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SimpleSelect({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  disabled,
}: SimpleSelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedLabel = options.find((o) => o.value === currentValue)?.label;

  useEffect(() => { setMounted(true); }, []);

  function openDropdown() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
    setOpen(true);
  }

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node) &&
      !triggerRef.current?.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  function handleSelect(optionValue: string) {
    setInternalValue(optionValue);
    onValueChange?.(optionValue);
    setOpen(false);
  }

  const dropdown = mounted && open ? createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-md"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSelect(option.value)}
          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        >
          {option.label}
          {currentValue === option.value && (
            <CheckIcon className="absolute right-2 h-4 w-4" />
          )}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={cn(!currentValue && "text-muted-foreground")}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {dropdown}
    </div>
  );
}
