import Phaser from "phaser";
import { BIAS_NUDGE, colors, MAX_FLOW, PIPE_NUDGE, W } from "./constants.js";
import { addText, clamp, fmt, normalizedFlow, strengthName, waterStatus } from "./utils.js";

export function rr(scene, width, height, radius, fill, stroke, strokeWidth = 2, alpha = 1) {
  const rect = scene.rexUI.add.roundRectangle(0, 0, width, height, radius, fill, alpha);
  if (stroke !== undefined) {
    rect.setStrokeStyle(strokeWidth, stroke, 1);
  }
  return rect;
}

export function createSurface(scene, x, y, width, height, opts = {}) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.graphics();
  shadow.fillStyle(opts.shadow ?? colors.shadow, opts.shadowAlpha ?? 0.14);
  shadow.fillRoundedRect(0, 6, width, height, opts.radius ?? 24);
  const card = scene.add.graphics();
  card.fillStyle(opts.fill ?? colors.paper, opts.alpha ?? 0.92);
  card.fillRoundedRect(0, 0, width, height, opts.radius ?? 24);
  card.lineStyle(opts.lineWidth ?? 2, opts.stroke ?? colors.skyBorder, 1);
  card.strokeRoundedRect(0, 0, width, height, opts.radius ?? 24);
  container.add([shadow, card]);
  return container;
}

export function createChip(scene, label, opts = {}) {
  const width = opts.width ?? 92;
  const height = opts.height ?? 28;
  const chip = scene.rexUI.add.label({
    width,
    height,
    background: rr(scene, width, height, opts.radius ?? 14, opts.fill ?? colors.paperSoft, opts.stroke ?? colors.skyBorder, 2),
    text: scene.add.text(0, 0, label, {
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: `${opts.size ?? 13}px`,
      fontStyle: opts.weight || "900",
      color: Phaser.Display.Color.IntegerToColor(opts.color ?? colors.ink).rgba,
      align: "center"
    }).setOrigin(0.5),
    align: "center",
    space: { left: 12, right: 12, top: 5, bottom: 5 }
  });
  chip.setOrigin(0, 0);
  return chip;
}

export function createButton(scene, label, onClick, opts = {}) {
  const width = opts.width ?? 120;
  const height = opts.height ?? 46;
  const button = scene.rexUI.add.label({
    width,
    height,
    background: rr(
      scene,
      width,
      height,
      opts.radius ?? 16,
      opts.fill ?? colors.paper,
      opts.stroke ?? colors.line,
      opts.lineWidth ?? 2,
      opts.alpha ?? 1
    ),
    text: scene.add.text(0, 0, label, {
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: `${opts.size ?? 18}px`,
      fontStyle: opts.weight || "800",
      color: Phaser.Display.Color.IntegerToColor(opts.color ?? colors.ink).rgba,
      align: "center",
      wordWrap: { width: opts.wrap ?? Math.max(24, width - 28), useAdvancedWrap: true }
    }).setOrigin(0.5),
    align: "center",
    space: { left: 12, right: 12, top: 8, bottom: 8 }
  });
  button.setInteractive({ useHandCursor: true });
  button.setOrigin(0, 0);
  button.on("pointerdown", () => {
    scene.tweens.add({ targets: button, scaleX: 0.97, scaleY: 0.97, duration: 70, yoyo: true });
    onClick();
  });
  return button;
}

export function createMeter(scene, { width, value, target, compact = false }) {
  const height = compact ? 26 : 40;
  const bar = scene.rexUI.add.numberBar({
    width,
    background: rr(scene, width, height, compact ? 12 : 18, 0xffffff, colors.muted, compact ? 3 : 4),
    slider: {
      background: rr(scene, width - 10, compact ? 18 : 28, compact ? 9 : 14, 0xeaf4ff),
      indicator: rr(scene, width - 10, compact ? 18 : 28, compact ? 9 : 14, colors.water),
      input: "none",
      gap: compact ? 3 : 4
    },
    space: { left: 4, right: 4, top: 4, bottom: 4, slider: 0 }
  });
  bar.setValue(normalizedFlow(value));
  bar.layout();

  const marker = scene.add.rectangle(0, 0, compact ? 4 : 5, compact ? 30 : 48, colors.gold).setOrigin(0.5);
  const root = scene.add.container(0, 0, [bar, marker]);
  root.setSize(width, compact ? 30 : 48);

  const refresh = (nextValue, nextTarget) => {
    bar.setValue(normalizedFlow(nextValue));
    marker.setPosition((clamp(nextTarget, 0, MAX_FLOW) / MAX_FLOW - 0.5) * width, 0);
  };

  refresh(value, target);
  return { root, bar, marker, refresh };
}

function createActionRow(scene, buttons, gap = 10) {
  const row = scene.rexUI.add.sizer({ orientation: "x", space: { item: gap } });
  buttons.forEach((button) => row.add(button, { proportion: 1, expand: true }));
  return row;
}

function createPresetGrid(scene, buttons, columns = 3) {
  const grid = scene.rexUI.add.gridSizer({
    column: columns,
    row: Math.ceil(buttons.length / columns),
    columnProportions: Array(columns).fill(1),
    rowProportions: Array(Math.ceil(buttons.length / columns)).fill(1),
    space: { column: 8, row: 8 }
  });
  buttons.forEach((button, index) => {
    grid.add(button, index % columns, Math.floor(index / columns), "center", 0, true);
  });
  return grid;
}

export function buildLevelHud(scene) {
  const panel = scene.rexUI.add.sizer({
    x: W / 2,
    y: 736,
    width: 358,
    orientation: "y",
    space: { left: 16, right: 16, top: 16, bottom: 14, item: 12 }
  });
  panel.addBackground(rr(scene, 358, 202, 22, 0xfffbef, 0xbfd3ec, 2, 0.99));

  if (scene.reportOpen) {
    const report = scene.rexUI.add.sizer({
      x: W / 2,
      y: 520,
      width: 330,
      orientation: "y",
      space: { left: 18, right: 18, top: 16, bottom: 16, item: 10 }
    });
    report.addBackground(rr(scene, 330, 160, 18, 0xffffff, 0xbfd3ec, 2, 0.97));
    report.add(addText(scene, 0, 0, "水路日志", 20, colors.ink, { weight: "900" }));
    const inputs = scene.sample.inputs.map((value, index) => `${scene.level.inputNames[index] || `水源${index + 1}`} ${fmt(value)}`).join("，");
    report.add(addText(scene, 0, 0, `来水：${inputs}\n现在水位：${fmt(scene.row.y)}\n目标黄线：${fmt(scene.sample.target)}\n提示：水少就加粗输水管；水多就调细，或把某根改成抽水管。`, 14, colors.muted, {
      weight: "800",
      wrap: 278,
      lineSpacing: 6
    }));
    report.layout();
    report.setDepth(15);
  }

  if (scene.selected) {
    buildToolPanel(scene, panel);
  } else {
    buildDefaultPanel(scene, panel);
  }

  panel.layout();
  panel.setDepth(16);
}

function buildDefaultPanel(scene, panel) {
  const header = scene.rexUI.add.sizer({ orientation: "x" });
  const left = scene.rexUI.add.sizer({ orientation: "y", width: 226, space: { item: 8 } });
  const titleRow = scene.rexUI.add.sizer({ orientation: "x", width: 226, space: { item: 8 } });
  titleRow.add(addText(scene, 0, 0, "供水池水位", 17, colors.ink, { weight: "900" }), { proportion: 1 });
  titleRow.add(createChip(scene, `目标 ${fmt(scene.sample.target)}`, {
    width: 94,
    height: 28,
    fill: 0xffffff,
    stroke: colors.gold,
    size: 13
  }));
  left.add(titleRow);
  const meter = createMeter(scene, { width: 232, value: scene.row.y, target: scene.sample.target });
  left.add(meter.root);
  left.add(addText(scene, 0, 0, `当前 ${fmt(scene.row.y)} · ${waterStatus(scene.row.y, scene.sample.target)}`, 15, colors.ink, { weight: "900" }));
  left.add(addText(scene, 0, 0, scene.feedback, 13, scene.feedbackKind === "good" ? colors.success : colors.muted, {
    weight: "800",
    wrap: 230,
    lineSpacing: 5
  }));

  const logButton = createButton(scene, "水路\n日志", () => {
    scene.reportOpen = !scene.reportOpen;
    scene.render();
  }, {
    width: 84,
    height: 72,
    fill: colors.blue,
    stroke: colors.blueDark,
    color: 0xffffff,
    size: 16
  });

  header.add(left, { proportion: 1, expand: true });
  header.add(logButton, { align: "top" });
  panel.add(header, { expand: true });

  panel.add(createActionRow(scene, [
    createButton(scene, "重来", () => scene.scene.restart({ levelIndex: scene.levelIndex }), {
      width: 126,
      height: 48,
      fill: colors.paper,
      stroke: colors.line
    }),
    createButton(scene, "放水试试", () => scene.checkLevel(), {
      width: 186,
      height: 48,
      fill: colors.blue,
      stroke: colors.blueDark,
      color: 0xffffff,
      size: 19
    })
  ]));
}

function buildToolPanel(scene, panel) {
  const isBias = scene.selected.kind === "bias";
  const pipe = isBias ? null : scene.level.pipes.find((item) => item.id === scene.selected.id);
  const title = isBias ? "泵站" : pipe.label;
  const subtitle = isBias ? `当前水压 ${fmt(scene.level.bias.value)}` : `${pipe.type === "pump" ? "抽水管" : "输水管"} · ${strengthName(pipe.strength)}`;

  const top = scene.rexUI.add.sizer({ orientation: "x", space: { item: 10 } });
  const titleBox = scene.rexUI.add.sizer({ orientation: "y", width: 134, space: { item: 6 } });
  titleBox.add(addText(scene, 0, 0, title, 20, colors.ink, { weight: "900" }));
  titleBox.add(addText(scene, 0, 0, subtitle, 13, colors.muted, { weight: "900", wrap: 132 }));
  const compactMeter = createMeter(scene, { width: 124, value: scene.row.y, target: scene.sample.target, compact: true });
  const meterBox = scene.rexUI.add.sizer({ orientation: "y", width: 124, space: { item: 4 } });
  meterBox.add(compactMeter.root);
  meterBox.add(addText(scene, 0, 0, `当前 ${fmt(scene.row.y)}\n目标 ${fmt(scene.sample.target)}`, 11, colors.muted, { weight: "900", wrap: 118, lineSpacing: 3 }));
  const closeButton = createButton(scene, "×", () => {
    scene.selected = null;
    scene.render();
  }, {
    width: 38,
    height: 38,
    fill: colors.paper,
    stroke: colors.line,
    size: 22
  });

  top.add(titleBox, { proportion: 1, expand: true });
  top.add(meterBox, { align: "center" });
  top.add(closeButton, { align: "top" });
  panel.add(top, { expand: true });

  if (isBias) {
    panel.add(createActionRow(scene, [
      createButton(scene, "−", () => scene.setBias(scene.level.bias.value - BIAS_NUDGE), { width: 66, height: 42, size: 24 }),
      createButton(scene, "+", () => scene.setBias(scene.level.bias.value + BIAS_NUDGE), { width: 66, height: 42, size: 24 }),
      createButton(scene, "关闭", () => scene.setBias(0), { width: 88, height: 42, size: 16 })
    ]));
    const presets = [
      { label: "降低", value: -0.2 },
      { label: "关闭", value: 0 },
      { label: "微升", value: 0.2 },
      { label: "升高", value: 0.4 },
      { label: "强升", value: 0.6 }
    ].filter((item) => item.value >= scene.level.bias.min && item.value <= scene.level.bias.max);
    panel.add(createPresetGrid(scene, presets.map((preset) => createButton(scene, preset.label, () => scene.setBias(preset.value), {
      width: 94,
      height: 34,
      radius: 14,
      size: 14,
      fill: Math.abs(scene.level.bias.value - preset.value) < 0.005 ? colors.gold : colors.paper,
      stroke: colors.line,
      color: Math.abs(scene.level.bias.value - preset.value) < 0.005 ? 0xffffff : colors.ink
    }))), { expand: true });
    panel.add(addText(scene, 0, 0, "泵站会整体抬高或压低这一关的基础水位。", 13, colors.muted, { weight: "800", wrap: 314, lineSpacing: 5 }));
    return;
  }

  const installRowButtons = [
    createButton(scene, pipe.installed ? "拆下管道" : "安装管道", () => {
      pipe.installed = !pipe.installed;
      scene.render();
    }, {
      width: 112,
      height: 42,
      fill: pipe.installed ? colors.paper : colors.blue,
      stroke: pipe.installed ? colors.line : colors.blueDark,
      color: pipe.installed ? colors.ink : 0xffffff,
      size: 16
    })
  ];

  if (!pipe.lockType) {
    installRowButtons.push(
      createButton(scene, "输水管", () => {
        pipe.type = "supply";
        pipe.installed = true;
        scene.render();
      }, {
        width: 96,
        height: 42,
        fill: pipe.type === "supply" ? colors.supply : colors.paper,
        stroke: colors.supply,
        color: pipe.type === "supply" ? 0xffffff : colors.ink,
        size: 15
      }),
      createButton(scene, "抽水管", () => {
        pipe.type = "pump";
        pipe.installed = true;
        scene.render();
      }, {
        width: 96,
        height: 42,
        fill: pipe.type === "pump" ? colors.pump : colors.paper,
        stroke: colors.pump,
        color: pipe.type === "pump" ? 0xffffff : colors.ink,
        size: 15
      })
    );
  } else {
    installRowButtons.push(createButton(scene, pipe.type === "pump" ? "抽水管" : "输水管", () => {}, {
      width: 110,
      height: 42,
      fill: colors.paper,
      stroke: colors.line,
      size: 15
    }));
  }

  panel.add(createActionRow(scene, installRowButtons));

  if (pipe.lockStrength) {
    panel.add(addText(scene, 0, 0, "这根管道粗细固定，这一关先观察水是怎样一路送到供水池的。", 13, colors.muted, {
      weight: "800",
      wrap: 314,
      lineSpacing: 5
    }));
    return;
  }

  panel.add(createActionRow(scene, [
    createButton(scene, "−", () => scene.setPipe(pipe, pipe.strength - PIPE_NUDGE), { width: 66, height: 42, size: 24 }),
    createButton(scene, "+", () => scene.setPipe(pipe, pipe.strength + PIPE_NUDGE), { width: 66, height: 42, size: 24 }),
    createButton(scene, "关闭", () => scene.setPipe(pipe, 0), { width: 88, height: 42, size: 16 })
  ]));

  const presets = [
    { label: "细管", value: 0.25 },
    { label: "中管", value: 0.5 },
    { label: "稍粗", value: 0.6 },
    { label: "粗管", value: 0.75 },
    { label: "全开", value: 1 }
  ];
  panel.add(createPresetGrid(scene, presets.map((preset) => createButton(scene, preset.label, () => scene.setPipe(pipe, preset.value), {
      width: 94,
      height: 34,
    radius: 14,
    size: 14,
    fill: Math.abs(pipe.strength - preset.value) < 0.005 ? colors.gold : colors.paper,
    stroke: colors.line,
    color: Math.abs(pipe.strength - preset.value) < 0.005 ? 0xffffff : colors.ink
  }))), { expand: true });
  panel.add(addText(scene, 0, 0, "一边调管道，一边看供水池和黄线的距离。", 13, colors.muted, { weight: "800", wrap: 314 }));
}

export function buildClearModal(scene, stars) {
  scene.add.rectangle(W / 2, 422, W, 844, colors.overlay, 0.42).setDepth(30);
  const dialog = scene.rexUI.add.dialog({
    x: W / 2,
    y: 388,
    width: 322,
    background: rr(scene, 322, 356, 24, 0xffffff, 0xbfd3ec, 2),
    title: scene.add.text(0, 0, "水路打通！", {
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: "28px",
      fontStyle: "900",
      color: Phaser.Display.Color.IntegerToColor(colors.ink).rgba
    }).setOrigin(0.5),
    content: scene.add.text(0, 0, `${"★".repeat(stars)}${"☆".repeat(3 - stars)}\n\n${stars >= 3 ? "供水池稳稳贴住黄线，清溪镇这一段恢复供水。" : "水路通了，小镇可以继续往前铺管。"}\n\n${scene.level.lesson}`, {
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: "16px",
      fontStyle: "800",
      color: Phaser.Display.Color.IntegerToColor(colors.muted).rgba,
      align: "center",
      wordWrap: { width: 248, useAdvancedWrap: true },
      lineSpacing: 8
    }).setOrigin(0.5, 0),
    actions: [
      createButton(scene, "再玩一次", () => {
        scene.clearModal = null;
        scene.scene.restart({ levelIndex: scene.levelIndex });
      }, { width: 112, height: 42, fill: colors.paper, stroke: colors.line, size: 16 }),
      createButton(scene, scene.levelIndex >= scene.levels.length - 1 ? "查看档案" : "下一关", () => {
        if (scene.levelIndex >= scene.levels.length - 1) {
          scene.scene.start("Summary");
        } else {
          scene.scene.start("Level", { levelIndex: scene.levelIndex + 1 });
        }
      }, { width: 146, height: 42, fill: colors.blue, stroke: colors.blueDark, color: 0xffffff, size: 16 })
    ],
    align: { title: "center", content: "center", actions: "center" },
    space: { left: 24, right: 24, top: 22, bottom: 22, content: 18, action: 14 }
  });
  dialog.layout();
  dialog.setDepth(31);
}
