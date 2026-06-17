import { Color, Graphics, Node, UITransform, Vec3 } from "cc";
import type { PointLayout, VisualNodeLayout, VisualPipeLayout, VisualPipeState } from "../data/LevelOneLayout";

export type GeneratedPipeOptions = {
  name: string;
  path: PointLayout[];
  state: VisualPipeState;
  thickness: number;
  layer: number;
};

export function resolveVisualPipePath(pipe: VisualPipeLayout, nodes: readonly VisualNodeLayout[]): PointLayout[] {
  if (pipe.flowPath.length >= 2) return [...pipe.flowPath];

  const from = pipe.from ? findPort(nodes, pipe.from.nodeId, pipe.from.port) : null;
  const to = pipe.to ? findPort(nodes, pipe.to.nodeId, pipe.to.port) : null;
  if (from && to) return createSoftRoute(from, to);

  if (pipe.connector.width > 0) {
    const halfWidth = pipe.connector.width / 2;
    return [
      { x: pipe.connector.x - halfWidth, y: pipe.connector.y },
      { x: pipe.connector.x + halfWidth, y: pipe.connector.y }
    ];
  }

  return [];
}

export function createGeneratedPipeVisual(options: GeneratedPipeOptions): Node {
  const node = new Node(options.name);
  node.layer = options.layer;
  node.addComponent(UITransform).setContentSize(1080, 1920);

  const graphics = node.addComponent(Graphics);
  const path = options.path.map((point) => new Vec3(point.x, point.y, 0));
  if (path.length < 2) return node;

  if (options.state === "empty") {
    strokePath(graphics, path, options.thickness + 8, new Color(255, 209, 79, 85));
    strokePath(graphics, path, Math.max(6, options.thickness * 0.35), new Color(255, 249, 218, 92));
  } else if (options.state === "pump") {
    strokePath(graphics, path, options.thickness + 10, new Color(255, 204, 204, 150));
    strokePath(graphics, path, options.thickness, new Color(227, 83, 94, 230));
    strokePath(graphics, path, Math.max(6, options.thickness * 0.28), new Color(255, 242, 242, 138));
  } else {
    strokePath(graphics, path, options.thickness + 14, new Color(229, 161, 50, 245));
    strokePath(graphics, path, options.thickness + 4, new Color(35, 105, 181, 255));
    strokePath(graphics, path, options.thickness, new Color(42, 166, 236, 250));
    strokePath(graphics, path, Math.max(6, options.thickness * 0.25), new Color(178, 240, 255, 150));
  }

  return node;
}

function findPort(nodes: readonly VisualNodeLayout[], nodeId: string, port: string): PointLayout | null {
  const node = nodes.find((candidate) => candidate.id === nodeId);
  return node?.ports?.[port] ?? null;
}

function createSoftRoute(from: PointLayout, to: PointLayout): PointLayout[] {
  const horizontalDistance = Math.abs(to.x - from.x);
  if (horizontalDistance < 80 || Math.abs(to.y - from.y) < 20) {
    return [from, to];
  }

  const midX = from.x + (to.x - from.x) / 2;
  return [
    from,
    { x: midX, y: from.y },
    { x: midX, y: to.y },
    to
  ];
}

function strokePath(graphics: Graphics, points: Vec3[], width: number, color: Color): void {
  if (points.length < 2) return;
  graphics.strokeColor = color;
  graphics.lineWidth = width;
  graphics.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    graphics.lineTo(points[index].x, points[index].y);
  }
  graphics.stroke();
}
