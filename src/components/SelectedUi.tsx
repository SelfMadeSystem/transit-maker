import { EditorContext } from '../EditorContext';
import { Label } from '../transit/Label';
import {
  ConnectionStrokeType,
  TransitConnection,
} from '../transit/TransitConnection';
import { TransitMap } from '../transit/TransitMap';
import { StrokeType, TransitRoute } from '../transit/TransitRoute';
import { TransitStop } from '../transit/TransitStop';
import { ColorEditor } from './ColorEditor';
import { useContext, useState } from 'react';

export function SelectedUi() {
  const { selected, map } = useContext(EditorContext);

  if (selected instanceof TransitStop) {
    return <TransitStopUi stop={selected} />;
  }
  if (selected instanceof TransitConnection) {
    return <TransitConnectionUi connection={selected} map={map} />;
  }
  return <TransitRoutesUi routes={map.routes} />;
}

function TransitStopUi({ stop }: { stop: TransitStop }) {
  const [hidden, setHidden] = useState(stop.hidden);
  const style = stop.getStyle();
  const [hasStyle, setHasStyle] = useState(stop.style !== undefined);
  const [fillColor, setFillColor] = useState(style.fillColor);
  const [strokeColor, setStrokeColor] = useState(style.strokeColor);
  const [edges, setEdges] = useState(style.edges);
  const [edgeOrientation, setEdgeOrientation] = useState(style.edgeOrientation);
  const [edgeFollowsRoute, setEdgeFollowsRoute] = useState(
    style.edgeFollowsRoute,
  );
  const [radius, setRadius] = useState(style.radius);
  const [strokeWidth, setStrokeWidth] = useState(style.strokeWidth);

  function addLabel() {
    stop.addLabel(new Label('Unnamed Label', 0, -15));
  }

  return (
    <div className="absolute top-0 right-0 w-fit bg-white/10 p-2">
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
        <button onClick={addLabel} className="bg-gray-900 text-white">
          Add label
        </button>
        {stop.style ? (
          <>
            <label className="flex items-center gap-2">
              <div className="text-white">Fill color:</div>
              <ColorEditor
                stopColor={fillColor}
                onChange={fill => setFillColor((stop.style!.fillColor = fill))}
              />
            </label>
            <label className="flex items-center gap-2">
              <div className="text-white">Stroke color:</div>
              <ColorEditor
                stopColor={strokeColor}
                onChange={stroke =>
                  setStrokeColor((stop.style!.strokeColor = stroke))
                }
              />
            </label>
            <label className="flex items-center gap-2">
              <div className="text-white">Edges:</div>
              <select
                value={edges}
                onChange={e =>
                  setEdges((stop.style!.edges = parseInt(e.target.value)))
                }
                className="bg-gray-900 text-white"
              >
                <option value="0">Circle</option>
                <option value="3">Triangle</option>
                <option value="4">Square</option>
                <option value="5">Pentagon</option>
                <option value="6">Hexagon</option>
              </select>
            </label>
            {edges > 0 ? (
              <>
                <label className="flex items-center gap-2">
                  <div className="text-white">Edge orientation:</div>
                  <select
                    value={edgeOrientation}
                    onChange={e =>
                      setEdgeOrientation(
                        (stop.style!.edgeOrientation = parseInt(
                          e.target.value,
                        )),
                      )
                    }
                    className="bg-gray-900 text-white"
                  >
                    <option value="0">A</option>
                    <option value="1">B</option>
                    <option value="2">C</option>
                    <option value="3">D</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <div className="text-white">Edge follows route:</div>
                  <input
                    type="checkbox"
                    checked={edgeFollowsRoute}
                    onChange={() =>
                      setEdgeFollowsRoute(
                        (stop.style!.edgeFollowsRoute = !edgeFollowsRoute),
                      )
                    }
                  />
                </label>
              </>
            ) : null}
            <label className="flex items-center gap-2">
              <div className="text-white">Radius:</div>
              <input
                type="number"
                value={radius}
                min="0"
                onChange={e =>
                  setRadius((stop.style!.radius = parseInt(e.target.value)))
                }
                className="bg-gray-900 text-white"
              />
            </label>
            <label className="flex items-center gap-2">
              <div className="text-white">Stroke width:</div>
              <input
                type="number"
                value={strokeWidth}
                min="0"
                onChange={e =>
                  setStrokeWidth(
                    (stop.style!.strokeWidth = parseInt(e.target.value)),
                  )
                }
                className="bg-gray-900 text-white"
              />
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
}

function TransitConnectionUi({
  connection,
  map,
}: {
  connection: TransitConnection;
  map: TransitMap;
}) {
  const [strokeType, setStrokeType] = useState(connection.style.strokeType);
  const [route, setRoute] = useState(connection.route);
  const { routes } = map;

  return (
    <div className="absolute top-0 right-0 w-fit bg-white/10 p-2">
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
          </select>
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
      </div>
    </div>
  );
}

function TransitRoutesUi({ routes }: { routes: Set<TransitRoute> }) {
  const [route, setRoute] = useState<TransitRoute | null>(null);
  return (
    <div className="absolute top-0 right-0 w-fit bg-white/10 p-2">
      <div className="text-white">Modify routes</div>
      <div className="flex items-center gap-2">
        <div className="text-white">Select route:</div>
        <select
          value={route?.name}
          onChange={e => {
            const name = e.target.value;
            setRoute(Array.from(routes).find(r => r.name === name) ?? null);
          }}
          className="bg-gray-900 text-white"
        >
          <option value="">None</option>
          {Array.from(routes).map(r => (
            <option key={r.name} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      {route ? <RouteUi route={route} /> : null}
    </div>
  );
}

function RouteUi({ route }: { route: TransitRoute }) {
  const [name, setName] = useState(route.name);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Name:</div>
        <input
          type="text"
          value={name}
          onChange={e => setName((route.name = e.target.value))}
          className="bg-gray-900 text-white"
        />
      </label>
      <RouteStyleUi style={route.style} />
    </div>
  );
}

function RouteStyleUi({ style }: { style: TransitRoute['style'] }) {
  const [color, setColor] = useState(style.color);
  const [lineWidth, setLineWidth] = useState(style.lineWidth);
  const [strokeType, setStrokeType] = useState(style.strokeType);
  const [innerWidth, setInnerWidth] = useState(style.innerWidth);
  const [margin, setMargin] = useState(style.margin);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Color:</div>
        <ColorEditor
          stopColor={color}
          onChange={c => setColor((style.color = c))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Line width:</div>
        <input
          type="number"
          value={lineWidth}
          min="0"
          onChange={e =>
            setLineWidth((style.lineWidth = parseInt(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Stroke type:</div>
        <select
          value={strokeType}
          onChange={e =>
            setStrokeType((style.strokeType = e.target.value as StrokeType))
          }
          className="bg-gray-900 text-white"
        >
          <option value="solid">Solid</option>
          <option value="split">Split</option>
        </select>
      </label>
      {strokeType === 'split' ? (
        <label className="flex items-center gap-2">
          <div className="text-white">Inner width:</div>
          <input
            type="number"
            value={innerWidth}
            min="0"
            onChange={e =>
              setInnerWidth((style.innerWidth = parseInt(e.target.value)))
            }
            className="bg-gray-900 text-white"
          />
        </label>
      ) : null}
      <label className="flex items-center gap-2">
        <div className="text-white">Margin:</div>
        <input
          type="number"
          value={margin}
          min="0"
          onChange={e => setMargin((style.margin = parseInt(e.target.value)))}
          className="bg-gray-900 text-white"
        />
      </label>
    </div>
  );
}
