import { EditorContext } from '../../EditorContext';
import { createLabelAction } from '../../transit/Action';
import { SavedStopStyle, TransitStop } from '../../transit/TransitStop';
import { StopStyleUi } from './StopStyleUi';
import { useContext, useId, useState } from 'react';

export function TransitStopUi({ stop }: { stop: TransitStop }) {
  const id = useId();
  const [style, setStyle] = useState(stop.style);
  const { map } = useContext(EditorContext);
  const [styles, setStyles] = useState(() => map.getAllStopStyles());
  const [hidden, setHidden] = useState(stop.hidden);
  const [roundRadius, setRoundRadius] = useState(stop.roundRadius);
  const hasRoundRadius = roundRadius !== undefined;

  const autoStyle = `auto-${id}`;
  const newStyle = `new-${id}`;
  const styleName = stop.style ? stop.style.name : autoStyle;

  function addLabel() {
    const label = createLabelAction(stop.map, 'New label').data;
    stop.addLabel(label);
  }

  function unsetStyle() {
    stop.style = undefined;
    setStyle(undefined);
  }

  return (
    <>
      <div className="text-white">Modify stop style</div>
      <div className="flex flex-col justify-center gap-2">
        <label className="flex items-center gap-2">
          <div className="text-white">Hidden:</div>
          <input
            type="checkbox"
            checked={hidden}
            onChange={() => setHidden((stop.hidden = !hidden))}
          />
        </label>
        <label className="flex items-center gap-2">
          <div className="text-white">Stop style:</div>
          <select
            value={styleName}
            onChange={e => {
              const name = e.target.value;
              switch (name) {
                case autoStyle:
                  stop.style = undefined;
                  setStyle(undefined);
                  break;
                case newStyle: {
                  const style: SavedStopStyle = {
                    name: `New style ${id}`,
                    id: `new-${id}`,
                    style: { ...stop.getStyle() },
                    removable: true,
                  };
                  map.addSavedStopStyle(style);
                  stop.style = style;
                  setStyle(style);
                  setStyles(map.getAllStopStyles());
                  break;
                }
                default:
                  stop.style = styles.find(style => style.name === name);
                  setStyle(stop.style);
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
          <div className="text-white">Round radius:</div>
          <input
            type="checkbox"
            checked={hasRoundRadius}
            onChange={() => {
              stop.roundRadius = hasRoundRadius ? undefined : 5;
              setRoundRadius(stop.roundRadius);
            }}
          />
          {hasRoundRadius && (
            <input
              type="number"
              value={roundRadius}
              min="0"
              onChange={e =>
                setRoundRadius((stop.roundRadius = parseFloat(e.target.value)))
              }
              className="bg-gray-900 text-white"
            />
          )}
        </label>
        <button onClick={addLabel} className="bg-gray-900 text-white">
          Add label
        </button>
        {style ? <StopStyleUi style={style} unsetStyle={unsetStyle} /> : null}
      </div>
    </>
  );
}
