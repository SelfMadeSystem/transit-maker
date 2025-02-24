import {
  ConnectionStrokeType,
  TransitConnection,
} from '../../transit/TransitConnection';
import { TransitMap } from '../../transit/TransitMap';
import { useState } from 'react';

export function TransitConnectionUi({
  connection,
  map,
}: {
  connection: TransitConnection;
  map: TransitMap;
}) {
  const [strokeType, setStrokeType] = useState(connection.style.strokeType);
  const [spacingMultiplier, setSpacingMultiplier] = useState(
    connection.style.spacingMultiplier,
  );
  const [spacingOffset, setSpacingOffset] = useState(
    connection.style.spacingOffset,
  );
  const [route, setRoute] = useState(connection.route);
  const [zIndex, setZIndex] = useState(connection.style.zIndex);
  const { routes } = map;

  return (
    <>
      <div className="text-white">Modify connection style</div>
      <div className="flex flex-col justify-center gap-2">
        <label className="flex items-center gap-2">
          <div className="text-white">Stroke type:</div>
          <select
            value={strokeType}
            onChange={e =>
              setStrokeType(
                (connection.style.strokeType = e.target
                  .value as ConnectionStrokeType),
              )
            }
            className="bg-gray-900 text-white"
          >
            <option value="solid">Solid</option>
            <option value="dotted">Dotted</option>
            <option value="dashed">Dashed</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        {strokeType !== 'solid' && (
          <>
            <label className="flex items-center gap-2">
              <div className="text-white">Spacing multiplier:</div>
              <input
                type="number"
                value={spacingMultiplier}
                min="0.5"
                max="2"
                step="0.01"
                onChange={e =>
                  setSpacingMultiplier(
                    (connection.style.spacingMultiplier = parseFloat(
                      e.target.value,
                    )),
                  )
                }
                className="bg-gray-900 text-white"
              />
            </label>
            <label className="flex items-center gap-2">
              <div className="text-white">Spacing offset:</div>
              <input
                type="number"
                value={spacingOffset}
                min="0.0"
                max="1.0"
                step="0.01"
                onChange={e =>
                  setSpacingOffset(
                    (connection.style.spacingOffset = parseFloat(
                      e.target.value,
                    )),
                  )
                }
                className="bg-gray-900 text-white"
              />
            </label>
          </>
        )}
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
          <input
            type="number"
            value={zIndex}
            onChange={e =>
              setZIndex((connection.style.zIndex = parseFloat(e.target.value)))
            }
            className="bg-gray-900 text-white"
          />
        </label>
      </div>
    </>
  );
}
