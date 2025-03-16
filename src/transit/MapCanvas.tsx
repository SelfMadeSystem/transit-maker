import { Color } from '../components/color/Color';
import { useCanvasDrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route } from './Route';
import { Segment } from './Segment';
import { SegmentPosition } from './SegmentPosition';
import { TransitMap } from './TransitMap';
import { eventToDragInfo, eventToPosWithKeys } from './types';
import { useCallback, useEffect, useRef, useState } from 'react';

function createMap(): TransitMap {
  const map = new TransitMap();
  const route1 = new Route(map);
  route1.color = Color.TW.sky[400];
  const route2 = new Route(map);
  route2.color = Color.TW.lime[400];
  const segment1 = new Segment(
    map,
    route1,
    SegmentPosition.vec(new Vector2(50, 50)),
    SegmentPosition.vec(new Vector2(100, 100)),
  );
  const segment2 = new Segment(
    map,
    route1,
    segment1.end,
    SegmentPosition.vec(new Vector2(200, 25)),
  );

  new Segment(
    map,
    route2,
    SegmentPosition.snap(segment2, 0.5, 0),
    SegmentPosition.vec(new Vector2(100, 0)),
  );
  return map;
}

type Camera = {
  zoom: number;
  offset: Vector2;
};

export function MapCanvas() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  const [map, _setMap] = useState(createMap);
  const [camera, setCamera] = useState<Camera>({
    zoom: 1,
    offset: new Vector2(0, 0),
  });
  const ctx = useCanvasDrawingContext(bgCanvasRef, canvasRef, fgCanvasRef);
  const frameRef = useRef<number | null>(null);

  const pointToMap = useCallback(
    (point: Vector2) => {
      const { zoom, offset } = camera;
      return point.sub(offset).div(zoom);
    },
    [camera],
  );

  const draw = useCallback(() => {
    if (!ctx) return;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    ctx.clear();
    ctx.setBackground(Color.BLACK);

    const { zoom, offset } = camera;

    ctx.save();
    ctx.translate(...offset.a);
    ctx.scale(zoom, zoom);
    map.draw(ctx);
    map.selected?.drawSelected(ctx);
    ctx.restore();

    if (map.selected) {
      frameRef.current = requestAnimationFrame(draw);
    }
  }, [camera, ctx, map]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
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
      e.preventDefault();
      let prevMouse = new Vector2(e.clientX, e.clientY);
      let prevPos = pointToMap(prevMouse);
      const startPos = prevPos;

      const newSelected = map.getSelectedAt(prevPos, ctx);

      if (newSelected) {
        map.selected = newSelected;
        newSelected.onClick?.(eventToPosWithKeys(e, prevPos));
        draw();
      } else if (map.selected) {
        map.selected = null;
        draw();
      }

      const handleMove = (e: MouseEvent) => {
        const currentMouse = new Vector2(e.clientX, e.clientY);
        const currentPos = pointToMap(currentMouse);
        if (newSelected) {
          const delta = currentPos.sub(prevPos);
          newSelected.onDrag?.(eventToDragInfo(e, startPos, currentPos, delta));
          draw();
        } else {
          const delta = currentMouse.sub(prevMouse);
          setCamera(({ zoom, offset }) => ({
            zoom,
            offset: offset.add(delta),
          }));
        }
        prevMouse = currentMouse;
        prevPos = currentPos;
      };

      const handleUp = (e: MouseEvent) => {
        if (newSelected) {
          const currentMouse = new Vector2(e.clientX, e.clientY);
          const currentPos = pointToMap(currentMouse);
          const delta = currentMouse.sub(prevMouse);
          newSelected.onDragEnd?.(
            eventToDragInfo(e, startPos, currentPos, delta),
          );
          draw();
        }
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    };

    const keyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (map.selected) {
            map.selected.remove();
            map.selected = null;
            draw();
          }
          break;
        case 'Escape':
          if (map.selected) {
            map.selected = null;
            draw();
          }
          break;
      }
    };

    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleDrag);
    canvas.addEventListener('contextmenu', preventDefault);
    window.addEventListener('keydown', keyDown);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleDrag);
      canvas.removeEventListener('contextmenu', preventDefault);
      window.removeEventListener('keydown', keyDown);
    };
  }, [ctx, draw, map, pointToMap]);

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
