/**
 * PRQL syntax highlighting for CodeMirror 6.
 *
 * This is an approximate highlighter, not a parser. PRQL publishes no
 * CodeMirror or Lezer package — the official grammar lives at
 * `grammars/prql-lezer/` in the PRQL repo and its README states it is not
 * published to any package manager. The token set below is derived from that
 * grammar, but this is a hand-written `StreamLanguage` tokenizer: it colours a
 * pipeline sensibly and makes no attempt to validate it. The compiler is the
 * source of truth for correctness; this is a placeholder until PRQL ships a
 * Lezer package.
 *
 * Client-safe: this file must never import `prqlc`.
 */
import {
  LanguageSupport,
  StreamLanguage,
  type StringStream,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";

/** Pipeline transforms and declaration keywords. */
const KEYWORDS = new Set([
  "aggregate",
  "append",
  "case",
  "derive",
  "distinct",
  "filter",
  "from",
  "func",
  "group",
  "import",
  "intersect",
  "into",
  "join",
  "let",
  "loop",
  "module",
  "prql",
  "remove",
  "select",
  "sort",
  "take",
  "type",
  "window",
]);

/** Standard library functions, mostly used in aggregate/window position. */
const BUILTINS = new Set([
  "all",
  "any",
  "as",
  "average",
  "concat_array",
  "count",
  "first",
  "in",
  "lag",
  "last",
  "lead",
  "max",
  "min",
  "rank",
  "round",
  "row_number",
  "stddev",
  "sum",
]);

const ATOMS = new Set(["true", "false", "null"]);

/** Multi-character operators, longest first so `==` wins over `=`. */
const OPERATORS = ["??", "->", "=>", "==", "!=", ">=", "<=", "&&", "||", ".."];
const OPERATOR_CHARS = "|+-*/%<>=!~^&";

/** Token name for an s-string, mapped to a distinct tag in `tokenTable`. */
const S_STRING = "prqlSString";

/** Carries an open (triple-quoted) string across line boundaries. */
interface PrqlState {
  /** Quote character terminating the open string, if any. */
  quote: string | null;
  /** Highlight token name to emit for the open string. */
  tokenType: string | null;
}

export const prqlLanguage = StreamLanguage.define<PrqlState>({
  name: "prql",

  startState: () => ({ quote: null, tokenType: null }),

  token(stream, state) {
    // Continuation of a triple-quoted string opened on a previous line.
    if (state.quote) return consumeString(stream, state);

    if (stream.eatSpace()) return null;

    // Comments run to the end of the line.
    if (stream.peek() === "#") {
      stream.skipToEnd();
      return "comment";
    }

    // Date/time literals: @2010-01-16, @16:30, @2010-01-16T00:00Z
    if (stream.peek() === "@") {
      stream.next();
      // A bare `@` introduces an annotation rather than a literal.
      return stream.eatWhile(/[\d\-:.TZ+]/) ? "literal" : "meta";
    }

    // f-strings and s-strings: a single-letter prefix directly before a quote.
    const prefix = stream.peek();
    if (
      (prefix === "f" || prefix === "s") &&
      isQuote(stream.string[stream.pos + 1])
    ) {
      stream.next();
      return startString(stream, state, prefix === "s" ? S_STRING : "string");
    }

    const ch = stream.peek();
    if (ch === undefined) {
      stream.skipToEnd();
      return null;
    }

    if (isQuote(ch)) return startString(stream, state, "string");

    // Numbers, including underscore separators, floats and exponents.
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\d_]/);
      if (stream.peek() === "." && /\d/.test(stream.string[stream.pos + 1])) {
        stream.next();
        stream.eatWhile(/[\d_]/);
      }
      if (stream.eat(/[eE]/)) {
        stream.eat(/[+-]/);
        stream.eatWhile(/\d/);
      }
      return "number";
    }

    // Identifiers and keywords. The `.` in `table.column` falls through to
    // punctuation below, so both halves highlight as identifiers.
    if (/[A-Za-z_]/.test(ch)) {
      stream.eatWhile(/[\w$]/);
      const word = stream.current();
      if (ATOMS.has(word)) return "atom";
      if (KEYWORDS.has(word)) return "keyword";
      if (BUILTINS.has(word)) return "function";
      return "variableName";
    }

    for (const op of OPERATORS) {
      if (stream.match(op)) return "operator";
    }

    stream.next();
    if (OPERATOR_CHARS.includes(ch)) return "operator";
    if ("()[]{}".includes(ch)) return "bracket";
    if (",:.".includes(ch)) return "punctuation";
    return null;
  },

  languageData: {
    commentTokens: { line: "#" },
    closeBrackets: { brackets: ["(", "[", "{", "'", '"'] },
  },

  tokenTable: {
    // s-strings are PRQL's raw-SQL escape hatch; worth telling apart from a
    // plain string at a glance.
    [S_STRING]: tags.special(tags.string),
    literal: tags.literal,
    function: tags.function(tags.variableName),
    bracket: tags.bracket,
    punctuation: tags.punctuation,
  },
});

function isQuote(ch: string | undefined): boolean {
  return ch === '"' || ch === "'";
}

/** Open a string at the stream position and consume as much of it as fits. */
function startString(
  stream: StringStream,
  state: PrqlState,
  tokenType: string,
): string {
  const quote = stream.next() as string;
  // A triple quote is the only form that may span lines.
  const triple =
    stream.string[stream.pos] === quote &&
    stream.string[stream.pos + 1] === quote;
  if (triple) {
    stream.next();
    stream.next();
  }
  state.quote = triple ? quote.repeat(3) : quote;
  state.tokenType = tokenType;
  return consumeString(stream, state);
}

/**
 * Consume the body of an open string. A single-quoted string that reaches the
 * end of the line is closed implicitly, so an unterminated string never leaks
 * its highlighting into the rest of the document.
 */
function consumeString(stream: StringStream, state: PrqlState): string {
  const tokenType = state.tokenType ?? "string";
  const closer = state.quote as string;
  const triple = closer.length === 3;
  const quote = closer[0];
  let escaped = false;

  while (!stream.eol()) {
    const ch = stream.next() as string;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch !== quote) continue;

    if (!triple) return closeString(state, tokenType);
    if (
      stream.string[stream.pos] === quote &&
      stream.string[stream.pos + 1] === quote
    ) {
      stream.next();
      stream.next();
      return closeString(state, tokenType);
    }
  }

  // Unterminated: only triple-quoted strings continue onto the next line.
  if (!triple) closeString(state, tokenType);
  return tokenType;
}

function closeString(state: PrqlState, tokenType: string): string {
  state.quote = null;
  state.tokenType = null;
  return tokenType;
}

/** PRQL language support, ready to hand to CodeMirror as an extension. */
export function prql(): LanguageSupport {
  return new LanguageSupport(prqlLanguage);
}
