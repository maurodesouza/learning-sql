/**
 * Unit tests for the hand-written PRQL tokenizer.
 *
 * The tokenizer is driven directly through `StringStream`, one line at a time,
 * mirroring how `StreamLanguage` calls it — no editor or DOM required.
 */
import { StringStream } from "@codemirror/language";
import { describe, expect, it } from "vitest";
import { prqlLanguage } from "#/lib/prql/codemirror";

interface Token {
  text: string;
  type: string | null;
}

/** Tokenise a source string into `{ text, type }` pairs, skipping whitespace. */
function tokenize(source: string): Token[] {
  // `StreamLanguage.define` returns a Language whose parser holds the spec;
  // the spec functions are what we want to exercise.
  const spec = (
    prqlLanguage as unknown as {
      streamParser: {
        token: (stream: StringStream, state: unknown) => string | null;
        startState: (indentUnit: number) => unknown;
      };
    }
  ).streamParser;

  const state = spec.startState(2);
  const tokens: Token[] = [];

  for (const line of source.split("\n")) {
    const stream = new StringStream(line, 2, 2);
    let guard = 0;
    while (!stream.eol()) {
      stream.start = stream.pos;
      const type = spec.token(stream, state);
      if (stream.pos === stream.start) {
        // A zero-length token must advance the state; bail out rather than spin.
        throw new Error(`tokenizer made no progress at ${stream.pos}`);
      }
      const text = stream.current();
      if (text.trim().length > 0) tokens.push({ text, type });
      if (++guard > 500) throw new Error("tokenizer did not terminate");
    }
  }
  return tokens;
}

const typeOf = (tokens: Token[], text: string) =>
  tokens.find((t) => t.text === text)?.type;

describe("PRQL tokenizer", () => {
  it("tags transforms as keywords and identifiers as variable names", () => {
    const tokens = tokenize("from sellers | filter rating > 4 | take 10");
    expect(typeOf(tokens, "from")).toBe("keyword");
    expect(typeOf(tokens, "filter")).toBe("keyword");
    expect(typeOf(tokens, "take")).toBe("keyword");
    expect(typeOf(tokens, "sellers")).toBe("variableName");
    expect(typeOf(tokens, "rating")).toBe("variableName");
    expect(typeOf(tokens, "10")).toBe("number");
  });

  it("tags the pipe and comparison operators", () => {
    const tokens = tokenize("from a | filter x != 1 && y >= 2");
    expect(typeOf(tokens, "|")).toBe("operator");
    expect(typeOf(tokens, "!=")).toBe("operator");
    expect(typeOf(tokens, "&&")).toBe("operator");
    expect(typeOf(tokens, ">=")).toBe("operator");
  });

  it("tags aggregate built-ins as functions", () => {
    const tokens = tokenize(
      "group country ( aggregate { total = sum price } )",
    );
    expect(typeOf(tokens, "group")).toBe("keyword");
    expect(typeOf(tokens, "aggregate")).toBe("keyword");
    expect(typeOf(tokens, "sum")).toBe("function");
  });

  it("tags # comments to the end of the line", () => {
    const tokens = tokenize("from sellers # trailing comment | take 1\ntake 2");
    expect(typeOf(tokens, "# trailing comment | take 1")).toBe("comment");
    // The comment must not swallow the next line.
    expect(typeOf(tokens, "take")).toBe("keyword");
  });

  it("distinguishes s-strings from plain and f-strings", () => {
    const tokens = tokenize(
      `derive { a = s"COUNT(*)", b = f"{first}-{last}", c = "plain" }`,
    );
    expect(typeOf(tokens, `s"COUNT(*)"`)).toBe("prqlSString");
    expect(typeOf(tokens, `f"{first}-{last}"`)).toBe("string");
    expect(typeOf(tokens, `"plain"`)).toBe("string");
  });

  it("tags @date and @time literals", () => {
    const tokens = tokenize("filter d > @2010-01-16 && t > @16:30");
    expect(typeOf(tokens, "@2010-01-16")).toBe("literal");
    expect(typeOf(tokens, "@16:30")).toBe("literal");
  });

  it("tags a full datetime literal as one token", () => {
    const tokens = tokenize("filter ts > @2010-01-16T00:00");
    expect(typeOf(tokens, "@2010-01-16T00:00")).toBe("literal");
  });

  it("keeps both halves of a dotted reference as identifiers", () => {
    const tokens = tokenize("select orders.total");
    expect(typeOf(tokens, "orders")).toBe("variableName");
    expect(typeOf(tokens, ".")).toBe("punctuation");
    expect(typeOf(tokens, "total")).toBe("variableName");
  });

  it("tags booleans and null as atoms", () => {
    const tokens = tokenize("filter is_active == true && deleted == null");
    expect(typeOf(tokens, "true")).toBe("atom");
    expect(typeOf(tokens, "null")).toBe("atom");
  });

  it("handles numbers with underscores and floats", () => {
    const tokens = tokenize("filter n > 1_000_000 && r > 4.5");
    expect(typeOf(tokens, "1_000_000")).toBe("number");
    expect(typeOf(tokens, "4.5")).toBe("number");
  });

  it("does not let an unterminated string escape its line", () => {
    const tokens = tokenize(`derive a = "oops\nfrom sellers`);
    expect(typeOf(tokens, `"oops`)).toBe("string");
    expect(typeOf(tokens, "from")).toBe("keyword");
  });

  it("carries a triple-quoted string across lines", () => {
    const tokens = tokenize(
      `derive a = """line one\nline two"""\nfrom sellers`,
    );
    expect(tokens.filter((t) => t.type === "string").length).toBeGreaterThan(1);
    expect(typeOf(tokens, "from")).toBe("keyword");
  });

  it("terminates on escaped quotes and lone symbols", () => {
    expect(() =>
      tokenize(String.raw`derive a = "he said \"hi\"" | take 1`),
    ).not.toThrow();
    expect(() => tokenize("@ ??? $ `x`")).not.toThrow();
  });

  it("tokenises an empty document without spinning", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("\n\n")).toEqual([]);
  });
});
