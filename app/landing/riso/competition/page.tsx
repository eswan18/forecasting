import { RisoCompetition } from "../../riso-pages";
import { ORIGINAL } from "../../riso-seeds";

export const metadata = { title: "Haruspex — the 2026 season" };

export default function Page() {
  return <RisoCompetition spec={ORIGINAL} />;
}
