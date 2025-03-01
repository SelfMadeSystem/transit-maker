import { Color } from '../components/color/Color';
import { Path2Dpp } from './Path2Dpp';
import { clone } from './clone';

export interface DrawingContext {
  setBackground(color: Color): void;
  setStrokeWidth(width: number): void;
  setStrokeDash(dash: number[]): void;
  setStrokeDashOffset(offset: number): void;
  setStrokeLineCap(cap: CanvasLineCap): void;
  setStrokeLineJoin(join: CanvasLineJoin): void;
  setFill(color: Color): void;
  setStroke(color: Color): void;
  fillPath(path: Path2Dpp, clear?: boolean): void;
  strokePath(path: Path2Dpp, clear?: boolean): void;
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
  ): void;
  setFont(font: string): void;
  setTextAlign(align: CanvasTextAlign): void;
  setTextBaseline(baseline: CanvasTextBaseline): void;
  fillText(
    text: string,
    x: number,
    y: number,
    clear?: boolean,
    maxWidth?: number,
  ): void;
  strokeText(
    text: string,
    x: number,
    y: number,
    clear?: boolean,
    maxWidth?: number,
  ): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  scale(x: number, y: number): void;
}

// TODO: somehow able to switch between bg and ctx and perhaps fg
export class CanvasDrawingContext implements DrawingContext {
  private bgCtx: CanvasRenderingContext2D;
  private ctx: CanvasRenderingContext2D;

  constructor(bgCtx: CanvasRenderingContext2D, ctx: CanvasRenderingContext2D) {
    this.bgCtx = bgCtx;
    this.ctx = ctx;
  }

  getBgCtx() {
    return this.bgCtx;
  }

  getCtx() {
    return this.ctx;
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
    this.ctx.lineWidth = width;
  }

  setStrokeDash(dash: number[]) {
    this.ctx.setLineDash(dash);
  }

  setStrokeDashOffset(offset: number) {
    this.ctx.lineDashOffset = offset;
  }

  setStrokeLineCap(cap: CanvasLineCap) {
    this.ctx.lineCap = cap;
  }

  setStrokeLineJoin(join: CanvasLineJoin) {
    this.ctx.lineJoin = join;
  }

  setFill(color: Color) {
    this.ctx.fillStyle = color.hex();
  }

  setStroke(color: Color) {
    this.ctx.strokeStyle = color.hex();
  }

  fillPath(pathpp: Path2Dpp, clear?: true) {
    const path = pathpp.toPath2D();
    if (clear) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.fillStyle = '#000';
      this.ctx.fill(path);
      this.ctx.restore();
    }
    this.ctx.fill(path);
  }

  strokePath(pathpp: Path2Dpp, clear?: true) {
    const path = pathpp.toPath2D();
    if (clear) {
      this.ctx.save();
      this.ctx.strokeStyle = '#000';
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.stroke(path);
      this.ctx.restore();
    }
    this.ctx.stroke(path);
  }

  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
  ) {
    if (dWidth && dHeight) {
      this.ctx.drawImage(image, dx, dy, dWidth, dHeight);
    } else {
      this.ctx.drawImage(image, dx, dy);
    }
  }

  setFont(font: string) {
    this.ctx.font = font;
  }

  setTextAlign(align: CanvasTextAlign) {
    this.ctx.textAlign = align;
  }

  setTextBaseline(baseline: CanvasTextBaseline) {
    this.ctx.textBaseline = baseline;
  }

  fillText(
    text: string,
    x: number,
    y: number,
    clear?: boolean,
    maxWidth?: number,
  ) {
    if (clear) {
      this.ctx.save();
      this.ctx.fillStyle = '#000';
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.fillText(text, x, y, maxWidth);
      this.ctx.restore();
    }
    this.ctx.fillText(text, x, y, maxWidth);
  }

  strokeText(
    text: string,
    x: number,
    y: number,
    clear?: boolean,
    maxWidth?: number,
  ) {
    if (clear) {
      this.ctx.save();
      this.ctx.strokeStyle = '#000';
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeText(text, x, y, maxWidth);
      this.ctx.restore();
    }
    this.ctx.strokeText(text, x, y, maxWidth);
  }

  save() {
    this.ctx.save();
  }

  restore() {
    this.ctx.restore();
  }

  translate(x: number, y: number) {
    this.ctx.translate(x, y);
  }

  rotate(angle: number) {
    this.ctx.rotate(angle);
  }

  scale(x: number, y: number) {
    this.ctx.scale(x, y);
  }
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
};

export class SvgDrawingContext implements DrawingContext {
  private bg: Color;
  private svg: SVGSVGElement;
  private bgG: SVGGElement;
  private g: SVGGElement;
  private state: SvgDrawingState[] = [
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
    },
  ];
  private usedFonts: Set<string> = new Set();

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
    this.bg = new Color(0, 0, 0, 0);
    this.bgG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svg.appendChild(this.bgG);
    this.svg.appendChild(this.g);
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

  fillPath(pathpp: Path2Dpp, clear?: true) {
    const path = pathpp.toSVGPath();
    this.applyState(path, 'fill');
    if (clear) {
      const path = pathpp.toSVGPath();
      this.applyState(path, 'fill');
      path.setAttribute('fill', this.bg.hex());
      this.g.appendChild(path);
    }
    this.g.appendChild(path);
  }

  strokePath(pathpp: Path2Dpp, clear?: true) {
    const path = pathpp.toSVGPath();
    this.applyState(path, 'stroke');
    if (clear) {
      const path = pathpp.toSVGPath();
      this.applyState(path, 'stroke');
      path.setAttribute('stroke', this.bg.hex());
      this.g.appendChild(path);
    }
    this.g.appendChild(path);
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
    this.g.appendChild(img);
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

  fillText(text: string, x: number, y: number, clear?: boolean) {
    const textElem = this.createTextPath(text, x, y);
    this.applyState(textElem, 'fill');
    if (clear) {
      const textElem = this.createTextPath(text, x, y);
      this.applyState(textElem, 'fill');
      textElem.setAttribute('fill', this.bg.hex());
      this.g.appendChild(textElem);
    }
    this.g.appendChild(textElem);
  }

  strokeText(text: string, x: number, y: number, clear?: boolean) {
    const textElem = this.createTextPath(text, x, y);
    this.applyState(textElem, 'stroke');
    if (clear) {
      const textElem = this.createTextPath(text, x, y);
      this.applyState(textElem, 'stroke');
      textElem.setAttribute('stroke', this.bg.hex());
      this.g.appendChild(textElem);
    }
    this.g.appendChild(textElem);
  }

  save() {
    this.state.push(clone(this.getState()));
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
