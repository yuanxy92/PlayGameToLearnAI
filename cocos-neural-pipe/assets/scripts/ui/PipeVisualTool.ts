import { Color, Graphics, Node, resources, Sprite, SpriteFrame, tween, UITransform, Vec3 } from "cc";

export type PipeVisualState = "disconnected" | "supply" | "pump";

export type PipeVisualOptions = {
  state: PipeVisualState;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
};

export function createPipeStateVisual(options: PipeVisualOptions): Node {
  const node = new Node(`PipeStateVisual-${options.state}`);
  node.layer = options.layer;
  node.setPosition(new Vec3(options.x, options.y, 0));
  node.addComponent(UITransform).setContentSize(options.width, options.height);

  if (options.state === "pump") {
    const graphics = node.addComponent(Graphics);
    drawPumpState(graphics, options.width, options.height);
  } else if (options.state === "supply") {
    addSupplyPipeAsset(node, options.width, options.height, options.layer);
  } else {
    const graphics = node.addComponent(Graphics);
    drawDisconnectedState(graphics, options.width, options.height);
  }

  tween(node)
    .repeatForever(
      tween<Node>()
        .to(0.95, { scale: new Vec3(1.015, 1.015, 1) })
        .to(0.95, { scale: new Vec3(1, 1, 1) })
    )
    .start();

  return node;
}

function addSupplyPipeAsset(parent: Node, width: number, height: number, layer: number): void {
  const glow = new Node("SupplyPipeGlow");
  glow.layer = layer;
  glow.setPosition(new Vec3(0, 0, 0));
  glow.addComponent(UITransform).setContentSize(width * 1.08, height * 1.18);
  const glowGraphics = glow.addComponent(Graphics);
  glowGraphics.fillColor = new Color(91, 205, 255, 38);
  glowGraphics.ellipse(0, 0, width * 0.48, height * 0.22);
  glowGraphics.fill();
  glowGraphics.strokeColor = new Color(255, 220, 62, 82);
  glowGraphics.lineWidth = 5;
  glowGraphics.ellipse(0, 0, width * 0.43, height * 0.42);
  glowGraphics.stroke();
  parent.addChild(glow);

  const spriteNode = new Node("SupplyPipeAsset");
  spriteNode.layer = layer;
  spriteNode.setPosition(new Vec3(0, 0, 0));
  spriteNode.addComponent(UITransform).setContentSize(width, height);
  const sprite = spriteNode.addComponent(Sprite);
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  parent.addChild(spriteNode);

  resources.load("art/level1/pipe-connector-supply/spriteFrame", SpriteFrame, (error, spriteFrame) => {
    if (error || !spriteFrame) {
      parent.removeChild(spriteNode);
      drawSupplyFallback(parent, width, height, layer);
      return;
    }
    sprite.spriteFrame = spriteFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  });
}

function drawSupplyFallback(parent: Node, width: number, height: number, layer: number): void {
  const node = new Node("SupplyPipeFallback");
  node.layer = layer;
  node.setPosition(new Vec3(0, 0, 0));
  node.addComponent(UITransform).setContentSize(width, height);
  const graphics = node.addComponent(Graphics);
  const railWidth = width * 0.9;
  const railHeight = height * 0.45;

  graphics.fillColor = new Color(20, 92, 168, 245);
  graphics.roundRect(-railWidth / 2, -railHeight / 2, railWidth, railHeight, railHeight / 2);
  graphics.fill();

  graphics.fillColor = new Color(48, 171, 241, 248);
  graphics.roundRect(-railWidth / 2 + 7, -railHeight / 2 + 6, railWidth - 14, railHeight - 12, (railHeight - 12) / 2);
  graphics.fill();

  graphics.fillColor = new Color(43, 153, 231, 255);
  graphics.roundRect(-width * 0.24, -railHeight * 0.44, width * 0.48, railHeight * 0.88, railHeight * 0.4);
  graphics.fill();

  graphics.fillColor = new Color(151, 232, 255, 150);
  graphics.roundRect(-railWidth * 0.4, railHeight * 0.07, railWidth * 0.76, railHeight * 0.18, 8);
  graphics.fill();

  graphics.strokeColor = new Color(230, 249, 255, 170);
  graphics.lineWidth = 3;
  graphics.roundRect(-railWidth / 2 + 4, -railHeight / 2 + 4, railWidth - 8, railHeight - 8, (railHeight - 8) / 2);
  graphics.stroke();

  drawGoldClamp(graphics, -railWidth * 0.43, railHeight);
  drawGoldClamp(graphics, railWidth * 0.43, railHeight);

  graphics.fillColor = new Color(255, 255, 255, 215);
  graphics.circle(-width * 0.15, 0, 6);
  graphics.circle(width * 0.16, 0, 5);
  graphics.fill();
  parent.addChild(node);
}

function drawGoldClamp(graphics: Graphics, x: number, railHeight: number): void {
  graphics.fillColor = new Color(229, 151, 34, 250);
  graphics.roundRect(x - 8, -railHeight * 0.68, 16, railHeight * 1.36, 8);
  graphics.fill();

  graphics.strokeColor = new Color(255, 225, 118, 245);
  graphics.lineWidth = 3;
  graphics.moveTo(x - 2, -railHeight * 0.54);
  graphics.lineTo(x - 2, railHeight * 0.54);
  graphics.stroke();
}

function drawPumpState(graphics: Graphics, width: number, height: number): void {
  const railWidth = width * 0.92;
  const railHeight = height * 0.22;
  graphics.fillColor = new Color(255, 112, 112, 76);
  graphics.roundRect(-railWidth / 2, -railHeight / 2, railWidth, railHeight, railHeight / 2);
  graphics.fill();
  graphics.strokeColor = new Color(255, 225, 225, 150);
  graphics.lineWidth = 5;
  graphics.roundRect(-railWidth / 2 + 2, -railHeight / 2 + 2, railWidth - 4, railHeight - 4, railHeight / 2 - 2);
  graphics.stroke();
}

function drawDisconnectedState(graphics: Graphics, width: number, height: number): void {
  graphics.strokeColor = new Color(255, 201, 58, 150);
  graphics.lineWidth = 6;
  graphics.circle(0, 0, width * 0.26);
  graphics.stroke();
}
