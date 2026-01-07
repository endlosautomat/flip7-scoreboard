import { uid } from "./id";
import type { Player, Round } from "../types/flip7";
import { toNumber } from "./numbers";

export function sanitizePlayers(input: unknown): Player[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((p: any) => {
      const id = String(p?.id ?? "");
      const name = String(p?.name ?? "").trim();
      if (!id || !name) return null;
      return { id, name } satisfies Player;
    })
    .filter(Boolean) as Player[];
}

// akzeptiert altes oder neues Format und gibt Round[] zurück
export function migrateRounds(input: unknown): Round[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((x: any) => {
      // neues Format
      if (x && typeof x === "object" && x.scores && typeof x.scores === "object") {
        const scores: Record<string, number> = {};
        for (const [k, v] of Object.entries(x.scores)) scores[String(k)] = toNumber(v);

        return {
          id: String(x.id ?? uid()),
          ts: toNumber(x.ts) || Date.now(),
          note: String(x.note ?? ""),
          scores,
        } satisfies Round;
      }

      // altes Format
      if (x && typeof x === "object" && x.playerId != null) {
        return {
          id: String(x.id ?? uid()),
          ts: toNumber(x.ts) || Date.now(),
          note: String(x.note ?? ""),
          scores: { [String(x.playerId)]: toNumber(x.points) },
        } satisfies Round;
      }

      return null;
    })
    .filter(Boolean) as Round[];
}
