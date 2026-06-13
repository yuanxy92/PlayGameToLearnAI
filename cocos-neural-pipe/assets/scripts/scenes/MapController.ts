import { _decorator, Component } from "cc";
import { gameState } from "../app/GameState";
import { goToScene, SceneNames } from "../app/SceneRouter";

const { ccclass } = _decorator;

@ccclass("MapController")
export class MapController extends Component {
  selectLevel(levelIndex: number): void {
    gameState.currentLevelIndex = levelIndex;
    goToScene(SceneNames.level);
  }
}
