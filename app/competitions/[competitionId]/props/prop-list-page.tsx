import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import ErrorPage from "@/components/pages/error-page";
import {
  awaitingResult,
  buildPropViews,
  resolvedProps,
} from "@/components/prop-list/build-prop-views";
import { LayoutAxis } from "@/components/prop-list/layout-axis";
import { competitionAccess } from "../access";
import { AccessDenied } from "../access-denied";

/**
 * Both settled-prop routes: `awaiting` and `resolved` differ only in which
 * bucket they draw, so they share everything except that word.
 */
export async function PropListPage({
  competitionIdString,
  bucket,
}: {
  competitionIdString: string;
  bucket: "awaiting" | "resolved";
}) {
  const access = await competitionAccess(competitionIdString);
  if (!access.ok) return <AccessDenied access={access} />;

  const { competition, user } = access;
  const propsResult = await getPropsWithUserForecasts({
    userId: user.id,
    competitionId: competition.id,
  });
  if (!propsResult.success) return <ErrorPage title={propsResult.error} />;

  const isPrivate = competition.is_private;
  const resolved = resolvedProps(propsResult.data);
  const awaiting = awaitingResult(propsResult.data, isPrivate, new Date());

  const showingResolved = bucket === "resolved";
  const source = showingResolved ? resolved : awaiting;

  return (
    <LayoutAxis
      props={buildPropViews({ props: source, isPrivate })}
      resolved={showingResolved}
      competitionName={competition.name}
      backHref={`/competitions/${competition.id}`}
      // Both buckets are already in hand, so the chooser can print each one's
      // size and an empty destination is visible before it is chosen.
      buckets={{
        current: bucket,
        counts: { awaiting: awaiting.length, resolved: resolved.length },
      }}
      competitionId={competition.id}
    />
  );
}
