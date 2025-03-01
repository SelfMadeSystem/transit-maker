import { createLabelAction } from '../../transit/Action';
import { TransitStop } from '../../transit/TransitStop';
import { NumberInput } from '../NumberInput';
import { StopStyleSelector } from './StopStyleUi';
import { useState } from 'react';

export function TransitStopUi({ stop }: { stop: TransitStop }) {
  const [style, setStyle] = useState(stop.style);
  const [hidden, setHidden] = useState(stop.hidden);
  const [roundRadius, setRoundRadius] = useState(stop.roundRadius);
  const [lateralOtherSide, setLateralOtherSide] = useState(
    stop.lateralOtherSide,
  );
  const [zIndex, setZIndex] = useState(stop.zIndex);
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
            <NumberInput
              value={roundRadius}
              min={0}
              onChange={e => setRoundRadius((stop.roundRadius = e))}
              className="bg-gray-900 text-white"
            />
          )}
        </label>
        <label className="flex items-center gap-2">
          <div className="text-white">Lateral other side:</div>
          <input
            type="checkbox"
            checked={lateralOtherSide}
            onChange={() =>
              setLateralOtherSide((stop.lateralOtherSide = !lateralOtherSide))
            }
          />
        </label>
        <label className="flex items-center gap-2">
          <div className="text-white">Z-index:</div>
          <NumberInput
            value={zIndex}
            onChange={e => setZIndex((stop.zIndex = e))}
            className="bg-gray-900 text-white"
          />
        </label>
        <button onClick={addLabel} className="bg-gray-900 text-white">
          Add label
        </button>
      </div>
      <StopStyleSelector
        allowNone
        getStyle={() => stop.getStyle()}
        setStyle={s => {
          stop.style = s;
          setStyle(s);
        }}
        style={style}
      />
    </>
  );
}
