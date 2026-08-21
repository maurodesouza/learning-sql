import { Container } from "./container";
import { DownloadButton } from "./download-button";
import { ExamplePicker } from "./example-picker";
import { RunButton } from "./run-button";
import { ShortcutHint } from "./shortcut-hint";

export const Toolbar = {
  Container,
  RunButton,
  ShortcutHint,
  ExamplePicker,
  DownloadButton,
} as const;
