import { ColumnContainer } from "./column-container";
import { KeyIcon } from "./key-icon";
import { List } from "./list";
import { Name } from "./name";
import { Type } from "./type";

const Column = {
  Container: ColumnContainer,
  KeyIcon,
  Name,
  Type,
} as const;

export const Columns = {
  List,
  Column,
} as const;
