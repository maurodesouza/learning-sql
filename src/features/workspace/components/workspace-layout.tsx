"use client";

import {
  type ILayoutApi,
  Layout,
  type Model,
  type TabNode,
} from "flexlayout-react";
import { observer } from "mobx-react-lite";
import { forwardRef } from "react";
import { ScrollArea } from "#/components/atoms/scroll-area";
import { QueryConsole } from "#/features/query-console";
import { SchemaExplorer, useSchemaStore } from "#/features/schema-explorer";
import { useTransition } from "#/hooks/use-transition";

function QueryConsoleContent() {
  return (
    <QueryConsole.Container>
      <QueryConsole.Toolbar.Container>
        <QueryConsole.Toolbar.RunButton />
        <QueryConsole.Toolbar.ShortcutHint />
        <QueryConsole.Toolbar.ExamplePicker />
        <QueryConsole.Toolbar.DownloadButton />
      </QueryConsole.Toolbar.Container>
      <QueryConsole.EditorSplit.Container>
        <QueryConsole.EditorSplit.Pane
          language="prql"
          header={
            <QueryConsole.EditorSplit.PaneHeader
              label="PRQL"
              action={<QueryConsole.EditorSplit.TransformButton />}
              shortcut="Ctrl/Cmd+E"
            />
          }
        >
          <QueryConsole.EditorSplit.CodeEditor
            language="prql"
            placeholder="from sellers | take 10"
          />
        </QueryConsole.EditorSplit.Pane>
        <QueryConsole.EditorSplit.Divider />
        <QueryConsole.EditorSplit.Pane
          language="sql"
          header={
            <QueryConsole.EditorSplit.PaneHeader
              label="SQL"
              shortcut="Ctrl/Cmd+Enter"
            />
          }
        >
          <QueryConsole.EditorSplit.CodeEditor
            language="sql"
            placeholder="SELECT * FROM sellers LIMIT 10;"
          />
        </QueryConsole.EditorSplit.Pane>
      </QueryConsole.EditorSplit.Container>
      <QueryConsole.Results.Container
        loading={<QueryConsole.Loading />}
        ok={<QueryConsole.Results.GridWrapper />}
        error={<QueryConsole.Results.ErrorDisplay />}
        empty={<QueryConsole.Empty />}
      />
    </QueryConsole.Container>
  );
}

const SchemaExplorerContent = observer(function SchemaExplorerContent() {
  const store = useSchemaStore();
  const schemaLoading = useTransition(["schema"]);

  if (schemaLoading) {
    return <SchemaExplorer.Loading />;
  }

  if (!store.hasSchema) {
    return <SchemaExplorer.Error />;
  }

  return (
    <>
      <SchemaExplorer.Header>
        <SchemaExplorer.Search />
        <SchemaExplorer.Refresh />
      </SchemaExplorer.Header>
      <ScrollArea className="flex-1 overflow-auto">
        <SchemaExplorer.TableList
          render={(table) => (
            <SchemaExplorer.TableItem.Provider table={table}>
              <SchemaExplorer.TableItem.Container>
                <SchemaExplorer.TableItem.Row>
                  <SchemaExplorer.TableItem.ToggleButton>
                    <SchemaExplorer.TableItem.Chevron />
                    <SchemaExplorer.TableItem.KindIcon />
                    <SchemaExplorer.TableItem.Name />
                    <SchemaExplorer.TableItem.RowCount />
                  </SchemaExplorer.TableItem.ToggleButton>
                  <SchemaExplorer.TableItem.CopyButton />
                </SchemaExplorer.TableItem.Row>
                <SchemaExplorer.TableItem.ExpandedContent>
                  <SchemaExplorer.TableItem.Columns.List
                    render={() => (
                      <SchemaExplorer.TableItem.Columns.Column.Container>
                        <SchemaExplorer.TableItem.Columns.Column.KeyIcon />
                        <SchemaExplorer.TableItem.Columns.Column.Name />
                        <SchemaExplorer.TableItem.Columns.Column.Type />
                      </SchemaExplorer.TableItem.Columns.Column.Container>
                    )}
                    empty={null}
                  />
                </SchemaExplorer.TableItem.ExpandedContent>
              </SchemaExplorer.TableItem.Container>
            </SchemaExplorer.TableItem.Provider>
          )}
          empty={<SchemaExplorer.Empty />}
        />
      </ScrollArea>
      <SchemaExplorer.EnumList.Container>
        <SchemaExplorer.EnumList.ToggleButton />
        <SchemaExplorer.EnumList.List
          render={() => (
            <SchemaExplorer.Enum.Item>
              <SchemaExplorer.Enum.Name />
              <SchemaExplorer.Enum.Values />
            </SchemaExplorer.Enum.Item>
          )}
          empty={null}
        />
      </SchemaExplorer.EnumList.Container>
    </>
  );
});

export interface WorkspaceLayoutProps {
  model: Model;
}

export const WorkspaceLayout = forwardRef<ILayoutApi, WorkspaceLayoutProps>(
  function WorkspaceLayout({ model }, ref) {
    function factory(node: TabNode): React.ReactNode {
      const component = node.getComponent();
      if (component === "queryConsole") {
        const config = node.getConfig() as { instanceId?: string } | undefined;
        const instanceId = config?.instanceId ?? node.getId();
        return (
          <QueryConsole.Provider instanceId={instanceId}>
            <QueryConsole.Handles />
            <QueryConsoleContent />
          </QueryConsole.Provider>
        );
      }
      if (component === "schemaExplorer") {
        return (
          <SchemaExplorer.Provider>
            <SchemaExplorer.Handles />
            <SchemaExplorer.Container>
              <SchemaExplorerContent />
            </SchemaExplorer.Container>
          </SchemaExplorer.Provider>
        );
      }
      return <div>Unknown component</div>;
    }

    return (
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Layout
          ref={ref}
          model={model}
          factory={factory}
          supportsPopout={false}
        />
      </div>
    );
  },
);
