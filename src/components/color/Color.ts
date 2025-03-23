import { Clonable } from '../../utils/clone';
import { clamp } from '../../utils/mathUtils';
import ColorJS from 'colorjs.io';
import colors from 'tailwindcss/colors';

export function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  };
}

export class Color implements Clonable {
  public readonly r: number; // 0-255
  public readonly g: number; // 0-255
  public readonly b: number; // 0-255
  public readonly a: number; // 0-1
  public readonly hue: number; // 0-360
  public readonly saturation: number; // 0-1
  public readonly value: number; // 0-1

  constructor(r: number, g: number, b: number, a = 1, hue?: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.hue = hue ?? this.getHue();
    this.saturation = this.getSaturation();
    this.value = this.getValue();
  }

  static fromColorJS(color: ColorJS) {
    const [r, g, b] = color.srgb;

    return new Color(
      clamp(r * 255, 0, 255),
      clamp(g * 255, 0, 255),
      clamp(b * 255, 0, 255),
      color.a,
      color.h,
    );
  }

  private getHue() {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    if (max === min) {
      hue = 0;
    } else if (max === r) {
      hue = (60 * (g - b)) / (max - min);
    } else if (max === g) {
      hue = (60 * (b - r)) / (max - min) + 120;
    } else {
      hue = (60 * (r - g)) / (max - min) + 240;
    }
    if (hue < 0) {
      hue += 360;
    }
    return hue;
  }

  private getSaturation() {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0) {
      return 0;
    }
    return (max - min) / max;
  }

  private getValue() {
    return Math.max(this.r, this.g, this.b) / 255;
  }

  withHue(hue: number) {
    const { r, g, b } = hsvToRgb(hue, this.saturation, this.value);
    return new Color(r, g, b, this.a, hue);
  }

  withSaturation(saturation: number) {
    const { r, g, b } = hsvToRgb(this.hue, saturation, this.value);
    return new Color(r, g, b, this.a, this.hue);
  }

  withValue(value: number) {
    const { r, g, b } = hsvToRgb(this.hue, this.saturation, value);
    return new Color(r, g, b, this.a, this.hue);
  }

  withSv(saturation: number, value: number) {
    const { r, g, b } = hsvToRgb(this.hue, saturation, value);
    return new Color(r, g, b, this.a, this.hue);
  }

  withAlpha(a: number) {
    return new Color(this.r, this.g, this.b, a, this.hue);
  }

  hex() {
    const r = Math.round(this.r);
    const g = Math.round(this.g);
    const b = Math.round(this.b);
    const a = Math.round(this.a * 255);
    let str = `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    if (a !== 255) {
      str += a.toString(16).padStart(2, '0');
    }

    return str;
  }

  /**
   * Returns the most compact CSS representation of the color
   */
  toCss() {
    if (this.a === 0) {
      return '#0000';
    }
    if (this.a < 1) {
      return this.hex();
    }
    if (this.r % 17 === 0 && this.g % 17 === 0 && this.b % 17 === 0) {
      return `#${(this.r / 17).toString(16)}${(this.g / 17).toString(16)}${(
        this.b / 17
      ).toString(16)}`;
    }
    return this.hex();
  }

  clone(): Color {
    return this; // Color is immutable
  }

  static TRANSPARENT = new Color(0, 0, 0, 0);
  static WHITE = new Color(255, 255, 255);
  static BLACK = new Color(0, 0, 0);
  static RED = new Color(255, 0, 0);
  static GREEN = new Color(0, 255, 0);
  static BLUE = new Color(0, 0, 255);
  static YELLOW = new Color(255, 255, 0);
  static CYAN = new Color(0, 255, 255);
  static MAGENTA = new Color(255, 0, 255);

  static TW = Object.fromEntries(
    Object.entries(colors).map(([colorName, shades]) => [
      colorName,
      shades === 'inherit' || shades === 'currentColor'
        ? undefined
        : typeof shades === 'string'
          ? Color.fromColorJS(new ColorJS(shades))
          : Object.fromEntries(
              Object.entries(shades).map(([shade, css]) => [
                shade,
                Color.fromColorJS(new ColorJS(css)),
              ]),
            ),
    ]),
  ) as {
    [colorName in keyof typeof colors]: (typeof colors)[colorName] extends string
      ? Color
      : {
          [shade in keyof (typeof colors)[colorName]]: Color;
        };
  };

  static random({
    hue = Math.random() * 360,
    saturation = Math.random(),
    value = Math.random(),
    alpha = 1,
  }): Color {
    const { r, g, b } = hsvToRgb(hue, saturation, value);
    return new Color(r, g, b, alpha, hue);
  }
}
