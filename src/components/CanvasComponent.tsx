import { loopAnimationFrame } from "../utils/abortable";
import { useEffect, useRef, useState } from "react";
import { usePrevious } from "../utils/hooks";

type Functionify<T extends Record<string, unknown>> = {
  [K in keyof T]: (data: T[K]) => void;
};

type ReturnType<T extends Record<string, unknown>> = {
  manualUpdate?: boolean;
  resize?: (width: number, height: number) => void;
  update?: (dt: number, time: number) => void;
  propsUpdate?: Partial<Functionify<T>>;
  mouseMove?: (
    e: MouseEvent,
    coords: { mouseX: number; mouseY: number }
  ) => void;
  mouseDown?: (
    e: MouseEvent,
    coords: { mouseX: number; mouseY: number }
  ) => void;
  mouseDbClick?: (
    e: MouseEvent,
    coords: { mouseX: number; mouseY: number }
  ) => void;
  mouseUp?: (e: MouseEvent, coords: { mouseX: number; mouseY: number }) => void;
  touchStart?: (
    e: TouchEvent,
    coords: { mouseX: number; mouseY: number }
  ) => void;
  touchMove?: (
    e: TouchEvent,
    coords: { mouseX: number; mouseY: number }
  ) => void;
  touchEnd?: (
    e: TouchEvent,
    coords: { mouseX: number; mouseY: number }
  ) => void;
  keyDown?: (e: KeyboardEvent) => void;
  keyUp?: (e: KeyboardEvent) => void;
  wheel?: (
    e: WheelEvent,
    opts: { deltaX: number; deltaY: number; mouseX: number; mouseY: number }
  ) => void;
  scroll?: (
    e: Event,
    opts: {
      deltaX: number;
      deltaY: number;
      scrollX: number;
      scrollY: number;
      percentX: number;
      percentY: number;
    }
  ) => void;
};

type CreateProps<T extends Record<string, unknown>> = {
  props: React.HTMLProps<HTMLCanvasElement>;
  autoResize?: boolean;
  setup: (
    canvas: HTMLCanvasElement,
    props: T,
    draw: () => void
  ) => ReturnType<T>;
};

export default function createCanvasComponent<
  T extends Record<string, unknown>
>({
  props,
  autoResize,
  setup,
}: CreateProps<T>): React.FC<
  React.HTMLProps<HTMLCanvasElement> & {
    props: T;
  }
> {
  return function CanvasComponent({
    props: props1,
    ...props2
  }: React.HTMLProps<HTMLCanvasElement> & {
    props: T;
  }) {
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const didMount = useRef(false);
    const resultRef = useRef<ReturnType<T>>();
    const prevProps = usePrevious(props1);

    useEffect(() => {
      if (!didMount.current && canvas) {
        const { signal, abort } = new AbortController();
        if (autoResize) {
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
        }
        let lastTime = performance.now();
        function draw(t: number) {
          const now = performance.now();
          const dt = now - lastTime;
          lastTime = now;
          if (result?.update) result.update!(dt, t);
        }

        function drawNow() {
          draw(document.timeline.currentTime as number);
        }

        const result = setup(canvas, props1, drawNow);
        resultRef.current = result;
        didMount.current = true;

        if (!result?.manualUpdate) loopAnimationFrame(draw, { signal });
        else requestAnimationFrame(draw);

        if (result?.mouseMove) {
          window.addEventListener(
            "mousemove",
            (e: MouseEvent) => {
              const rect = canvas.getBoundingClientRect();
              result.mouseMove!(e, {
                mouseX: e.clientX - rect.left,
                mouseY: e.clientY - rect.top,
              });
            },
            { signal }
          );
        }

        if (result?.mouseDown) {
          window.addEventListener(
            "mousedown",
            (e: MouseEvent) => {
              const rect = canvas.getBoundingClientRect();
              result.mouseDown!(e, {
                mouseX: e.clientX - rect.left,
                mouseY: e.clientY - rect.top,
              });
            },
            { signal, passive: false }
          );
          window.addEventListener(
            "contextmenu",
            (e: MouseEvent) => {
              e.preventDefault();
            },
            { signal }
          );
        }

        if (result?.mouseDbClick) {
          window.addEventListener(
            "dblclick",
            (e: MouseEvent) => {
              const rect = canvas.getBoundingClientRect();
              result.mouseDbClick!(e, {
                mouseX: e.clientX - rect.left,
                mouseY: e.clientY - rect.top,
              });
            },
            { signal }
          );
        }

        if (result?.mouseUp) {
          window.addEventListener(
            "mouseup",
            (e: MouseEvent) => {
              const rect = canvas.getBoundingClientRect();
              result.mouseUp!(e, {
                mouseX: e.clientX - rect.left,
                mouseY: e.clientY - rect.top,
              });
            },
            { signal }
          );
        }

        if (result?.touchStart) {
          window.addEventListener(
            "touchstart",
            (e: TouchEvent) => {
              const rect = canvas.getBoundingClientRect();
              const touch = e.touches[0];
              result.touchStart!(e, {
                mouseX: touch.clientX - rect.left,
                mouseY: touch.clientY - rect.top,
              });
            },
            { signal }
          );
        }

        if (result?.touchMove) {
          window.addEventListener(
            "touchmove",
            (e: TouchEvent) => {
              const rect = canvas.getBoundingClientRect();
              const touch = e.touches[0];
              result.touchMove!(e, {
                mouseX: touch.clientX - rect.left,
                mouseY: touch.clientY - rect.top,
              });
            },
            { signal }
          );
        }

        if (result?.touchEnd) {
          window.addEventListener(
            "touchend",
            (e: TouchEvent) => {
              const rect = canvas.getBoundingClientRect();
              const touch = e.changedTouches[0];
              result.touchEnd!(e, {
                mouseX: touch.clientX - rect.left,
                mouseY: touch.clientY - rect.top,
              });
            },
            { signal }
          );
        }

        if (result?.keyDown) {
          window.addEventListener(
            "keydown",
            (e: KeyboardEvent) => {
              result.keyDown!(e);
            },
            { signal }
          );
        }

        if (result?.keyUp) {
          window.addEventListener(
            "keyup",
            (e: KeyboardEvent) => {
              result.keyUp!(e);
            },
            { signal }
          );
        }

        if (result?.wheel) {
          window.addEventListener(
            "wheel",
            (e: WheelEvent) => {
              const rect = canvas.getBoundingClientRect();
              result.wheel!(e, {
                deltaX: e.deltaX,
                deltaY: e.deltaY,
                mouseX: e.clientX - rect.left,
                mouseY: e.clientY - rect.top,
              });
            },
            { signal }
          );
        }

        if (result?.scroll) {
          window.addEventListener(
            "scroll",
            (e) => {
              const rect = canvas.getBoundingClientRect();
              let deltaX = 0;
              let deltaY = 0;

              if (e instanceof WheelEvent) {
                deltaX = e.deltaX;
                deltaY = e.deltaY;
              } else if (e instanceof TouchEvent && e.touches.length === 1) {
                const touch = e.touches[0];
                deltaX = touch.clientX - rect.left;
                deltaY = touch.clientY - rect.top;
              }

              const scrollX = window.scrollX;
              const scrollY = window.scrollY;
              const percentX = (scrollX - rect.left) / rect.width;
              const percentY = (scrollY - rect.top) / rect.height;
              result.scroll!(e, {
                deltaX,
                deltaY,
                scrollX,
                scrollY,
                percentX,
                percentY,
              });
            },
            { signal }
          );
        }

        if (autoResize) {
          const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            canvas.width = entry.contentRect.width;
            canvas.height = entry.contentRect.height;
            if (result?.resize) {
              result.resize(entry.contentRect.width, entry.contentRect.height);
            }
          });

          observer.observe(canvas);

          signal.addEventListener("abort", () => {
            observer.disconnect();
          });
        }

        return abort;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvas]);

    useEffect(() => {
      if (resultRef.current?.propsUpdate) {
        const propsResult = resultRef.current.propsUpdate;
        const props1Keys = Object.keys(props1) as (keyof T)[];
        for (const key of props1Keys) {
          const current = props1[key];
          const prev = prevProps?.[key];
          if (current !== prev) {
            propsResult[key]?.(props1[key]);
          }
        }
      }
    }, [prevProps, props1]);

    return <canvas {...props} {...props2} ref={setCanvas} />;
  };
}
