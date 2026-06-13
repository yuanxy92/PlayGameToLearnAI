import { _decorator, Color, Component, Graphics, Label, Node, UITransform, Vec3 } from "cc";
import { goToScene, SceneNames } from "../app/SceneRouter";

const { ccclass } = _decorator;

@ccclass("HomeController")
export class HomeController extends Component {
  start(): void {
    this.buildPrototypeHome();
  }

  startGame(): void {
    goToScene(SceneNames.map);
  }

  private buildPrototypeHome(): void {
    this.node.removeAllChildren();
    this.node.addChild(this.createRect("Background", 0, 0, 1080, 1920, new Color(230, 246, 255, 255)));
    this.node.addChild(this.createRect("StoryPanel", 0, -70, 900, 760, new Color(255, 255, 255, 235), new Color(142, 190, 230, 255)));
    this.node.addChild(this.createLabel("神经水厂", 0, 570, 86, new Color(36, 48, 74, 255)));
    this.node.addChild(this.createLabel("青溪镇通水冒险", 0, 470, 38, new Color(102, 114, 138, 255)));
    this.node.addChild(this.createLabel("清溪镇新建了一座会思考的水厂。", 0, 180, 46, new Color(36, 48, 74, 255), 780));
    this.node.addChild(this.createLabel("你要接管、调管、开泵，让供水池稳稳贴住黄线。第一章只做一件事：用水路直觉理解 y = wx + b。", 0, 40, 34, new Color(82, 96, 122, 255), 780));
    this.node.addChild(this.createButton("StartButton", 0, -610, 760, 130, "开始冒险", () => this.startGame()));
  }

  private createRect(name: string, x: number, y: number, width: number, height: number, fill: Color, stroke?: Color): Node {
    const node = new Node(name);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = fill;
    graphics.roundRect(-width / 2, -height / 2, width, height, 42);
    graphics.fill();
    if (stroke) {
      graphics.strokeColor = stroke;
      graphics.lineWidth = 5;
      graphics.roundRect(-width / 2, -height / 2, width, height, 42);
      graphics.stroke();
    }
    return node;
  }

  private createLabel(name: string, x: number, y: number, size: number, color: Color, width = 900): Node {
    const node = new Node(name);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, 180);
    const label = node.addComponent(Label);
    label.string = name;
    label.fontSize = size;
    label.lineHeight = Math.round(size * 1.24);
    label.color = color;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.RESIZE_HEIGHT;
    return node;
  }

  private createButton(name: string, x: number, y: number, width: number, height: number, caption: string, onClick: () => void): Node {
    const node = this.createRect(name, x, y, width, height, new Color(47, 142, 232, 255), new Color(30, 102, 181, 255));
    const labelNode = this.createLabel(caption, 0, 0, 44, new Color(255, 255, 255, 255), width);
    node.addChild(labelNode);
    node.on(Node.EventType.TOUCH_END, onClick, this);
    return node;
  }
}
