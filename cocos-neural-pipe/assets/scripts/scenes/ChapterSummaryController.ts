import { _decorator, Component } from "cc";
import { goToScene, SceneNames } from "../app/SceneRouter";

const { ccclass } = _decorator;

@ccclass("ChapterSummaryController")
export class ChapterSummaryController extends Component {
  backToMap(): void {
    goToScene(SceneNames.map);
  }
}
