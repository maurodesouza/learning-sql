"use client";

import { useSyncExternalStore } from "react";
import { InstanceRegistry } from "#/lib/command/instance-registry";
import type { Instance } from "#/lib/command/types";

const EMPTY: readonly Instance[] = Object.freeze([]);

/**
 * Subscribe to the InstanceRegistry for a given domain.
 *
 * Returns a referentially-stable snapshot (the registry caches the array per
 * domain and only invalidates it on add/remove). The server snapshot returns
 * a module-level frozen empty array to keep SSR consistent.
 */
export function useInstances(domain: string): readonly Instance[] {
  const registry = InstanceRegistry.getInstance();
  return useSyncExternalStore(
    (callback) => registry.subscribe(callback),
    () => registry.getInstances(domain),
    () => EMPTY,
  );
}
