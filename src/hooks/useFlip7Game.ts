import { useEffect, useMemo, useRef, useState } from "react";
import type { Player, Round, PersistedStateV2 } from "../types/flip7";
import { useLocalStorageState } from "./useLocalStorageState";
import { uid } from "../utils/id";
import { migrateRounds, sanitizePlayers } from "../utils/migrate";
import { toInt, toNumber } from "../utils/numbers";

const STORAGE_KEY = "flip7_scoreboard_v2";

export function useFlip7Game() {
  const [persisted, setPersisted] = useLocalStorageState<PersistedStateV2>(STORAGE_KEY, () => ({
    players: [],
    rounds: [],
  }));

  // UI state
  const [newPlayerName, setNewPlayerName] = useState("");
  const [roundScores, setRoundScores] = useState<Record<string, string | number>>({});
  const [roundNote, setRoundNote] = useState("");

  // Migration beim ersten Laden, falls irgendwo noch alt drin liegt
  useEffect(() => {
    // defensiv: falls persisted.rounds nicht Round[] ist (z.B. durch alte Version)
    const safePlayers = sanitizePlayers(persisted.players as unknown);
    const safeRounds = migrateRounds(persisted.rounds as unknown);

    // nur überschreiben, wenn was „anders“ ist (simple check)
    if (safePlayers.length !== persisted.players.length || safeRounds.length !== persisted.rounds.length) {
      setPersisted({ players: safePlayers, rounds: safeRounds });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const players = persisted.players;
  const rounds = persisted.rounds;

  // roundScores sync mit Spielern (default 0)
  useEffect(() => {
    setRoundScores((prev) => {
      const next: Record<string, string | number> = { ...prev };
      for (const p of players) if (next[p.id] == null) next[p.id] = 0;
      for (const id of Object.keys(next)) if (!players.some((p) => p.id === id)) delete next[id];
      return next;
    });
  }, [players]);

  const totals = useMemo(() => {
    const map: Record<string, number> = Object.fromEntries(players.map((p) => [p.id, 0]));
    for (const r of rounds) {
      for (const [playerId, pts] of Object.entries(r.scores ?? {})) {
        map[playerId] = (map[playerId] ?? 0) + (toNumber(pts) || 0);
      }
    }
    return map;
  }, [players, rounds]);

  function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    const p: Player = { id: uid(), name };
    setPersisted((prev) => ({ ...prev, players: [...prev.players, p] }));
    setNewPlayerName("");
  }

  function removePlayer(id: string) {
    setPersisted((prev) => ({
      players: prev.players.filter((p) => p.id !== id),
      rounds: prev.rounds.map((r) => ({
        ...r,
        scores: Object.fromEntries(Object.entries(r.scores).filter(([pid]) => pid !== id)),
      })),
    }));
  }

  function setAllZero() {
    setRoundScores((prev) => {
      const next = { ...prev };
      for (const p of players) next[p.id] = 0;
      return next;
    });
  }

  function undoLastRound() {
    setPersisted((prev) => ({ ...prev, rounds: prev.rounds.slice(1) }));
  }

  function saveFullRound() {
    if (players.length === 0) return;

    const scores: Record<string, number> = {};
    for (const p of players) scores[p.id] = toInt(roundScores[p.id]);

    const r: Round = {
      id: uid(),
      ts: Date.now(),
      note: roundNote.trim(),
      scores,
    };

    setPersisted((prev) => ({ ...prev, rounds: [r, ...prev.rounds] }));
    setRoundNote("");
  }

  // Import/Export
  function exportJson() {
    const blob = new Blob([JSON.stringify(persisted, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flip7-scoreboard.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const nextPlayers = sanitizePlayers(data.players);
        const nextRounds = migrateRounds(data.rounds);

        const known = new Set(nextPlayers.map((p) => p.id));
        const filteredRounds = nextRounds.map((r) => ({
          ...r,
          scores: Object.fromEntries(Object.entries(r.scores).filter(([pid]) => known.has(pid))),
        }));

        setPersisted({ players: nextPlayers, rounds: filteredRounds });
      } catch {
        // ignore
      }
    };
    reader.readAsText(file);
  }

  return {
    players,
    rounds,
    totals,

    newPlayerName,
    setNewPlayerName,
    addPlayer,
    removePlayer,

    roundScores,
    setRoundScores,
    roundNote,
    setRoundNote,

    saveFullRound,
    setAllZero,
    undoLastRound,

    exportJson,
    importJson,
  };
}
