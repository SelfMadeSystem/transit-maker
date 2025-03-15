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

type Camera = {
  zoom: number;
  offset: Vector2;
};

export function MapCanvas() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState(createMap);
  const [camera, setCamera] = useState<Camera>({
    zoom: 1,
    offset: new Vector2(0, 0),
  });
  const ctx = useCanvasDrawingContext(bgCanvasRef, canvasRef, fgCanvasRef);

  const draw = useCallback(() => {
    if (!ctx) return;

    ctx.setBackground(Color.BLACK);

    const { zoom, offset } = camera;

    ctx.save();
    ctx.translate(...offset.a);
    ctx.scale(zoom, zoom);
    map.draw(ctx);
    ctx.restore();
  }, [camera, ctx, map]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
      setCamera(({ zoom, offset }) => {
        const mouse = new Vector2(e.clientX, e.clientY);
        const deltaY = e.deltaY;
        const delta = 1 + deltaY / 1000;
        const newZoom = Math.max(0.1, zoom * delta);
        const newOffset = mouse.sub(mouse.sub(offset).mult(delta));
        return { zoom: newZoom, offset: newOffset };
      });
    };

    const handleDrag = (e: MouseEvent) => {
      let prevMouse = new Vector2(e.clientX, e.clientY);

      const handleMove = (e: MouseEvent) => {
        const currentMouse = new Vector2(e.clientX, e.clientY);
        const delta = currentMouse.sub(prevMouse);
        setCamera(({ zoom, offset }) => ({
          zoom,
          offset: offset.add(delta),
        }));
        prevMouse = currentMouse;
      };

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleDrag);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleDrag);
    };
  }, [draw]);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const canvas = canvasRef.current;
    const fgCanvas = fgCanvasRef.current;
    if (!bgCanvas || !canvas || !fgCanvas) return;
    const handleResize = () => {
      bgCanvas.width = canvas.width = fgCanvas.width = canvas.clientWidth;
      bgCanvas.height = canvas.height = fgCanvas.height = canvas.clientHeight;
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
      <canvas
        ref={fgCanvasRef}
        className="pointer-events-none absolute h-full w-full"
      />
    </div>
  );
}
