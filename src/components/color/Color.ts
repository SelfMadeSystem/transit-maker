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

export class Color {
  public readonly r: number;
  public readonly g: number;
  public readonly b: number;
  public readonly a: number;
  public readonly hue: number;
  public readonly saturation: number;
  public readonly value: number;

  constructor(r: number, g: number, b: number, a = 1, hue?: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.hue = hue ?? this.getHue();
    this.saturation = this.getSaturation();
    this.value = this.getValue();
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

  hex() {
    const r = Math.round(this.r);
    const g = Math.round(this.g);
    const b = Math.round(this.b);
    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
