import { wrapAngle2PI } from '../utils/mathUtils';
import { Vector2, pointSegmentDistance } from '../utils/vec';
import { ActionableItem, Transformable } from './types';

const HANDLE_SIZE = 10;
const ROTATE_HANDLE_OFFSET = 20;

function drawRotateHandle(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  size: Vector2,
) {
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

function getSize(t: Transformable, zoom: number) {
  return t.getSize().add(new Vector2(10, 10).div(zoom));
}

export function drawTransformableRegion(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  t: Transformable,
) {
  ctx.save();
  const pos = t.getPos();
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
): Handle | null {
  const rotation = -t.getRotation();
  pos = pos.sub(t.getPos()).rotateBy(rotation);

  const handleSize = HANDLE_SIZE / zoom;
  const edgeSize = Math.sqrt(handleSize);

  const size = getSize(t, zoom);
  const halfSize = size.div(2);
  const handles = {
    rotate: new Vector2(0, -halfSize.y - ROTATE_HANDLE_OFFSET / zoom),
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
  let minDist = Infinity;
  for (const edge in edges) {
    const [start, end] = edges[edge as keyof typeof edges];
    const dist = pointSegmentDistance(pos, start, end);
    if (dist < edgeSize) {
      return edge as Handle;
    }
    if (dist < minDist) {
      minDist = dist;
    }
  }
  console.log(minDist);
  return null;
}

export function getCursor(handle: Handle, t: Transformable) {
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
    pos: t.getPos(),
    rotation: t.getRotation(),
    scale: t.getScale(),
    size: t.getNormalSize(),
    handle,
    mousePos,
  };
}

export function transform(ogState: TransformableState, mousePos: Vector2) {
  switch (ogState.handle) {
    case 'rotate':
      transformRotate(ogState, mousePos);
      break;
    case 't':
    case 'l':
    case 'b':
    case 'r':
      transformScale(ogState, mousePos);
      break;
    case 'tr':
    case 'br':
    case 'bl':
    case 'tl':
      transformUniformScale(ogState, mousePos);
      break;
  }
}

function transformRotate(ogState: TransformableState, mousePos: Vector2) {
  const angle = mousePos.sub(ogState.pos).angle();
  ogState.t.setRotation(angle + Math.PI / 2);
}

function transformScale(ogState: TransformableState, mousePos: Vector2) {
  const diff = mousePos.sub(ogState.mousePos).rotateBy(-ogState.rotation);
  const posDiff = { x: 0, y: 0 };
  const scale = { ...ogState.scale };
  switch (ogState.handle) {
    case 't':
      posDiff.y += diff.y / 2;
      scale.y -= diff.y / ogState.size.y;
      break;
    case 'l':
      posDiff.x += diff.x / 2;
      scale.x -= diff.x / ogState.size.x;
      break;
    case 'b':
      posDiff.y += diff.y / 2;
      scale.y += diff.y / ogState.size.y;
      break;
    case 'r':
      posDiff.x += diff.x / 2;
      scale.x += diff.x / ogState.size.x;
      break;
  }
  const newPos = ogState.pos.add(
    new Vector2(posDiff.x, posDiff.y).rotateBy(ogState.rotation),
  );
  ogState.t.setScale(new Vector2(scale.x, scale.y));
  ogState.t.setPos(newPos);
}

function transformUniformScale(ogState: TransformableState, mousePos: Vector2) {
  const diff = mousePos.sub(ogState.mousePos).rotateBy(-ogState.rotation);
  const posDiff = { x: 0, y: 0 };
  const scale = { ...ogState.scale };
  const isX = true;
  const scaleBy = isX ? diff.x : diff.y;
  switch (ogState.handle) {
    case 'tr':
      posDiff.x += scaleBy / 2;
      posDiff.y -= scaleBy / 2;
      scale.x += scaleBy / ogState.size.x;
      scale.y += scaleBy / ogState.size.y;
      break;
    case 'br':
      posDiff.x += scaleBy / 2;
      posDiff.y += scaleBy / 2;
      scale.x += scaleBy / ogState.size.x;
      scale.y += scaleBy / ogState.size.y;
      break;
    case 'bl':
      posDiff.x += scaleBy / 2;
      posDiff.y -= scaleBy / 2;
      scale.x -= scaleBy / ogState.size.x;
      scale.y -= scaleBy / ogState.size.y;
      break;
    case 'tl':
      posDiff.x += scaleBy / 2;
      posDiff.y += scaleBy / 2;
      scale.x -= scaleBy / ogState.size.x;
      scale.y -= scaleBy / ogState.size.y;
      break;
  }
  const newPos = ogState.pos.add(
    new Vector2(posDiff.x, posDiff.y).rotateBy(ogState.rotation),
  );
  ogState.t.setScale(new Vector2(scale.x, scale.y));
  ogState.t.setPos(newPos);
}

export function isTransformable(actionable: ActionableItem | null): boolean {
  // Can't use type guard because there is no "actionable extends Transformable"
  // without actionable *100% being* Transformable (i.e. no extra properties)
  return (
    actionable !== null &&
    'getSize' in actionable &&
    'setScale' in actionable &&
    'getPos' in actionable &&
    'getRotation' in actionable &&
    'setRotation' in actionable
  );
}
