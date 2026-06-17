import { _decorator, Color, Component, Graphics, Label, Node, resources, Sprite, SpriteFrame, tween, UITransform, Vec3 } from "cc";
import { gameState } from "../app/GameState";
import { clamp, cloneLevel, evaluateLevel } from "../core/LinearWaterModel";
import { evaluateStars, pipeStrengthName, waterStatus } from "../core/LevelEvaluator";
import { chapterOneLevels } from "../data/ChapterOneLevels";
import { LEVEL_ONE_LAYOUT, type GameLabelLayout, type LabelLayout, type RectLayout, type VisualNodeKind, type VisualPipeLayout, type VisualPipeState } from "../data/LevelOneLayout";
import type { LevelConfig, PipeConfig } from "../data/LevelTypes";
import { createGeneratedPipeVisual, resolveVisualPipePath } from "../ui/PipeRouteTool";
import { createWaterGauge } from "../ui/WaterGaugeTool";

const { ccclass } = _decorator;

type LevelOneLayers = {
  background: Node;
  nodes: Node;
  pipes: Node;
  flow: Node;
  labels: Node;
  input: Node;
  hud: Node;
};

@ccclass("HomeController")
export class HomeController extends Component {
  private activeLevel: LevelConfig | null = null;
  private activeLevelIndex = 0;
  private selectedPipeId: string | null = null;

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
    this.selectedPipeId = this.activeLevel.pipes[0]?.id ?? null;
    gameState.currentLevelIndex = levelIndex;
    this.renderPlayableLevel();
  }

  private renderPlayableLevel(): void {
    if (!this.activeLevel) return;
    if (this.activeLevelIndex === 0) {
      this.renderAssetizedLevelOne();
      return;
    }

    const level = this.activeLevel;
    const result = evaluateLevel(level);
    const stars = evaluateStars(level);
    const firstSample = level.samples[0];
    const firstResult = result.rows[0];

    const content = this.createContentLayer();
    content.addChild(this.createRect("Background", 0, 0, 1080, 1920, new Color(214, 240, 229, 255)));
    content.addChild(this.createLevelArt());
    content.addChild(this.createPlayableTopHud(level));
    content.addChild(this.createWaterDiagram(level, firstResult.y, firstSample.target));
    this.addPipeFlow(content, level, firstResult.y);
    this.addScenePipeHotspots(content, level);

    const status = waterStatus(firstResult.y, firstSample.target);
    content.addChild(this.createControlDock(level, firstResult.y, firstSample.target, status, stars));
  }

  private renderAssetizedLevelOne(): void {
    if (!this.activeLevel) return;
    const level = this.activeLevel;
    const result = evaluateLevel(level);
    const stars = evaluateStars(level);
    const sample = level.samples[0];
    const row = result.rows[0];
    const status = waterStatus(row.y, sample.target);
    const pipe = level.pipes[0];
    const layout = LEVEL_ONE_LAYOUT;

    const content = this.createContentLayer();
    const layers = this.createLevelOneLayers(content);
    layers.background.addChild(this.createSprite("Level1CleanBackground", layout.background.path, layout.background.x, layout.background.y, layout.background.width, layout.background.height));
    layers.hud.addChild(this.createSprite("Level1BottomHudArt", layout.hudArt.bottom.path, layout.hudArt.bottom.x, layout.hudArt.bottom.y, layout.hudArt.bottom.width, layout.hudArt.bottom.height));
    layers.hud.addChild(this.createLevelOneTitleWidget(level));
    layers.hud.addChild(this.createLevelOneMapButtonWidget());

    this.addLevelOneVisualNodes(layers.nodes);
    this.addLevelOnePipeInteraction(layers.pipes, layers.input, level, pipe);
    if (pipe.installed) {
      this.addLevelOneFixedPipes(layers.pipes);
      this.addLevelOneAmbientPulse(layers.flow);
      this.addLevelOneFlow(layers.flow);
    }
    this.addLevelOneSceneLabels(layers.labels, level, row.y, sample.target);

    layers.hud.addChild(this.createLevelOneObjectivePlate(layout.top.objective));
    layers.hud.addChild(this.createLevelOneText(level.objective, layout.top.objective, new Color(35, 56, 87, 255), {
      color: new Color(255, 255, 255, 245),
      width: 4
    }));
    layers.input.addChild(this.createInvisibleButton("Level1MapButton", layout.top.mapButton.x, layout.top.mapButton.y, layout.top.mapButton.width, layout.top.mapButton.height, () => this.buildPrototypeMap()));
    this.addLevelOneControlDock(layers.hud, layers.input, level, row.y, sample.target, status, stars);
  }

  private createLevelOneLayers(content: Node): LevelOneLayers {
    const names: Array<keyof LevelOneLayers> = ["background", "nodes", "pipes", "labels", "hud", "flow", "input"];
    const layers = {} as LevelOneLayers;
    names.forEach((name) => {
      const layer = new Node(`Level1${name[0].toUpperCase()}${name.slice(1)}Layer`);
      layer.layer = this.node.layer;
      layer.addComponent(UITransform).setContentSize(1080, 1920);
      content.addChild(layer);
      layers[name] = layer;
    });
    return layers;
  }

  private addLevelOneVisualNodes(content: Node): void {
    LEVEL_ONE_LAYOUT.visualNodes.forEach((visualNode) => {
      const path = this.getLevelOneNodeResource(visualNode.kind);
      const node = this.createSprite(
        `Level1${visualNode.id}Node`,
        path,
        visualNode.x,
        visualNode.y,
        visualNode.width,
        visualNode.height
      );
      const delay = visualNode.kind === "merge" ? 0.22 : visualNode.kind === "tank" ? 0.38 : 0;
      tween(node)
        .delay(delay)
        .repeatForever(
          tween<Node>()
            .to(1.1, { scale: new Vec3(1.018, 1.018, 1) })
            .to(1.1, { scale: new Vec3(1, 1, 1) })
        )
        .start();
      content.addChild(node);
    });
  }

  private getLevelOneNodeResource(kind: VisualNodeKind): string {
    if (kind === "source") return "art/level1/spring-node";
    if (kind === "merge") return "art/level1/merge-node";
    if (kind === "tank") return "art/level1/tank-node";
    return "art/level1/tank-node";
  }

  private addLevelOneFixedPipes(content: Node): void {
    LEVEL_ONE_LAYOUT.visualPipes
      .filter((pipe) => pipe.pipeId !== this.activeLevel?.pipes[0]?.id)
      .forEach((pipe) => {
        content.addChild(this.createLevelOneRoutePipe(`Level1FixedRoutePipe-${pipe.pipeId}`, pipe, pipe.state));
      });
  }

  private addLevelOneSceneLabels(content: Node, level: LevelConfig, output: number, target: number): void {
    const sourceValue = level.samples[0].inputs[0] ?? 0;
    const layout = LEVEL_ONE_LAYOUT.visualNodes;
    const source = layout.find((node) => node.id === "source")?.label ?? LEVEL_ONE_LAYOUT.scene.source;
    const merge = layout.find((node) => node.id === "merge")?.label ?? LEVEL_ONE_LAYOUT.scene.merge;
    const tank = layout.find((node) => node.id === "tank")?.label ?? LEVEL_ONE_LAYOUT.scene.tank;
    content.addChild(this.createGameLabel("山泉", `流量 ${this.formatNumber(sourceValue)}`, source));
    content.addChild(this.createGameLabel("合流池", output > 0.01 ? "水流汇入" : "等待接管", merge));
    content.addChild(this.createGameLabel("供水池", waterStatus(output, target), tank));
  }

  private addLevelOnePipeInteraction(pipeLayer: Node, inputLayer: Node, level: LevelConfig, pipe: PipeConfig): void {
    const fallbackLayout: VisualPipeLayout = {
      ...LEVEL_ONE_LAYOUT.pipe,
      pipeId: pipe.id,
      state: "supply",
      flowPath: LEVEL_ONE_LAYOUT.flow.sourceToMerge.map((point) => ({ x: point.x, y: point.y }))
    };
    const layout = LEVEL_ONE_LAYOUT.visualPipes.find((visualPipe) => visualPipe.pipeId === pipe.id) ?? fallbackLayout;
    if (!pipe.installed) {
      pipeLayer.addChild(this.createSprite("Level1PipeGlow", "art/level1/pipe-socket-glow", layout.glow.x, layout.glow.y, layout.glow.width, layout.glow.height));
      pipeLayer.addChild(this.createPulseRing(layout.glow.x, layout.glow.y, 68, new Color(255, 205, 58, 125)));
      pipeLayer.addChild(this.createLevelOneText("点亮管口", layout.prompt, new Color(31, 118, 190, 255), {
        color: new Color(255, 255, 255, 255),
        width: 4
      }));
    } else {
      pipeLayer.addChild(this.createLevelOneRoutePipe(
        `Level1RoutePipe-${pipe.id}`,
        layout,
        pipe.type === "pump" ? "pump" : "supply"
      ));
    }

    inputLayer.addChild(this.createInvisibleButton("Level1PipeSocket", layout.hitbox.x, layout.hitbox.y, layout.hitbox.width, layout.hitbox.height, () => {
      if (!this.activeLevel) return;
      const activePipe = this.activeLevel.pipes[0];
      activePipe.installed = true;
      this.selectedPipeId = activePipe.id;
      this.renderPlayableLevel();
    }));
  }

  private createLevelOneRoutePipe(name: string, pipe: VisualPipeLayout, state: VisualPipeState): Node {
    const path = resolveVisualPipePath(pipe, LEVEL_ONE_LAYOUT.visualNodes);
    const thickness = pipe.thickness ?? Math.max(28, Math.round(pipe.connector.height * 0.62));
    return createGeneratedPipeVisual({
      name,
      path,
      state,
      thickness,
      layer: this.node.layer
    });
  }

  private addLevelOneControlDock(content: Node, inputLayer: Node, level: LevelConfig, output: number, target: number, status: string, stars: number): void {
    const layout = LEVEL_ONE_LAYOUT;
    content.addChild(createWaterGauge({
      name: "Level1WaterGauge",
      current: output,
      target,
      startX: layout.gauge.startX,
      width: layout.gauge.width,
      y: layout.gauge.y,
      max: layout.gauge.max,
      fillHeight: layout.gauge.fillHeight,
      targetHeight: layout.gauge.targetHeight,
      layer: this.node.layer
    }));

    content.addChild(this.createLevelOneText("供水池水位", layout.gauge.title, new Color(35, 56, 87, 255)));
    content.addChild(this.createLevelOneText(`黄线 ${this.formatNumber(target)}`, layout.gauge.targetText, new Color(31, 118, 190, 255)));
    content.addChild(this.createLevelOneText(`当前 ${this.formatNumber(output)} · ${status}`, layout.status.current, new Color(35, 56, 87, 255), {
      color: new Color(255, 255, 255, 235),
      width: 4
    }));
    content.addChild(this.createLevelOneText("返回", layout.buttons.backText, new Color(31, 83, 145, 255)));
    content.addChild(this.createLevelOneText(stars > 0 ? "通水成功" : "放水试试", layout.buttons.mainText, new Color(255, 255, 255, 255), {
      color: new Color(26, 107, 184, 255),
      width: 4
    }));
    inputLayer.addChild(this.createInvisibleButton("Level1BackButton", layout.buttons.backHitbox.x, layout.buttons.backHitbox.y, layout.buttons.backHitbox.width, layout.buttons.backHitbox.height, () => this.buildPrototypeMap()));
    inputLayer.addChild(this.createInvisibleButton("Level1TryButton", layout.buttons.mainHitbox.x, layout.buttons.mainHitbox.y, layout.buttons.mainHitbox.width, layout.buttons.mainHitbox.height, () => this.checkPlayableLevel()));
  }

  private addLevelOneFlow(content: Node): void {
    const dotCount = LEVEL_ONE_LAYOUT.flow.dotCount;
    LEVEL_ONE_LAYOUT.visualPipes.forEach((pipe) => {
      const points = resolveVisualPipePath(pipe, LEVEL_ONE_LAYOUT.visualNodes).map((point) => new Vec3(point.x, point.y, 0));
      this.addFlowDots(content, points, new Color(168, 232, 255, 220), false, dotCount);
    });
  }

  private addLevelOneAmbientPulse(content: Node): void {
    LEVEL_ONE_LAYOUT.visualNodes.forEach((node) => {
      const radius = node.kind === "merge" ? 66 : 54;
      content.addChild(this.createPulseRing(node.pulse.x, node.pulse.y, radius, new Color(118, 220, 255, 48)));
    });
  }

  private createSprite(name: string, resourcePath: string, x: number, y: number, width: number, height: number): Node {
    const node = new Node(name);
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(width, height);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    resources.load(`${resourcePath}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
      if (error || !spriteFrame) return;
      sprite.spriteFrame = spriteFrame;
    });
    return node;
  }

  private createInvisibleButton(name: string, x: number, y: number, width: number, height: number, onClick: () => void): Node {
    const node = new Node(name);
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(255, 255, 255, 1);
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
    node.on(Node.EventType.TOUCH_END, onClick, this);
    return node;
  }

  private createLevelOneText(
    text: string,
    layout: LabelLayout,
    color: Color,
    outline?: { color: Color; width: number }
  ): Node {
    const node = new Node(`LevelOneText${text}`);
    node.layer = this.node.layer;
    node.setPosition(new Vec3(layout.x, layout.y, 0));
    node.addComponent(UITransform).setContentSize(layout.width, layout.height);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = layout.size;
    label.lineHeight = Math.round(layout.size * 1.12);
    label.color = color;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.SHRINK;
    if (outline) {
      label.outlineColor = outline.color;
      label.outlineWidth = outline.width;
    }
    return node;
  }

  private createLevelOnePlate(name: string, layout: LabelLayout, fill: Color): Node {
    return this.createRect(
      name,
      layout.x,
      layout.y,
      layout.width,
      layout.height,
      fill,
      new Color(255, 255, 255, 105),
      Math.min(30, layout.height / 2)
    );
  }

  private createLevelOneOverlaySprite(
    name: string,
    resourcePath: string,
    layout: { x: number; y: number; width: number; height: number }
  ): Node {
    const node = new Node(name);
    node.layer = this.node.layer;
    node.addComponent(UITransform).setContentSize(1080, 1920);
    node.addChild(this.createSprite(`${name}Sprite`, resourcePath, layout.x, layout.y, layout.width, layout.height));
    return node;
  }

  private createLevelOneTitleWidget(level: LevelConfig): Node {
    const node = new Node("LevelOneTitleWidget");
    node.layer = this.node.layer;
    node.addComponent(UITransform).setContentSize(1080, 1920);
    node.addChild(this.createLevelOneOverlaySprite(
      "LevelOneTitleWidgetBg",
      LEVEL_ONE_LAYOUT.hudArt.titleWidget.path,
      LEVEL_ONE_LAYOUT.hudArt.titleWidget
    ));
    node.addChild(this.createLevelOneText(`第 ${level.index} 关`, LEVEL_ONE_LAYOUT.top.chapter, new Color(31, 118, 190, 255)));
    node.addChild(this.createLevelOneText(level.title, LEVEL_ONE_LAYOUT.top.title, new Color(31, 83, 145, 255)));
    return node;
  }

  private createLevelOneMapButtonWidget(): Node {
    return this.createLevelOneOverlaySprite(
      "LevelOneMapButtonWidget",
      LEVEL_ONE_LAYOUT.hudArt.mapButton.path,
      LEVEL_ONE_LAYOUT.hudArt.mapButton
    );
  }

  private createLevelOneObjectivePlate(layout: LabelLayout): Node {
    const container = new Node("LevelOneObjectivePlateWrap");
    container.layer = this.node.layer;
    container.addComponent(UITransform).setContentSize(1080, 1920);
    container.addChild(this.createRect(
      "LevelOneObjectivePlate",
      layout.x,
      layout.y + 2,
      layout.width + 86,
      layout.height + 34,
      new Color(244, 251, 255, 170),
      new Color(255, 255, 255, 145),
      Math.min(42, (layout.height + 34) / 2)
    ));
    container.addChild(this.createRect(
      "LevelOneObjectiveHighlight",
      layout.x,
      layout.y + 18,
      layout.width + 28,
      Math.max(20, Math.round((layout.height + 20) * 0.34)),
      new Color(255, 255, 255, 72),
      undefined,
      26
    ));
    return container;
  }

  private createGameLabel(
    title: string,
    subtitle: string,
    layout: { x: number; y: number; width: number; height: number; titleSize: number; subtitleSize: number }
  ): Node {
    const node = new Node(`${title}GameLabel`);
    node.layer = this.node.layer;
    node.setPosition(new Vec3(layout.x, layout.y, 0));
    node.addComponent(UITransform).setContentSize(layout.width, layout.height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(255, 255, 255, 198);
    graphics.roundRect(-layout.width / 2, -layout.height / 2, layout.width, layout.height, 22);
    graphics.fill();
    graphics.strokeColor = new Color(255, 255, 255, 230);
    graphics.lineWidth = 3;
    graphics.roundRect(-layout.width / 2, -layout.height / 2, layout.width, layout.height, 22);
    graphics.stroke();
    node.addChild(this.createLevelOneText(title, {
      x: 0,
      y: layout.height * 0.18,
      size: layout.titleSize,
      width: layout.width - 18,
      height: layout.height * 0.42
    }, new Color(35, 56, 87, 255), {
      color: new Color(255, 255, 255, 255),
      width: 3
    }));
    node.addChild(this.createLevelOneText(subtitle, {
      x: 0,
      y: -layout.height * 0.24,
      size: layout.subtitleSize,
      width: layout.width - 18,
      height: layout.height * 0.36
    }, new Color(73, 91, 118, 255), {
      color: new Color(255, 255, 255, 245),
      width: 3
    }));
    return node;
  }

  private createPulseRing(x: number, y: number, radius: number, color: Color): Node {
    const node = new Node("PulseRing");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(radius * 2.5, radius * 2.5);
    const graphics = node.addComponent(Graphics);
    graphics.strokeColor = color;
    graphics.lineWidth = 10;
    graphics.circle(0, 0, radius);
    graphics.stroke();
    tween(node)
      .repeatForever(
        tween<Node>()
          .to(0.9, { scale: new Vec3(1.1, 1.1, 1) })
          .to(0.9, { scale: new Vec3(0.94, 0.94, 1) })
      )
      .start();
    return node;
  }

  private createPlayableTopHud(level: LevelConfig): Node {
    const node = new Node("PlayTopHud");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(0, 815, 0));
    node.addComponent(UITransform).setContentSize(1040, 190);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(229, 247, 255, 224);
    graphics.roundRect(-520, -90, 1040, 180, 48);
    graphics.fill();
    graphics.strokeColor = new Color(255, 255, 255, 180);
    graphics.lineWidth = 4;
    graphics.roundRect(-520, -90, 1040, 180, 48);
    graphics.stroke();

    node.addChild(this.createWaterDropIcon(-438, 18, 80));
    node.addChild(this.createLabel(`第 ${level.index} 关`, -360, 44, 36, new Color(32, 118, 190, 255), 190));
    node.addChild(this.createLabel(level.title, -120, 30, 58, new Color(36, 48, 74, 255), 520));
    node.addChild(this.createLabel(level.objective, -105, -42, 30, new Color(58, 73, 100, 255), 650));
    node.addChild(this.createButton("BackToMapTop", 398, 17, 220, 90, "地图", () => this.buildPrototypeMap(), 42));
    return node;
  }

  private createWaterDiagram(level: LevelConfig, output: number, target: number): Node {
    const node = new Node("WaterDiagram");
    node.layer = this.node.layer;
    node.addComponent(UITransform).setContentSize(1080, 1920);
    const graphics = node.addComponent(Graphics);

    const inputYStart = 285;
    level.inputNames.forEach((name, index) => {
      const y = inputYStart - index * 108;
      node.addChild(this.createSceneLabel(name, `流量 ${this.formatNumber(level.samples[0].inputs[index] ?? 0)}`, -330, y));
    });
    node.addChild(this.createSceneLabel("合流池", "汇在这里", -5, 205));
    node.addChild(this.createSceneLabel("供水池", waterStatus(output, target), 320, 215));

    level.pipes.forEach((pipe, index) => {
      const fromY = inputYStart - pipe.input * 108 - 165;
      const mergeY = 108 + index * 14;
      if (!pipe.installed) {
        graphics.strokeColor = new Color(255, 177, 42, 150);
        graphics.lineWidth = 9;
        for (let segment = 0; segment < 5; segment += 1) {
          const x1 = -235 + segment * 28;
          const x2 = x1 + 16;
          const y1 = fromY + segment * 5;
          const y2 = y1 + 4;
          graphics.moveTo(x1, y1);
          graphics.lineTo(x2, y2);
          graphics.stroke();
        }
      }
    });

    return node;
  }

  private addPipeFlow(content: Node, level: LevelConfig, output: number): void {
    level.pipes.forEach((pipe, index) => {
      if (!pipe.installed || pipe.strength <= 0.01) return;
      const points = this.getPipeFlowPath(pipe, index);
      const color = pipe.type === "pump"
        ? new Color(255, 108, 108, 230)
        : new Color(76, 193, 255, 240);
      this.drawFlowRibbon(content, points, color);
      this.addFlowDots(content, points, color, pipe.type === "pump");
    });

    if (output > 0.01 && level.pipes.some((pipe) => pipe.installed)) {
      const outputPath = [
        new Vec3(55, 126, 0),
        new Vec3(135, 136, 0),
        new Vec3(230, 150, 0),
        new Vec3(318, 168, 0)
      ];
      this.drawFlowRibbon(content, outputPath, new Color(76, 193, 255, 235));
      this.addFlowDots(content, outputPath, new Color(76, 193, 255, 240), false);
    }
  }

  private getPipeFlowPath(pipe: PipeConfig, index: number): Vec3[] {
    const startY = 125 - pipe.input * 118 + index * 10;
    const endY = 116 + index * 12;
    return [
      new Vec3(-315, startY + 18, 0),
      new Vec3(-230, startY + 6, 0),
      new Vec3(-145, endY + 4, 0),
      new Vec3(-42, endY, 0)
    ];
  }

  private drawFlowRibbon(content: Node, points: Vec3[], color: Color): void {
    const node = new Node("FlowRibbon");
    node.layer = this.node.layer;
    node.addComponent(UITransform).setContentSize(1080, 1920);
    const graphics = node.addComponent(Graphics);
    graphics.lineCap = Graphics.LineCap.ROUND;
    graphics.lineJoin = Graphics.LineJoin.ROUND;
    graphics.strokeColor = new Color(255, 255, 255, 115);
    graphics.lineWidth = 36;
    this.strokePolyline(graphics, points);
    graphics.stroke();
    graphics.strokeColor = new Color(color.r, color.g, color.b, 122);
    graphics.lineWidth = 24;
    this.strokePolyline(graphics, points);
    graphics.stroke();
    graphics.strokeColor = new Color(255, 255, 255, 92);
    graphics.lineWidth = 8;
    this.strokePolyline(graphics, points);
    graphics.stroke();
    content.addChild(node);
  }

  private strokePolyline(graphics: Graphics, points: Vec3[]): void {
    if (points.length < 2) return;
    graphics.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      graphics.lineTo(points[index].x, points[index].y);
    }
  }

  private addFlowDots(content: Node, points: Vec3[], color: Color, reverse: boolean, dotCount = 3): void {
    const path = reverse ? [...points].reverse() : points;
    for (let index = 0; index < dotCount; index += 1) {
      const dot = this.createFlowDot(path[0].x, path[0].y, color);
      content.addChild(dot);
      dot.setScale(new Vec3(0.62 + index * 0.04, 0.62 + index * 0.04, 1));
      const segmentDuration = 0.58;
      let run = tween<Node>();
      for (let pointIndex = 1; pointIndex < path.length; pointIndex += 1) {
        run = run.to(segmentDuration, { position: new Vec3(path[pointIndex].x, path[pointIndex].y, 0) });
      }
      run = run.call(() => dot.setPosition(new Vec3(path[0].x, path[0].y, 0)));
      tween(dot)
        .delay(index * 0.42)
        .repeatForever(run)
        .start();
    }
  }

  private createFlowDot(x: number, y: number, color: Color): Node {
    const node = new Node("FlowDot");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(20, 20);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.circle(0, 0, 7);
    graphics.fill();
    graphics.strokeColor = new Color(255, 255, 255, 125);
    graphics.lineWidth = 2;
    graphics.circle(0, 0, 7);
    graphics.stroke();
    return node;
  }

  private addScenePipeHotspots(content: Node, level: LevelConfig): void {
    level.pipes.forEach((pipe, index) => {
      const position = this.getPipeHotspotPosition(pipe, index);
      const selected = this.selectedPipeId === pipe.id;
      content.addChild(this.createPipeHotspot(pipe, position.x, position.y, position.width, position.height, selected));
      if (!pipe.installed) {
        content.addChild(this.createTapPrompt("点管口", position.x - 24, position.y - 92));
      }
    });
  }

  private getPipeHotspotPosition(pipe: PipeConfig, index: number): { x: number; y: number; width: number; height: number } {
    return {
      x: -242,
      y: 128 - pipe.input * 118 + index * 10,
      width: 180,
      height: 150
    };
  }

  private createPipeHotspot(pipe: PipeConfig, x: number, y: number, width: number, height: number, selected: boolean): Node {
    const node = new Node(`PipeHotspot${pipe.id}`);
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(width, height);

    const graphics = node.addComponent(Graphics);
    const ringColor = selected
      ? new Color(255, 177, 42, 235)
      : pipe.installed
        ? new Color(255, 255, 255, 0)
        : new Color(255, 177, 42, 210);
    if (selected || !pipe.installed) {
      graphics.fillColor = new Color(255, 246, 208, selected ? 88 : 52);
      graphics.circle(0, 0, selected ? 58 : 48);
      graphics.fill();
      graphics.strokeColor = ringColor;
      graphics.lineWidth = selected ? 9 : 7;
      graphics.circle(0, 0, selected ? 58 : 48);
      graphics.stroke();
      graphics.strokeColor = new Color(255, 255, 255, 230);
      graphics.lineWidth = 4;
      graphics.circle(0, 0, selected ? 36 : 30);
      graphics.stroke();
      graphics.fillColor = new Color(255, 177, 42, selected ? 135 : 115);
      graphics.circle(0, 0, 11);
      graphics.fill();
    }

    node.on(Node.EventType.TOUCH_END, () => {
      if (!this.activeLevel) return;
      pipe.installed = true;
      this.selectedPipeId = pipe.id;
      this.renderPlayableLevel();
    }, this);
    if (selected || !pipe.installed) {
      tween(node)
        .repeatForever(
          tween<Node>()
            .to(0.72, { scale: new Vec3(1.08, 1.08, 1) })
            .to(0.72, { scale: new Vec3(1, 1, 1) })
        )
        .start();
    }
    return node;
  }

  private createTapPrompt(text: string, x: number, y: number): Node {
    const node = this.createRect("TapPrompt", x, y, 142, 56, new Color(255, 255, 255, 238), new Color(255, 177, 42, 255), 28);
    node.addChild(this.createLabel(text, 71, 28, 30, new Color(32, 118, 190, 255), 132));
    tween(node)
      .repeatForever(
        tween<Node>()
          .to(0.55, { scale: new Vec3(1.05, 1.05, 1) })
          .to(0.55, { scale: new Vec3(1, 1, 1) })
      )
      .start();
    return node;
  }

  private createSceneLabel(title: string, subtitle: string, x: number, y: number): Node {
    const node = new Node(`${title}SceneLabel`);
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(170, 82);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(255, 255, 255, 218);
    graphics.roundRect(-85, -36, 170, 72, 20);
    graphics.fill();
    graphics.strokeColor = new Color(255, 255, 255, 240);
    graphics.lineWidth = 3;
    graphics.roundRect(-85, -36, 170, 72, 20);
    graphics.stroke();
    node.addChild(this.createLabel(title, 0, 13, 34, new Color(36, 48, 74, 255), 160, {
      color: new Color(255, 255, 255, 255),
      width: 3
    }));
    node.addChild(this.createLabel(subtitle, 0, -19, 24, new Color(82, 96, 122, 255), 160));
    return node;
  }

  private createLevelArt(): Node {
    const node = new Node("LevelArt");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(0, 0, 0));
    node.addComponent(UITransform).setContentSize(1080, 1920);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    resources.load("art/chapter1-level-stage-bg/spriteFrame", SpriteFrame, (error, spriteFrame) => {
      if (error || !spriteFrame) {
        return;
      }
      sprite.spriteFrame = spriteFrame;
    });
    return node;
  }

  private createOutputGauge(output: number, target: number, status: string, y = -35): Node {
    const node = new Node("OutputGauge");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(0, y, 0));
    node.addComponent(UITransform).setContentSize(900, 145);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(243, 250, 255, 245);
    graphics.roundRect(-450, -36, 900, 72, 34);
    graphics.fill();
    graphics.strokeColor = new Color(84, 101, 130, 255);
    graphics.lineWidth = 5;
    graphics.roundRect(-450, -36, 900, 72, 34);
    graphics.stroke();

    const levelWidth = clamp(output, 0, 1.2) / 1.2 * 850;
    if (levelWidth > 2) {
      graphics.fillColor = new Color(76, 181, 242, 235);
      graphics.roundRect(-425, -25, levelWidth, 50, 24);
      graphics.fill();
    }

    const targetX = -425 + clamp(target, 0, 1.2) / 1.2 * 850;
    graphics.strokeColor = new Color(255, 177, 42, 255);
    graphics.lineWidth = 8;
    graphics.moveTo(targetX, -46);
    graphics.lineTo(targetX, 46);
    graphics.stroke();

    node.addChild(this.createLabel(`当前 ${this.formatNumber(output)}`, -300, 60, 31, new Color(36, 48, 74, 255), 280));
    node.addChild(this.createLabel(`黄线 ${this.formatNumber(target)} · ${status}`, 230, 60, 31, new Color(32, 118, 190, 255), 430));
    return node;
  }

  private createControlDock(level: LevelConfig, output: number, target: number, status: string, stars: number): Node {
    const node = new Node("ControlDock");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(0, -742, 0));
    node.addComponent(UITransform).setContentSize(1040, 402);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(255, 255, 255, 238);
    graphics.roundRect(-520, -201, 1040, 402, 52);
    graphics.fill();
    graphics.strokeColor = new Color(176, 213, 239, 245);
    graphics.lineWidth = 5;
    graphics.roundRect(-520, -201, 1040, 402, 52);
    graphics.stroke();

    node.addChild(this.createOutputGauge(output, target, status, 125));
    this.addPipeControlContent(node, level);
    this.addBiasControlContent(node, level);
    node.addChild(this.createButton("BackToBrief", -300, -150, 310, 88, "返回地图", () => this.buildPrototypeMap(), 36));
    node.addChild(this.createButton("TryWater", 245, -150, 430, 88, stars > 0 ? "通水成功" : "放水试试", () => this.checkPlayableLevel(), 38));
    return node;
  }

  private addPipeControlContent(content: Node, level: LevelConfig): void {
    const selectedPipe = level.pipes.find((pipe) => pipe.id === this.selectedPipeId) ?? level.pipes[0];
    const title = selectedPipe ? selectedPipe.label : "点地图上的管口";
    const typeName = selectedPipe?.type === "pump" ? "抽水管" : "输水管";
    const status = selectedPipe?.installed ? `${typeName} · ${pipeStrengthName(selectedPipe.strength)}` : "点发光管口接管";

    content.addChild(this.createPipeBadge(-412, -8, selectedPipe));
    content.addChild(this.createLabel(title, -235, 12, 38, new Color(36, 48, 74, 255), 390));
    content.addChild(this.createLabel(status, 180, 12, 30, new Color(82, 96, 122, 255), 430));

    if (!selectedPipe) return;

    if (!selectedPipe.installed) {
      content.addChild(this.createLabel("点场景里的发光管口，接上这根管。", 52, -64, 34, new Color(32, 118, 190, 255), 780));
      return;
    }

    if (!selectedPipe.lockType) {
      content.addChild(this.createButton(`Type${selectedPipe.id}`, -335, -64, 220, 70, typeName, () => {
        selectedPipe.type = selectedPipe.type === "pump" ? "supply" : "pump";
        this.renderPlayableLevel();
      }, 34));
    } else {
      content.addChild(this.createSoftPill(typeName, -335, -64, 220, 70));
    }

    if (!selectedPipe.lockStrength) {
      content.addChild(this.createLabel(`粗细 ${this.formatNumber(selectedPipe.strength)}`, -70, -64, 34, new Color(36, 48, 74, 255), 280));
      content.addChild(this.createButton(`Minus${selectedPipe.id}`, 180, -64, 88, 70, "-", () => {
        selectedPipe.strength = clamp(selectedPipe.strength - 0.05, 0, 1.2);
        this.renderPlayableLevel();
      }, 44));
      content.addChild(this.createButton(`Plus${selectedPipe.id}`, 302, -64, 88, 70, "+", () => {
        selectedPipe.strength = clamp(selectedPipe.strength + 0.05, 0, 1.2);
        this.renderPlayableLevel();
      }, 44));
    } else {
      content.addChild(this.createLabel("这根管道已固定", 110, -64, 34, new Color(82, 96, 122, 255), 460));
    }
  }

  private addBiasControlContent(content: Node, level: LevelConfig): void {
    if (!level.bias) return;
    const y = -112;
    content.addChild(this.createLabel(`泵站水压 ${this.formatNumber(level.bias.value)}`, -190, y, 32, new Color(36, 48, 74, 255), 430));
    content.addChild(this.createButton("BiasMinus", 145, y, 82, 62, "-", () => {
      if (!level.bias) return;
      level.bias.value = clamp(level.bias.value - 0.05, level.bias.min, level.bias.max);
      this.renderPlayableLevel();
    }, 40));
    content.addChild(this.createButton("BiasPlus", 260, y, 82, 62, "+", () => {
      if (!level.bias) return;
      level.bias.value = clamp(level.bias.value + 0.05, level.bias.min, level.bias.max);
      this.renderPlayableLevel();
    }, 40));
  }

  private createWaterDropIcon(x: number, y: number, size: number): Node {
    const node = new Node("WaterDropIcon");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(size, size);
    const graphics = node.addComponent(Graphics);
    const radius = size / 2;
    graphics.fillColor = new Color(37, 137, 224, 255);
    graphics.circle(0, 0, radius);
    graphics.fill();
    graphics.strokeColor = new Color(255, 255, 255, 230);
    graphics.lineWidth = 5;
    graphics.circle(0, 0, radius);
    graphics.stroke();
    graphics.fillColor = new Color(137, 225, 255, 255);
    graphics.moveTo(0, radius * 0.52);
    graphics.bezierCurveTo(radius * 0.48, 0, radius * 0.25, -radius * 0.48, 0, -radius * 0.5);
    graphics.bezierCurveTo(-radius * 0.34, -radius * 0.48, -radius * 0.5, 0, 0, radius * 0.52);
    graphics.fill();
    return node;
  }

  private addSelectedPipePanel(content: Node, level: LevelConfig): void {
    const selectedPipe = level.pipes.find((pipe) => pipe.id === this.selectedPipeId) ?? level.pipes[0];
    const title = selectedPipe ? selectedPipe.label : "点地图上的管道";
    const typeName = selectedPipe?.type === "pump" ? "抽水管" : "输水管";
    const status = selectedPipe?.installed ? `${typeName} · ${pipeStrengthName(selectedPipe.strength)}` : "点地图上的发光管道接上水路";

    content.addChild(this.createPipeBadge(-410, -682, selectedPipe));
    content.addChild(this.createLabel(title, -220, -665, 38, new Color(36, 48, 74, 255), 360));
    content.addChild(this.createLabel(status, 150, -665, 32, new Color(82, 96, 122, 255), 430));

    if (!selectedPipe) return;

    if (!selectedPipe.installed) {
      content.addChild(this.createLabel("点地图上的发光管口，接上这根管。", 0, -742, 36, new Color(32, 118, 190, 255), 820));
      return;
    }

    if (!selectedPipe.lockType) {
      content.addChild(this.createButton(`Type${selectedPipe.id}`, -340, -742, 220, 74, typeName, () => {
        selectedPipe.type = selectedPipe.type === "pump" ? "supply" : "pump";
        this.renderPlayableLevel();
      }, 36));
    } else {
      content.addChild(this.createSoftPill(typeName, -340, -742, 220, 74));
    }

    if (!selectedPipe.lockStrength) {
      content.addChild(this.createLabel(`粗细 ${this.formatNumber(selectedPipe.strength)}`, -65, -742, 36, new Color(36, 48, 74, 255), 280));
      content.addChild(this.createButton(`Minus${selectedPipe.id}`, 175, -742, 92, 74, "-", () => {
        selectedPipe.strength = clamp(selectedPipe.strength - 0.05, 0, 1.2);
        this.renderPlayableLevel();
      }, 46));
      content.addChild(this.createButton(`Plus${selectedPipe.id}`, 300, -742, 92, 74, "+", () => {
        selectedPipe.strength = clamp(selectedPipe.strength + 0.05, 0, 1.2);
        this.renderPlayableLevel();
      }, 46));
    } else {
      content.addChild(this.createLabel("这根管道已固定", 100, -742, 36, new Color(82, 96, 122, 255), 430));
    }
  }

  private createPipeBadge(x: number, y: number, pipe?: PipeConfig): Node {
    const node = new Node("PipeBadge");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(96, 96);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(232, 247, 255, 245);
    graphics.circle(0, 0, 48);
    graphics.fill();
    graphics.strokeColor = new Color(86, 149, 206, 230);
    graphics.lineWidth = 5;
    graphics.circle(0, 0, 48);
    graphics.stroke();
    graphics.strokeColor = pipe?.type === "pump" ? new Color(239, 92, 92, 240) : new Color(67, 166, 232, 245);
    graphics.lineWidth = 14;
    graphics.moveTo(-30, -5);
    graphics.bezierCurveTo(-10, 13, 10, 13, 30, -5);
    graphics.stroke();
    return node;
  }

  private createSoftPill(text: string, x: number, y: number, width: number, height: number): Node {
    const node = this.createRect("SoftPill", x, y, width, height, new Color(232, 247, 255, 232), new Color(142, 190, 230, 210), 28);
    node.addChild(this.createLabel(text, width / 2, height / 2, 36, new Color(32, 118, 190, 255), width));
    return node;
  }

  private addBiasControls(content: Node, level: LevelConfig): void {
    if (!level.bias) return;
    const y = -805;
    content.addChild(this.createLabel(`泵站水压 ${this.formatNumber(level.bias.value)}`, -170, y, 34, new Color(36, 48, 74, 255), 440));
    content.addChild(this.createButton("BiasMinus", 175, y, 88, 68, "-", () => {
      if (!level.bias) return;
      level.bias.value = clamp(level.bias.value - 0.05, level.bias.min, level.bias.max);
      this.renderPlayableLevel();
    }, 44));
    content.addChild(this.createButton("BiasPlus", 295, y, 88, 68, "+", () => {
      if (!level.bias) return;
      level.bias.value = clamp(level.bias.value + 0.05, level.bias.min, level.bias.max);
      this.renderPlayableLevel();
    }, 44));
  }

  private createLevelLog(level: LevelConfig): Node {
    const node = new Node("LevelLog");
    node.layer = this.node.layer;
    node.setPosition(new Vec3(0, -815, 0));
    node.addComponent(UITransform).setContentSize(880, 62);
    const result = evaluateLevel(level);
    const lines = result.rows.map((row, index) => {
      const sample = level.samples[index];
      return `${sample.label ?? `水情${index + 1}`}：${this.formatNumber(row.y)} / ${this.formatNumber(sample.target)} · ${waterStatus(row.y, sample.target)}`;
    });
    node.addChild(this.createLabel(lines.join("\n"), 0, 0, 32, new Color(82, 96, 122, 255), 840));
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

  private createRect(name: string, x: number, y: number, width: number, height: number, fill: Color, stroke?: Color, radius = 42): Node {
    const node = new Node(name);
    node.layer = this.node.layer;
    node.setPosition(new Vec3(x - width / 2, y - height / 2, 0));
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    transform.setAnchorPoint(0, 0);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = fill;
    graphics.roundRect(0, 0, width, height, radius);
    graphics.fill();
    if (stroke) {
      graphics.strokeColor = stroke;
      graphics.lineWidth = 5;
      graphics.roundRect(0, 0, width, height, radius);
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
      label.outlineColor = outline.color;
      label.outlineWidth = outline.width;
    }
    return node;
  }

  private createButton(name: string, x: number, y: number, width: number, height: number, caption: string, onClick: () => void, labelSize = 44): Node {
    const node = this.createRect(name, x, y, width, height, new Color(47, 142, 232, 255), new Color(30, 102, 181, 255));
    const labelNode = this.createLabel(caption, width / 2, height / 2, labelSize, new Color(255, 255, 255, 255), width);
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
