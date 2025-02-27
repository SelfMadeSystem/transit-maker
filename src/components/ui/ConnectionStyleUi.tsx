import {
  ConnectionOutline,
  ConnectionStyle,
  DEFALUT_CONNECTION_OUTLINE,
} from '../../transit/TransitConnection';
import { NumberInput } from '../NumberInput';
import { RouteColorEditor } from '../RouteColorEditor';
import { useState } from 'react';

function ConnectionOutlineDotted({
  outline,
}: {
  outline: ConnectionOutline & { strokeType: 'dotted' };
}) {
  const [dottedSpacing, setDottedSpacing] = useState(outline.dottedSpacing);
  const [dottedOffset, setDottedOffset] = useState(outline.dottedOffset);

  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Dotted spacing:</div>
        <NumberInput
          value={dottedSpacing}
          min={0}
          onChange={e => setDottedSpacing((outline.dottedSpacing = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dotted offset:</div>
        <NumberInput
          value={dottedOffset}
          min={0}
          max={1}
          step={0.01}
          onChange={e => setDottedOffset((outline.dottedOffset = e))}
          className="bg-gray-900 text-white"
        />
      </label>
    </>
  );
}

function ConnectionOutlineDashed({
  outline,
}: {
  outline: ConnectionOutline & { strokeType: 'dashed' };
}) {
  const [dashedLength, setDashedLength] = useState(outline.dashedLength);
  const [dashedSpacing, setDashedSpacing] = useState(outline.dashedSpacing);
  const [dashedOffset, setDashedOffset] = useState(outline.dashedOffset);

  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed length:</div>
        <NumberInput
          value={dashedLength}
          min={0}
          onChange={e => setDashedLength((outline.dashedLength = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed spacing:</div>
        <NumberInput
          value={dashedSpacing}
          min={0}
          onChange={e => setDashedSpacing((outline.dashedSpacing = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed offset:</div>
        <NumberInput
          value={dashedOffset}
          min={0}
          max={1}
          step={0.01}
          onChange={e => setDashedOffset((outline.dashedOffset = e))}
          className="bg-gray-900 text-white"
        />
      </label>
    </>
  );
}

export function ConnectionOutlineUi({
  outline,
}: {
  outline: ConnectionOutline;
}) {
  const [width, setWidth] = useState(outline.width);
  const [color, setColor] = useState(outline.color);
  const [clear, setClear] = useState(outline.clear);
  const [lineCap, setLineCap] = useState(outline.lineCap);
  const [strokeType, setStrokeType] = useState(outline.strokeType);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Width:</div>
        <NumberInput
          value={width}
          min={0}
          onChange={e => setWidth((outline.width = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Color:</div>
        <RouteColorEditor
          color={color}
          onChange={c => setColor((outline.color = c))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Clear:</div>
        <input
          type="checkbox"
          checked={clear}
          onChange={() => setClear((outline.clear = !clear))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Line cap:</div>
        <select
          value={lineCap}
          onChange={e =>
            setLineCap((outline.lineCap = e.target.value as CanvasLineCap))
          }
          className="bg-gray-900 text-white"
        >
          <option value="butt">Butt</option>
          <option value="round">Round</option>
          <option value="square">Square</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Stroke type:</div>
        <select
          value={strokeType}
          onChange={e => {
            const newStrokeType = e.target
              .value as ConnectionOutline['strokeType'];
            switch (newStrokeType) {
              case 'dotted':
                outline.strokeType = 'dotted';
                (
                  outline as ConnectionOutline & { strokeType: 'dotted' }
                ).dottedSpacing = 2;
                (
                  outline as ConnectionOutline & { strokeType: 'dotted' }
                ).dottedOffset = 0;
                break;
              case 'dashed':
                outline.strokeType = 'dashed';
                (
                  outline as ConnectionOutline & { strokeType: 'dashed' }
                ).dashedLength = 2;
                (
                  outline as ConnectionOutline & { strokeType: 'dashed' }
                ).dashedSpacing = 2;
                (
                  outline as ConnectionOutline & { strokeType: 'dashed' }
                ).dashedOffset = 0;
                break;
              default:
                outline.strokeType = 'solid';
                break;
            }
            setStrokeType(newStrokeType);
          }}
          className="bg-gray-900 text-white"
        >
          <option value="solid">Solid</option>
          <option value="dotted">Dotted</option>
          <option value="dashed">Dashed</option>
        </select>
      </label>
      {strokeType === 'dotted' ? (
        <ConnectionOutlineDotted
          outline={outline as ConnectionOutline & { strokeType: 'dotted' }}
        />
      ) : strokeType === 'dashed' ? (
        <ConnectionOutlineDashed
          outline={outline as ConnectionOutline & { strokeType: 'dashed' }}
        />
      ) : null}
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
