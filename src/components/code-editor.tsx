"use client";

/**
 * Shared CodeMirror 6 editor for the query console.
 *
 * Renders either SQL (PostgreSQL dialect, schema-aware completion) or PRQL
 * (approximate highlighting — see `#/lib/prql/codemirror`). Deliberately dumb:
 * it fetches nothing, compiles nothing, and knows nothing about which pane is
 * active. The console owns all of that.
 */
import { PostgreSQL, type SQLNamespace, sql } from "@codemirror/lang-sql";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo, useRef } from "react";
import { prql } from "#/lib/prql/codemirror";
import type { QueryLanguage, SchemaIntrospection } from "#/lib/sql/types";

interface CodeEditorProps {
  language: QueryLanguage;
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  /** PRQL -> SQL compilation. Omit to disable the Mod-e binding. */
  onTransform?: () => void;
  onFocus?: () => void;
  /** Completion source for SQL. Ignored for PRQL. */
  schema?: SchemaIntrospection | null;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Editor chrome, driven by the app's design tokens so the editor follows the
 * light/dark class instead of shipping a second colour system.
 */
const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    fontSize: "0.875rem",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-content": {
    fontFamily: "var(--font-mono, ui-monospace, monospace)",
    caretColor: "var(--foreground)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
    border: "none",
  },
  ".cm-activeLine": { backgroundColor: "var(--accent)" },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },
  "&.cm-focused .cm-cursor": { borderLeftColor: "var(--foreground)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection":
    { backgroundColor: "var(--cm-selection)" },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },
});

/** Token colours, defined as CSS variables in globals.css for both modes. */
const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--cm-keyword)", fontWeight: "600" },
  { tag: tags.controlKeyword, color: "var(--cm-keyword)", fontWeight: "600" },
  { tag: tags.operator, color: "var(--cm-operator)" },
  { tag: tags.punctuation, color: "var(--cm-punctuation)" },
  { tag: tags.bracket, color: "var(--cm-punctuation)" },
  { tag: tags.comment, color: "var(--cm-comment)", fontStyle: "italic" },
  { tag: tags.string, color: "var(--cm-string)" },
  // PRQL s-strings are the raw-SQL escape hatch; call them out.
  {
    tag: tags.special(tags.string),
    color: "var(--cm-escape)",
    fontWeight: "600",
  },
  { tag: tags.number, color: "var(--cm-number)" },
  { tag: tags.literal, color: "var(--cm-number)" },
  { tag: tags.atom, color: "var(--cm-atom)" },
  { tag: tags.bool, color: "var(--cm-atom)" },
  { tag: tags.null, color: "var(--cm-atom)" },
  { tag: tags.function(tags.variableName), color: "var(--cm-function)" },
  { tag: tags.typeName, color: "var(--cm-type)" },
  { tag: tags.variableName, color: "var(--foreground)" },
  { tag: tags.meta, color: "var(--cm-comment)" },
]);

/** Only the pieces a query editor needs — no search panel, no fold gutter. */
const BASIC_SETUP = {
  lineNumbers: true,
  foldGutter: false,
  searchKeymap: false,
  highlightActiveLine: true,
  highlightActiveLineGutter: true,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: true,
  history: true,
  drawSelection: true,
  rectangularSelection: true,
  highlightSelectionMatches: false,
} as const;

/** Map the introspection payload onto lang-sql's table -> columns shape. */
function toSqlNamespace(schema: SchemaIntrospection | null | undefined) {
  if (!schema) return undefined;
  const namespace: SQLNamespace = {};
  for (const table of schema.tables) {
    // Views and materialized views are queryable too — include them all.
    (namespace as Record<string, string[]>)[table.name] = table.columns.map(
      (c) => c.name,
    );
  }
  return namespace;
}

export function CodeEditor({
  language,
  value,
  onChange,
  onRun,
  onTransform,
  onFocus,
  schema,
  disabled,
  placeholder,
}: CodeEditorProps) {
  const languageExtension = useMemo(
    () =>
      language === "prql"
        ? prql()
        : sql({
            dialect: PostgreSQL,
            schema: toSqlNamespace(schema),
            upperCaseKeywords: true,
          }),
    [language, schema],
  );

  // The console rebuilds `onRun` on every keystroke (it closes over the query
  // text). Reading the callbacks through a ref keeps the keymap — and therefore
  // the whole extension array — referentially stable, so CodeMirror is never
  // reconfigured while typing.
  const handlers = useRef({ onRun, onTransform, disabled });
  handlers.current = { onRun, onTransform, disabled };

  const shortcuts = useMemo(
    () =>
      // Prec.highest so these beat CodeMirror's default keymap. `Mod` is Cmd on
      // macOS and Ctrl elsewhere, which sidesteps standardKeymap's macOS
      // `Ctrl-e` (cursorLineBoundaryForward) binding.
      Prec.highest(
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              // Always claim the shortcut: while a query is running the editor
              // is read-only and falling through would do nothing useful.
              if (!handlers.current.disabled) handlers.current.onRun();
              return true;
            },
          },
          {
            key: "Mod-e",
            run: () => {
              // Without a transform handler the binding does not exist, so let
              // CodeMirror's default keymap have the key.
              const { onTransform: transform, disabled: busy } =
                handlers.current;
              if (!transform) return false;
              if (!busy) transform();
              return true;
            },
          },
        ]),
      ),
    [],
  );

  const extensions = useMemo(
    () => [
      shortcuts,
      languageExtension,
      syntaxHighlighting(highlightStyle),
      baseTheme,
      EditorView.lineWrapping,
    ],
    [shortcuts, languageExtension],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      extensions={extensions}
      basicSetup={BASIC_SETUP}
      editable={!disabled}
      readOnly={disabled}
      placeholder={placeholder}
      height="100%"
      className="h-full text-sm"
    />
  );
}
