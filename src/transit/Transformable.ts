import { wrapAngle2PI } from '../utils/mathUtils';
import { Vector2, pointSegmentDistance } from '../utils/vec';
import { Transformable } from './types';

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
