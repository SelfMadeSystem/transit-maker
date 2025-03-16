import { RouteStyle } from '../../transit/TransitRoute';
import { NumberInput } from '../NumberInput';
import ColorInput from '../color/ColorInput';
import { ConnectionStyleSelector } from './ConnectionStyleUi';
import { StopStyleSelector } from './StopStyleUi';
import { useState } from 'react';

export function RouteStyleUi({ style }: { style: RouteStyle }) {
  const [color, setColor] = useState(style.color);
  const [roundRadius, setRoundRadius] = useState(style.roundRadius);
  const [roundDistInstead, setRoundDistInstead] = useState(
    style.roundDistInstead,
  );
  const [lateralOffset, setLateralOffset] = useState(style.lateralOffset);
  const [zIndex, setZIndex] = useState(style.zIndex);
  const [stopZIndex, setStopZIndex] = useState(style.stopZIndex);
  const [connectionStyle, setConnectionStyle] = useState(style.connectionStyle);
  const [stopStyle, setStopStyle] = useState(style.stopStyle);
  const [terminusStyle, setTerminusStyle] = useState(style.terminusStyle);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Color:</div>
        <ColorInput color={color} setColor={c => setColor((style.color = c))} />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Round radius:</div>
        <NumberInput
          value={roundRadius}
          min={0}
          onChange={e => setRoundRadius((style.roundRadius = e))}
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
        <NumberInput
          value={lateralOffset}
          onChange={e => setLateralOffset((style.lateralOffset = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Z index:</div>
        <NumberInput
          value={zIndex}
          onChange={e => setZIndex((style.zIndex = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Stop Z index:</div>
        <NumberInput
          value={stopZIndex}
          onChange={e => setStopZIndex((style.stopZIndex = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <details>
        <summary className="text-white">Connection style</summary>
        <ConnectionStyleSelector
          style={connectionStyle}
          setStyle={setConnectionStyle}
        />
      </details>
      <details>
        <summary className="text-white">Stop style</summary>
        <StopStyleSelector
          setStyle={s => {
            style.stopStyle = s;
            setStopStyle(s);
          }}
          style={stopStyle}
        />
      </details>
      <details>
        <summary className="text-white">Terminus style</summary>
        <StopStyleSelector
          setStyle={s => {
            style.terminusStyle = s;
            setTerminusStyle(s);
          }}
          style={terminusStyle}
        />
      </details>
    </div>
  );
}
