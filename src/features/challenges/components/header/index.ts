import { HeaderContainer } from "./container";
import { LevelFilterSelect } from "./level-filter";
import { ProgressSummary } from "./progress-summary";
import { SearchInput } from "./search";

export const Header = {
  Container: HeaderContainer,
  Search: SearchInput,
  LevelFilter: LevelFilterSelect,
  ProgressSummary,
} as const;
