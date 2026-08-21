"use client";

/**
 * Shared CodeMirror 6 editor for the query console.
 *
 * Renders either SQL (PostgreSQL dialect, schema-aware completion) or PRQL
 * (approximate highlighting — see `#/lib/prql/codemirror`). Reads state from
 * stores and dispatches via the actions proxy.
 */
import { PostgreSQL, type SQLNamespace, sql } from "@codemirror/lang-sql";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { observer } from "mobx-react-lite";
import { useMemo, useRef } from "react";
import { schemaStore } from "#/features/schema-explorer/stores/schema-store";
import { useTransition } from "#/hooks/use-transition";
import { actions } from "#/lib/command";
import { prql } from "#/lib/prql/codemirror";
import type { QueryLanguage } from "#/lib/sql/types";
import { useQueryConsoleStore } from "../../context/query-console-context";

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
function toSqlNamespace(
  schema:
    | { tables: { name: string; columns: { name: string }[] }[] }
    | null
    | undefined,
) {
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

interface CodeEditorProps {
  language: QueryLanguage;
  placeholder?: string;
}

export const CodeEditor = observer(function CodeEditor({
  language,
  placeholder,
}: CodeEditorProps) {
  const store = useQueryConsoleStore();
  const { instanceId } = store;

  const value = language === "prql" ? store.prql : store.sql;
  const disabled = useTransition(["queryConsole.run", instanceId]);

  const languageExtension = useMemo(
    () =>
      language === "prql"
        ? prql()
        : sql({
            dialect: PostgreSQL,
            schema: toSqlNamespace(schemaStore.schema),
            upperCaseKeywords: true,
          }),
    [language],
  );

  // Reading the dispatch callbacks through a ref keeps the keymap — and
  // therefore the whole extension array — referentially stable, so CodeMirror
  // is never reconfigured while typing.
  const handlers = useRef({
    onRun: () =>
      actions.queryConsole.run(undefined, {
        instanceId,
        transition: ["queryConsole.run", instanceId],
      }),
    onTransform: () =>
      actions.queryConsole.transform(undefined, {
        instanceId,
        transition: ["queryConsole.transform", instanceId],
      }),
    disabled,
  });

  handlers.current = {
    onRun: () =>
      actions.queryConsole.run(undefined, {
        instanceId,
        transition: ["queryConsole.run", instanceId],
      }),
    onTransform: () =>
      actions.queryConsole.transform(undefined, {
        instanceId,
        transition: ["queryConsole.transform", instanceId],
      }),
    disabled,
  };

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
      onChange={(val) => {
        actions.queryConsole.editor[language](
          { template: val },
          { instanceId },
        );
      }}
      onFocus={() => {
        actions.queryConsole.editor.activate(language, { instanceId });
      }}
      extensions={extensions}
      basicSetup={BASIC_SETUP}
      editable={!disabled}
      readOnly={disabled}
      placeholder={placeholder}
      height="100%"
      className="h-full text-sm"
    />
  );
});
