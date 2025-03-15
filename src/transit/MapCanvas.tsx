import { Color } from '../components/color/Color';
import {
  CanvasDrawingContext,
  useCanvasDrawingContext,
} from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route, RouteSegment } from './Transit';
import { useEffect, useRef, useState } from 'react';

function createRoute(): Route {
  return new Route([
    new RouteSegment(
      { type: 'vec', pos: new Vector2(0, 0) },
      { type: 'vec', pos: new Vector2(100, 100) },
    ),
  ]);
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
