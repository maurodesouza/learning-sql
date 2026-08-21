import { CodeEditor } from "./code-editor";
import { Container } from "./container";
import { Divider } from "./divider";
import { Pane } from "./pane";
import { PaneHeader } from "./pane-header";
import { TransformButton } from "./transform-button";

export const EditorSplit = {
  Container,
  Pane,
  PaneHeader,
  TransformButton,
  Divider,
  CodeEditor,
} as const;
