import { Container } from "./container";
import { EditorSplit } from "./editor-split";
import { Empty } from "./empty";
import { Handles } from "./handles";
import { Loading } from "./loading";
import { Provider } from "./provider";
import { Results } from "./results";
import { Toolbar } from "./toolbar";

export const QueryConsole = {
  Provider,
  Handles,
  Container,
  Toolbar,
  EditorSplit,
  Results,
  Loading,
  Empty,
} as const;
