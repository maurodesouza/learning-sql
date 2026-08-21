import { Container } from "./container";
import { Content } from "./content";
import { Detail } from "./detail";
import { Empty } from "./empty";
import { ErrorState } from "./error";
import { Handles } from "./handles";
import { Header } from "./header";
import { List } from "./list";
import { Loading } from "./loading";
import { Provider } from "./provider";

export const Challenges = {
  Provider,
  Handles,
  Container,
  Content,
  Header,
  List,
  Detail,
  Loading,
  Error: ErrorState,
  Empty,
} as const;
