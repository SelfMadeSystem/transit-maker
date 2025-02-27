import { TransitConnection } from '../../transit/TransitConnection';
import { TransitMap } from '../../transit/TransitMap';
import { NumberInput } from '../NumberInput';
import { useState } from 'react';

export function TransitConnectionUi({
  connection,
  map,
}: {
  connection: TransitConnection;
  map: TransitMap;
}) {
  const [hidden, setHidden] = useState(connection.specificStyle.hidden);
  const [spacingMultiplier, setSpacingMultiplier] = useState(
    connection.specificStyle.spacingMultiplier,
  );
  const [spacingOffset, setSpacingOffset] = useState(
    connection.specificStyle.spacingOffset,
  );
  const [route, setRoute] = useState(connection.route);
  const [zIndex, setZIndex] = useState(connection.specificStyle.zIndex);
  const { routes } = map;

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
          <div className="text-white">Z index:</div>
          <NumberInput
            value={zIndex}
            onChange={e => setZIndex((connection.specificStyle.zIndex = e))}
            className="bg-gray-900 text-white"
          />
        </label>
      </div>
    </>
  );
}
