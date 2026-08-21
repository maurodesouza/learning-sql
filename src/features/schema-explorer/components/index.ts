import { Container } from "./container";
import { Empty } from "./empty";
import { Enum } from "./enum";
import { EnumList } from "./enum-list";
import { ErrorState } from "./error";
import { Handles } from "./handles";
import { Header } from "./header";
import { Loading } from "./loading";
import { Provider } from "./provider";
import { Refresh } from "./refresh";
import { Search } from "./search";
import { TableItem } from "./table-item";
import { TableList } from "./table-list";

export const SchemaExplorer = {
  Provider,
  Handles,
  Container,
  Header,
  Search,
  Refresh,
  TableList,
  TableItem,
  EnumList,
  Enum,
  Loading,
  Error: ErrorState,
  Empty,
};
