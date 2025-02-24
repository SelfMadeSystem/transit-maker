import { wrapAngle2PI } from '../utils/mathUtils';
import { Vector2, pointSegmentDistance } from '../utils/vec';
import { createActionFunction } from './Action';
import { ActionableItem, PosWithKeys, Transformable } from './types';

const HANDLE_SIZE = 10;
const ROTATE_HANDLE_OFFSET = 20;

function drawRotateHandle(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  size: Vector2,
) {
  if (size.y < 0) {
    size = size.mult(1, -1);
  }
  const topMid = new Vector2(0, -size.y / 2);
  ctx.beginPath();
  ctx.moveTo(topMid.x, topMid.y);
  ctx.lineTo(topMid.x, topMid.y - ROTATE_HANDLE_OFFSET / 2 / zoom);
  ctx.arc(
    topMid.x,
    topMid.y - ROTATE_HANDLE_OFFSET / zoom,
    HANDLE_SIZE / 2 / zoom,
    Math.PI / 2,
    (5 * Math.PI) / 2,
  );
  ctx.stroke();
}

function drawResizeHandles(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  size: Vector2,
) {
  const halfSize = size.div(2);
  const handles = [
    new Vector2(-halfSize.x, -halfSize.y),
    new Vector2(halfSize.x, -halfSize.y),
    new Vector2(halfSize.x, halfSize.y),
    new Vector2(-halfSize.x, halfSize.y),
  ];
  handles.forEach(handle => {
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, HANDLE_SIZE / 2 / zoom, 0, 2 * Math.PI);
    ctx.stroke();
  });
}

function getSize(t: Transformable, zoom: number, absolute = false) {
  const add = new Vector2(10, 10).div(zoom);
  const size = t.getSize();
  if (absolute) {
    return size.abs().add(add);
  }
  return size.add(add.mult(...size.sign().a()));
}

export function drawTransformableRegion(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  t: Transformable,
) {
  ctx.save();
  const pos = t.getCenterPos();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(t.getRotation());
  const size = getSize(t, zoom);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2 / zoom;
  ctx.strokeRect(-size.x / 2, -size.y / 2, size.x, size.y);

  drawRotateHandle(ctx, zoom, size);
  drawResizeHandles(ctx, zoom, size);

  ctx.restore();
}

export function isOverTransformable(t: Transformable, pos: Vector2): boolean {
  const size = t.getSize().abs();
  const halfSize = size.div(2);
  pos = pos.sub(t.getCenterPos()).rotateBy(-t.getRotation());
  return (
    pos.x >= -halfSize.x &&
    pos.x <= halfSize.x &&
    pos.y >= -halfSize.y &&
    pos.y <= halfSize.y
  );
}

export type Handle =
  | 'rotate'
  | 't'
  | 'tr'
  | 'r'
  | 'br'
  | 'b'
  | 'bl'
  | 'l'
  | 'tl';

export function getHandle(
  pos: Vector2,
  zoom: number,
  t: Transformable,
  absolute = false,
): Handle | null {
  const rotation = -t.getRotation();
  pos = pos.sub(t.getCenterPos()).rotateBy(rotation);

  const handleSize = HANDLE_SIZE / zoom;
  const edgeSize = Math.sqrt(handleSize);

  const size = getSize(t, zoom, absolute);
  const halfSize = size.div(2);
  const handles = {
    rotate: new Vector2(
      0,
      -halfSize.y * Math.sign(halfSize.y) - ROTATE_HANDLE_OFFSET / zoom,
    ),
    tr: new Vector2(halfSize.x, -halfSize.y),
    br: new Vector2(halfSize.x, halfSize.y),
    bl: new Vector2(-halfSize.x, halfSize.y),
    tl: new Vector2(-halfSize.x, -halfSize.y),
  } satisfies Partial<Record<Handle, Vector2>>;
  for (const handle in handles) {
    const dist = pos.dist(handles[handle as keyof typeof handles]);
    if (dist < handleSize) {
      return handle as Handle;
    }
  }
  const edges = {
    t: [
      new Vector2(-halfSize.x, -halfSize.y),
      new Vector2(halfSize.x, -halfSize.y),
    ],
    r: [
      new Vector2(halfSize.x, -halfSize.y),
      new Vector2(halfSize.x, halfSize.y),
    ],
    b: [
      new Vector2(halfSize.x, halfSize.y),
      new Vector2(-halfSize.x, halfSize.y),
    ],
    l: [
      new Vector2(-halfSize.x, halfSize.y),
      new Vector2(-halfSize.x, -halfSize.y),
    ],
  } satisfies Partial<Record<Handle, [Vector2, Vector2]>>;
  for (const edge in edges) {
    const [start, end] = edges[edge as keyof typeof edges];
    const dist = pointSegmentDistance(pos, start, end);
    if (dist < edgeSize) {
      return edge as Handle;
    }
  }
  return null;
}

export function getCursor(pos: Vector2, zoom: number, t: Transformable) {
  const handle = getHandle(pos, zoom, t, true);
  let rotation = -t.getRotation();
  switch (handle) {
    case 'rotate':
      return 'grab';
    case 't':
      rotation += Math.PI / 2;
      break;
    case 'tr':
      rotation += Math.PI / 4;
      break;
    case 'r':
      break;
    case 'br':
      rotation -= Math.PI / 4;
      break;
    case 'b':
      rotation -= Math.PI / 2;
      break;
    case 'bl':
      rotation -= (3 * Math.PI) / 4;
      break;
    case 'l':
      rotation += Math.PI;
      break;
    case 'tl':
      rotation += (3 * Math.PI) / 4;
      break;
  }

  rotation = wrapAngle2PI(rotation);
  if (rotation < Math.PI / 8 || rotation > (15 * Math.PI) / 8) {
    return 'e-resize';
  }
  if (rotation < (3 * Math.PI) / 8) {
    return 'ne-resize';
  }
  if (rotation < (5 * Math.PI) / 8) {
    return 'n-resize';
  }
  if (rotation < (7 * Math.PI) / 8) {
    return 'nw-resize';
  }
  if (rotation < (9 * Math.PI) / 8) {
    return 'w-resize';
  }
  if (rotation < (11 * Math.PI) / 8) {
    return 'sw-resize';
  }
  if (rotation < (13 * Math.PI) / 8) {
    return 's-resize';
  }
  return 'se-resize';
}

export type TransformableState = {
  t: Transformable;
  pos: Vector2;
  rotation: number;
  scale: Vector2;
  size: Vector2;
  handle: Handle;
  mousePos: Vector2;
};

export function getTransformableState(
  t: Transformable,
  zoom: number,
  mousePos: Vector2,
): TransformableState | null {
  const handle = getHandle(mousePos, zoom, t);
  if (!handle) {
    return null;
  }
  return {
    t,
    pos: t.getCenterPos(),
    rotation: t.getRotation(),
    scale: t.getScale(),
    size: t.getNormalSize(),
    handle,
    mousePos,
  };
}

export function transform(state: TransformableState, pwk: PosWithKeys) {
  switch (state.handle) {
    case 'rotate':
      transformRotate(state, pwk);
      break;
    case 't':
    case 'l':
    case 'b':
    case 'r':
      transformScale(state, pwk);
      break;
    case 'tr':
    case 'br':
    case 'bl':
    case 'tl':
      transformUniformScale(state, pwk);
      break;
  }
}

export const createTransformAction = createActionFunction(
  (_, state: TransformableState) => {
    const pos = state.t.getCenterPos();
    const rotation = state.t.getRotation();
    const scale = state.t.getScale();
    if (
      pos.equals(state.pos) &&
      rotation === state.rotation &&
      scale.equals(state.scale)
    ) {
      return null;
    }
    return {
      label: 'Transform',
      undo() {
        state.t.setCenterPos(state.pos);
        state.t.setRotation(state.rotation);
        state.t.setScale(state.scale);
      },
      redo() {
        state.t.setCenterPos(pos);
        state.t.setRotation(rotation);
        state.t.setScale(scale);
      },
      data: state,
    };
  },
);

function transformRotate(state: TransformableState, pwk: PosWithKeys) {
  let angle = pwk.pos.sub(state.pos).angle();
  if (pwk.shiftKey) {
    angle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  }
  state.t.setRotation(angle + Math.PI / 2);
}

function transformScale(state: TransformableState, pwk: PosWithKeys) {
  if (pwk.shiftKey) {
    transformUniformScale(state, pwk);
    return;
  }
  const diff = pwk.pos.sub(state.mousePos).rotateBy(-state.rotation);
  const posDiff = { x: 0, y: 0 };
  const scale = { ...state.scale };
  switch (state.handle) {
    case 't':
      posDiff.y += diff.y / 2;
      scale.y -= diff.y / state.size.y;
      break;
    case 'l':
      posDiff.x += diff.x / 2;
      scale.x -= diff.x / state.size.x;
      break;
    case 'b':
      posDiff.y += diff.y / 2;
      scale.y += diff.y / state.size.y;
      break;
    case 'r':
      posDiff.x += diff.x / 2;
      scale.x += diff.x / state.size.x;
      break;
  }
  const newPos = state.pos.add(
    new Vector2(posDiff.x, posDiff.y).rotateBy(state.rotation),
  );
  state.t.setScale(new Vector2(scale.x, scale.y));
  state.t.setCenterPos(newPos);
}

function transformUniformScale(state: TransformableState, pwk: PosWithKeys) {
  const diff = pwk.pos.sub(state.mousePos).rotateBy(-state.rotation);
  const posDiff = { x: 0, y: 0 };
  const scale = { ...state.scale };
  const isX = state.handle.includes('r') || state.handle.includes('l');
  const ogRatio = state.scale.x / state.scale.y;
  const scaleByX = isX ? diff.x / state.size.x : diff.y / state.size.y;
  const scaleByY = scaleByX / ogRatio;
  switch (state.handle) {
    case 't':
      posDiff.y += (scaleByY * state.size.y) / 2;
      scale.x -= scaleByX;
      scale.y -= scaleByY;
      break;
    case 'r':
      posDiff.x += (scaleByX * state.size.x) / 2;
      scale.x += scaleByX;
      scale.y += scaleByY;
      break;
    case 'b':
      posDiff.y += (scaleByY * state.size.y) / 2;
      scale.x += scaleByX;
      scale.y += scaleByY;
      break;
    case 'l':
      posDiff.x += (scaleByX * state.size.x) / 2;
      scale.x -= scaleByX;
      scale.y -= scaleByY;
      break;
    case 'tr':
      posDiff.x += (scaleByX * state.size.x) / 2;
      posDiff.y -= (scaleByY * state.size.y) / 2;
      scale.x += scaleByX;
      scale.y += scaleByY;
      break;
    case 'br':
      posDiff.x += (scaleByX * state.size.x) / 2;
      posDiff.y += (scaleByY * state.size.y) / 2;
      scale.x += scaleByX;
      scale.y += scaleByY;
      break;
    case 'bl':
      posDiff.x += (scaleByX * state.size.x) / 2;
      posDiff.y -= (scaleByY * state.size.y) / 2;
      scale.x -= scaleByX;
      scale.y -= scaleByY;
      break;
    case 'tl':
      posDiff.x += (scaleByX * state.size.x) / 2;
      posDiff.y += (scaleByY * state.size.y) / 2;
      scale.x -= scaleByX;
      scale.y -= scaleByY;
      break;
  }
  const newPos = state.pos.add(
    new Vector2(posDiff.x, posDiff.y).rotateBy(state.rotation),
  );
  state.t.setScale(new Vector2(scale.x, scale.y));
  state.t.setCenterPos(newPos);
}

export function isTransformable(actionable: ActionableItem | null): boolean {
  // Can't use type guard because there is no "actionable extends Transformable"
  // without actionable *100% being* Transformable (i.e. no extra properties)
  return (
    actionable !== null &&
    'getSize' in actionable &&
    'setScale' in actionable &&
    'getCenterPos' in actionable &&
    'getRotation' in actionable &&
    'setRotation' in actionable
  );
}
