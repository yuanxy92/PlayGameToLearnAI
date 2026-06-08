import { levels } from "./levels.js";

export const storageKey = "pipenet-lab-progress-v3";
export const legacyStorageKeys = ["pipenet-lab-progress-v2", "pipenet-lab-progress-v1"];
export const urlParams = new URLSearchParams(window.location.search);
export const debugUnlock = ["play", "debug", "unlock"].some((key) => urlParams.get(key) === "1");

function loadProgress() {
  try {
    for (const key of [storageKey, ...legacyStorageKeys]) {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    return {};
  }
  return {};
}

export const GAME_STATE = {
  progress: loadProgress(),
  levelIndex: 0,
  mapChapter: urlParams.get("map") === "2" ? 2 : 1
};

export function isLevelUnlocked(index) {
  if (debugUnlock || index === 0) return true;
  const previous = levels[index - 1];
  return Boolean(previous && GAME_STATE.progress[previous.id] > 0);
}

export function requestedLevelIndex() {
  const raw = Number(urlParams.get("level"));
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(levels.length - 1, Math.round(raw) - 1));
}

export function passedCount() {
  return levels.filter((level) => GAME_STATE.progress[level.id] > 0).length;
}

export function saveProgress(level, stars) {
  const old = GAME_STATE.progress[level.id] || 0;
  if (stars > old) {
    GAME_STATE.progress[level.id] = stars;
    localStorage.setItem(storageKey, JSON.stringify(GAME_STATE.progress));
  }
}
