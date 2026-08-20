"use client";

import { useEffect, useRef } from "react";
import { Textarea } from "#/components/ui/textarea";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  disabled?: boolean;
}

export function SqlEditor({
  value,
  onChange,
  onRun,
  disabled,
}: SqlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Ctrl/Cmd+Enter to run the query
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!disabled) {
          onRun();
        }
      }
    };
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("keydown", handleKeyDown);
      return () => textarea.removeEventListener("keydown", handleKeyDown);
    }
  }, [onRun, disabled]);

  return (
    <div className="relative h-full">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter SQL query... (Ctrl/Cmd+Enter to run)"
        className="h-full resize-none rounded-none border-0 font-mono text-sm leading-relaxed focus-visible:ring-0"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
