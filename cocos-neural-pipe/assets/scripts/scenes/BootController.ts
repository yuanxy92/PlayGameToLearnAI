import { _decorator, Component } from "cc";
import { gameState } from "../app/GameState";
import { goToScene, SceneNames } from "../app/SceneRouter";

const { ccclass } = _decorator;

@ccclass("BootController")
export class BootController extends Component {
  start(): void {
    gameState.load();
    goToScene(SceneNames.home);
  }
}
