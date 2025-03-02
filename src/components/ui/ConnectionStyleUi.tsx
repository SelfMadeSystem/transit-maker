import { EditorContext } from '../../EditorContext';
import {
  ConnectionOutline,
  ConnectionStyle,
  DEFALUT_CONNECTION_OUTLINE,
} from '../../transit/TransitConnection';
import { SavedStyle } from '../../transit/TransitMap';
import { clone } from '../../utils/clone';
import { NumberInput } from '../NumberInput';
import { RouteColorEditor } from '../RouteColorEditor';
import { useContext, useState } from 'react';

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
  removeOutline,
  index,
}: {
  outline: ConnectionOutline;
  removeOutline: () => void;
  index: number;
}) {
  const [width, setWidth] = useState(outline.width);
  const [color, setColor] = useState(outline.color);
  const [clear, setClear] = useState(outline.clear);
  const [lineCap, setLineCap] = useState(outline.lineCap);
  const [strokeType, setStrokeType] = useState(outline.strokeType);

  return (
    <details>
      <summary className="flex flex-row items-center gap-2 text-white">
        <div>Outline {index + 1}</div>
        <RouteColorEditor
          color={color}
          onChange={c => setColor((outline.color = c))}
        />
        <NumberInput
          value={width}
          min={0}
          onChange={e => setWidth((outline.width = e))}
          className="w-8 bg-gray-900 text-white"
        />
      </summary>
      <div className="flex flex-col gap-2 pl-2">
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
      <button className="bg-gray-800 p-1 text-white" onClick={removeOutline}>
        Remove outline
      </button>
    </details>
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
          <ConnectionOutlineUi
            key={i}
            index={i}
            outline={outline}
            removeOutline={() => removeOutline(i)}
          />
        ))}
      </div>
    </div>
  );
}

export function ConnectionStyleSelector({
  allowNone,
  style,
  setStyle,
  getStyle,
}:
  | {
      allowNone?: never;
      style: SavedStyle<ConnectionStyle>;
      setStyle: (style: SavedStyle<ConnectionStyle>) => void;
      getStyle?: never;
    }
  | {
      allowNone: true;
      style: SavedStyle<ConnectionStyle> | undefined;
      setStyle: (style: SavedStyle<ConnectionStyle> | undefined) => void;
      getStyle: () => ConnectionStyle;
    }) {
  const { map } = useContext(EditorContext);
  const [styles, setStyles] = useState(() => map.getAllConnectionStyles());

  const autoStyle = 'Auto';
  const newStyle = 'New style';
  const styleId = style ? '-' + style.id : autoStyle;

  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Connection style:</div>
        <select
          value={styleId}
          onChange={e => {
            const newId = e.target.value;
            switch (newId) {
              case autoStyle:
                if (allowNone) {
                  setStyle(undefined);
                }
                break;
              case newStyle: {
                const style: SavedStyle<ConnectionStyle> = {
                  name: `New style`,
                  id: `_${Date.now()}`,
                  style: clone(
                    getStyle?.() ?? map.defaultConnectionStyle.style,
                  ),
                  removable: true,
                };
                map.addSavedConnectionStyle(style);
                setStyle(style);
                setStyles(map.getAllConnectionStyles());
                break;
              }
              default: {
                const id = newId.substring(1);
                setStyle(styles.find(style => style.id === id)!);
                break;
              }
            }
          }}
          className="bg-gray-900 text-white"
        >
          {allowNone && <option value={autoStyle}>Auto</option>}
          {styles.map(style => (
            <option key={style.id} value={`-${style.id}`}>
              {style.name}
            </option>
          ))}
          <option value={newStyle}>New style</option>
        </select>
      </label>

      {style ? (
        <details>
          <summary className="text-white">Style details</summary>
          {style.removable && (
            <label className="flex items-center gap-2">
              <div className="text-white">Name:</div>
              <input
                type="text"
                defaultValue={style.name}
                onChange={e => (style.name = e.target.value)}
                className="bg-gray-900 text-white"
              />
            </label>
          )}
          <ConnectionStyleUi style={style.style} />
          {style.removable && (
            <button
              onClick={() => {
                if (!confirm('u sure buddy?')) return;
                map.removeSavedConnectionStyle(style.id);
                if (allowNone) {
                  setStyle(undefined);
                } else {
                  setStyle(map.defaultConnectionStyle);
                }
                setStyles(map.getAllConnectionStyles());
              }}
              className="cursor-pointer rounded-md bg-red-900 text-white"
            >
              Remove
            </button>
          )}
        </details>
      ) : null}
    </>
  );
}
