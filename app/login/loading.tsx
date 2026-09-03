import { LoginSheet } from "./login-sheet";

/**
 * The same sheet with its one control not yet live, so the door does not
 * change shape between the wait and the page.
 */
export default function Loading() {
  return <LoginSheet pending />;
}
