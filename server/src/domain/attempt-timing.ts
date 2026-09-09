export type AttemptTiming = {
  startedAt: string;
  expiresAt: string;
  serverNow: string;
  durationMinutes: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  expired: boolean;
  boundedTotalSeconds: number;
};

export function calculateAttemptTiming(startedAt: string, durationMinutes: number, now = new Date()): AttemptTiming {
  const startedMs = Date.parse(startedAt);
  const durationSeconds = durationMinutes * 60;
  const expiresMs = startedMs + durationSeconds * 1_000;
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startedMs) / 1_000));
  const boundedTotalSeconds = Math.min(durationSeconds, elapsedSeconds);
  return {
    startedAt,
    expiresAt: new Date(expiresMs).toISOString(),
    serverNow: now.toISOString(),
    durationMinutes,
    elapsedSeconds,
    remainingSeconds: Math.max(0, durationSeconds - elapsedSeconds),
    expired: now.getTime() >= expiresMs,
    boundedTotalSeconds
  };
}
