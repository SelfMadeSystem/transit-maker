import { Color } from './Color';
import { HueSelectionCanvas, SaturationValueCanvas } from './ColorCanvas';
import ColorJS from 'colorjs.io';
import { useEffect, useRef, useState } from 'react';

export type ColorCanvasProps = {
  color: Color;
  setColor: (color: Color) => void;
};

export default function ColorInput({ color, setColor }: ColorCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [hex, setHex] = useState(color.hex());

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (parentRef.current?.contains(e.target as Node)) return;
      setEditing(false);
    };
    window.addEventListener('mousedown', close, { capture: true });
    return () => {
      window.removeEventListener('mousedown', close, { capture: true });
    };
  }, [parentRef]);

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
      {editing && (
        <div className="absolute top-full right-0 z-10 flex h-48 w-64 flex-col justify-between bg-gray-700 p-4">
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
      )}
    </div>
  );
}
