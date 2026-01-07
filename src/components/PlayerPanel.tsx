import { useRef, useState } from "react";
import type { Player } from "../types/flip7";

interface Props {
  players: Player[];
  totals: Record<string, number>;
  newPlayerName: string;
  setNewPlayerName: (v: string) => void;
  addPlayer: () => void;
  removePlayer: (id: string) => void;
}

export function PlayerPanel({
  players,
  totals,
  newPlayerName,
  setNewPlayerName,
  addPlayer,
  removePlayer,
}: Props) {
  // Swipe state: welche Row ist "open" (Delete sichtbar + shift)
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null);

  // Swipe tracking
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const swipingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  function onPointerDown(e: React.PointerEvent, playerId: string) {
    // Swipe nur für Touch/Pen; Mouse = Desktop hover
    if (e.pointerType === "mouse") return;

    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    swipingRef.current = false;
  }

  function onPointerMove(e: React.PointerEvent, playerId: string) {
    if (e.pointerType === "mouse") return;
    if (pointerIdRef.current !== e.pointerId) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    // erst entscheiden ob horizontaler Swipe oder vertikales Scrollen
    if (!swipingRef.current) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < 12 && absY < 12) return;

      // horizontal dominiert -> swipe mode
      if (absX > absY * 1.2) {
        swipingRef.current = true;
        e.preventDefault();
      } else {
        // vertikal: lassen (scroll)
        return;
      }
    } else {
      e.preventDefault();
    }

    // links öffnen
    if (dx < -40) setOpenDeleteId(playerId);
    // rechts schließen (nur wenn die gleiche row offen ist)
    if (dx > 40) setOpenDeleteId((prev) => (prev === playerId ? null : prev));
  }

  function onPointerUp(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    if (pointerIdRef.current !== e.pointerId) return;

    pointerIdRef.current = null;
    swipingRef.current = false;
  }

  // Tap in die Section schließt offene Row (mobile nice)
  function closeOpenDelete() {
    if (openDeleteId) setOpenDeleteId(null);
  }


  const sortedPlayers = [...players].sort((a, b) => {
  const ta = totals[a.id] ?? 0;
  const tb = totals[b.id] ?? 0;

  // Erst nach Punkten (absteigend)
  if (tb !== ta) return tb - ta;

  // Tie-breaker: Name (stabil & nice)
  return a.name.localeCompare(b.name, "de");
  });

  return (
    <section
      className="rounded-2xl bg-[var(--surface)] p-5 shadow lg:sticky lg:top-6 lg:self-start"
      onClick={closeOpenDelete}
    >
      <div className="sticky top-0 z-20 -mx-5 bg-[var(--surface)] px-5 pb-3 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold">Spieler</h2>

        <div className="mt-3 flex gap-2">
          <input
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-xl bg-[var(--surface2)] px-3 py-3 sm:py-2 text-sm text-[var(--text)]
            ring-1 ring-[var(--border)] placeholder:text-[var(--muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"

          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              addPlayer();
            }}
            className="rounded-xl bg-[var(--primary)] px-4 py-3 sm:py-2 text-sm font-semibold text-[var(--bg)]
            hover:bg-[var(--primary-hover)] transition-colors"

          >
            + Add
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto px-1 pt-3 space-y-2">
        {sortedPlayers.map((p, idx) => {
          const isOpen = openDeleteId === p.id;
          return (
            <div
              key={p.id}
              className={`group relative overflow-hidden rounded-xl ring-1 ${
                idx === 0
                  ? "ring-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_16px_rgba(16,185,129,0.25)]"
                  : "ring-[var(--border)]"
              }`}
              onPointerDown={(e) => onPointerDown(e, p.id)}
              onPointerMove={(e) => onPointerMove(e, p.id)}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ touchAction: "pan-y" }}
              onClick={(e) => e.stopPropagation()} // nicht sofort schließen beim Tap auf die Row
            >
              {/* Action area (rechts) */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePlayer(p.id);
                    setOpenDeleteId(null);
                  }}
                  className={`rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition-opacity
                    ${
                      isOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none " +
                          "[@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 " +
                          "[@media(hover:hover)_and_(pointer:fine)]:group-hover:pointer-events-auto"
                    }`}
                  title="Spieler löschen"
                >
                  Löschen
                </button>
              </div>

              {/* Content (shifted left when open) */}
              <div
                className={`flex items-center justify-between gap-3 px-3 py-2 transition-transform duration-200
                  ${isOpen ? "-translate-x-20" : "translate-x-0"}`}
              >
                <span className="truncate">{p.name}</span>

                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-nums">{totals[p.id] ?? 0}</span>

                  {/* kleiner Hint nur Desktop hover */}
                  <span className="text-xs text-[var(--muted)] opacity-0 transition-opacity [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
                    ⇦
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
