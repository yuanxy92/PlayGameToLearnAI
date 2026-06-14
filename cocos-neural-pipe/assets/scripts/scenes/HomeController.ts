import { _decorator, Color, Component, Graphics, Label, LabelOutline, Node, resources, Sprite, SpriteFrame, tween, UITransform, Vec3 } from "cc";
import { gameState } from "../app/GameState";
import { clamp, cloneLevel, evaluateLevel } from "../core/LinearWaterModel";
import { evaluateStars, pipeStrengthName, waterStatus } from "../core/LevelEvaluator";
import { chapterOneLevels } from "../data/ChapterOneLevels";
import type { LevelConfig } from "../data/LevelTypes";

const { ccclass } = _decorator;

@ccclass("HomeController")
export class HomeController extends Component {
  private activeLevel: LevelConfig | null = null;
  private activeLevelIndex = 0;

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
      new Vec3(-159, -610, 0),
      new Vec3(-69, -480, 0),
      new Vec3(-5, -304, 0),
      new Vec3(-113, -193, 0),
      new Vec3(18, -88, 0),
      new Vec3(115, 66, 0),
      new Vec3(34, 186, 0)
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
    content.addChild(this.createLabel("先试着让供水池贴近黄线。水路日志会告诉你哪里还差一点。", 0, -210, 34, new Color(32, 118, 190, 255), 760));
    content.addChild(this.createButton("StartLevelButton", 0, -610, 760, 120, "进入本关", () => this.startPlayableLevel(levelIndex)));
    content.addChild(this.createButton("BackToMapButton", 0, -780, 760, 120, "返回地图", () => this.buildPrototypeMap()));
  }

  private startPlayableLevel(levelIndex: number): void {
    this.activeLevelIndex = levelIndex;
    this.activeLevel = cloneLevel(chapterOneLevels[levelIndex]);
    gameState.currentLevelIndex = levelIndex;
    this.renderPlayableLevel();
  }

  private renderPlayableLevel(): void {
    if (!this.activeLevel) return;
    const level = this.activeLevel;
    const result = evaluateLevel(level);
    const stars = evaluateStars(level);
    const firstSample = level.samples[0];
    const firstResult = result.rows[0];

    const content = this.createContentLayer();
    content.addChild(this.createRect("Background", 0, 0, 1080, 1920, new Color(229, 247, 255, 255)));
    content.addChild(this.createLabel(`第 ${level.index} 关`, -340, 800, 34, new Color(32, 118, 190, 255), 240));
    content.addChild(this.createLabel(level.title, 0, 735, 68, new Color(36, 48, 74, 255), 840));
    content.addChild(this.createLabel(level.objective, 0, 650, 30, new Color(82, 96, 122, 255), 860));

    content.addChild(this.createRect("PlayField", 0, 210, 900, 720, new Color(250, 248, 236, 255), new Color(142, 190, 230, 255)));
    content.addChild(this.createWaterDiagram(level, firstResult.y, firstSample.target));

    const status = waterStatus(firstResult.y, firstSample.target);
    content.addChild(this.createOutputGauge(firstResult.y, firstSample.target, status));

    content.addChild(this.createRect("ControlPanel", 0, -610, 900, 460, new Color(255, 255, 255, 240), new Color(198, 219, 238, 255)));
    content.addChild(this.createLabel("调水路", -330, -425, 38, new Color(36, 48, 74, 255), 200));
    this.addPipeControls(content, level);
    this.addBiasControls(content, level);

    content.addChild(this.createLevelLog(level));
    content.addChild(this.createButton("TryWater", 215, -805, 410, 100, stars > 0 ? "通水成功" : "放水试试", () => this.checkPlayableLevel()));
    content.addChild(this.createButton("BackToBrief", -250, -805, 300, 100, "返回地图", () => this.buildPrototypeMap()));
  }

  private createWaterDiagram(level: LevelConfig, output: number, target: number): Node {
    const node = new Node("WaterDiagram");
    node.layer = this.node.layer;
    node.addComponent(UITransform).setContentSize(900, 720);
    const graphics = node.addComponent(Graphics);

    const inputYStart = 420;
    level.inputNames.forEach((name, index) => {
      const y = inputYStart - index * 155;
      node.addChild(this.createPoolNode(name, `流量 ${this.formatNumber(level.samples[0].inputs[index] ?? 0)}`, -310, y));
    });
    node.addChild(this.createPoolNode("合流池", "汇在这里", 0, 205));
    node.addChild(this.createPoolNode("供水池", waterStatus(output, target), 310, 205));

    level.pipes.forEach((pipe, index) => {
      const fromY = inputYStart - pipe.input * 155 - 315;
      const mergeY = 205 - 315;
      const color = !pipe.installed
        ? new Color(186, 196, 210, 190)
        : pipe.type === "pump"
          ? new Color(239, 92, 92, 220)
          : new Color(65, 177, 125, 220);
      graphics.strokeColor = color;
      graphics.lineWidth = Math.max(10, 18 + pipe.strength * 16);
      graphics.moveTo(-230, fromY);
      graphics.bezierCurveTo(-160, fromY + 20, -110, mergeY + index * 22, -75, mergeY);
      graphics.stroke();
    });

    graphics.strokeColor = new Color(67, 166, 232, 230);
    graphics.lineWidth = 24;
    graphics.moveTo(75, 205 - 315);
    graphics.bezierCurveTo(150, 205 - 315, 215, 205 - 315, 235, 205 - 315);
    graphics.stroke();
    return node;
  }

  private createPoolNode(title: string, subtitle: string, x: number, y: number): Node {
    const node = new Node(`${title}Pool`);
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x, y - 360, 0));
    node.addComponent(UITransform).setContentSize(170, 170);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(255, 249, 219, 245);
    graphics.circle(0, 45, 70);
    graphics.fill();
    graphics.strokeColor = new Color(78, 96, 126, 255);
    graphics.lineWidth = 8;
    graphics.circle(0, 45, 70);
    graphics.stroke();
    node.addChild(this.createLabel(title, 0, 52, 28, new Color(36, 48, 74, 255), 170));
    node.addChild(this.createLabel(subtitle, 0, 8, 22, new Color(82, 96, 122, 255), 170));
    return node;
  }

  private createOutputGauge(output: number, target: number, status: string): Node {
    const node = new Node("OutputGauge");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(0, -35, 0));
    node.addComponent(UITransform).setContentSize(760, 170);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(255, 255, 255, 245);
    graphics.roundRect(-380, -55, 760, 110, 34);
    graphics.fill();
    graphics.strokeColor = new Color(84, 101, 130, 255);
    graphics.lineWidth = 7;
    graphics.roundRect(-380, -55, 760, 110, 34);
    graphics.stroke();

    const levelWidth = clamp(output, 0, 1.2) / 1.2 * 720;
    if (levelWidth > 2) {
      graphics.fillColor = new Color(76, 181, 242, 235);
      graphics.roundRect(-360, -35, levelWidth, 70, 26);
      graphics.fill();
    }

    const targetX = -360 + clamp(target, 0, 1.2) / 1.2 * 720;
    graphics.strokeColor = new Color(255, 177, 42, 255);
    graphics.lineWidth = 8;
    graphics.moveTo(targetX, -58);
    graphics.lineTo(targetX, 58);
    graphics.stroke();

    node.addChild(this.createLabel(`供水池 ${this.formatNumber(output)} / 目标 ${this.formatNumber(target)}`, -65, 80, 28, new Color(36, 48, 74, 255), 520));
    node.addChild(this.createLabel(status, 285, 80, 28, new Color(32, 118, 190, 255), 180));
    return node;
  }

  private addPipeControls(content: Node, level: LevelConfig): void {
    level.pipes.forEach((pipe, index) => {
      const y = -505 - index * 94;
      const typeName = pipe.type === "pump" ? "抽水管" : "输水管";
      content.addChild(this.createLabel(`${pipe.label} · ${typeName} · ${pipe.installed ? pipeStrengthName(pipe.strength) : "未接"}`, -110, y, 26, new Color(36, 48, 74, 255), 500));
      content.addChild(this.createButton(`Install${pipe.id}`, -365, y, 160, 68, pipe.installed ? "已接" : "接上", () => {
        pipe.installed = true;
        this.renderPlayableLevel();
      }));
      if (!pipe.lockType) {
        content.addChild(this.createButton(`Type${pipe.id}`, 150, y, 130, 68, typeName, () => {
          pipe.type = pipe.type === "pump" ? "supply" : "pump";
          this.renderPlayableLevel();
        }));
      }
      if (!pipe.lockStrength) {
        content.addChild(this.createButton(`Minus${pipe.id}`, 285, y, 80, 68, "-", () => {
          pipe.strength = clamp(pipe.strength - 0.05, 0, 1.2);
          this.renderPlayableLevel();
        }));
        content.addChild(this.createButton(`Plus${pipe.id}`, 380, y, 80, 68, "+", () => {
          pipe.strength = clamp(pipe.strength + 0.05, 0, 1.2);
          this.renderPlayableLevel();
        }));
      }
    });
  }

  private addBiasControls(content: Node, level: LevelConfig): void {
    if (!level.bias) return;
    const y = -505 - level.pipes.length * 94;
    content.addChild(this.createLabel(`泵站水压 · ${this.formatNumber(level.bias.value)}`, -110, y, 26, new Color(36, 48, 74, 255), 500));
    content.addChild(this.createButton("BiasMinus", 285, y, 80, 68, "-", () => {
      if (!level.bias) return;
      level.bias.value = clamp(level.bias.value - 0.05, level.bias.min, level.bias.max);
      this.renderPlayableLevel();
    }));
    content.addChild(this.createButton("BiasPlus", 380, y, 80, 68, "+", () => {
      if (!level.bias) return;
      level.bias.value = clamp(level.bias.value + 0.05, level.bias.min, level.bias.max);
      this.renderPlayableLevel();
    }));
  }

  private createLevelLog(level: LevelConfig): Node {
    const node = new Node("LevelLog");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(0, -255, 0));
    node.addComponent(UITransform).setContentSize(860, 150);
    const result = evaluateLevel(level);
    const lines = result.rows.map((row, index) => {
      const sample = level.samples[index];
      return `${sample.label ?? `水情${index + 1}`}：${this.formatNumber(row.y)} / ${this.formatNumber(sample.target)} · ${waterStatus(row.y, sample.target)}`;
    });
    node.addChild(this.createLabel(lines.join("\n"), 0, 0, 25, new Color(82, 96, 122, 255), 820));
    return node;
  }

  private formatNumber(value: number): string {
    return value.toFixed(2);
  }

  private checkPlayableLevel(): void {
    if (!this.activeLevel) return;
    const stars = evaluateStars(this.activeLevel);
    if (stars <= 0) {
      this.renderPlayableLevel();
      return;
    }
    gameState.saveLevel(this.activeLevel.id, stars);
    this.showPassDialog(stars);
  }

  private showPassDialog(stars: number): void {
    if (!this.activeLevel) return;
    const level = this.activeLevel;
    const content = this.node.getChildByName("HomeContent")?.getChildByName("GameStage");
    if (!content) return;
    content.addChild(this.createRect("Dim", 0, 0, 1080, 1920, new Color(24, 34, 52, 120)));
    content.addChild(this.createRect("PassDialog", 0, 20, 820, 760, new Color(255, 255, 255, 248), new Color(255, 177, 42, 255)));
    content.addChild(this.createLabel("通水成功", 0, 250, 64, new Color(36, 48, 74, 255), 700));
    content.addChild(this.createLabel(`${"★".repeat(stars)}${"☆".repeat(3 - stars)}`, 0, 165, 44, new Color(255, 177, 42, 255), 300));
    content.addChild(this.createLabel(level.lesson, 0, 40, 32, new Color(82, 96, 122, 255), 680));
    const nextIndex = this.activeLevelIndex + 1;
    const hasNext = nextIndex < chapterOneLevels.length;
    content.addChild(this.createButton("NextLevel", 180, -230, 310, 100, hasNext ? "下一关" : "回地图", () => {
      if (hasNext) {
        this.buildLevelBrief(nextIndex);
      } else {
        this.buildPrototypeMap();
      }
    }));
    content.addChild(this.createButton("PassMap", -180, -230, 310, 100, "看地图", () => this.buildPrototypeMap()));
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

  private createLabel(name: string, x: number, y: number, size: number, color: Color, width = 900, outline?: { color: Color; width: number }): Node {
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
    if (outline) {
      const labelOutline = node.addComponent(LabelOutline);
      labelOutline.color = outline.color;
      labelOutline.width = outline.width;
    }
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
    node.addComponent(UITransform).setContentSize(130, 166);

    const disk = new Node(`LevelDisk${index}`);
    disk.layer = this.node.layer;
    disk.addComponent(UITransform).setContentSize(112, 112);
    const graphics = disk.addComponent(Graphics);
    graphics.fillColor = unlocked ? new Color(255, 255, 255, 178) : new Color(232, 238, 246, 140);
    graphics.circle(0, 30, 56);
    graphics.fill();
    graphics.strokeColor = passed ? new Color(47, 142, 232, 230) : unlocked ? new Color(255, 177, 42, 235) : new Color(164, 177, 196, 190);
    graphics.lineWidth = 10;
    graphics.circle(0, 30, 56);
    graphics.stroke();
    node.addChild(disk);

    node.addChild(this.createLabel(String(index), 0, 30, 50, unlocked ? new Color(17, 94, 170, 255) : new Color(111, 122, 142, 255), 110, {
      color: new Color(255, 255, 255, 230),
      width: 5
    }));
    node.addChild(this.createLabel(passed ? "已通水" : unlocked ? "可进入" : "未开", 0, -58, 25, new Color(36, 48, 74, 255), 120, {
      color: new Color(255, 255, 255, 245),
      width: 4
    }));
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
