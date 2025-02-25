import { RouteStyle } from '../../transit/TransitRoute';
import ColorInput from '../color/ColorInput';
import { ConnectionStyleUi } from './ConnectionStyleUi';
import { StopStyleUi } from './StopStyleUi';
import { useState } from 'react';

export function RouteStyleUi({ style }: { style: RouteStyle }) {
  const [color, setColor] = useState(style.color);
  const [roundRadius, setRoundRadius] = useState(style.roundRadius);
  const [roundDistInstead, setRoundDistInstead] = useState(
    style.roundDistInstead,
  );
  const [lateralOffset, setLateralOffset] = useState(style.lateralOffset);
  const [zIndex, setZIndex] = useState(style.zIndex);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Color:</div>
        <ColorInput color={color} setColor={c => setColor((style.color = c))} />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Round radius:</div>
        <input
          type="number"
          value={roundRadius}
          min="0"
          onChange={e =>
            setRoundRadius((style.roundRadius = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Round distance instead:</div>
        <input
          type="checkbox"
          checked={roundDistInstead}
          onChange={() =>
            setRoundDistInstead((style.roundDistInstead = !roundDistInstead))
          }
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Lateral offset:</div>
        <input
          type="number"
          value={lateralOffset}
          onChange={e =>
            setLateralOffset((style.lateralOffset = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Z index:</div>
        <input
          type="number"
          value={zIndex}
          onChange={e => setZIndex((style.zIndex = parseFloat(e.target.value)))}
          className="bg-gray-900 text-white"
        />
      </label>
      <details>
        <summary className="text-white">Connection style</summary>
        <ConnectionStyleUi style={style.connectionStyle} />
      </details>
      <details>
        <summary className="text-white">Stop style</summary>
        <StopStyleUi style={style.stopStyle} />
      </details>
      <details>
        <summary className="text-white">Terminus style</summary>
        <StopStyleUi style={style.terminusStyle} />
      </details>
    </div>
  );
}
