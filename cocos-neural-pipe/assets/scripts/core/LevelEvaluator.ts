import type { LevelConfig } from "../data/LevelTypes";
import { evaluateLevel } from "./LinearWaterModel";

export function starsForLoss(level: LevelConfig, loss: number): number {
  if (loss <= level.tolerance * 0.35) return 3;
  if (loss <= level.tolerance * 0.7) return 2;
  if (loss <= level.tolerance) return 1;
  return 0;
}

export function evaluateStars(level: LevelConfig): number {
  return starsForLoss(level, evaluateLevel(level).meanLoss);
}

export function waterStatus(output: number, target: number): string {
  const diff = output - target;
  const gap = Math.abs(diff);
  if (gap <= 0.02) return "刚刚好";
  if (gap <= 0.08) return diff > 0 ? "稍微偏高" : "稍微偏低";
  if (gap <= 0.25) return diff > 0 ? "水有点多" : "水有点少";
  return diff > 0 ? "快溢出了" : "水太少了";
}

export function pipeStrengthName(value: number): string {
  if (value <= 0.02) return "关闭";
  if (value < 0.35) return "细管";
  if (value < 0.65) return "中管";
  if (value < 0.95) return "粗管";
  return "全开";
}
