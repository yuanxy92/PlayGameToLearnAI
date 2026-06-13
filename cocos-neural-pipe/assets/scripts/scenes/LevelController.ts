import { _decorator, Component } from "cc";
import { gameState } from "../app/GameState";
import { cloneLevel, evaluateLevel } from "../core/LinearWaterModel";
import { evaluateStars } from "../core/LevelEvaluator";
import { chapterOneLevels } from "../data/ChapterOneLevels";
import type { LevelConfig } from "../data/LevelTypes";

const { ccclass } = _decorator;

@ccclass("LevelController")
export class LevelController extends Component {
  private level: LevelConfig | null = null;

  start(): void {
    this.level = cloneLevel(chapterOneLevels[gameState.currentLevelIndex]);
  }

  installPipe(pipeId: string): void {
    if (!this.level) return;
    const pipe = this.level.pipes.find((item) => item.id === pipeId);
    if (!pipe) return;
    pipe.installed = true;
  }

  checkLevel(): number {
    if (!this.level) return 0;
    const result = evaluateLevel(this.level);
    const stars = evaluateStars(this.level);
    if (stars > 0) {
      gameState.saveLevel(this.level.id, stars);
    }
    return result.meanLoss;
  }
}
