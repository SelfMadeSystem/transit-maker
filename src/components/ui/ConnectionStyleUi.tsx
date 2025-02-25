import {
  ConnectionOutline,
  ConnectionStyle,
  DEFALUT_CONNECTION_OUTLINE,
} from '../../transit/TransitConnection';
import { RouteColorEditor } from '../RouteColorEditor';
import { useState } from 'react';

export function ConnectionOutlineUi({
  outline,
}: {
  outline: ConnectionOutline;
}) {
  const [color, setColor] = useState(outline.color);
  const [width, setWidth] = useState(outline.width);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Color:</div>
        <RouteColorEditor
          color={color}
          onChange={c => setColor((outline.color = c))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Width:</div>
        <input
          type="number"
          value={width}
          min="0"
          onChange={e => setWidth((outline.width = parseFloat(e.target.value)))}
          className="bg-gray-900 text-white"
        />
      </label>
    </div>
  );
}

export function ConnectionStyleUi({ style }: { style: ConnectionStyle }) {
  const [outlines, setOutlines] = useState(style.outlines);

  function addOutline() {
    const newOutlines = [
      ...outlines,
      {
        ...DEFALUT_CONNECTION_OUTLINE,
      },
    ];

    setOutlines(newOutlines);
    style.outlines = newOutlines;
  }

  function removeOutline(index: number) {
    const newOutlines = [...outlines];
    newOutlines.splice(index, 1);

    setOutlines(newOutlines);
    style.outlines = newOutlines;
  }

  return (
    <div className="flex flex-col gap-2">
      <button className="bg-gray-800 p-1 text-white" onClick={addOutline}>
        Add outline
      </button>
      <div className="ml-4">
        {outlines.map((outline, i) => (
          <details key={i}>
            <summary className="text-white">Outline {i + 1}</summary>
            <ConnectionOutlineUi outline={outline} />
            <button
              className="bg-gray-800 p-1 text-white"
              onClick={() => removeOutline(i)}
            >
              Remove outline
            </button>
          </details>
        ))}
      </div>
    </div>
  );
}
