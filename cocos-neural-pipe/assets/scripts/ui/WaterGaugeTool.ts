import { Color, Graphics, Node, UITransform, Vec3 } from "cc";

export type WaterGaugeOptions = {
  name: string;
  current: number;
  target: number;
  startX: number;
  width: number;
  y: number;
  max: number;
  fillHeight: number;
  targetHeight: number;
  layer: number;
};

export function createWaterGauge(options: WaterGaugeOptions): Node {
  const node = new Node(options.name);
  node.layer = options.layer;
  node.setPosition(new Vec3(0, 0, 0));
  node.addComponent(UITransform).setContentSize(1080, 1920);

  const progress = clampRatio(options.current, options.max);
  const targetProgress = clampRatio(options.target, options.max);
  const targetX = options.startX + targetProgress * options.width;
  const fillWidth = Math.max(options.fillHeight, options.width * progress);
  const shellHeight = Math.max(options.fillHeight + 34, options.targetHeight + 18);

  node.addChild(createGaugeShell(
    options.startX,
    options.y,
    options.width,
    shellHeight,
    options.fillHeight,
    options.layer
  ));

  if (options.current > 0.001) {
    node.addChild(createWaterFill(options.startX, options.y, fillWidth, options.fillHeight, options.layer));
  }
  node.addChild(createTargetMarker(targetX, options.y, options.targetHeight, options.layer));
  return node;
}

function createGaugeShell(startX: number, y: number, width: number, shellHeight: number, trackHeight: number, layer: number): Node {
  const node = new Node("WaterGaugeShell");
  node.layer = layer;
  node.setPosition(new Vec3(0, 0, 0));
  node.addComponent(UITransform).setContentSize(1080, 1920);

  const graphics = node.addComponent(Graphics);
  const shellX = startX - 34;
  const shellY = y - shellHeight / 2;
  const shellWidth = width + 68;
  const shellRadius = shellHeight / 2;

  graphics.fillColor = new Color(255, 248, 235, 252);
  graphics.roundRect(shellX, shellY, shellWidth, shellHeight, shellRadius);
  graphics.fill();

  graphics.strokeColor = new Color(43, 118, 195, 235);
  graphics.lineWidth = 5;
  graphics.roundRect(shellX, shellY, shellWidth, shellHeight, shellRadius);
  graphics.stroke();

  graphics.fillColor = new Color(255, 255, 255, 108);
  graphics.roundRect(shellX + 10, shellY + shellHeight * 0.56, shellWidth - 20, shellHeight * 0.18, shellHeight * 0.09);
  graphics.fill();

  const trackY = y - trackHeight / 2;
  const trackRadius = trackHeight / 2;
  graphics.fillColor = new Color(252, 247, 236, 250);
  graphics.roundRect(startX, trackY, width, trackHeight, trackRadius);
  graphics.fill();

  graphics.strokeColor = new Color(235, 221, 193, 225);
  graphics.lineWidth = 3;
  graphics.roundRect(startX + 2, trackY + 2, width - 4, trackHeight - 4, Math.max(0, trackRadius - 2));
  graphics.stroke();

  graphics.fillColor = new Color(255, 255, 255, 92);
  graphics.roundRect(startX + 10, trackY + 8, width - 20, trackHeight * 0.22, trackHeight * 0.11);
  graphics.fill();

  return node;
}

function createWaterFill(startX: number, y: number, width: number, height: number, layer: number): Node {
  const node = new Node("WaterGaugeFill");
  node.layer = layer;
  node.setPosition(new Vec3(0, 0, 0));
  node.addComponent(UITransform).setContentSize(1080, 1920);

  const graphics = node.addComponent(Graphics);
  const radius = height / 2;
  const top = y - height / 2;

  graphics.fillColor = new Color(45, 151, 232, 245);
  graphics.roundRect(startX, top, width, height, radius);
  graphics.fill();

  graphics.fillColor = new Color(103, 212, 255, 185);
  graphics.roundRect(startX + 6, top + 6, Math.max(0, width - 12), height * 0.48, height * 0.24);
  graphics.fill();

  graphics.fillColor = new Color(255, 255, 255, 175);
  graphics.roundRect(startX + height * 0.28, top + height * 0.16, Math.max(0, width - height * 0.56), height * 0.12, height * 0.06);
  graphics.fill();

  graphics.strokeColor = new Color(255, 255, 255, 86);
  graphics.lineWidth = 3;
  graphics.roundRect(startX + 3, top + 3, Math.max(0, width - 6), height - 6, Math.max(0, radius - 3));
  graphics.stroke();

  return node;
}

function createTargetMarker(x: number, y: number, height: number, layer: number): Node {
  const node = new Node("WaterGaugeTargetMarker");
  node.layer = layer;
  node.setPosition(new Vec3(x, y, 0));
  node.addComponent(UITransform).setContentSize(32, height + 22);
  const graphics = node.addComponent(Graphics);
  graphics.fillColor = new Color(255, 255, 255, 118);
  graphics.roundRect(-8, -height / 2 - 6, 16, height + 12, 8);
  graphics.fill();
  graphics.fillColor = new Color(255, 177, 42, 255);
  graphics.roundRect(-4, -height / 2, 8, height, 4);
  graphics.fill();
  return node;
}

function clampRatio(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}
