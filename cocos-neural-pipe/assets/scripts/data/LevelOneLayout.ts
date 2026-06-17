export type LabelLayout = {
  x: number;
  y: number;
  size: number;
  width: number;
  height: number;
};

export type RectLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PointLayout = {
  x: number;
  y: number;
};

export type GameLabelLayout = RectLayout & {
  titleSize: number;
  subtitleSize: number;
};

export type VisualNodeKind = "source" | "merge" | "tank" | "factory";
export type VisualPortName = "input" | "output" | "left" | "right" | "top" | "bottom";

export type VisualNodeLayout = RectLayout & {
  id: string;
  kind: VisualNodeKind;
  label: GameLabelLayout;
  pulse: PointLayout;
  ports?: Partial<Record<VisualPortName, PointLayout>>;
};

export type VisualPipeState = "empty" | "supply" | "pump";

export type VisualPipeLayout = {
  pipeId: string;
  state: VisualPipeState;
  from?: VisualPipeEndpoint;
  to?: VisualPipeEndpoint;
  connector: RectLayout;
  hitbox: RectLayout;
  glow: RectLayout;
  prompt: LabelLayout;
  flowPath: PointLayout[];
  thickness?: number;
};

export type VisualPipeEndpoint = {
  nodeId: string;
  port: VisualPortName;
};

export const LEVEL_ONE_LAYOUT = {
  background: {
    path: "art/level1/gameplay-bg-clean",
    x: 0,
    y: 0,
    width: 1080,
    height: 1920
  },

  hudArt: {
    top: { path: "art/level1/ui-top", x: 0, y: 826, width: 1080, height: 216 },
    titleWidget: { path: "art/level1/ui-title-widget-v2", x: -190, y: 812, width: 640, height: 170 },
    mapButton: { path: "art/level1/ui-map-button-v2", x: 419, y: 812, width: 164, height: 164 },
    bottom: { path: "art/level1/ui-bottom-v2", x: 0, y: -625, width: 1080, height: 670 }
  },

  top: {
    chapter: { x: -282, y: 801, size: 36, width: 180, height: 58 },
    title: { x: -103, y: 808, size: 50, width: 390, height: 72 },
    objective: { x: 4, y: 687, size: 37, width: 753, height: 62 },
    mapButton: { x: 419, y: 812, width: 190, height: 150 }
  },

  visualNodes: [
    {
      id: "source",
      kind: "source",
      x: -394,
      y: 2,
      width: 236,
      height: 220,
      label: { x: -375, y: -111, width: 162, height: 78, titleSize: 38, subtitleSize: 27 },
      pulse: { x: -374, y: 19 },
      ports: {
        output: { x: -303, y: 13 },
        right: { x: -303, y: 13 }
      }
    },
    {
      id: "merge",
      kind: "merge",
      x: 30,
      y: 26,
      width: 250,
      height: 173,
      label: { x: 44, y: -133, width: 170, height: 82, titleSize: 38, subtitleSize: 27 },
      pulse: { x: 38, y: 33 },
      ports: {
        input: { x: -76, y: 8 },
        left: { x: -76, y: 8 },
        output: { x: 142, y: 9 },
        right: { x: 142, y: 9 }
      }
    },
    {
      id: "tank",
      kind: "tank",
      x: 404,
      y: 82,
      width: 178,
      height: 276,
      label: { x: 414, y: -106, width: 170, height: 82, titleSize: 38, subtitleSize: 27 },
      pulse: { x: 408, y: 82 },
      ports: {
        input: { x: 313, y: 9 },
        left: { x: 313, y: 9 }
      }
    }
  ] as VisualNodeLayout[],

  scene: {
    source: { x: -386, y: -150, width: 162, height: 78, titleSize: 38, subtitleSize: 27 },
    merge: { x: 40, y: -164, width: 170, height: 82, titleSize: 38, subtitleSize: 27 },
    tank: { x: 391, y: -158, width: 170, height: 82, titleSize: 38, subtitleSize: 27 }
  },

  visualPipes: [
    {
      pipeId: "x1",
      state: "supply",
      from: { nodeId: "source", port: "output" },
      to: { nodeId: "merge", port: "input" },
      connector: { x: -185, y: 10, width: 264, height: 64 },
      hitbox: { x: -184, y: 4, width: 230, height: 190 },
      glow: { x: -187, y: 2, width: 174, height: 174 },
      prompt: { x: -193, y: 4, size: 34, width: 240, height: 56 },
      flowPath: [
        { x: -303, y: 13 },
        { x: -235, y: 6 },
        { x: -152, y: 6 },
        { x: -76, y: 8 }
      ]
    },
    {
      pipeId: "merge-to-tank",
      state: "supply",
      from: { nodeId: "merge", port: "output" },
      to: { nodeId: "tank", port: "input" },
      connector: { x: 229, y: 10, width: 246, height: 64 },
      hitbox: { x: 228, y: 10, width: 0, height: 0 },
      glow: { x: 228, y: 10, width: 0, height: 0 },
      prompt: { x: 228, y: 10, size: 1, width: 1, height: 1 },
      flowPath: [
        { x: 142, y: 9 },
        { x: 232, y: 8 },
        { x: 313, y: 9 }
      ]
    }
  ] as VisualPipeLayout[],

  pipe: {
    glow: { x: -187, y: 2, width: 174, height: 174 },
    connector: { x: -185, y: 10, width: 262, height: 64 },
    prompt: { x: -193, y: 4, size: 34, width: 240, height: 56 },
    hitbox: { x: -184, y: 4, width: 230, height: 190 }
  },

  gauge: {
    startX: -292,
    width: 702,
    y: -424,
    max: 1.2,
    fillHeight: 78,
    targetHeight: 92,
    title: { x: -167, y: -427, size: 35, width: 218, height: 60 },
    targetText: { x: 290, y: -426, size: 35, width: 280, height: 60 }
  },

  status: {
    current: { x: 408, y: -231, size: 34, width: 200, height: 106 }
  },

  buttons: {
    backText: { x: -287, y: -812, size: 48, width: 280, height: 82 },
    mainText: { x: 193, y: -810, size: 54, width: 430, height: 88 },
    backHitbox: { x: -290, y: -809, width: 330, height: 112 },
    mainHitbox: { x: 185, y: -812, width: 500, height: 120 }
  },

  flow: {
    sourceToMerge: [
      { x: -303, y: 13 },
      { x: -235, y: 6 },
      { x: -152, y: 6 },
      { x: -76, y: 8 }
    ],
    mergeToTank: [
      { x: 142, y: 9 },
      { x: 232, y: 8 },
      { x: 313, y: 9 }
    ],
    dotCount: 2
  },

  ambient: {
    source: { x: -389, y: 179 },
    merge: { x: 27, y: 53 },
    tank: { x: 386, y: 30 }
  }
} as const;
