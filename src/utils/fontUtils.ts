import { useEffect, useState } from 'react';

export type AvailableFont = {
  family: string;
  variants: { weight: string; italic: boolean }[];
};

const fontList: AvailableFont[] = [];

export function useFonts() {
  const [fonts, setFonts] = useState<AvailableFont[]>([]);

  useEffect(() => {
    async function fetchFonts() {
      if (fontList.length) {
        setFonts(fontList);
        return;
      }
      const fonts = await document.fonts.ready;

      fonts.forEach(fontFace => {
        const font = fontFace.family;
        const weight = fontFace.weight;
        const italic = fontFace.style === 'italic';

        let fontEntry = fontList.find(f => f.family === font);
        if (!fontEntry) {
          fontEntry = { family: font, variants: [] };
          fontList.push(fontEntry);
        }

        if (
          !fontEntry.variants.some(
            variant => variant.weight === weight && variant.italic === italic,
          )
        ) {
          fontEntry.variants.push({ weight, italic });
        }
      });

      setFonts(fontList);
    }

    fetchFonts();
  }, []);

  const uploadFont = async (file: File) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const font = new FontFace(file.name, reader.result as ArrayBuffer);
      await font.load();
      document.fonts.add(font);
      // Refresh the font list after uploading a new font
      setFonts([
        ...fontList,
        { family: file.name, variants: [{ weight: '400', italic: false }] },
      ]);
    };

    reader.readAsArrayBuffer(file);
  };

  return { fonts, uploadFont };
}

export type ParsedFont = {
  size?: number;
  unit?: string;
  weight?: string;
  family: string;
};

export function parseFont(font: string): ParsedFont {
  const fontRegex =
    /^(?:(\d+(?:\.\d+)?)(px|pt|em|rem|%))?\s*(?:(\w+)\s+)?(.+)$/;
  const match = font.match(fontRegex);

  if (!match) {
    throw new Error('Invalid font string');
  }

  const [, size, unit, weight, family] = match;

  return {
    size: size ? parseFloat(size) : undefined,
    unit: unit || undefined,
    weight: weight || undefined,
    family: family.trim(),
  };
}
