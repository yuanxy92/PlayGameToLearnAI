import { Color, EventTouch, Graphics, Node, tween, Tween, UITransform, Vec3 } from "cc";

export type SliderControlOptions = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  min: number;
  max: number;
  value: number;
  layer: number;
  enabled?: boolean;
  onChange?: (value: number) => void;
};

export function createSliderControl(options: SliderControlOptions): Node {
  const node = new Node(options.name);
  node.layer = options.layer;
  node.setPosition(new Vec3(options.x, options.y, 0));
  node.addComponent(UITransform).setContentSize(options.width, options.height);

  const trackWidth = Math.max(80, options.width * 0.78);
  const trackHeight = Math.max(28, options.height * 0.36);
  const knobWidth = Math.max(58, options.height * 0.58);
  const knobHeight = Math.max(72, options.height * 0.82);
  const state = {
    value: clamp(options.value, options.min, options.max)
  };

  node.addChild(createTrack(trackWidth, trackHeight, options.layer));
  const knob = createKnob(knobWidth, knobHeight, options.layer);
  node.addChild(knob);

  const setValue = (value: number, notify: boolean): void => {
    state.value = clamp(value, options.min, options.max);
    const ratio = ratioFromValue(state.value, options.min, options.max);
    knob.setPosition(new Vec3(-trackWidth / 2 + ratio * trackWidth, 0, 0));
    if (notify) options.onChange?.(state.value);
  };

  setValue(state.value, false);

  if (options.enabled !== false) {
    const transform = node.getComponent(UITransform);
    let hovered = false;
    const normal = new Vec3(1, 1, 1);
    const hover = new Vec3(1.035, 1.035, 1);
    const pressed = new Vec3(0.94, 0.94, 1);
    const animateKnob = (scale: Vec3, duration: number): void => {
      Tween.stopAllByTarget(knob);
      tween(knob).to(duration, { scale }, { easing: "quadOut" }).start();
    };
    const updateFromTouch = (event: EventTouch): void => {
      if (!transform) return;
      const location = event.getUILocation();
      const local = transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
      const ratio = clamp01((local.x + trackWidth / 2) / trackWidth);
      setValue(options.min + ratio * (options.max - options.min), true);
    };
    node.on(Node.EventType.MOUSE_ENTER, () => {
      hovered = true;
      animateKnob(hover, 0.1);
    });
    node.on(Node.EventType.MOUSE_LEAVE, () => {
      hovered = false;
      animateKnob(normal, 0.12);
    });
    node.on(Node.EventType.TOUCH_START, updateFromTouch);
    node.on(Node.EventType.TOUCH_START, () => animateKnob(pressed, 0.06));
    node.on(Node.EventType.TOUCH_MOVE, updateFromTouch);
    node.on(Node.EventType.TOUCH_END, () => animateKnob(hovered ? hover : normal, 0.12));
    node.on(Node.EventType.TOUCH_CANCEL, () => animateKnob(normal, 0.12));
  }

  return node;
}

function createTrack(width: number, height: number, layer: number): Node {
  const node = new Node("SliderTrack");
  node.layer = layer;
  node.addComponent(UITransform).setContentSize(width, height + 34);
  const graphics = node.addComponent(Graphics);
  const x = -width / 2;
  const y = -height / 2;
  const radius = height / 2;

  graphics.fillColor = new Color(237, 217, 181, 235);
  graphics.roundRect(x - 8, y - 8, width + 16, height + 16, radius + 8);
  graphics.fill();

  graphics.fillColor = new Color(255, 239, 206, 248);
  graphics.roundRect(x, y, width, height, radius);
  graphics.fill();

  graphics.strokeColor = new Color(189, 139, 79, 220);
  graphics.lineWidth = 4;
  graphics.roundRect(x, y, width, height, radius);
  graphics.stroke();

  graphics.fillColor = new Color(255, 255, 255, 225);
  const dotCount = 9;
  for (let index = 0; index < dotCount; index += 1) {
    const dotX = x + 34 + index * ((width - 68) / (dotCount - 1));
    graphics.circle(dotX, 0, 6);
    graphics.fill();
  }

  return node;
}

function createKnob(width: number, height: number, layer: number): Node {
  const node = new Node("SliderKnob");
  node.layer = layer;
  node.addComponent(UITransform).setContentSize(width, height);
  const graphics = node.addComponent(Graphics);
  const x = -width / 2;
  const y = -height / 2;
  const radius = Math.min(width, height) * 0.28;

  graphics.fillColor = new Color(202, 151, 86, 210);
  graphics.roundRect(x - 6, y - 8, width + 12, height + 16, radius + 8);
  graphics.fill();

  graphics.fillColor = new Color(255, 238, 207, 255);
  graphics.roundRect(x, y, width, height, radius);
  graphics.fill();

  graphics.strokeColor = new Color(194, 142, 75, 230);
  graphics.lineWidth = 4;
  graphics.roundRect(x, y, width, height, radius);
  graphics.stroke();

  graphics.fillColor = new Color(255, 255, 255, 118);
  graphics.roundRect(x + 10, y + height - 22, width - 20, 10, 5);
  graphics.fill();

  graphics.fillColor = new Color(218, 174, 104, 235);
  graphics.roundRect(-11, -height * 0.24, 8, height * 0.48, 4);
  graphics.fill();
  graphics.roundRect(3, -height * 0.24, 8, height * 0.48, 4);
  graphics.fill();

  return node;
}

function ratioFromValue(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp01((value - min) / (max - min));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
