import { EditorContext } from '../../EditorContext';
import { Label } from '../../transit/Label';
import ColorInput from '../color/ColorInput';
import { useContext, useState } from 'react';

//#endregion
//#region Label UI
export function LabelUi({ label }: { label: Label }) {
  const { fonts, uploadFont } = useContext(EditorContext);
  const [text, setText] = useState(label.text);
  const [font, setFont] = useState(label.style.font);
  const [italic, setItalic] = useState(label.style.italic);
  const [size, setSize] = useState(label.style.size);
  const [weight, setWeight] = useState(label.style.weight);
  const [textAlign, setTextAlign] = useState(label.style.textAlign);
  const [textBaseline, setTextBaseline] = useState(label.style.textBaseline);
  const [color, setColor] = useState(label.style.color);
  const [margin, setMargin] = useState(label.style.margin);

  const foundFont = fonts.find(f => f.family === font);

  const weightHasItalic = foundFont?.variants.some(
    v => v.weight === weight && v.italic,
  );
  const isWeightValid = foundFont?.variants.some(v => v.weight === weight);
  const weights = [...new Set(foundFont?.variants.map(v => v.weight))].sort();

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Text:</div>
        <input
          type="text"
          value={text}
          onChange={e => setText((label.text = e.target.value))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Font:</div>
        <select
          value={font}
          onChange={e => {
            setFont((label.style.font = e.target.value));
            const foundFont = fonts.find(f => f.family === e.target.value);
            const isWeightValid = foundFont?.variants.some(
              v => v.weight === weight,
            );
            const weightHasItalic = foundFont?.variants.some(
              v => v.weight === weight && v.italic,
            );
            if (!isWeightValid) {
              setWeight((label.style.weight = '400')); // they should all have 400
            }
            if (!weightHasItalic) {
              setItalic((label.style.italic = false));
            }
          }}
          className="bg-gray-900 text-white"
          style={{ fontFamily: `"${font}"` }}
        >
          {fonts.map(f => (
            <option
              key={f.family}
              value={f.family}
              style={{ fontFamily: `"${f.family}"` }}
            >
              {f.family}
            </option>
          ))}
        </select>
      </label>
      <label
        className={`flex items-center gap-2 ${!weightHasItalic ? 'opacity-50' : ''}`}
      >
        <div className="text-white">Italic:</div>
        <input
          type="checkbox"
          checked={italic}
          disabled={!weightHasItalic}
          onChange={() => setItalic((label.style.italic = !italic))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Size:</div>
        <input
          type="number"
          value={size}
          min="1"
          onChange={e =>
            setSize((label.style.size = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Weight:</div>
        <select
          value={isWeightValid ? weight : ''}
          onChange={e => {
            setWeight((label.style.weight = e.target.value));
            if (!isWeightValid) {
              setItalic((label.style.italic = false));
            }
          }}
          className="bg-gray-900 text-white"
        >
          {!isWeightValid && (
            <option value="" disabled hidden>
              Choose
            </option>
          )}
          {weights.map(v => (
            <option
              key={v}
              value={v}
              style={{ fontFamily: font, fontWeight: v }}
            >
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Text align:</div>
        <select
          value={textAlign}
          onChange={e =>
            setTextAlign(
              (label.style.textAlign = e.target.value as CanvasTextAlign),
            )
          }
          className="bg-gray-900 text-white"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Text baseline:</div>
        <select
          value={textBaseline}
          onChange={e =>
            setTextBaseline(
              (label.style.textBaseline = e.target.value as CanvasTextBaseline),
            )
          }
          className="bg-gray-900 text-white"
        >
          <option value="top">Top</option>
          <option value="middle">Middle</option>
          <option value="bottom">Bottom</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Color:</div>
        <ColorInput
          color={color}
          setColor={c => setColor((label.style.color = c))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Margin:</div>
        <input
          type="number"
          value={margin}
          min="0"
          step="0.1"
          onChange={e =>
            setMargin((label.style.margin = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <details>
        <summary className="text-white">Upload font</summary>
        <input
          type="file"
          onChange={e => uploadFont(e.target.files![0])}
          className="bg-gray-900 text-white"
        />
      </details>
    </div>
  );
}
