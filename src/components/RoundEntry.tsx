import type { Player } from "../types/flip7";

interface Props {
  players: Player[];
  totals: Record<string, number>;
  roundScores: Record<string, string | number>;
  setRoundScores: React.Dispatch<React.SetStateAction<Record<string, string | number>>>;
  roundNote: string;
  setRoundNote: (v: string) => void;
  saveFullRound: () => void;
  setAllZero: () => void;
  undoLastRound: () => void;
  roundsCount: number;
}

export function RoundEntry({
  players,
  totals,
  roundScores,
  setRoundScores,
  roundNote,
  setRoundNote,
  saveFullRound,
  setAllZero,
  undoLastRound,
  roundsCount,
}: Props) {

  const TARGET = 200;

  const roundNo = roundsCount;
  const totalPoints = Object.values(totals).reduce((a, b) => a + (Number(b) || 0), 0);

  const sorted = [...players]
    .map((p) => ({ id: p.id, name: p.name, total: totals[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  const leader = sorted[0];

  const leaderTo200 = leader ? Math.max(0, TARGET - leader.total) : TARGET;
  const leaderAvg = leader && roundNo > 0 ? leader.total / roundNo : 0;

  // hübsch runden
  const leaderAvgRounded = Math.round(leaderAvg * 10) / 10; // 1 Nachkommastelle

  return (
    <section className="rounded-2xl bg-[var(--surface)] p-5 shadow">
      
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">Runde eintragen</h2>

        <div className="text-right">
          <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface2)] px-3 py-2 text-xs ring-1 ring-[var(--border)]">
            <span className="text-[var(--muted)]">Runden</span>
            <span className="font-semibold tabular-nums text-[var(--text)]">{roundNo}</span>

            <span className="mx-1 h-4 w-px bg-[var(--border)]" />

            <span className="text-[var(--muted)]">Ø/Runde</span>
            <span className="font-semibold tabular-nums text-[var(--text)]">
              {leader ? leaderAvgRounded : "–"}
            </span>
          </div>

          {leader ? (
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              Leader: <span className="text-[var(--text)]">{leader.name}</span>
              {" "}
              · bis <span className="text-[var(--text)]">{TARGET}</span>:{" "}
              <span className="font-semibold tabular-nums text-[var(--text)]">
                {leaderTo200}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              Noch keine Spieler
            </div>
          )}
        </div>
        
      </div>


      <div className="grid gap-2 sm:grid-cols-2">
        {players.map((p) => (
          <div key={p.id} className="rounded-xl bg-[var(--surface)] p-3 ring-1 ring-[var(--border)]">
            <div className="flex justify-between text-sm md:text-sm text-[16px] md:text-sm mb-1">
              <span>{p.name}</span>
              <span>Total: {totals[p.id] ?? 0}</span>
            </div>
            <input
              value={String(roundScores[p.id] ?? "")}
              inputMode="numeric"
              pattern="[0-9]*"
              type="text"
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                // nur Ziffern erlauben
                const digitsOnly = e.target.value.replace(/\D/g, "");
                setRoundScores((prev) => ({
                  ...prev,
                  [p.id]: digitsOnly === "" ? "" : String(Number(digitsOnly)), // entfernt führende Nullen
                }));
              }}
              className="w-full rounded-xl bg-[var(--surface2)] px-3 py-3 sm:py-2 text-base text-[var(--text)]
                ring-1 ring-[var(--border)] placeholder:text-[var(--muted)]
                focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={roundNote}
          onChange={(e) => setRoundNote(e.target.value)}
          placeholder="Notiz"
          className="rounded-xl bg-[var(--surface2)] px-3 py-3 sm:py-2 text-base text-[var(--text)]
          ring-1 ring-[var(--border)] placeholder:text-[var(--muted)]
          focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <button
          onClick={saveFullRound}
          className="rounded-xl bg-[var(--primary)] px-4 py-3 sm:py-2 font-semibold text-[var(--bg)]
          hover:bg-[var(--primary-hover)] transition-colors"
        >
          Runde speichern
        </button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <button onClick={setAllZero} 
          className="rounded-xl bg-[var(--surface)] py-3 sm:py-2 text-[var(--text)]
          ring-1 ring-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
          Alle 0 (X)
        </button>
        <button
          onClick={undoLastRound}
          disabled={roundsCount === 0}
          className="rounded-xl bg-[var(--danger)] py-3 sm:py-2 text-white
          hover:bg-[var(--danger-hover)] transition-colors disabled:opacity-50"
        >
          Undo
        </button>
      </div>
    </section>
  );
}
