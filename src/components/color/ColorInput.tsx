import { Vector2 } from '../../utils/vec';
import { Color } from './Color';
import { HueSelectionCanvas, SaturationValueCanvas } from './ColorCanvas';
import ColorJS from 'colorjs.io';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type ColorCanvasProps = {
  color: Color;
  setColor: (color: Color) => void;
};

export default function ColorInput({ color, setColor }: ColorCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [hex, setHex] = useState(color.hex());
  const [topLeft, setTopLeft] = useState(new Vector2(0, 0));

  useEffect(() => {
    if (!parentRef.current || !portalRef.current) return;

    const p1 = parentRef.current.getBoundingClientRect();
    const p2 = portalRef.current.getBoundingClientRect();

    let x = p1.left;
    let y = p1.top + p1.height;

    if (x + p2.width > window.innerWidth) x = p1.right - p2.width;
    if (y + p2.height > window.innerHeight) y = p1.top - p2.height;

    setTopLeft(new Vector2(x, y));
  }, [editing]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (
        parentRef.current?.contains(e.target as Node) ||
        portalRef.current?.contains(e.target as Node)
      )
        return;
      setEditing(false);
    };
    window.addEventListener('mousedown', close, { capture: true });

    return () => {
      window.removeEventListener('mousedown', close, { capture: true });
    };
  }, []);

  const portalElement = (
    <div
      ref={portalRef}
      className="absolute z-10 flex h-48 w-64 flex-col justify-between bg-gray-700 p-4"
      style={{ top: topLeft.y, left: topLeft.x }}
    >
      <div className="relative h-32 w-full">
        <SaturationValueCanvas
          hue={color.hue}
          saturation={color.saturation}
          value={color.value}
          setSv={(s, v) => {
            const c = color.withSv(s, v);
            setColor(c);
            setHex(c.hex());
          }}
        />
      </div>
      <div className="relative h-4 w-full">
        <HueSelectionCanvas
          hue={color.hue}
          setHue={hue => {
            const c = color.withHue(hue);
            setColor(c);
            setHex(c.hex());
          }}
        />
      </div>
      <input
        type="text"
        className="w-full bg-gray-800 p-1 text-white"
        value={hex}
        onChange={e => {
          const newHex = e.target.value;
          setHex(newHex);
          try {
            const c = Color.fromColorJS(new ColorJS(newHex));
            setColor(c);
          } catch (e) {
            console.error(e);
          }
        }}
      />
    </div>
  );

  return (
    <div
      ref={parentRef}
      className="relative flex items-center"
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div
        className="h-8 w-8 cursor-pointer rounded-full"
        style={{ backgroundColor: color.hex() }}
        onClick={() => setEditing(!editing)}
      />
      {editing && createPortal(portalElement, document.body)}
    </div>
  );
}
