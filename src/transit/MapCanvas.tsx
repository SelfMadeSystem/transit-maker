import { Color } from '../components/color/Color';
import { useCanvasDrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route } from './Route';
import { Segment } from './Segment';
import { SegmentPosition } from './SegmentPosition';
import { TransitMap } from './TransitMap';
import { eventToDragInfo, eventToPosWithKeys } from './types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pane } from 'tweakpane';

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

  const segment3 = new Segment(
    map,
    route2,
    SegmentPosition.snap(segment1, 0, 10),
    SegmentPosition.snap(segment1, 1, 10),
  );
  const segment4 = new Segment(
    map,
    route2,
    SegmentPosition.snap(segment1, 0, -10),
    SegmentPosition.snap(segment1, 1, -10),
  );
  new Segment(map, route2, segment3.end, SegmentPosition.snap(segment2, 1, 10));
  new Segment(
    map,
    route2,
    segment4.end,
    SegmentPosition.snap(segment2, 1, -10),
  );
  return map;
}

type Camera = {
  zoom: number;
  offset: Vector2;
};

export type DebugDrawFn = (ctx: CanvasRenderingContext2D) => void;

const debugQueue: DebugDrawFn[] = [];

// eslint-disable-next-line react-refresh/only-export-components
export function debugDraw(fn: DebugDrawFn) {
  debugQueue.push(fn);
}

export function MapCanvas() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const paneRef = useRef<Pane | null>(null);
  const [map, _setMap] = useState(createMap);
  const [camera, setCamera] = useState<Camera>({
    zoom: 1,
    offset: new Vector2(0, 0),
  });
  const ctx = useCanvasDrawingContext(bgCanvasRef, canvasRef, fgCanvasRef);
  const frameRef = useRef<number | null>(null);
  const drawRef = useRef<() => void>(() => {});

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
    map.draw(ctx, zoom, offset);
    map.selected?.drawSelected(ctx);
    ctx.restore();

    if (debugQueue.length > 0) {
      const debugCanvas = debugCanvasRef.current!;
      const debugCtx = debugCanvas.getContext('2d')!;
      debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
      debugCtx.save();
      debugCtx.translate(...offset.a);
      debugCtx.scale(zoom, zoom);
      debugQueue.forEach(fn => fn(debugCtx));
      debugCtx.restore();
      debugQueue.length = 0;
    }

    if (map.selected) {
      frameRef.current = requestAnimationFrame(draw);
    }
  }, [camera, ctx, map]);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    if (paneRef.current) {
      paneRef.current.dispose();
      paneRef.current = null;
    }
    const pane = new Pane();
    paneRef.current = pane;
    pane.on('change', () => {
      drawRef.current();
    });

    const grid = pane.addFolder({ title: 'Grid' });
    grid.addBinding(map.grid, 'gridSize', {
      min: 5,
      max: 1000,
      step: 1,
      label: 'Grid Size',
    });
    grid.addBinding(map.grid, 'minor', {
      min: 0,
      max: 10,
      step: 1,
      label: 'Minor',
    });
    grid.addBinding(map.grid, 'autoAdjust', {
      label: 'Auto Adjust',
    });
    grid
      .addBinding(map.grid, 'gridOffset', {
        label: 'Grid Offset',
        view: 'vector2',
        min: -100,
        max: 100,
        step: 1,
      })
      .on('change', ({ value }) => {
        map.grid.gridOffset = new Vector2(value.x, value.y);
        drawRef.current();
      });
    grid
      .addBinding(map.grid, 'gridRotation', {
        label: 'Grid Rotation',
        view: 'vector2',
        min: -45,
        max: 45,
        step: 1,
      })
      .on('change', ({ value }) => {
        map.grid.gridRotation = new Vector2(
          (value.x * Math.PI) / 180,
          (value.y * Math.PI) / 180,
        );
        drawRef.current();
      });
  }, [map]);

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
        const newOffset = mouse.sub(mouse.sub(offset).mult(newZoom / zoom));
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
        if (map.selected) {
          const delta = currentPos.sub(prevPos);
          map.selected.onDrag?.(
            eventToDragInfo(e, startPos, currentPos, delta),
          );
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
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        if (map.selected) {
          const currentMouse = new Vector2(e.clientX, e.clientY);
          const currentPos = pointToMap(currentMouse);
          const delta = currentMouse.sub(prevMouse);
          map.selected.onDragEnd?.(
            eventToDragInfo(e, startPos, currentPos, delta),
          );
          draw();
        }
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
    const debugCanvas = debugCanvasRef.current;
    if (!bgCanvas || !canvas || !fgCanvas || !debugCanvas) return;
    const handleResize = () => {
      if (
        debugCanvas.width === canvas.clientWidth &&
        debugCanvas.height === canvas.clientHeight
      ) {
        draw();
        return;
      }
      bgCanvas.width =
        canvas.width =
        fgCanvas.width =
        debugCanvas.width =
          canvas.clientWidth;
      bgCanvas.height =
        canvas.height =
        fgCanvas.height =
        debugCanvas.height =
          canvas.clientHeight;
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
      <canvas
        ref={debugCanvasRef}
        className="pointer-events-none absolute h-full w-full"
      />
    </div>
  );
}
