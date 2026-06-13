import { director } from "cc";

export const SceneNames = {
  boot: "Boot",
  home: "Home",
  map: "Map",
  level: "Level",
  chapterSummary: "ChapterSummary"
} as const;

export function goToScene(name: string): void {
  director.loadScene(name);
}
