// src/App.tsx
import { useEffect, useRef, useState } from "react";
import { useFlip7Game } from "./hooks/useFlip7Game";
import { PlayerPanel } from "./components/PlayerPanel";
import { RoundEntry } from "./components/RoundEntry";
import { History } from "./components/History";

type Route = "game" | "history" | "settings";

function NavButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm ring-1 transition ${
        active
          ? "bg-[var(--surface2)] text-[var(--text)] ring-[var(--border)]"
          : "bg-[color:var(--surface)]/40 text-[var(--muted)] ring-[var(--border)] hover:bg-[color:var(--surface)]/70 hover:text-[var(--text)]"
      }`}

    >
      {children}
    </button>
  );
}

export default function App() {
  const game = useFlip7Game();
  const [route, setRoute] = useState<Route>("game");
  const importRef = useRef<HTMLInputElement | null>(null);

  // Hotkeys: Ctrl/⌘+Z = Undo, X = Alle 0, Enter = Runde speichern (außerhalb Inputs)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || (target as any)?.isContentEditable;

      const key = e.key;

      if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === "z") {
        e.preventDefault();
        game.undoLastRound();
        return;
      }

      if (!isTyping && key.toLowerCase() === "x") {
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          game.setAllZero();
        }
        return;
      }

      if (!isTyping && key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        game.saveFullRound();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--bg)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface)] ring-1 ring-[var(--border)]">
              <span className="text-sm font-black">F7</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">F7 Scoreboard</div>
              <div className="text-xs text-[var(--muted)]">
                {game.players.length} Spieler · {game.rounds.length} Runden
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-2">
            <NavButton active={route === "game"} onClick={() => setRoute("game")}>
              Spiel
            </NavButton>
            <NavButton
              active={route === "history"}
              onClick={() => setRoute("history")}
            >
              Historie
            </NavButton>
            <NavButton
              active={route === "settings"}
              onClick={() => setRoute("settings")}
            >
              Settings
            </NavButton>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={game.exportJson}
              className="rounded-xl bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] ring-1 ring-[var(--border)] hover:bg-[var(--surface2)]"
              title="Export als JSON"
            >
              Export
            </button>

            <button
              onClick={() => importRef.current?.click()}
              className="rounded-xl bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] ring-1 ring-[var(--border)] hover:bg-[var(--surface2)]"
              title="Import JSON"
            >
              Import
            </button>

            <button
              onClick={game.undoLastRound}
              disabled={game.rounds.length === 0}
              className="rounded-xl bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] ring-1 ring-[var(--border)] hover:bg-[var(--surface2)] disabled:opacity-50"
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>

            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) game.importJson(f);
                // reset, damit man dieselbe Datei erneut importieren kann
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="mx-auto max-w-6xl px-4 pb-3 md:hidden">
          <div className="grid grid-cols-3 gap-2">
            <NavButton active={route === "game"} onClick={() => setRoute("game")}>
              Spiel
            </NavButton>
            <NavButton
              active={route === "history"}
              onClick={() => setRoute("history")}
            >
              Historie
            </NavButton>
            <NavButton
              active={route === "settings"}
              onClick={() => setRoute("settings")}
            >
              Settings
            </NavButton>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl p-4">
        {route === "game" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <PlayerPanel
              players={game.players}
              totals={game.totals}
              newPlayerName={game.newPlayerName}
              setNewPlayerName={game.setNewPlayerName}
              addPlayer={game.addPlayer}
              removePlayer={game.removePlayer}
            />

            <div className="space-y-6">
              <RoundEntry
                players={game.players}
                totals={game.totals}
                roundScores={game.roundScores}
                setRoundScores={game.setRoundScores}
                roundNote={game.roundNote}
                setRoundNote={game.setRoundNote}
                saveFullRound={game.saveFullRound}
                setAllZero={game.setAllZero}
                undoLastRound={game.undoLastRound}
                roundsCount={game.rounds.length}
              />

              {/* Historie hier optional — ich würde sie im Game-Tab lassen }
              <History players={game.players} rounds={game.rounds} />
              { Historie hier optional — ich würde sie im Game-Tab lassen */}
            </div>
          </div>
        )}

        {route === "history" && (
          <div className="max-w-4xl h-[calc(100vh-8rem)]">
            <History
              players={game.players}
              rounds={game.rounds}
              className="h-full"
            />
          </div>
        )}

        {route === "settings" && (
          <div className="max-w-3xl rounded-2xl bg-[var(--surface)] p-5 ring-1 ring-[var(--border)]">
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Coming soon: Sessions, PWA, Multiplayer, etc. (steht im Backlog 😄)
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
