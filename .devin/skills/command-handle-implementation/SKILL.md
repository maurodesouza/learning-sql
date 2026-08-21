# Command Handle Implementation

## When to use

Use this skill whenever you need to create or modify a command Handle — the component responsible for registering `command.handle()` listeners.

This includes:

- Creating a new Handle.
- Adding an action to an existing Handle.
- Refactoring an existing Handle.

Do not use this skill for general command architecture questions or command dispatching. Follow the `command-architecture` rule instead.

If the `command-architecture` rule is not available, invoke the `/setup-command-system` skill before implementing the Handle

## Before implementation

1. Identify the domain/feature that owns the Handle.
2. Confirm whether the action is `Action` or `ScopedAction`.
3. Check whether the action declaration already exists.
4. Check whether a Handle already exists for the domain.

Do not change the action scope or architecture merely to simplify the implementation.

## File structure

Shared application context:

```text
src/components/handles/<domain>/
├── <domain>-actions.ts
└── <domain>-handle.tsx
````

Feature context:

```text
src/features/<feature>/components/handles/<domain>/
├── <domain>-actions.ts
└── <domain>-handle.tsx
```

## Action declarations

If the action is new:

* Declare its type in `<domain>-actions.ts`.
* Extend `#/lib/command/global` through module augmentation.
* Use `Action` for global actions.
* Use `ScopedAction` for instance-specific actions.
* Never modify the global `Actions` interface directly.

If the action already exists, reuse its existing declaration. Do not redeclare it.

## Handle implementation

Handler functions MUST:

* Be defined inside the component.
* Be defined outside `useEffect`.
* Contain the application/orchestration logic.
* Call store mutations when state needs to change.
* Call external APIs when required.
* Dispatch other commands when required.

Example:

```typescript
export function MyHandle() {
  const store = useMyStore();

  async function handleDoThing(payload: Payload) {
    const result = await api.process(payload);

    store.setData(result);
  }

  useEffect(() => {
    const disposes = [
      command.handle("myDomain.doThing", handleDoThing),
    ];

    return () => {
      for (const dispose of disposes) dispose();
    };
  }, []);

  return null;
}
```

## Registration

`command.handle()` MUST:

* Be called inside `useEffect`.
* Receive handlers by reference.
* Receive `{ instanceId }` when registering a `ScopedAction`.
* Return a disposer that is cleaned up.

Do not put handler logic inline:

```typescript
// ❌ Wrong
command.handle("myDomain.doThing", async (payload) => {
  // logic
});
```

Use a named handler instead:

```typescript
// ✅ Correct
async function handleDoThing(payload: Payload) {
  // logic
}

command.handle("myDomain.doThing", handleDoThing);
```

## Cleanup

Store every disposer returned by `command.handle()`.

Dispose every handler when the Handle unmounts.

```typescript
useEffect(() => {
  const disposes = [
    command.handle("domain.action", handleAction),
    command.handle("domain.otherAction", handleOtherAction),
  ];

  return () => {
    for (const dispose of disposes) dispose();
  };
}, []);
```

## Dependencies

Use the correct `useEffect` dependencies.

If handlers close over a stable store reference and dependencies intentionally need to be omitted, use:

```typescript
// biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over the stable store reference
```

Always provide a clear reason for the suppression.

## Store vs Handle

Stores hold state.

Handles orchestrate behavior.

### Store

* Observable state.
* Computed state.
* Simple state mutations/setters.
* No external API calls.
* No business/application decisions.

### Handle

* Application/orchestration logic.
* Validation and decisions.
* API calls.
* Command dispatching.
* Coordination between stores and external systems.

Do not create a store that contains only business logic and no observable state.

## Dispatching from a Handle

Prefer the `actions` proxy for normal command dispatching:

```typescript
actions.domain.action(payload);
```

Do not use `command.dispatch()` merely because it is shorter or more convenient.

Direct `command.dispatch()` is reserved for external/realtime/AI triggers where there is no natural `actions` proxy context.

## Verification

Before finishing:

* [ ] `pnpm typecheck` passes.
* [ ] `pnpm lint` passes.
* [ ] Handlers are outside `useEffect`.
* [ ] `command.handle()` receives handlers by reference.
* [ ] All disposers are cleaned up.
* [ ] Scoped actions receive the correct `instanceId`.
* [ ] New actions use module augmentation.
* [ ] Existing actions are not redeclared.
* [ ] Store contains state/simple mutations, not orchestration logic.
* [ ] Normal dispatch uses the `actions` proxy.
* [ ] No unnecessary `command.dispatch()` is used.
