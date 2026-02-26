let startTime = null;
let killCount = 0;

export function startTimer() {
  startTime = Date.now();
}

export function getTimeSurvived() {
  return startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
}

export function resetStats() {
  startTime = null;
  killCount = 0;
}

export function recordKill() {
  killCount += 1;
}

export function getKillCount() {
  return killCount;
}