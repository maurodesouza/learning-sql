import { Container } from "./container";
import { Handles } from "./handles";
import { Layout2 } from "./layout";
import { Provider } from "./provider";
import { SideMenu } from "./side-menu";

export const Workspace = {
  Provider,
  Handles,
  Container,
  SideMenu,
  Layout: Layout2,
} as const;
