import { _decorator, Component } from "cc";
import { goToScene, SceneNames } from "../app/SceneRouter";

const { ccclass } = _decorator;

@ccclass("HomeController")
export class HomeController extends Component {
  startGame(): void {
    goToScene(SceneNames.map);
  }
}
