import { Color } from '../components/color/Color';
import { Path2Dpp } from './Path2Dpp';
import { RefObject, useEffect, useState } from 'react';

export interface DrawingContext {
  /**
   * Set the current context to either the background or middle ground context.
   * Eventually, might add a foreground context if needed.
   * @param which - 'bg' for background, 'mg' for middle ground, 'fg' for foreground
   */
  setCtx(which: 'bg' | 'mg' | 'fg'): void;
  /**
   * Set the background color of the canvas.
   * @param color - The color to set the background to
   */
  setBackground(color: Color): void;
  /**
   * Set the stroke width for the current context.
   * @param width - The width of the stroke
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineWidth
   */
  setStrokeWidth(width: number): void;
  /**
   * Set the stroke dash pattern for the current context.
   * @param dash - An array of numbers that specify distances to alternately draw a line and a gap
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
   */
  setStrokeDash(dash: number[]): void;
  /**
   * Set the stroke dash offset for the current context.
   * @param offset - The amount to offset the dash pattern
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineDashOffset
   */
  setStrokeDashOffset(offset: number): void;
  /**
   * Set the stroke line cap for the current context.
   * @param cap - The style of the end caps for a line
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineCap
   */
  setStrokeLineCap(cap: CanvasLineCap): void;
  /**
   * Set the stroke line join for the current context.
   * @param join - The type of corner created when two lines meet
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin
   */
  setStrokeLineJoin(join: CanvasLineJoin): void;
  /**
   * Set the fill color for the current context.
   * @param color - The color to fill shapes with
   */
  setFill(color: Color): void;
  /**
   * Set the stroke color for the current context.
   * @param color - The color to stroke shapes with
   */
  setStroke(color: Color): void;
  /**
   * Fill a path with the current fill color.
   * @param path - The path to fill
   * @param erase - Whether to erase the content behind the path on the canvas before filling
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fill
   */
  fillPath(path: Path2Dpp, erase?: boolean): void;
  /**
   * Stroke a path with the current stroke color.
   * @param path - The path to stroke
   * @param erase - Whether to erase the content behind the path on the canvas before stroking
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/stroke
   */
  strokePath(path: Path2Dpp, erase?: boolean): void;
  /**
   * Draw an image on the canvas.
   * @param image - The image to draw
   * @param dx - The x-coordinate at which to place the image
   * @param dy - The y-coordinate at which to place the image
   * @param dWidth - The width of the image to draw
   * @param dHeight - The height of the image to draw
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
   */
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
  ): void;
  /**
   * Set the font for the current context.
   * @param font - The font to use
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
   */
  setFont(font: string): void;
  /**
   * Set the text alignment for the current context.
   * @param align - The alignment of text
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textAlign
   */
  setTextAlign(align: CanvasTextAlign): void;
  /**
   * Set the text baseline for the current context.
   * @param baseline - The baseline of text
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
   */
  setTextBaseline(baseline: CanvasTextBaseline): void;
  /**
   * Fill text on the canvas.
   * @param text - The text to fill
   * @param x - The x-coordinate at which to place the text
   * @param y - The y-coordinate at which to place the text
   * @param erase - Whether to erase the content behind the text on the canvas before filling
   * @param maxWidth - The maximum width to draw the text
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
   */
  fillText(
    text: string,
    x: number,
    y: number,
    erase?: boolean,
    maxWidth?: number,
  ): void;
  /**
   * Stroke text on the canvas.
   * @param text - The text to stroke
   * @param x - The x-coordinate at which to place the text
   * @param y - The y-coordinate at which to place the text
   * @param erase - Whether to erase the content behind the text on the canvas before stroking
   * @param maxWidth - The maximum width to draw the text
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/strokeText
   */
  strokeText(
    text: string,
    x: number,
    y: number,
    erase?: boolean,
    maxWidth?: number,
  ): void;
  /**
   * Save the current context state.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save
   */
  save(): void;
  /**
   * Restore the last saved context state.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/restore
   */
  restore(): void;
  /**
   * Translate the all contexts by the given x and y coordinates.
   * @param x - The x-coordinate to translate by
   * @param y - The y-coordinate to translate by
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/translate
   */
  translate(x: number, y: number): void;
  /**
   * Rotate the all contexts by the given angle.
   * @param angle - The angle to rotate by
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate
   */
  rotate(angle: number): void;
  /**
   * Scale the all contexts by the given x and y factors.
   * @param x - The factor to scale the x-axis by
   * @param y - The factor to scale the y-axis by
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/scale
   */
  scale(x: number, y: number): void;
}

// TODO: somehow able to switch between bg and ctx and perhaps fg
export class CanvasDrawingContext implements DrawingContext {
  private bgCtx: CanvasRenderingContext2D;
  private ctx: CanvasRenderingContext2D;
  private fgCtx: CanvasRenderingContext2D;
  private currentCtx: CanvasRenderingContext2D;
  private ctxHistory: CanvasRenderingContext2D[] = [];

  constructor(
    bgCtx: CanvasRenderingContext2D,
    ctx: CanvasRenderingContext2D,
    fgCtx: CanvasRenderingContext2D,
  ) {
    this.bgCtx = bgCtx;
    this.ctx = ctx;
    this.fgCtx = fgCtx;
    this.currentCtx = ctx;
  }

  getBgCtx() {
    return this.bgCtx;
  }

  getCtx() {
    return this.currentCtx;
  }

  setCtx(which: 'bg' | 'mg' | 'fg') {
    switch (which) {
      case 'bg':
        this.currentCtx = this.bgCtx;
        break;
      case 'mg':
        this.currentCtx = this.ctx;
        break;
      case 'fg':
        this.currentCtx = this.fgCtx;
        break;
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.bgCtx.clearRect(
      0,
      0,
      this.bgCtx.canvas.width,
      this.bgCtx.canvas.height,
    );
    this.fgCtx.clearRect(
      0,
      0,
      this.fgCtx.canvas.width,
      this.fgCtx.canvas.height,
    );
  }

  setBackground(color: Color) {
    this.bgCtx.save();
    this.bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.bgCtx.fillStyle = color.hex();
    this.bgCtx.fillRect(
      0,
      0,
      this.bgCtx.canvas.width,
      this.bgCtx.canvas.height,
    );
    this.bgCtx.restore();
  }

  setStrokeWidth(width: number) {
    this.currentCtx.lineWidth = width;
  }

  setStrokeDash(dash: number[]) {
    this.currentCtx.setLineDash(dash);
  }

  setStrokeDashOffset(offset: number) {
    console.log(this.currentCtx, offset);
    this.currentCtx.lineDashOffset = offset;
  }

  setStrokeLineCap(cap: CanvasLineCap) {
    this.currentCtx.lineCap = cap;
  }

  setStrokeLineJoin(join: CanvasLineJoin) {
    this.currentCtx.lineJoin = join;
  }

  setFill(color: Color) {
    this.currentCtx.fillStyle = color.hex();
  }

  setStroke(color: Color) {
    this.currentCtx.strokeStyle = color.hex();
  }

  fillPath(pathpp: Path2Dpp, erase?: true) {
    const path = pathpp.toPath2D();
    if (erase) {
      this.currentCtx.save();
      this.currentCtx.globalCompositeOperation = 'destination-out';
      this.currentCtx.fillStyle = '#000';
      this.currentCtx.fill(path);
      this.currentCtx.restore();
    }
    this.currentCtx.fill(path);
  }

  strokePath(pathpp: Path2Dpp, erase?: true) {
    const path = pathpp.toPath2D();
    if (erase) {
      this.currentCtx.save();
      this.currentCtx.strokeStyle = '#000';
      this.currentCtx.globalCompositeOperation = 'destination-out';
      this.currentCtx.stroke(path);
      this.currentCtx.restore();
    }
    this.currentCtx.stroke(path);
  }

  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
  ) {
    if (dWidth && dHeight) {
      this.currentCtx.drawImage(image, dx, dy, dWidth, dHeight);
    } else {
      this.currentCtx.drawImage(image, dx, dy);
    }
  }

  setFont(font: string) {
    this.currentCtx.font = font;
  }

  setTextAlign(align: CanvasTextAlign) {
    this.currentCtx.textAlign = align;
  }

  setTextBaseline(baseline: CanvasTextBaseline) {
    this.currentCtx.textBaseline = baseline;
  }

  fillText(
    text: string,
    x: number,
    y: number,
    erase?: boolean,
    maxWidth?: number,
  ) {
    if (erase) {
      this.currentCtx.save();
      this.currentCtx.fillStyle = '#000';
      this.currentCtx.globalCompositeOperation = 'destination-out';
      this.currentCtx.fillText(text, x, y, maxWidth);
      this.currentCtx.restore();
    }
    this.currentCtx.fillText(text, x, y, maxWidth);
  }

  strokeText(
    text: string,
    x: number,
    y: number,
    erase?: boolean,
    maxWidth?: number,
  ) {
    if (erase) {
      this.currentCtx.save();
      this.currentCtx.strokeStyle = '#000';
      this.currentCtx.globalCompositeOperation = 'destination-out';
      this.currentCtx.strokeText(text, x, y, maxWidth);
      this.currentCtx.restore();
    }
    this.currentCtx.strokeText(text, x, y, maxWidth);
  }

  save() {
    this.bgCtx.save();
    this.ctx.save();
    this.fgCtx.save();
    this.ctxHistory.push(this.currentCtx);
  }

  restore() {
    this.bgCtx.restore();
    this.ctx.restore();
    this.fgCtx.restore();
    this.currentCtx = this.ctxHistory.pop() ?? this.ctx;
  }

  translate(x: number, y: number) {
    this.bgCtx.translate(x, y);
    this.ctx.translate(x, y);
    this.fgCtx.translate(x, y);
  }

  rotate(angle: number) {
    this.bgCtx.rotate(angle);
    this.ctx.rotate(angle);
    this.fgCtx.rotate(angle);
  }

  scale(x: number, y: number) {
    this.bgCtx.scale(x, y);
    this.ctx.scale(x, y);
    this.fgCtx.scale(x, y);
  }
}

export function useCanvasDrawingContext(
  bgCanavas: RefObject<HTMLCanvasElement>,
  canvas: RefObject<HTMLCanvasElement>,
  fgCanvas: RefObject<HTMLCanvasElement>,
): CanvasDrawingContext | null {
  const [ctx, setCtx] = useState<CanvasDrawingContext | null>(null);

  useEffect(() => {
    const bgCtx = bgCanavas.current?.getContext('2d');
    const ctx = canvas.current?.getContext('2d');
    const fgCtx = fgCanvas.current?.getContext('2d');
    if (!bgCtx || !ctx || !fgCtx) return;

    setCtx(new CanvasDrawingContext(bgCtx, ctx, fgCtx));
  }, [bgCanavas, canvas, fgCanvas]);

  return ctx;
}

type SvgTransform =
  | {
      translate: { x: number; y: number };
    }
  | {
      rotate: number;
    }
  | {
      scale: { x: number; y: number };
    };

type SvgDrawingState = {
  stroke: Color;
  fill: Color;
  strokeWidth: number;
  strokeDash: number[];
  strokeDashOffset: number;
  strokeLineCap: CanvasLineCap;
  strokeLineJoin: CanvasLineJoin;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  transform: SvgTransform[];
  context: SVGGElement;
};

export class SvgDrawingContext implements DrawingContext {
  private bg: Color;
  private svg: SVGSVGElement;
  private bgG: SVGGElement;
  private mgG: SVGGElement;
  private fgG: SVGGElement;
  private currentG: SVGGElement;
  private state: SvgDrawingState[];
  private usedFonts: Set<string> = new Set();

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
    this.bg = new Color(0, 0, 0, 0);
    this.bgG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.currentG = this.mgG = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g',
    );
    this.fgG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svg.appendChild(this.bgG);
    this.svg.appendChild(this.mgG);
    this.svg.appendChild(this.fgG);
    this.state = [
      {
        stroke: new Color(0, 0, 0, 0),
        fill: new Color(0, 0, 0, 0),
        strokeWidth: 1,
        strokeDash: [],
        strokeDashOffset: 0,
        strokeLineCap: 'butt',
        strokeLineJoin: 'miter',
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        transform: [],
        context: this.mgG,
      },
    ];
  }

  setCtx(which: 'bg' | 'mg' | 'fg') {
    switch (which) {
      case 'bg':
        this.currentG = this.bgG;
        break;
      case 'mg':
        this.currentG = this.mgG;
        break;
      case 'fg':
        this.currentG = this.fgG;
        break;
    }
  }

  setBackground(color: Color) {
    this.bg = color;
    this.svg.setAttribute('style', `background-color: ${color.toCss()}`);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', color.toCss());
    this.svg.insertBefore(rect, this.bgG);
  }

  private getState() {
    return this.state[this.state.length - 1];
  }

  setStrokeWidth(width: number) {
    this.getState().strokeWidth = width;
  }

  setStrokeDash(dash: number[]) {
    this.getState().strokeDash = dash;
  }

  setStrokeDashOffset(offset: number) {
    this.getState().strokeDashOffset = offset;
  }

  setStrokeLineCap(cap: CanvasLineCap) {
    this.getState().strokeLineCap = cap;
  }

  setStrokeLineJoin(join: CanvasLineJoin) {
    this.getState().strokeLineJoin = join;
  }

  setFill(color: Color) {
    this.getState().fill = color;
  }

  setStroke(color: Color) {
    this.getState().stroke = color;
  }

  private applyState(elem: SVGElement, type?: 'fill' | 'stroke') {
    const state = this.getState();
    if (type === 'stroke') {
      elem.setAttribute('stroke', state.stroke.toCss());
      elem.setAttribute('stroke-width', state.strokeWidth.toString());
      if (state.strokeDash.length > 0) {
        elem.setAttribute('stroke-dasharray', state.strokeDash.join(' '));
        if (state.strokeDashOffset !== 0)
          elem.setAttribute(
            'stroke-dashoffset',
            state.strokeDashOffset.toString(),
          );
      }
      if (state.strokeLineCap !== 'butt')
        elem.setAttribute('stroke-linecap', state.strokeLineCap);
      if (state.strokeLineJoin !== 'miter')
        elem.setAttribute('stroke-linejoin', state.strokeLineJoin);
    } else if (type === 'fill') {
      elem.setAttribute('fill', state.fill.toCss());
    }
    if (state.transform.length === 0) return;
    elem.setAttribute(
      'transform',
      state.transform
        .map(t => {
          if ('translate' in t) {
            if (t.translate.x === 0 && t.translate.y === 0) return '';
            return `translate(${t.translate.x}, ${t.translate.y})`;
          } else if ('rotate' in t) {
            if (t.rotate === 0) return '';
            return `rotate(${t.rotate})`;
          } else if ('scale' in t) {
            if (t.scale.x === 1 && t.scale.y === 1) return '';
            if (t.scale.x === t.scale.y) return `scale(${t.scale.x})`;
            return `scale(${t.scale.x}, ${t.scale.y})`;
          }
          return '';
        })
        .map(s => s.trim())
        .filter(s => s !== '')
        .join(' '),
    );
  }

  fillPath(pathpp: Path2Dpp, erase?: true) {
    const path = pathpp.toSVGPath();
    this.applyState(path, 'fill');
    if (erase) {
      const path = pathpp.toSVGPath();
      this.applyState(path, 'fill');
      path.setAttribute('fill', this.bg.hex());
      this.currentG.appendChild(path);
    }
    this.currentG.appendChild(path);
  }

  strokePath(pathpp: Path2Dpp, erase?: true) {
    const path = pathpp.toSVGPath();
    this.applyState(path, 'stroke');
    if (erase) {
      const path = pathpp.toSVGPath();
      this.applyState(path, 'stroke');
      path.setAttribute('stroke', this.bg.hex());
      this.currentG.appendChild(path);
    }
    this.currentG.appendChild(path);
  }

  private imageToBase64(image: CanvasImageSource): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(image, 0, 0, 100, 100);
    return canvas.toDataURL();
  }

  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
  ) {
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('href', this.imageToBase64(image));
    img.setAttribute('x', dx.toString());
    img.setAttribute('y', dy.toString());
    if (dWidth && dHeight) {
      img.setAttribute('width', dWidth.toString());
      img.setAttribute('height', dHeight.toString());
    }
    this.currentG.appendChild(img);
  }

  setFont(font: string) {
    this.getState().font = font;
    this.usedFonts.add(font);
  }

  setTextAlign(align: CanvasTextAlign) {
    this.getState().textAlign = align;
  }

  setTextBaseline(baseline: CanvasTextBaseline) {
    this.getState().textBaseline = baseline;
  }

  private createTextPath(text: string, x: number, y: number): SVGTextElement {
    const textElem = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'text',
    );
    textElem.setAttribute('x', x.toString());
    textElem.setAttribute('y', y.toString());
    textElem.textContent = text;
    textElem.setAttribute('font', this.getState().font);
    textElem.setAttribute('text-anchor', this.getState().textAlign);
    textElem.setAttribute('alignment-baseline', this.getState().textBaseline);
    return textElem;
  }

  fillText(text: string, x: number, y: number, erase?: boolean) {
    const textElem = this.createTextPath(text, x, y);
    this.applyState(textElem, 'fill');
    if (erase) {
      const textElem = this.createTextPath(text, x, y);
      this.applyState(textElem, 'fill');
      textElem.setAttribute('fill', this.bg.hex());
      this.currentG.appendChild(textElem);
    }
    this.currentG.appendChild(textElem);
  }

  strokeText(text: string, x: number, y: number, erase?: boolean) {
    const textElem = this.createTextPath(text, x, y);
    this.applyState(textElem, 'stroke');
    if (erase) {
      const textElem = this.createTextPath(text, x, y);
      this.applyState(textElem, 'stroke');
      textElem.setAttribute('stroke', this.bg.hex());
      this.currentG.appendChild(textElem);
    }
    this.currentG.appendChild(textElem);
  }

  save() {
    this.state.push({ ...this.getState() });
  }

  restore() {
    this.state.pop();
  }

  translate(x: number, y: number) {
    this.getState().transform.push({ translate: { x, y } });
  }

  rotate(angle: number) {
    this.getState().transform.push({ rotate: angle });
  }

  scale(x: number, y: number) {
    this.getState().transform.push({ scale: { x, y } });
  }

  export(): string {
    return new XMLSerializer().serializeToString(this.svg);
  }
}
