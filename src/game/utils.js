import Phaser from "phaser";
import { colors, MAX_FLOW } from "./constants.js";

export function cloneLevel(level) {
  return JSON.parse(JSON.stringify(level));
}

export function fmt(value) {
  return Number(value).toFixed(2);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function signedStrength(pipe) {
  return pipe.type === "pump" ? -pipe.strength : pipe.strength;
}

export function calcForSample(level, sample) {
  let z = level.bias ? level.bias.value : 0;
  const terms = [];
  level.pipes.forEach((pipe) => {
    if (!pipe.installed) return;
    const x = sample.inputs[pipe.input] || 0;
    const term = signedStrength(pipe) * x;
    z += term;
    terms.push({ pipe, x, term });
  });
  return { z, y: z, loss: Math.abs(z - sample.target), terms };
}

export function calcAll(level) {
  const rows = level.samples.map((sample) => calcForSample(level, sample));
  const meanLoss = rows.reduce((sum, row) => sum + row.loss, 0) / rows.length;
  return { rows, meanLoss };
}

export function starForLoss(level, loss) {
  if (loss <= level.tolerance * 0.35) return 3;
  if (loss <= level.tolerance * 0.7) return 2;
  if (loss <= level.tolerance) return 1;
  return 0;
}

export function waterStatus(output, target) {
  const diff = output - target;
  const gap = Math.abs(diff);
  if (gap <= 0.02) return "刚刚好";
  if (gap <= 0.08) return diff > 0 ? "稍微偏高" : "稍微偏低";
  if (gap <= 0.25) return diff > 0 ? "水有点多" : "水有点少";
  return diff > 0 ? "快溢出了" : "水太少了";
}

export function strengthName(value) {
  if (value <= 0.02) return "关闭";
  if (value < 0.35) return "细管";
  if (value < 0.65) return "中管";
  if (value < 0.95) return "粗管";
  return "全开";
}

export function addText(scene, x, y, text, size, color = colors.ink, options = {}) {
  return scene.add.text(x, y, text, {
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: `${size}px`,
    color: Phaser.Display.Color.IntegerToColor(color).rgba,
    fontStyle: options.weight || "700",
    align: options.align || "left",
    lineSpacing: options.lineSpacing || 4,
    wordWrap: options.wrap ? { width: options.wrap, useAdvancedWrap: true } : undefined,
    stroke: options.stroke ? Phaser.Display.Color.IntegerToColor(options.stroke).rgba : undefined,
    strokeThickness: options.strokeThickness || 0
  }).setOrigin(options.originX ?? 0, options.originY ?? 0);
}

export function roundedRect(scene, x, y, w, h, radius, fill, alpha = 1, stroke, strokeWidth = 2) {
  const g = scene.add.graphics();
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, radius);
  if (stroke !== undefined) {
    g.lineStyle(strokeWidth, stroke, 1);
    g.strokeRoundedRect(x, y, w, h, radius);
  }
  return g;
}

export function setImageCover(image, width, height) {
  const sx = width / image.width;
  const sy = height / image.height;
  image.setScale(Math.max(sx, sy));
}

export function drawPath(graphics, path, width, color, alpha = 1) {
  graphics.lineStyle(width, color, alpha);
  path.draw(graphics, 42);
}

export function makeFlow(scene, path, color, reverse = false, count = 5, speed = 0.14) {
  const dots = [];
  for (let i = 0; i < count; i += 1) {
    dots.push(scene.add.circle(0, 0, 3.1, color, 0.95));
  }
  scene.flowDots.push({ path, dots, reverse, speed, offset: Math.random() });
}

export function normalizedFlow(value) {
  return clamp(value, 0, MAX_FLOW) / MAX_FLOW;
}
