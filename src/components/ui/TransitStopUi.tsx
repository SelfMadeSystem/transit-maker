import { createLabelAction } from '../../transit/Action';
import { TransitStop } from '../../transit/TransitStop';
import { StopStyleUi } from './StopStyleUi';
import { useState } from 'react';

export function TransitStopUi({ stop }: { stop: TransitStop }) {
  const [hidden, setHidden] = useState(stop.hidden);
  const [hasStyle, setHasStyle] = useState(stop.style !== undefined);
  const [roundRadius, setRoundRadius] = useState(stop.roundRadius);
  const hasRoundRadius = roundRadius !== undefined;

  function addLabel() {
    const label = createLabelAction(stop.map, 'New label').data;
    stop.addLabel(label);
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
          <div className="text-white">Override stop style:</div>
          <input
            type="checkbox"
            checked={hasStyle}
            onChange={() => {
              stop.style =
                stop.style === undefined ? { ...stop.getStyle() } : undefined;
              setHasStyle(!hasStyle);
            }}
          />
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
        {stop.style ? <StopStyleUi style={stop.style} /> : null}
      </div>
    </>
  );
}
