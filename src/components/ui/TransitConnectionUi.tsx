import { EditorContext } from '../../EditorContext';
import {
  ConnectionStyle,
  TransitConnection,
} from '../../transit/TransitConnection';
import { SavedStyle } from '../../transit/TransitMap';
import { clone } from '../../utils/clone';
import { NumberInput } from '../NumberInput';
import { ConnectionStyleUi } from './ConnectionStyleUi';
import { useContext, useId, useState } from 'react';

export function TransitConnectionUi({
  connection,
}: {
  connection: TransitConnection;
}) {
  const id = useId();
  const { map } = useContext(EditorContext);
  const { routes } = map;
  const [styles, setStyles] = useState(() => map.getAllConnectionStyles());
  const [style, setStyle] = useState(connection.style);
  const [hidden, setHidden] = useState(connection.specificStyle.hidden);
  const [spacingMultiplier, setSpacingMultiplier] = useState(
    connection.specificStyle.spacingMultiplier,
  );
  const [spacingOffset, setSpacingOffset] = useState(
    connection.specificStyle.spacingOffset,
  );
  const [route, setRoute] = useState(connection.route);
  const [zIndex, setZIndex] = useState(connection.specificStyle.zIndex);

  const autoStyle = `auto-${id}`;
  const newStyle = `new-${id}`;
  const styleName = connection.style ? connection.style.name : autoStyle;

  function unsetStyle() {
    connection.style = undefined;
    setStyle(undefined);
  }

  return (
    <>
      <div className="text-white">Modify connection style</div>
      <div className="flex flex-col justify-center gap-2">
        <label className="flex items-center gap-2">
          <div className="text-white">Hidden:</div>
          <input
            type="checkbox"
            checked={hidden}
            onChange={e =>
              setHidden((connection.specificStyle.hidden = e.target.checked))
            }
            className="bg-gray-900 text-white"
          />
        </label>
        <label className="flex items-center gap-2">
          <div className="text-white">Spacing multiplier:</div>
          <NumberInput
            value={spacingMultiplier}
            min={0.5}
            max={2}
            step={0.01}
            onChange={e =>
              setSpacingMultiplier(
                (connection.specificStyle.spacingMultiplier = e),
              )
            }
            className="bg-gray-900 text-white"
          />
        </label>
        <label className="flex items-center gap-2">
          <div className="text-white">Spacing offset:</div>
          <NumberInput
            value={spacingOffset}
            min={0.0}
            max={1.0}
            step={0.01}
            onChange={e =>
              setSpacingOffset((connection.specificStyle.spacingOffset = e))
            }
            className="bg-gray-900 text-white"
          />
        </label>
        <label className="flex items-center gap-2">
          <div className="text-white">Route:</div>
          <select
            value={route.name}
            onChange={e =>
              setRoute(
                (connection.route = Array.from(routes).find(
                  r => r.name === e.target.value,
                )!),
              )
            }
            className="bg-gray-900 text-white"
          >
            {Array.from(routes).map(r => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <div className="text-white">Connection style:</div>
          <select
            value={styleName}
            onChange={e => {
              const name = e.target.value;
              switch (name) {
                case autoStyle:
                  connection.style = undefined;
                  setStyle(undefined);
                  break;
                case newStyle: {
                  const style: SavedStyle<ConnectionStyle> = {
                    name: `New style ${id}`,
                    id: `new-${id}`,
                    style: clone(connection.getStyle()),
                    removable: true,
                  };
                  map.addSavedConnectionStyle(style);
                  connection.style = style;
                  setStyle(style);
                  setStyles(map.getAllConnectionStyles());
                  break;
                }
                default:
                  connection.style = styles.find(style => style.name === name);
                  setStyle(connection.style);
                  break;
              }
            }}
            className="bg-gray-900 text-white"
          >
            <option value={autoStyle}>Auto</option>
            {styles.map(style => (
              <option key={style.name} value={style.name}>
                {style.name}
              </option>
            ))}
            <option value={newStyle}>New style</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <div className="text-white">Z index:</div>
          <NumberInput
            value={zIndex}
            onChange={e => setZIndex((connection.specificStyle.zIndex = e))}
            className="bg-gray-900 text-white"
          />
        </label>
        {style ? (
          <details>
            <summary className="text-white">Style</summary>
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
                  unsetStyle();
                }}
                className="cursor-pointer rounded-md bg-red-900 text-white"
              >
                Remove
              </button>
            )}
          </details>
        ) : null}
      </div>
    </>
  );
}
