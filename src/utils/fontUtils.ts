export type AvailableFont = {
  family: string;
  variants: string[];
};

export async function getAvailableFonts(): Promise<AvailableFont[]> {
  const fonts = await document.fonts.ready;
  const fontList: AvailableFont[] = [];

  fonts.forEach(fontFace => {
    const font = fontFace.family;
    const weight = fontFace.weight;

    let fontEntry = fontList.find(f => f.family === font);
    if (!fontEntry) {
      fontEntry = { family: font, variants: [] };
      fontList.push(fontEntry);
    }

    if (!fontEntry.variants.includes(weight)) {
      fontEntry.variants.push(weight);
    }
  });

  return fontList;
}
