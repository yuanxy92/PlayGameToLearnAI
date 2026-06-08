import Phaser from "phaser";
import { assets } from "./assets.js";
import { H, W, BIAS_NUDGE, colors, PIPE_NUDGE } from "./constants.js";
import { levels } from "./levels.js";
import { GAME_STATE, isLevelUnlocked, passedCount, requestedLevelIndex, saveProgress, urlParams } from "./state.js";
import { buildClearModal, buildLevelHud, createButton } from "./ui.js";
import { addText, calcAll, clamp, cloneLevel, drawPath, fmt, makeFlow, normalizedFlow, roundedRect, setImageCover, starForLoss, strengthName, waterStatus } from "./utils.js";

function ensureRexUI(scene) {
  if (!scene.rexUI) {
    scene.plugins.installScenePlugin("rexUI", window.rexuiplugin, "rexUI", scene);
  }
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    Object.entries(assets).forEach(([key, url]) => this.load.image(key, url));
  }

  create() {
    if (urlParams.get("play") === "1") {
      this.scene.start("Level", { levelIndex: requestedLevelIndex() });
    } else if (urlParams.get("map") === "1" || urlParams.get("map") === "2") {
      this.scene.start("Map");
    } else {
      this.scene.start("Welcome");
    }
  }
}

export class WelcomeScene extends Phaser.Scene {
  constructor() {
    super("Welcome");
  }

  create() {
    ensureRexUI(this);
    this.cameras.main.setBackgroundColor("#ccefff");
    this.add.rectangle(W / 2, H / 2, W, H, 0xe4f7e6);
    this.add.image(W / 2, 380, "chapterMap").setDisplaySize(390, 640).setAlpha(0.38);
    roundedRect(this, 22, 58, 346, 412, 28, 0xffffff, 0.88, 0xb6cee9, 2);
    addText(this, 42, 82, "神经水厂", 38, colors.ink, { weight: "900" });
    addText(this, 44, 132, "青溪镇通水冒险", 22, colors.muted);
    addText(this, 44, 188, "清溪镇新建了一座会思考的水厂。它要根据山泉、井水、雨水槽的来水，自动调出刚刚好的供水量。\n\n水太少，镇上的水塔会见底；水太多，管道会报警。你的任务是修水路、调水管、写下水路档案，让每一段供水都稳稳贴住黄线。", 18, colors.ink, {
      weight: "700",
      wrap: 296,
      lineSpacing: 8
    });
    addText(this, 44, 394, "第 1 章：先学会一条最基础的水路。", 16, colors.blueDark, { weight: "800", wrap: 292 });
    createButton(this, "开始冒险", () => this.scene.start("Map"), {
      width: 306,
      height: 64,
      fill: colors.blue,
      stroke: colors.blueDark,
      color: 0xffffff,
      size: 24
    }).setPosition(42, 520);
    createButton(this, "直接进第一关", () => this.scene.start("Level", { levelIndex: 0 }), {
      width: 306,
      height: 52,
      fill: colors.paper,
      stroke: colors.line,
      size: 18
    }).setPosition(42, 604);
  }
}

export class MapScene extends Phaser.Scene {
  constructor() {
    super("Map");
  }

  create() {
    ensureRexUI(this);
    this.cameras.main.setBackgroundColor("#c9efff");
    this.render();
  }

  render() {
    this.children.removeAll();
    const map = this.add.image(W / 2, H / 2, "chapterMap");
    setImageCover(map, W, H);
    this.add.rectangle(W / 2, H / 2, W, H, GAME_STATE.mapChapter === 2 ? 0xcdf3ee : 0xffffff, GAME_STATE.mapChapter === 2 ? 0.28 : 0.08);
    this.add.rectangle(W / 2, 54, W, 108, 0xcbefff, 0.82);
    addText(this, 20, 24, "神经水厂", 30, colors.ink, { weight: "900" });
    addText(this, 22, 62, "青溪镇通水冒险", 17, colors.muted, { weight: "700" });
    createButton(this, "地图", () => {}, { width: 70, height: 54, fill: colors.paper, stroke: 0x94b6d9, size: 20 }).setPosition(300, 25);

    if (GAME_STATE.mapChapter === 1) {
      this.renderChapterOneMap();
    } else {
      this.renderChapterTwoPreview();
    }
  }

  renderChapterOneMap() {
    const pathPoints = [
      { x: 100, y: 706 },
      { x: 194, y: 628 },
      { x: 286, y: 552 },
      { x: 218, y: 480 },
      { x: 272, y: 404 },
      { x: 204, y: 316 },
      { x: 198, y: 244 }
    ];

    roundedRect(this, 24, 118, 266, 92, 18, 0xffffff, 0.78, 0xffffff, 0);
    addText(this, 44, 146, "青溪镇地图", 31, colors.ink, { weight: "900" });
    addText(this, 46, 188, `第 1 章：线性水路 ${passedCount()}/7`, 17, colors.muted, { weight: "800" });

    pathPoints.forEach((point, index) => {
      const unlocked = isLevelUnlocked(index);
      const done = Boolean(GAME_STATE.progress[levels[index].id]);
      const color = done ? colors.goldDark : unlocked ? colors.blueDark : 0x7b8798;
      const glow = this.add.circle(point.x, point.y + 2, 18, 0xffffff, 0.4);
      const label = addText(this, point.x, point.y, String(index + 1), 31, color, {
        weight: "900",
        originX: 0.5,
        originY: 0.5,
        stroke: 0xffffff,
        strokeThickness: 8
      });
      if (done) {
        addText(this, point.x, point.y + 24, "已通水", 11, colors.ink, {
          weight: "900",
          originX: 0.5,
          stroke: 0xffffff,
          strokeThickness: 4
        });
      } else if (!unlocked) {
        addText(this, point.x, point.y + 24, "未开", 11, colors.ink, {
          weight: "900",
          originX: 0.5,
          stroke: 0xffffff,
          strokeThickness: 4
        });
      }
      const hit = this.add.circle(point.x, point.y, 30, 0xffffff, 0.001);
      hit.setInteractive({ useHandCursor: unlocked });
      hit.on("pointerdown", () => {
        if (!unlocked) return;
        GAME_STATE.levelIndex = index;
        this.scene.start("Level", { levelIndex: index });
      });
      this.tweens.add({ targets: [glow, label], alpha: { from: 1, to: 0.72 }, duration: 1200 + index * 70, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    });

    createButton(this, "第 1 章 已解锁", () => {}, {
      width: 156,
      height: 44,
      fill: colors.blue,
      stroke: colors.blueDark,
      color: 0xffffff,
      size: 16
    }).setPosition(24, 784);
    createButton(this, "去看第 2 章", () => {
      GAME_STATE.mapChapter = 2;
      this.render();
    }, {
      width: 170,
      height: 44,
      fill: colors.paper,
      stroke: colors.line,
      color: colors.ink,
      size: 16
    }).setPosition(196, 784);
  }

  renderChapterTwoPreview() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x4dbca7, 0.24);
    roundedRect(this, 28, 140, 334, 226, 22, 0xffffff, 0.84, 0xb8d1e8, 2);
    addText(this, 52, 166, "第 2 章：闸门谷", 30, colors.ink, { weight: "900" });
    addText(this, 54, 214, "下一章会把“线性水路”接到各种闸门：有的闸门挡住负水位，有的闸门会把水压进固定范围，最后再进入多出口分流。", 18, colors.muted, {
      weight: "800",
      wrap: 280,
      lineSpacing: 7
    });
    const items = ["止回闸", "限流闸", "软闸门", "S 形水门", "分流池"];
    items.forEach((name, index) => {
      const y = 410 + index * 58;
      this.add.circle(74, y + 18, 20, 0xffffff, 0.96).setStrokeStyle(4, colors.gold);
      addText(this, 74, y + 18, String(index + 1), 18, colors.blueDark, { originX: 0.5, originY: 0.5, weight: "900" });
      addText(this, 112, y + 6, name, 20, colors.ink, { weight: "900" });
      addText(this, 112, y + 31, "设计中", 14, colors.muted, { weight: "800" });
    });
    createButton(this, "回第 1 章", () => {
      GAME_STATE.mapChapter = 1;
      this.render();
    }, {
      width: 156,
      height: 52,
      fill: colors.paper,
      stroke: colors.line,
      color: colors.ink,
      size: 17
    }).setPosition(28, 768);
    createButton(this, "先玩线性水路", () => {
      GAME_STATE.mapChapter = 1;
      this.scene.start("Level", { levelIndex: 0 });
    }, {
      width: 162,
      height: 52,
      fill: colors.blue,
      stroke: colors.blueDark,
      color: 0xffffff,
      size: 17
    }).setPosition(200, 768);
  }
}

export class LevelScene extends Phaser.Scene {
  constructor() {
    super("Level");
  }

  init(data) {
    this.levels = levels;
    this.levelIndex = data.levelIndex ?? GAME_STATE.levelIndex ?? 0;
    GAME_STATE.levelIndex = this.levelIndex;
    this.level = cloneLevel(levels[this.levelIndex]);
    this.sampleIndex = 0;
    this.selected = null;
    this.feedback = "点管道或泵站开始通水。";
    this.feedbackKind = "neutral";
    this.reportOpen = false;
    this.clearModal = null;
    this.flowDots = [];
  }

  create() {
    ensureRexUI(this);
    this.cameras.main.setBackgroundColor("#dff3db");
    this.render();
  }

  render() {
    this.children.removeAll();
    this.flowDots = [];
    this.all = calcAll(this.level);
    this.row = this.all.rows[this.sampleIndex];
    this.sample = this.level.samples[this.sampleIndex];
    this.drawHeader();
    this.drawBoard();
    buildLevelHud(this);
    if (this.clearModal) buildClearModal(this, this.clearModal.stars);
  }

  drawHeader() {
    this.add.rectangle(W / 2, 48, W, 96, 0xccefff, 0.9);
    addText(this, 18, 14, "神经水厂", 25, colors.ink, { weight: "900" });
    addText(this, 20, 48, "第 1 章 · 线性水路", 14, colors.muted, { weight: "800" });
    createButton(this, "地图", () => this.scene.start("Map"), {
      width: 66,
      height: 50,
      fill: colors.paper,
      stroke: 0x98b8d8,
      size: 18
    }).setPosition(304, 17);
    const unlocked = levels.filter((_, index) => isLevelUnlocked(index)).length;
    addText(this, 226, 24, `${this.levelIndex + 1}/7`, 24, colors.ink, { weight: "900", originX: 0.5 });
    addText(this, 226, 54, `已开 ${unlocked}`, 13, colors.muted, { weight: "800", originX: 0.5 });
  }

  drawBoard() {
    const top = 92;
    const height = 530;
    roundedRect(this, 10, top, 370, height, 18, colors.panel, 0.98, 0xbfd3ec, 2);
    const playTop = top + 112;
    const playHeight = height - 116;
    const image = this.add.image(W / 2, playTop + playHeight / 2, "boardBg");
    image.setDisplaySize(370, playHeight);
    image.setAlpha(0.76);
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(10, playTop, 370, playHeight, 18);
    image.setMask(maskShape.createGeometryMask());
    roundedRect(this, 10, playTop, 370, playHeight, 18, 0xfff4dc, 0.14);

    addText(this, 24, top + 16, `第 ${this.levelIndex + 1} 关`, 15, colors.blueDark, { weight: "900" });
    addText(this, 24, top + 38, this.level.title, 25, colors.ink, { weight: "900" });
    addText(this, 24, top + 72, this.level.objective, 16, colors.muted, { weight: "800", wrap: 332 });

    if (this.level.samples.length > 1) {
      this.level.samples.forEach((sample, index) => {
        createButton(this, ["清晨", "午后", "傍晚"][index] || `水情${index + 1}`, () => {
          this.sampleIndex = index;
          this.render();
        }, {
          width: 66,
          height: 30,
          fill: index === this.sampleIndex ? colors.gold : colors.paper,
          stroke: index === this.sampleIndex ? colors.goldDark : colors.line,
          color: index === this.sampleIndex ? 0xffffff : colors.ink,
          size: 13,
          radius: 12
        }).setPosition(24 + index * 78, top + 112);
      });
    }

    const baseY = this.level.samples.length > 1 ? top + 182 : top + 170;
    const inputYs = this.sample.inputs.length === 1 ? [baseY + 82] : [baseY + 42, baseY + 158];
    const sourceX = 72;
    this.sample.inputs.forEach((value, index) => {
      const y = inputYs[index];
      const spring = this.add.image(sourceX, y, "sourceSpring").setDisplaySize(78, 78);
      this.tweens.add({ targets: spring, y: y - 3, duration: 1150 + index * 160, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      addText(this, sourceX, y + 43, this.level.inputNames[index] || `水源${index + 1}`, 20, 0xffffff, {
        weight: "900",
        originX: 0.5,
        stroke: colors.ink,
        strokeThickness: 5
      });
      addText(this, sourceX, y + 69, `流量 ${fmt(value)}`, 15, 0xffffff, {
        weight: "900",
        originX: 0.5,
        stroke: colors.muted,
        strokeThickness: 4
      });
    });

    const poolX = 226;
    const poolY = baseY + 88;
    this.drawPipes(inputYs, poolX, poolY);

    const pool = this.add.image(poolX, poolY, "mixingPool").setDisplaySize(104, 92);
    const rippleAlpha = clamp(Math.abs(this.row.z), 0.12, 0.65);
    const ripple1 = this.add.ellipse(poolX, poolY - 10, 44, 18).setStrokeStyle(3, colors.waterLight, rippleAlpha);
    const ripple2 = this.add.ellipse(poolX, poolY - 10, 26, 9).setStrokeStyle(2, 0xffffff, rippleAlpha);
    this.tweens.add({ targets: [ripple1, ripple2], scaleX: 1.16, scaleY: 1.12, alpha: 0.35, duration: 950, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    addText(this, poolX, poolY + 62, "合流池", 23, 0xffffff, { weight: "900", originX: 0.5, stroke: colors.ink, strokeThickness: 5 });
    addText(this, poolX, poolY + 90, this.row.z <= 0.04 ? "还没进水" : this.row.z < 0.5 ? "水量偏少" : this.row.z < 0.9 ? "水量稳定" : "水量很足", 16, 0xffffff, {
      weight: "900",
      originX: 0.5,
      stroke: colors.muted,
      strokeThickness: 4
    });

    const tankX = 326;
    const tankY = poolY - 2;
    const outPath = new Phaser.Curves.Path(poolX + 52, poolY);
    outPath.lineTo(tankX - 38, tankY);
    const g = this.add.graphics();
    drawPath(g, outPath, 18, colors.pipeRim, 1);
    drawPath(g, outPath, 11, colors.water, 1);
    if (this.row.y > 0.02) makeFlow(this, outPath, colors.waterLight, false, 5, 0.22);

    const tank = this.add.image(tankX, tankY, "outputTank").setDisplaySize(74, 118);
    const waterTop = tankY + 40 - normalizedFlow(this.row.y) * 78;
    this.add.rectangle(tankX, (waterTop + tankY + 41) / 2, 40, tankY + 41 - waterTop, colors.water, 0.62);
    this.add.line(0, 0, tankX - 23, tankY + 40 - normalizedFlow(this.sample.target) * 78, tankX + 23, tankY + 40 - normalizedFlow(this.sample.target) * 78, colors.gold, 1).setLineWidth(4);
    tank.setDepth(2);
    addText(this, tankX, tankY + 72, "供水池", 20, 0xffffff, { weight: "900", originX: 0.5, stroke: colors.ink, strokeThickness: 5 });
    addText(this, tankX, tankY + 98, waterStatus(this.row.y, this.sample.target), 16, 0xffffff, {
      weight: "900",
      originX: 0.5,
      stroke: colors.muted,
      strokeThickness: 4
    });

    this.add.image(324, baseY - 42, "qingxiTown").setDisplaySize(78, 58);
    const townPath = new Phaser.Curves.Path(tankX + 20, tankY - 46);
    townPath.cubicBezierTo(365, baseY - 12, 360, baseY - 42, 342, baseY - 62);
    drawPath(g, townPath, 13, colors.pipeRim, 1);
    drawPath(g, townPath, 7, colors.water, 1);
    if (this.row.y > 0.02) makeFlow(this, townPath, colors.waterLight, false, 4, 0.2);
    addText(this, 324, baseY - 5, "清溪镇水厂", 13, 0xffffff, { weight: "900", originX: 0.5, stroke: colors.ink, strokeThickness: 4 });
  }

  drawPipes(inputYs, poolX, poolY) {
    const g = this.add.graphics();
    const sourceX = 72;
    this.level.pipes.forEach((pipe) => {
      const y = inputYs[pipe.input];
      const startX = sourceX + 34;
      const startY = y + (pipe.input === 0 ? -2 : 2);
      const endX = poolX - 48;
      const endY = poolY + (pipe.input === 0 ? -10 : 10);
      const midX = (startX + endX) / 2;
      const curveLift = pipe.input === 0 ? -28 : 28;
      const path = new Phaser.Curves.Path(startX, startY);
      path.cubicBezierTo(startX + 34, startY + curveLift * 0.2, midX - 20, startY + curveLift, endX, endY);

      const width = pipe.installed ? 10 + pipe.strength * 6 : 8;
      if (this.selected && this.selected.kind === "pipe" && this.selected.id === pipe.id) {
        drawPath(g, path, width + 16, 0xffffff, 0.94);
        drawPath(g, path, width + 10, colors.gold, 0.86);
      }

      if (pipe.installed) {
        drawPath(g, path, width + 8, colors.pipeWall, 0.95);
        drawPath(g, path, width + 3, colors.pipeRim, 1);
        drawPath(g, path, Math.max(4, width - 3), pipe.type === "pump" ? 0xffe5de : 0xe6f7ff, 0.98);
      } else {
        const guidePoints = [0.18, 0.36, 0.54, 0.72].map((t) => path.getPoint(t));
        guidePoints.forEach((point) => {
          this.add.circle(point.x, point.y, 4.5, 0xd7b37f, 0.65);
        });
      }

      this.add.circle(startX, startY, pipe.installed ? 6 : 5, 0xc28c49, pipe.installed ? 1 : 0.5);
      this.add.circle(endX, endY, pipe.installed ? 6 : 5, 0xc28c49, pipe.installed ? 1 : 0.5);

      if (pipe.installed && pipe.strength > 0.02 && Math.abs((this.sample.inputs[pipe.input] || 0) * pipe.strength) > 0.01) {
        makeFlow(this, path, pipe.type === "pump" ? 0xff8d5b : colors.water, pipe.type === "pump", 6, 0.22 + pipe.strength * 0.08);
      }

      const anchor = path.getPoint(0.48);
      const hit = this.add.circle(anchor.x, anchor.y, 28, 0xffffff, 0.001);
      hit.setInteractive({ useHandCursor: true });
      hit.on("pointerdown", () => this.selectPipe(pipe.id));
      this.add.circle(anchor.x, anchor.y, 10, pipe.installed ? (pipe.type === "pump" ? colors.pump : colors.supply) : 0xffffff, pipe.installed ? 0.9 : 0.72).setStrokeStyle(2, pipe.installed ? 0xffffff : colors.gold);
    });

    if (this.level.bias) {
      const path = new Phaser.Curves.Path(poolX - 36, poolY - 76);
      path.cubicBezierTo(poolX - 10, poolY - 64, poolX - 6, poolY - 36, poolX - 2, poolY - 20);
      if (this.selected && this.selected.kind === "bias") {
        drawPath(g, path, 22, colors.gold, 0.9);
      }
      drawPath(g, path, 17, colors.pipeRim, 1);
      drawPath(g, path, 9 + Math.abs(this.level.bias.value) * 8, 0x9d7aff, 1);
      const pump = this.add.image(poolX - 45, poolY - 92, "biasPump").setDisplaySize(64, 64);
      pump.setInteractive({ useHandCursor: true });
      pump.on("pointerdown", () => {
        this.selected = { kind: "bias" };
        this.feedback = "正在调泵站。";
        this.render();
      });
      addText(this, poolX - 48, poolY - 47, "泵站", 13, 0xffffff, { weight: "900", originX: 0.5, stroke: colors.ink, strokeThickness: 4 });
    }
  }

  selectPipe(id) {
    const pipe = this.level.pipes.find((item) => item.id === id);
    if (!pipe) return;
    if (!pipe.installed && pipe.lockType && pipe.lockStrength) {
      pipe.installed = true;
      this.feedback = "管道接上了，水已经流向供水池。";
      this.feedbackKind = "good";
      this.selected = null;
      this.render();
      return;
    }
    this.selected = { kind: "pipe", id };
    this.feedback = pipe.installed ? "可以调这根管道。" : "先安装，再调水量。";
    this.feedbackKind = "neutral";
    this.render();
  }

  setPipe(pipe, value) {
    if (pipe.lockStrength) return;
    pipe.strength = clamp(Math.round(value * 100) / 100, 0, 1.2);
    pipe.installed = true;
    this.feedback = "观察供水池和黄线的距离。";
    this.feedbackKind = "neutral";
    this.render();
  }

  setBias(value) {
    this.level.bias.value = clamp(Math.round(value * 100) / 100, this.level.bias.min, this.level.bias.max);
    this.feedback = "观察供水池和黄线的距离。";
    this.feedbackKind = "neutral";
    this.render();
  }

  checkLevel() {
    const all = calcAll(this.level);
    const stars = starForLoss(this.level, all.meanLoss);
    if (stars > 0) {
      saveProgress(levels[this.levelIndex], stars);
      this.clearModal = { stars };
      this.feedback = "水路打通！";
      this.feedbackKind = "good";
      this.render();
    } else if (all.meanLoss <= this.level.tolerance * 1.8) {
      this.feedback = "很接近了，还差一点就能贴住黄线。";
      this.feedbackKind = "neutral";
      this.render();
    } else {
      this.feedback = "还没稳住。水位偏低就加水，偏高就减水或抽水。";
      this.feedbackKind = "neutral";
      this.render();
    }
  }

  update(_time, delta) {
    const dt = delta / 1000;
    this.flowDots.forEach((flow) => {
      flow.offset = (flow.offset + dt * flow.speed) % 1;
      flow.dots.forEach((dot, index) => {
        let t = (flow.offset + index / flow.dots.length) % 1;
        if (flow.reverse) t = 1 - t;
        const point = flow.path.getPoint(t);
        dot.setPosition(point.x, point.y);
        dot.setAlpha(0.45 + 0.45 * Math.sin((t + flow.offset) * Math.PI));
      });
    });
  }
}

export class SummaryScene extends Phaser.Scene {
  constructor() {
    super("Summary");
  }

  create() {
    ensureRexUI(this);
    this.cameras.main.setBackgroundColor("#dff3db");
    this.add.image(W / 2, H / 2, "chapterMap").setDisplaySize(390, 844).setAlpha(0.28);
    roundedRect(this, 24, 58, 342, 696, 24, 0xffffff, 0.94, 0xbfd3ec, 2);
    addText(this, 48, 88, "第 1 章水路档案", 30, colors.ink, { weight: "900" });
    addText(this, 50, 136, "你刚刚学会的，其实就是一条线性水路。", 18, colors.muted, { weight: "800", wrap: 288 });
    const lines = [
      ["一处水源", "供水量 = 来水量 × 管道粗细"],
      ["加上泵站", "供水量 = 来水量 × 管道粗细 + 泵站水压"],
      ["两处水源", "供水量 = 山泉 × 山泉管 + 井水 × 井水管 + 泵站水压"],
      ["大学写法", "y = Xw + b"]
    ];
    lines.forEach((item, index) => {
      const y = 210 + index * 106;
      roundedRect(this, 46, y, 298, 78, 16, index === 3 ? 0xe9f5ff : 0xfffbef, 1, 0xd4e1ef, 2);
      addText(this, 64, y + 13, item[0], 16, colors.blueDark, { weight: "900" });
      addText(this, 64, y + 40, item[1], index === 3 ? 22 : 17, colors.ink, { weight: "900", wrap: 250 });
    });
    addText(this, 48, 662, "下一章会加入闸门：水不是直接流过去，而是先经过会改变水量的机关。这就是激活函数的直觉。", 16, colors.muted, {
      weight: "800",
      wrap: 292,
      lineSpacing: 6
    });
    createButton(this, "回地图", () => this.scene.start("Map"), {
      width: 142,
      height: 48,
      fill: colors.paper,
      stroke: colors.line,
      size: 18
    }).setPosition(44, 774);
    createButton(this, "看第 2 章", () => {
      GAME_STATE.mapChapter = 2;
      this.scene.start("Map");
    }, {
      width: 144,
      height: 48,
      fill: colors.blue,
      stroke: colors.blueDark,
      color: 0xffffff,
      size: 18
    }).setPosition(202, 774);
  }
}
