import { useEffect, useState } from 'react';

export type AvailableFont = {
  family: string;
  variants: string[];
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

        let fontEntry = fontList.find(f => f.family === font);
        if (!fontEntry) {
          fontEntry = { family: font, variants: [] };
          fontList.push(fontEntry);
        }

        console.log(font, fontEntry.variants);

        if (!fontEntry.variants.includes(weight)) {
          fontEntry.variants.push(weight);
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
      setFonts([...fontList, { family: file.name, variants: ['400'] }]);
    };

    reader.readAsArrayBuffer(file);
  };

  return { fonts, uploadFont };
}
