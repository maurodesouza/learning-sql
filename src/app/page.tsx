"use client";

import type { TabNode } from "flexlayout-react";
import { observer } from "mobx-react-lite";
import { Toaster } from "sonner";
import { ScrollArea } from "#/components/atoms/scroll-area";
import { AppHeader } from "#/components/organisms/app-header";
import { Challenges, useChallengesStore } from "#/features/challenges";
import { QueryConsole } from "#/features/query-console";
import { SchemaExplorer, useSchemaStore } from "#/features/schema-explorer";
import { Workspace } from "#/features/workspace";
import { useTransition } from "#/hooks/use-transition";

function QueryConsoleContent() {
  return (
    <QueryConsole.Container>
      <QueryConsole.Toolbar.Container>
        <QueryConsole.Toolbar.ExamplePicker />
        <QueryConsole.Toolbar.ShortcutHint />
        <QueryConsole.Toolbar.RunButton />
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

const ChallengesContent = observer(function ChallengesContent() {
  const store = useChallengesStore();
  const challengesLoading = useTransition(["challenges"]);

  return (
    <>
      <Challenges.Header.Container>
        {!store.isDetailOpen && (
          <>
            <Challenges.Header.Search />
            <Challenges.Header.LevelFilter />
            <Challenges.Header.ProgressSummary />
          </>
        )}
        {store.isDetailOpen && (
          <>
            <Challenges.Detail.BackButton />
            <Challenges.Detail.Title />
            <Challenges.Detail.LevelBadge />
            <Challenges.Detail.StatusBadge />
          </>
        )}
      </Challenges.Header.Container>
      <Challenges.Content
        loading={<Challenges.Loading />}
        list={
          challengesLoading ? (
            <Challenges.Loading />
          ) : store.totalCount === 0 ? (
            <Challenges.Empty />
          ) : (
            <Challenges.List.Container>
              {(
                Object.keys(store.groupedByLevel) as Array<
                  keyof typeof store.groupedByLevel
                >
              )
                .filter((level) => store.groupedByLevel[level].length > 0)
                .map((level) => {
                  const group = store.groupedByLevel[level];
                  const stats = store.solvedByLevel[level];
                  return (
                    <Challenges.List.LevelGroup
                      key={level}
                      level={level}
                      solved={stats.solved}
                      total={stats.total}
                    >
                      {group.map((challenge) => (
                        <Challenges.List.Item
                          key={challenge.slug}
                          challenge={challenge}
                        />
                      ))}
                    </Challenges.List.LevelGroup>
                  );
                })}
            </Challenges.List.Container>
          )
        }
        detail={
          <Challenges.Detail.Container>
            <Challenges.Detail.Prompt />
            <Challenges.Detail.ConsolePicker />
            <div className="flex items-center gap-2">
              <Challenges.Detail.LoadStarterButton />
              <Challenges.Detail.CheckButton />
            </div>
            <Challenges.Detail.Feedback />
            <div className="flex flex-col gap-2 border-t pt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reveal
              </span>
              <Challenges.Detail.ExpectedResult />
              <Challenges.Detail.Hints />
              <Challenges.Detail.Solution />
            </div>
          </Challenges.Detail.Container>
        }
      />
    </>
  );
});

function factory(node: TabNode): React.ReactNode {
  const component = node.getComponent();
  if (component === "queryConsole") {
    const config = node.getConfig() as { instanceId?: string } | undefined;
    const instanceId = config?.instanceId ?? node.getId();
    return (
      <Workspace.Layout.QueryConsoleTab instanceId={instanceId}>
        <QueryConsoleContent />
      </Workspace.Layout.QueryConsoleTab>
    );
  }
  if (component === "schemaExplorer") {
    return (
      <Workspace.Layout.SchemaExplorerTab>
        <SchemaExplorerContent />
      </Workspace.Layout.SchemaExplorerTab>
    );
  }
  if (component === "challenges") {
    return (
      <Workspace.Layout.ChallengesTab>
        <ChallengesContent />
      </Workspace.Layout.ChallengesTab>
    );
  }
  return <div>Unknown component</div>;
}

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <Toaster richColors position="bottom-right" />
      <AppHeader />
      <Workspace.Provider>
        <Workspace.Handles />
        <Workspace.Container>
          <Workspace.SideMenu.Container>
            <Workspace.SideMenu.AddQueryConsoleButton />
            <Workspace.SideMenu.AddSchemaExplorerButton />
            <Workspace.SideMenu.AddChallengesButton />
          </Workspace.SideMenu.Container>
          <Workspace.Layout.Container factory={factory} />
        </Workspace.Container>
      </Workspace.Provider>
    </div>
  );
}
