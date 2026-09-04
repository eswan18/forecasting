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
  // Both buckets are already in hand, so the crossing link can carry the other
  // list's size — and be left off entirely when there is nothing over there.
  const other = showingResolved ? awaiting : resolved;

  return (
    <LayoutAxis
      props={buildPropViews({ props: source, isPrivate })}
      resolved={showingResolved}
      competitionName={competition.name}
      backHref={`/competitions/${competition.id}`}
      sibling={
        other.length > 0
          ? {
              href: `/competitions/${competition.id}/props/${
                showingResolved ? "awaiting" : "resolved"
              }`,
              label: showingResolved ? "Awaiting result" : "Resolved",
              count: other.length,
            }
          : undefined
      }
      competitionId={competition.id}
    />
  );
}
