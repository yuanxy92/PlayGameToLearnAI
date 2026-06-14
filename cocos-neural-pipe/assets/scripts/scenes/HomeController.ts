import { _decorator, Color, Component, Graphics, Label, Node, resources, Sprite, SpriteFrame, tween, UITransform, Vec3 } from "cc";
import { gameState } from "../app/GameState";
import { chapterOneLevels } from "../data/ChapterOneLevels";

const { ccclass } = _decorator;

@ccclass("HomeController")
export class HomeController extends Component {
  start(): void {
    gameState.load();
    this.buildPrototypeHome();
  }

  startGame(): void {
    this.buildPrototypeMap();
  }

  private buildPrototypeHome(): void {
    const content = this.createContentLayer();
    content.addChild(this.createRect("Background", 0, 0, 1080, 1920, new Color(230, 246, 255, 255)));
    content.addChild(this.createRect("StoryPanel", 0, -70, 900, 760, new Color(255, 255, 255, 235), new Color(142, 190, 230, 255)));
    content.addChild(this.createLabel("神经水厂", 0, 570, 86, new Color(36, 48, 74, 255)));
    content.addChild(this.createLabel("青溪镇通水冒险", 0, 470, 38, new Color(102, 114, 138, 255)));
    content.addChild(this.createLabel("清溪镇新建了一座会思考的水厂。", 0, 180, 46, new Color(36, 48, 74, 255), 780));
    content.addChild(this.createLabel("你要接管、调管、开泵，让供水池稳稳贴住黄线。第一章只做一件事：用水路直觉理解 y = wx + b。", 0, 40, 34, new Color(82, 96, 122, 255), 780));
    content.addChild(this.createButton("StartButton", 0, -610, 760, 130, "开始冒险", () => this.startGame()));
  }

  private buildPrototypeMap(): void {
    const content = this.createContentLayer();
    content.addChild(this.createRect("Background", 0, 0, 1080, 1920, new Color(230, 246, 255, 255)));
    content.addChild(this.createLabel("青溪镇地图", 0, 760, 78, new Color(36, 48, 74, 255)));
    content.addChild(this.createLabel("第 1 章：线性水路", 0, 670, 40, new Color(102, 114, 138, 255)));
    content.addChild(this.createRect("MapPanel", 0, -80, 860, 1400, new Color(244, 252, 242, 245), new Color(142, 190, 230, 255)));
    content.addChild(this.createMapArt());

    const positions = [
      new Vec3(-90, -610, 0),
      new Vec3(-24, -405, 0),
      new Vec3(-139, -275, 0),
      new Vec3(-13, -125, 0),
      new Vec3(129, 84, 0),
      new Vec3(33, 256, 0),
      new Vec3(204, 378, 0)
    ];

    chapterOneLevels.forEach((level, index) => {
      const unlocked = index === 0 || gameState.isLevelPassed(chapterOneLevels[index - 1].id);
      const passed = gameState.isLevelPassed(level.id);
      content.addChild(this.createLevelDisk(level.index, positions[index], unlocked, passed, () => {
        if (unlocked) {
          this.buildLevelBrief(index);
        } else {
          this.buildPrototypeMap();
        }
      }));
    });

    content.addChild(this.createButton("BackButton", 0, -850, 760, 110, "返回首页", () => this.buildPrototypeHome()));
  }

  private buildLevelBrief(levelIndex: number): void {
    const level = chapterOneLevels[levelIndex];
    gameState.currentLevelIndex = levelIndex;

    const content = this.createContentLayer();
    content.addChild(this.createRect("Background", 0, 0, 1080, 1920, new Color(230, 246, 255, 255)));
    content.addChild(this.createLabel(`第 ${level.index} 关`, 0, 760, 42, new Color(32, 118, 190, 255)));
    content.addChild(this.createLabel(level.title, 0, 660, 78, new Color(36, 48, 74, 255)));
    content.addChild(this.createRect("BriefPanel", 0, 40, 900, 1040, new Color(255, 255, 255, 235), new Color(142, 190, 230, 255)));
    content.addChild(this.createLabel(level.objective, 0, 330, 42, new Color(36, 48, 74, 255), 760));
    content.addChild(this.createLabel(level.concept, 0, 130, 36, new Color(82, 96, 122, 255), 760));
    content.addChild(this.createLabel(`水源：${level.inputNames.join("、")}`, 0, -40, 34, new Color(82, 96, 122, 255), 760));
    content.addChild(this.createLabel("真正的修水路玩法下一步接入。", 0, -210, 34, new Color(32, 118, 190, 255), 760));
    content.addChild(this.createButton("StartLevelButton", 0, -610, 760, 120, "进入本关", () => this.buildPrototypeMap()));
    content.addChild(this.createButton("BackToMapButton", 0, -780, 760, 120, "返回地图", () => this.buildPrototypeMap()));
  }

  private createContentLayer(): Node {
    this.node.getChildByName("HomeContent")?.destroy();
    const content = new Node("HomeContent");
    content.layer = this.node.layer;
    const canvasSize = this.node.getComponent(UITransform)?.contentSize;
    const viewportWidth = canvasSize?.width || 1080;
    const viewportHeight = canvasSize?.height || 1920;
    content.addComponent(UITransform).setContentSize(viewportWidth, viewportHeight);
    this.node.addChild(content);

    const stage = new Node("GameStage");
    stage.layer = this.node.layer;
    stage.addComponent(UITransform).setContentSize(1080, 1920);
    const scale = Math.min(viewportWidth / 1080, viewportHeight / 1920);
    stage.setScale(scale, scale, 1);
    content.addChild(stage);
    return stage;
  }

  private createRect(name: string, x: number, y: number, width: number, height: number, fill: Color, stroke?: Color): Node {
    const node = new Node(name);
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x - width / 2, y - height / 2, 0));
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    transform.setAnchorPoint(0, 0);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = fill;
    graphics.roundRect(0, 0, width, height, 42);
    graphics.fill();
    if (stroke) {
      graphics.strokeColor = stroke;
      graphics.lineWidth = 5;
      graphics.roundRect(0, 0, width, height, 42);
      graphics.stroke();
    }
    return node;
  }

  private createLabel(name: string, x: number, y: number, size: number, color: Color, width = 900): Node {
    const node = new Node(name);
    node.layer = this.node.layer;
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
    const labelNode = this.createLabel(caption, width / 2, height / 2, 44, new Color(255, 255, 255, 255), width);
    node.addChild(labelNode);
    node.on(Node.EventType.TOUCH_END, onClick, this);
    return node;
  }

  private createMapArt(): Node {
    const node = new Node("MapArt");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(0, -80, 0));
    node.addComponent(UITransform).setContentSize(780, 1365);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    resources.load("art/chapter1-map-bg/spriteFrame", SpriteFrame, (error, spriteFrame) => {
      if (error || !spriteFrame) {
        return;
      }
      sprite.spriteFrame = spriteFrame;
    });
    return node;
  }

  private createLevelDisk(index: number, position: Vec3, unlocked: boolean, passed: boolean, onClick: () => void): Node {
    const node = new Node(`Level${index}`);
    node.layer = this.node.layer;
    node.setPosition(position);
    node.addComponent(UITransform).setContentSize(150, 190);

    const disk = new Node(`LevelDisk${index}`);
    disk.layer = this.node.layer;
    disk.addComponent(UITransform).setContentSize(132, 132);
    const graphics = disk.addComponent(Graphics);
    graphics.fillColor = unlocked ? new Color(255, 255, 255, 255) : new Color(232, 238, 246, 255);
    graphics.circle(0, 34, 66);
    graphics.fill();
    graphics.strokeColor = passed ? new Color(47, 142, 232, 255) : unlocked ? new Color(255, 177, 42, 255) : new Color(164, 177, 196, 255);
    graphics.lineWidth = 12;
    graphics.circle(0, 34, 66);
    graphics.stroke();
    node.addChild(disk);

    node.addChild(this.createLabel(String(index), 0, 34, 54, unlocked ? new Color(32, 118, 190, 255) : new Color(142, 154, 174, 255), 120));
    node.addChild(this.createLabel(passed ? "已通水" : unlocked ? "可进入" : "未开", 0, -72, 28, new Color(82, 96, 122, 255), 140));
    node.on(Node.EventType.TOUCH_END, onClick, this);
    const pulse = unlocked ? 1.05 : 1.025;
    const duration = unlocked ? 0.85 : 1.35;
    tween(node)
      .repeatForever(
        tween<Node>()
          .to(duration, { scale: new Vec3(pulse, pulse, 1) })
          .to(duration, { scale: new Vec3(1, 1, 1) })
      )
      .start();
    return node;
  }
}
