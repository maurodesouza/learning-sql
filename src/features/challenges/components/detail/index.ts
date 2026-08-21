import { BackButton } from "./back-button";
import { CheckButton } from "./check-button";
import { ConsolePicker } from "./console-picker";
import { Container } from "./container";
import { ExpectedResult } from "./expected-result";
import { ExpectedResultTable } from "./expected-result-table";
import { Feedback } from "./feedback";
import { Hints } from "./hints";
import { LevelBadge } from "./level-badge";
import { LoadStarterButton } from "./load-starter-button";
import { Prompt } from "./prompt";
import { Solution } from "./solution";
import { StatusBadge } from "./status-badge";
import { Title } from "./title";

export const Detail = {
  Container,
  BackButton,
  Title,
  LevelBadge,
  StatusBadge,
  Prompt,
  ConsolePicker,
  LoadStarterButton,
  CheckButton,
  Feedback,
  ExpectedResult,
  ExpectedResultTable,
  Hints,
  Solution,
} as const;
