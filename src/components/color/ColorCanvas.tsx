import { clamp } from '../../utils/mathUtils';
import { hsvToRgb } from './Color';
import { useEffect, useRef } from 'react';

export function HueSelectionCanvas({
  hue,
  setHue,
}: {
  hue: number;
  setHue: (v: number) => void;
}) {
  const gradientRef = useRef<HTMLCanvasElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = gradientRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);

    for (let x = 0; x < width; x++) {
      const hue = (360 * x) / width;
      const saturation = 1;
      const value = 1;
      const rgb = hsvToRgb(hue, saturation, value);
      const i = x * 4;
      imageData.data[i] = rgb.r;
      imageData.data[i + 1] = rgb.g;
      imageData.data[i + 2] = rgb.b;
      imageData.data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    const changeColor = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const hue = (360 * clamp(x, 0, 1)) | 0;
      setHue(hue);
    };
    const contoller = new AbortController();

    canvas.addEventListener(
      'mousedown',
      e => {
        changeColor(e);
        e.preventDefault();
        window.addEventListener('mousemove', changeColor);
        window.addEventListener('mouseup', () => {
          window.removeEventListener('mousemove', changeColor);
        });
      },
      { signal: contoller.signal },
    );

    return () => {
      contoller.abort();
    };
  }, [hue, setHue]);

  return (
    <div className="absloute inset-0 h-full w-full">
      <canvas
        className="absolute inset-0 h-full w-full"
        ref={gradientRef}
        width={360}
        height={1}
      />
      <div
        ref={selectorRef}
        className="absolute top-0 left-0 box-content h-full w-[2px] border-x-2 border-black"
        style={{ left: `calc(${hue / 360} * (100% - 4px))` }}
      />
    </div>
  );
}

export function SaturationValueCanvas({
  hue,
  saturation,
  value,
  setSv,
}: {
  hue: number;
  saturation: number;
  value: number;
  setSv: (s: number, v: number) => void;
}) {
  const gradientRef = useRef<HTMLCanvasElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = gradientRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');

    const width = (canvas.width = canvas.clientWidth);
    const height = (canvas.height = canvas.clientHeight);
    const imageData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const saturation = x / width;
        const lightness = 1 - y / height;
        const rgb = hsvToRgb(hue, saturation, lightness);
        const i = (y * width + x) * 4;
        imageData.data[i] = rgb.r;
        imageData.data[i + 1] = rgb.g;
        imageData.data[i + 2] = rgb.b;
        imageData.data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const changeColor = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const saturation = clamp(x, 0, 1);
      const value = 1 - clamp(y, 0, 1);
      setSv(saturation, value);
    };
    const contoller = new AbortController();

    canvas.addEventListener(
      'mousedown',
      e => {
        changeColor(e);
        e.preventDefault();
        window.addEventListener('mousemove', changeColor);
        window.addEventListener('mouseup', () => {
          window.removeEventListener('mousemove', changeColor);
        });
      },
      { signal: contoller.signal },
    );

    return () => {
      contoller.abort();
    };
  }, [hue, saturation, value, setSv]);

  return (
    <div className="absolute inset-0 h-full w-full">
      <canvas
        className="absolute inset-0 h-full w-full"
        ref={gradientRef}
        width={1}
        height={1}
      />
      <div
        ref={selectorRef}
        className="absolute top-0 left-0 box-content h-[3px] w-[3px] rounded-full border-2"
        style={{
          borderColor: value > 0.5 ? 'black' : 'white',
          left: `calc(${saturation * 100}% - 4px)`,
          top: `calc(${(1 - value) * 100}% - 4px)`,
        }}
      />
    </div>
  );
}
