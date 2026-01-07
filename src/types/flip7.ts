export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
}

export interface Round {
  id: string;
  ts: number;
  note: string;
  scores: Record<PlayerId, number>;
}

export interface PersistedStateV1 {
  players: Player[];
  rounds: unknown[]; // kann alt oder neu sein -> migrieren wir
}

export interface PersistedStateV2 {
  players: Player[];
  rounds: Round[];
}
