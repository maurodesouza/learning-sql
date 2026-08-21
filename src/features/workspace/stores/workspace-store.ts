import {
  Model as FlexLayoutModel,
  type ILayoutApi,
  type Model,
} from "flexlayout-react";
import { action, observable } from "mobx";
import { INITIAL_MODEL } from "../model";

export class WorkspaceStore {
  @observable accessor model: Model;
  @observable accessor layoutApi: ILayoutApi | null = null;
  @observable accessor consoleCounter = 1;

  constructor() {
    this.model = FlexLayoutModel.fromJson(INITIAL_MODEL);
  }

  @action
  setLayoutApi(api: ILayoutApi | null) {
    this.layoutApi = api;
  }
}
