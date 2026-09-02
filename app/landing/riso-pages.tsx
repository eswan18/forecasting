import Link from "next/link";
import { RisoFrame, RisoFooter } from "./riso-shell";
import type { RisoSpec } from "./riso-seeds";

/** A simple /competitions/{id} rendered in the Riso language. */

const STANDINGS = [
  { rank: 1, name: "M. Calder", brier: "0.112" },
  { rank: 2, name: "R. Okonkwo", brier: "0.126" },
  { rank: 3, name: "J. Vance", brier: "0.131" },
  { rank: 4, name: "You", brier: "0.148", you: true },
  { rank: 5, name: "A. Lindqvist", brier: "0.155" },
  { rank: 6, name: "T. Mbeki", brier: "0.163" },
];

const PROPS = [
  { q: "The Fed cuts rates before July", you: "70%", crowd: "62%", closes: "30 Jun", state: "open" },
  { q: "Someone here runs a sub-3 marathon", you: "35%", crowd: "41%", closes: "15 Oct", state: "open" },
  { q: "A new COVID variant gets a Greek letter", you: "—", crowd: "18%", closes: "31 Dec", state: "needs" },
  { q: "Bitcoin closes the year above $150k", you: "22%", crowd: "29%", closes: "31 Dec", state: "open" },
];

const RESOLVED = [
  { q: "A US government shutdown before April", you: "30%", outcome: "NO", brier: "0.090" },
  { q: "Anyone in the group changes jobs", you: "80%", outcome: "YES", brier: "0.040" },
  { q: "England win the Ashes", you: "65%", outcome: "NO", brier: "0.423" },
];

export function RisoCompetition({ spec }: { spec: RisoSpec }) {
  return (
    <RisoFrame spec={spec}>
      <header className="top">
        <span className="mono">Haruspex</span>
        <span className="mono ink2">Inside a season</span>
      </header>

      {/* The interior opens the way the cover does — figure label, then the
          number the page is about, printed twice — but smaller, so the two
          openings read as a pair rather than a repeat. */}
      <div className="comphead">
        <div className="kicker rise">
          <span className="mono status">Open · closes 31 Dec</span>
          <span className="mono">12 forecasters · 47 questions</span>
        </div>
        <h1 className="season rise">The 2026 Season</h1>
      </div>

      <div className="hero" style={{ paddingTop: "2.5rem" }}>
        {/* caption stays neutral: Fig. 1 is whatever number the seed drew, so
            it is only "0.000" on the original */}
        <span className="mono fig rise">Fig. 2 — your Brier, season to date</span>
        <p className="bignum interior rise">
          <span className="ghost rise" aria-hidden="true">
            0.148
          </span>
          <span className="top-ink">0.148</span>
        </p>
        <p className="herolabel rise">
          Three forecasters off the top of the sheet, with 18 questions still
          open.
        </p>
      </div>

      <div className="stats rise" style={{ marginTop: "3.5rem" }}>
        <div className="stat">
          <b className="ink2">1</b>
          <span>Needs you</span>
        </div>
        <div className="stat">
          <b>18</b>
          <span>Pending</span>
        </div>
        <div className="stat">
          <b>28</b>
          <span>Resolved</span>
        </div>
        <div className="stat">
          <b>4th</b>
          <span>Your rank</span>
        </div>
      </div>

      <section className="rise">
        <h2>Open — your call</h2>
        <ul>
          {PROPS.map((p) => (
            <li key={p.q}>
              <span className="bullet" aria-hidden="true">
                {p.state === "needs" ? "!" : "?"}
              </span>
              <span className="q">{p.q}</span>
              <span className="tail">
                <i className="lead" aria-hidden="true" />
                <span className="fig-r">
                  {p.you === "—" ? (
                    <b>needs you</b>
                  ) : (
                    <>
                      you {p.you} <span>· crowd {p.crowd}</span>
                    </>
                  )}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rise">
        <h2>Resolved — what it cost</h2>
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th className="r">Outcome</th>
              <th className="r">Brier</th>
            </tr>
          </thead>
          <tbody>
            {RESOLVED.map((r) => (
              <tr key={r.q} className={Number(r.brier) > 0.25 ? "bad" : "good"}>
                <td>
                  {r.q}
                  <span className="said">you said {r.you}</span>
                </td>
                <td className="num r">{r.outcome}</td>
                <td className="num cost r">{r.brier}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">
          England cost you 0.423 on one question. That is what a confident wrong
          call is worth, and it is why the season is not decided by how many you
          got right.
        </p>
      </section>

      {/* Standings use the landing's leader-list vocabulary rather than a
          sidebar, so the single editorial column survives the app screen. */}
      <section className="rise">
        <h2>Standings</h2>
        <ul>
          <li className="stand head" aria-hidden="true">
            <span className="rank">#</span>
            <span className="q">Forecaster</span>
            <span className="tail">
              <i className="lead" />
              <span className="fig-r">Brier</span>
            </span>
          </li>
          {STANDINGS.map((s) => (
            <li className="stand" key={s.rank} aria-current={s.you || undefined}>
              <span className="rank">{String(s.rank).padStart(2, "0")}</span>
              <span className="q">
                {s.you ? <span className="you">{s.name}</span> : s.name}
              </span>
              <span className="tail">
                <i className="lead" aria-hidden="true" />
                <span className="fig-r">{s.brier}</span>
              </span>
            </li>
          ))}
          <li className="stand flat">
            <span className="rank">—</span>
            <span className="q">A coin, every time</span>
            <span className="tail">
              <i className="lead" aria-hidden="true" />
              <span className="fig-r">0.250</span>
            </span>
          </li>
        </ul>
      </section>

      <section className="cta">
        <p>One question is still waiting on you.</p>
        <Link className="btn" href="/login">
          Sign in to make the call
        </Link>
      </section>

      <RisoFooter spec={spec} here="competition" />
    </RisoFrame>
  );
}
