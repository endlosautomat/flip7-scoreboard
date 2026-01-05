import React, { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { useRef } from "react";



const STORAGE_KEY = "flip7_scoreboard_v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function popConfettiSmall() {
  confetti({
    particleCount: 60,
    spread: 55,
    startVelocity: 35,
    origin: { y: 0.85 },
  });
}

function popConfettiBig() {
  // “Feuerwerk” in 2–3 Salven
  confetti({ particleCount: 120, spread: 70, startVelocity: 45, origin: { y: 0.8 } });
  setTimeout(() => confetti({ particleCount: 140, spread: 95, startVelocity: 55, origin: { y: 0.75 } }), 180);
  setTimeout(() => confetti({ particleCount: 160, spread: 120, startVelocity: 60, origin: { y: 0.7 } }), 360);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clampInt(v) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

export default function App() {
  const [players, setPlayers] = useState(() => loadState()?.players ?? []);
  const [rounds, setRounds] = useState(() => {
  const s = loadState();
  const r = s?.rounds ?? [];

  return r.map((x) => {
    // neues Format -> alles gut
    if (x?.scores) return x;

    // altes Format migrieren
    if (x?.playerId != null) {
      return {
        id: x.id ?? uid(),
        ts: x.ts ?? Date.now(),
        note: x.note ?? "",
        scores: { [x.playerId]: Number(x.points) || 0 },
      };
    }

    return x;
  });
});

  // UI state
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [roundScores, setRoundScores] = useState(() => ({}));
  const [roundNote, setRoundNote] = useState("");
  const [lastLeaderId, setLastLeaderId] = useState(null);
  const confettiArmedRef = useRef(false);
  const lastLeaderIdRef = useRef(null);


  useEffect(() => {
    saveState({ players, rounds });
  }, [players, rounds]);



  useEffect(() => {
  // stelle sicher, dass alle Spieler einen Eintrag haben (default 0)
  setRoundScores((prev) => {
    const next = { ...prev };
      for (const p of players) {
        if (next[p.id] == null) next[p.id] = 0;
      }
      // entferne Scores von gelöschten Spielern
      for (const id of Object.keys(next)) {
      if (!players.some((p) => p.id === id)) delete next[id];
      }
      return next;
    });
  }, [players]);

  useEffect(() => {
  function onKeyDown(e) {
    // Keine Hotkeys, wenn du gerade in einem Input tippst? (optional)
    // Ich lass's aktiv, weil du ja in Inputs bist – aber wir verhindern nur "komische" Fälle:
    const key = e.key.toLowerCase();
    const tag = e.target?.tagName?.toLowerCase();
    const isTyping =
      tag === "input" || tag === "textarea" || e.target?.isContentEditable;

// ab hier: globale Hotkeys nur, wenn man NICHT tippt
if (isTyping) return;

    // Enter -> Runde speichern (aber nicht wenn Shift+Enter)
    if (key === "enter" && !e.shiftKey) {
      e.preventDefault();
      saveFullRound();
      return;
    }

    // x -> Alle 0
    if (key === "x") {
      // nur wenn keine Modifier gedrückt sind
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setAllZero();
      }
      return;
    }

    // z oder Ctrl+Z -> Undo
    const isUndo = key === "z" && (e.ctrlKey || e.metaKey || !e.ctrlKey);
    // Erklärung: Wir erlauben Z auch ohne Ctrl (Speedrun), und Ctrl/⌘+Z sowieso.
    if (key === "z" && (!e.altKey)) {
      e.preventDefault();
      undoLastRound();
    }
  }

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveFullRound, setAllZero, undoLastRound]);


  const totals = useMemo(() => {
    const map = Object.fromEntries(players.map((p) => [p.id, 0]));

    for (const r of rounds) {
      for (const [playerId, pts] of Object.entries(r.scores ?? {})) {
        map[playerId] = (map[playerId] ?? 0) + (Number(pts) || 0);
    }
  }
  return map;
  }, [players, rounds]);


 useEffect(() => {
  if (players.length === 0) return;

  // Leader berechnen
  let leaderId = null;
  let best = -Infinity;
  for (const p of players) {
    const t = totals[p.id] ?? 0;
    if (t > best) {
      best = t;
      leaderId = p.id;
    }
  }

  const prevLeader = lastLeaderIdRef.current;

  // 🎆 Nur feuern, wenn die letzte Aktion "Runde speichern" war
  if (confettiArmedRef.current) {
    if (prevLeader && leaderId && leaderId !== prevLeader) {
      popConfettiBig();
    }
    // nach einem Totals-Update wieder deaktivieren
    confettiArmedRef.current = false;
  }

  lastLeaderIdRef.current = leaderId;
}, [totals, players]);




  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0));
  }, [players, totals]);


  function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    const p = { id: uid(), name };
    setPlayers((prev) => [...prev, p]);
    setNewPlayerName("");
    setSelectedPlayerId(p.id);
  }

  function saveFullRound() {
  if (players.length === 0) return;

  const scores = {};
  for (const p of players) {
    scores[p.id] = Number(roundScores[p.id]) || 0;
  }

  const r = {
    id: uid(),
    ts: Date.now(),
    note: roundNote.trim(),
    scores,
  };
  confettiArmedRef.current = true;
  setRounds((prev) => [r, ...prev]);
  //popConfettiSmall();
  setRoundNote("");
}


  function setAllZero() {
    setRoundScores((prev) => {
      const next = { ...prev };
      for (const p of players) next[p.id] = 0;
      return next;
    });
  }

  function undoLastRound() {
    setRounds((prev) => prev.slice(1));
  }


  function removePlayer(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setRounds((prev) => prev.filter((r) => r.playerId !== id));
    if (selectedPlayerId === id) setSelectedPlayerId("");
  }

  function addRound() {
    if (!selectedPlayerId) return;
    const pts = clampInt(points);
    const r = {
      id: uid(),
      ts: Date.now(),
      playerId: selectedPlayerId,
      points: pts,
      note: note.trim(),
    };
    setRounds((prev) => [r, ...prev]);
    setPoints("");
    setNote("");
  }

  function undoLast() {
    setRounds((prev) => prev.slice(1));
  }

  function resetAll() {
    setRounds([]);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ players, rounds }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flip7-scoreboard.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function migrateRounds(rounds) {
  if (!Array.isArray(rounds)) return [];

  return rounds
    .map((x) => {
      // Neues Format
      if (x && typeof x === "object" && x.scores && typeof x.scores === "object") {
        return {
          id: String(x.id ?? uid()),
          ts: Number(x.ts ?? Date.now()),
          note: String(x.note ?? ""),
          scores: Object.fromEntries(
            Object.entries(x.scores).map(([k, v]) => [String(k), Number(v) || 0])
          ),
        };
      }

      // Altes Format (Einzel-Entry)
      if (x && typeof x === "object" && x.playerId != null) {
        return {
          id: String(x.id ?? uid()),
          ts: Number(x.ts ?? Date.now()),
          note: String(x.note ?? ""),
          scores: { [String(x.playerId)]: Number(x.points) || 0 },
        };
      }

      return null;
    })
    .filter(Boolean);
}

  function sanitizePlayers(players) {
    if (!Array.isArray(players)) return [];
    return players
      .map((p) => {
        if (!p || typeof p !== "object") return null;
        const id = String(p.id ?? "");
        const name = String(p.name ?? "").trim();
        if (!id || !name) return null;
        return { id, name };
      })
      .filter(Boolean);
  }

  function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));

        const nextPlayers = sanitizePlayers(data.players);
        const nextRounds = migrateRounds(data.rounds);

        // Optional: Runden auf bekannte Spieler-IDs begrenzen
        const knownIds = new Set(nextPlayers.map((p) => p.id));
        const filteredRounds = nextRounds.map((r) => ({
          ...r,
          scores: Object.fromEntries(
            Object.entries(r.scores).filter(([pid]) => knownIds.has(pid))
          ),
        }));

        setPlayers(nextPlayers);
        setRounds(filteredRounds);
      } catch (err) {
        console.error("Import failed:", err);
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  }


  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Flip7 Scoreboard</h1>
            <p className="text-sm text-zinc-300">
              Lokal gespeichert (localStorage). Schnell, clean, kein Drama.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={undoLast}
              className="rounded-xl bg-zinc-800 px-4 py-3 sm:py-2 text-sm font-medium hover:bg-zinc-700"
              disabled={rounds.length === 0}
              title="Letzten Eintrag rückgängig"
            >
              Undo
            </button>
            <button
              onClick={resetAll}
              className="rounded-xl bg-rose-600 px-4 py-3 sm:py-2 text-sm font-medium hover:bg-rose-500"
              disabled={rounds.length === 0}
              title="Alle Runden löschen"
            >
              Reset Runden
            </button>
            <button
              onClick={exportJson}
              className="rounded-xl bg-emerald-600 px-4 py-3 sm:py-2 text-sm font-medium hover:bg-emerald-500"
              title="Export als JSON"
            >
              Export
            </button>
            <label className="cursor-pointer rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500">
              Import
              <input type="file" accept="application/json" className="hidden" onChange={importJson} />
            </label>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Spieler */}
          <section className="rounded-2xl bg-zinc-900 p-5 shadow lg:sticky lg:top-6 lg:self-start">
            <div className="sticky top-0 z-20 -mx-5 bg-zinc-900 px-5 pb-3 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">Spieler</h2>

              <div className="mt-3 flex gap-2">
                <input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Name (z.B. Miro)"
                  className="w-full rounded-xl bg-zinc-800 px-3 py-3 sm:py-2 text-sm outline-none ring-1 ring-zinc-700 focus:ring-2 focus:ring-sky-500"
                />
                <button
                  onClick={addPlayer}
                  className="shrink-0 rounded-xl bg-sky-600 px-4 py-3 sm:py-2 text-sm font-medium hover:bg-sky-500"
                >
                  + Add
                </button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto px-1 space-y-2 pt-3">
              {sortedPlayers.length === 0 ? (
                <p className="text-sm text-zinc-400">Noch keine Spieler. Mach mal paar Legends rein.</p>
              ) : (
                sortedPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 ring-1 ${
                      idx === 0 ? "ring-2 ring-inset ring-emerald-500" : "ring-1 ring-inset ring-zinc-800"
                    } ${
                      selectedPlayerId === p.id ? "bg-zinc-800" : "bg-zinc-900"
                    }`}

                  >
                    <button
                      className="flex w-full items-center justify-between gap-3 text-left"
                      onClick={() => setSelectedPlayerId(p.id)}
                      title="Als aktiven Spieler wählen"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">#{idx + 1}</span>
                          <span className="truncate font-medium">{p.name}</span>
                        </div>
                        <div className="text-xs text-zinc-400">ID: {p.id.slice(0, 6)}…</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold tabular-nums">{totals[p.id] ?? 0}</div>
                        <div className="text-xs text-zinc-400">Punkte</div>
                      </div>
                    </button>

                    <button
                      onClick={() => removePlayer(p.id)}
                      className="ml-3 rounded-lg bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700"
                      title="Spieler entfernen"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Runde erfassen */}
          <section className="rounded-2xl bg-zinc-900 p-5 shadow">
            <h2 className="mb-3 text-lg font-semibold">Runde eintragen</h2>

            {players.length === 0 ? (
              <p className="text-sm text-zinc-400">Erst Spieler anlegen — dann Punkte eintragen</p> 
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  {players.map((p) => (
                    <div key={p.id} className="rounded-xl bg-zinc-800 p-3 ring-1 ring-zinc-700">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-zinc-400 tabular-nums">
                          Total: {totals[p.id] ?? 0}
                        </div>
                      </div>

                      <input
                        value={roundScores[p.id] ?? 0}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setRoundScores((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        inputMode="numeric"
                        className="w-full rounded-xl bg-zinc-900 px-3 py-3 sm:py-2 text-sm outline-none ring-1 ring-zinc-700 focus:ring-2 focus:ring-sky-500"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    value={roundNote}
                    onChange={(e) => setRoundNote(e.target.value)}
                    placeholder="Notiz zur Runde (optional)"
                    className="rounded-xl bg-zinc-800 px-3 py-3 sm:py-2 text-sm outline-none ring-1 ring-zinc-700 focus:ring-2 focus:ring-sky-500"
                  />

                  <button
                    onClick={saveFullRound}
                    className="rounded-xl bg-emerald-600 px-4 py-3 sm:py-2 text-sm font-semibold hover:bg-emerald-500"
                  >
                    Runde speichern (Enter)
                  </button>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={setAllZero}
                    className="rounded-xl bg-zinc-800 px-4 py-3 sm:py-2 text-sm font-medium hover:bg-zinc-700"
                    title="Setzt alle Eingaben auf 0"
                    disabled={players.length === 0}
                  >
                    Alle 0 (x)
                  </button>

                  <button
                    onClick={undoLastRound}
                    className="rounded-xl bg-rose-600 px-4 py-3 sm:py-2 text-sm font-medium hover:bg-rose-500 disabled:opacity-50"
                    title="Letzte Runde entfernen"
                    disabled={rounds.length === 0}
                  >
                    Undo letzte Runde (z)
                  </button>
                </div>


                {/* Historie */}
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold text-zinc-200">Historie</h3>

                <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                  {rounds.length === 0 ? (
                    <p className="text-sm text-zinc-400">Noch keine Runden. Let’s goooo.</p>
                  ) : (
                    rounds.map((r, idx) => {
                      const maxScore = Math.max(
                        ...Object.values(r.scores ?? {}).map((v) => Number(v) || 0)
                      );

                      return (
                        <div
                          key={r.id}
                          className="rounded-xl bg-zinc-800 px-3 py-2 ring-1 ring-zinc-700"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">
                                Runde #{rounds.length - idx}
                              </div>
                              <div className="text-xs text-zinc-400">
                                {new Date(r.ts).toLocaleString("de-DE")}
                                {r.note ? ` · ${r.note}` : ""}
                              </div>
                            </div>
                            <div className="text-xs text-zinc-300">
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
                                        ? "bg-emerald-500/10 ring-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.35)]"
                                        : "bg-zinc-900/60 ring-zinc-700"
                                    }`}
                                >
                                  <span className="truncate text-sm text-zinc-300">
                                    {p.name}
                                  </span>
                                  <span className="ml-3 text-sm font-semibold tabular-nums text-zinc-50">
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
              </>
            )}
          </section>

        </div>

        <footer className="mt-8 text-center text-xs text-zinc-500">
          Build: React + Tailwind · Speicher: localStorage · Mood: kompetent-chaotisch
        </footer>
      </div>
    </div>
  );
}
