import { Color } from '../components/color/Color';
import { useCanvasDrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route, RouteSegment } from './Transit';
import { useEffect, useRef, useState } from 'react';

function createRoute(): Route {
  const segment1 = new RouteSegment(
    { type: 'vec', pos: new Vector2(50, 50) },
    { type: 'vec', pos: new Vector2(100, 100) },
  );
  const segment2 = new RouteSegment(
    { type: 'snap', segment: segment1, position: 0.5, offset: 0 },
    { type: 'vec', pos: new Vector2(200, 25) },
  );
  return new Route([segment1, segment2]);
}

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [route, setRoute] = useState(createRoute);
  const ctx = useCanvasDrawingContext(canvasRef);

  useEffect(() => {
    if (!ctx) return;

    ctx.setBackground(Color.WHITE);
    route.draw(ctx);
  });

  return <canvas ref={canvasRef} />;
}
