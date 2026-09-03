// Storybook mock for `next/navigation`.
//
// The app router's hooks throw outside a mounted router ("invariant expected
// app router to be mounted"), which takes down any story for a component that
// navigates or refreshes — the prop sheet, and every editor like it. These
// stand-ins are inert: navigation is logged, never performed, so a story can
// exercise the component's own behaviour without a router around it.

const log = (method: string) => (...args: unknown[]) =>
  console.info(`[storybook] router.${method}`, ...args);

const router = {
  push: log("push"),
  replace: log("replace"),
  refresh: log("refresh"),
  back: log("back"),
  forward: log("forward"),
  prefetch: log("prefetch"),
};

export const useRouter = () => router;
export const usePathname = () => "/";
export const useParams = () => ({});
export const useSearchParams = () => new URLSearchParams();
export const useSelectedLayoutSegment = () => null;
export const useSelectedLayoutSegments = () => [];
export const redirect = log("redirect");
export const notFound = log("notFound");
