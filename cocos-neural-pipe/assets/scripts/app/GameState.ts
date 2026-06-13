export interface ProgressState {
  [levelId: string]: number;
}

export class GameState {
  private static readonly storageKey = "neural-pipe-progress-v1";

  progress: ProgressState = {};
  currentLevelIndex = 0;

  load(): void {
    try {
      const raw = localStorage.getItem(GameState.storageKey);
      this.progress = raw ? JSON.parse(raw) : {};
    } catch {
      this.progress = {};
    }
  }

  saveLevel(levelId: string, stars: number): void {
    const oldStars = this.progress[levelId] ?? 0;
    if (stars <= oldStars) return;
    this.progress[levelId] = stars;
    localStorage.setItem(GameState.storageKey, JSON.stringify(this.progress));
  }

  isLevelPassed(levelId: string): boolean {
    return (this.progress[levelId] ?? 0) > 0;
  }
}

export const gameState = new GameState();
