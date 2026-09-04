// Storybook mock for `next/navigation`.
//
// The app router's hooks throw outside a mounted router ("invariant expected
// app router to be mounted"), which takes down any story for a component that
// navigates or refreshes — the prop sheet, and every editor like it.
//
// This keeps a URL of its own rather than being wholly inert, because a
// component that holds state in the query string reads it back through
// `useSearchParams`: if `replace` did nothing, its controls would not move.
// Everything else is still logged and never performed.

import { useSyncExternalStore } from "react";

let url = new URL("http://storybook.local/");

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// The snapshot has to be a stable value, not a fresh object, or
// `useSyncExternalStore` re-renders forever. The href is that value; the hooks
// below derive from it.
const getSnapshot = () => url.href;

const log =
  (method: string) =>
  (...args: unknown[]) =>
    console.info(`[storybook] router.${method}`, ...args);

const navigate =
  (method: string) =>
  (href: string, ...rest: unknown[]) => {
    console.info(`[storybook] router.${method}`, href, ...rest);
    url = new URL(href, url);
    listeners.forEach((listener) => listener());
  };

const router = {
  push: navigate("push"),
  replace: navigate("replace"),
  refresh: log("refresh"),
  back: log("back"),
  forward: log("forward"),
  prefetch: log("prefetch"),
};

export const useRouter = () => router;
export const usePathname = () =>
  new URL(useSyncExternalStore(subscribe, getSnapshot, getSnapshot)).pathname;
export const useParams = () => ({});
export const useSearchParams = () =>
  new URLSearchParams(
    new URL(useSyncExternalStore(subscribe, getSnapshot, getSnapshot)).search,
  );
export const useSelectedLayoutSegment = () => null;
export const useSelectedLayoutSegments = () => [];
export const redirect = log("redirect");
export const notFound = log("notFound");
