// src/components/History.tsx
import type { Player, Round } from "../types/flip7";

type Props = {
  players: Player[];
  rounds: Round[];
  className?: string;
};

export function History({ players, rounds, className }: Props) {
  return (
<div className={`mt-6 ${className ?? ""}`}>
      <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Historie</h3>

      <div className="h-full space-y-2 overflow-auto pr-1">
        {rounds.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Noch keine Runden. Let’s goooo.</p>
        ) : (
          rounds.map((r, idx) => {
            const maxScore = Math.max(
              ...Object.values(r.scores ?? {}).map((v) => Number(v) || 0)
            );

            return (
              <div
                key={r.id}
                className="rounded-xl bg-[var(--surface)] px-3 py-2 ring-1 ring-[var(--border)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      Runde #{rounds.length - idx}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {new Date(r.ts).toLocaleString("de-DE")}
                      {r.note ? ` · ${r.note}` : ""}
                    </div>
                  </div>

                  <div className="text-xs text-[var(--muted)]">
                    {Object.values(r.scores ?? {}).reduce(
                      (a, b) => a + (Number(b) || 0),
                      0
                    )}{" "}
                    pts
                  </div>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {players.map((p) => {
                    const score = Number(r.scores?.[p.id]) || 0;
                    const isLeader = score === maxScore && maxScore > 0;

                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 ring-1 transition
                        ${
                          isLeader
                            ? "bg-[var(--accent-soft)] ring-[var(--accent)] shadow-[0_0_16px_rgba(245,158,11,0.28)]"
                            : "bg-[var(--surface2)] ring-[var(--border)]"
                        }`}
                      >
                        <span className={`truncate text-sm ${
                            isLeader
                              ? "text-[var(--muted)]"
                              : "text-[var(--muted)]"
                          }`}>
                          {p.name}
                        </span>
                        <span className={`ml-3 text-sm font-semibold tabular-nums ${
                          isLeader
                              ? "text-[var(--text)]"
                              : "text-[var(--text)]"
                          }`}>
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
