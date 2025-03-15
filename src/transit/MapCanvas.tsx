import { Color } from '../components/color/Color';
import { useCanvasDrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { RouteSegment } from './Segment';
import { Route, TransitMap } from './Transit';
import { useCallback, useEffect, useRef, useState } from 'react';

function createMap(): TransitMap {
  const segment1 = new RouteSegment(
    { type: 'vec', pos: new Vector2(50, 50) },
    { type: 'vec', pos: new Vector2(100, 100) },
  );
  const segment2 = new RouteSegment(
    { type: 'snap', segment: segment1, position: 0.5, offset: 0 },
    { type: 'vec', pos: new Vector2(200, 25) },
  );
  const route1 = new Route([segment1, segment2]);

  const segment3 = new RouteSegment(
    { type: 'vec', pos: new Vector2(50, 150) },
    { type: 'vec', pos: new Vector2(100, 0) },
  );
  const route2 = new Route([segment3]);

  return new TransitMap([route1, route2], []);
}

export function MapCanvas() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState(createMap);
  const ctx = useCanvasDrawingContext(bgCanvasRef, canvasRef);

  const draw = useCallback(() => {
    if (!ctx) return;

    ctx.setBackground(Color.WHITE);
    map.draw(ctx);
  }, [ctx, map]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleResize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      draw();
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas);
    handleResize();

    return () => {
      observer.disconnect();
    };
  }, [draw]);

  return (
    <div className="absolute h-full w-full">
      <canvas ref={bgCanvasRef} className="absolute h-full w-full" />
      <canvas ref={canvasRef} className="absolute h-full w-full" />
    </div>
  );
}
