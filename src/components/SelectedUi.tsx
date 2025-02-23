import { EditorContext } from '../EditorContext';
import { Label } from '../transit/Label';
import {
  ConnectionStrokeType,
  TransitConnection,
} from '../transit/TransitConnection';
import { TransitMap } from '../transit/TransitMap';
import {
  StrokeType,
  TransitRoute,
  createDefaultRoute,
} from '../transit/TransitRoute';
import { StopStyle, TransitStop } from '../transit/TransitStop';
import { Vector2 } from '../utils/vec';
import { StopColorEditor } from './StopColorEditor';
import ColorInput from './color/ColorInput';
import { useContext, useState } from 'react';

export function SelectedUi() {
  const { selected, map } = useContext(EditorContext);

  if (selected instanceof TransitStop) {
    return <TransitStopUi key={selected.id} stop={selected} />;
  }
  if (selected instanceof TransitConnection) {
    return (
      <TransitConnectionUi key={selected.id} connection={selected} map={map} />
    );
  }
  if (selected instanceof Label) {
    return <LabelUi key={selected.id} label={selected} />;
  }
  return <TransitRoutesUi routes={map.routes} map={map} />;
}

//#region Stop UI
function TransitStopUi({ stop }: { stop: TransitStop }) {
  const [hidden, setHidden] = useState(stop.hidden);
  const [hasStyle, setHasStyle] = useState(stop.style !== undefined);
  const [roundRadius, setRoundRadius] = useState(stop.roundRadius);
  const hasRoundRadius = roundRadius !== undefined;

  function addLabel() {
    stop.addLabel(new Label(stop.map, 'Unnamed Label', new Vector2(0, -15)));
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

function StopStyleUi({ style }: { style: StopStyle }) {
  const [fillColor, setFillColor] = useState(style.fillColor);
  const [strokeColor, setStrokeColor] = useState(style.strokeColor);
  const [edges, setEdges] = useState(style.edges);
  const [edgeOrientation, setEdgeOrientation] = useState(style.edgeOrientation);
  const [edgeFollowsRoute, setEdgeFollowsRoute] = useState(
    style.edgeFollowsRoute,
  );
  const [radius, setRadius] = useState(style.radius);
  const [strokeWidth, setStrokeWidth] = useState(style.strokeWidth);
  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Fill color:</div>
        <StopColorEditor
          stopColor={fillColor}
          onChange={fill => setFillColor((style.fillColor = fill))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Stroke color:</div>
        <StopColorEditor
          stopColor={strokeColor}
          onChange={stroke => setStrokeColor((style.strokeColor = stroke))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Edges:</div>
        <select
          value={edges}
          onChange={e => setEdges((style.edges = parseInt(e.target.value)))}
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
                  (style.edgeOrientation = parseInt(e.target.value)),
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
                  (style.edgeFollowsRoute = !edgeFollowsRoute),
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
          onChange={e => setRadius((style.radius = parseFloat(e.target.value)))}
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
            setStrokeWidth((style.strokeWidth = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
    </>
  );
}
//#endregion

//#region Connection UI
function TransitConnectionUi({
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
      </div>
    </>
  );
}
//#endregion

//#region Route UI
function TransitRoutesUi({
  routes: _routes,
  map,
}: {
  routes: Set<TransitRoute>;
  map: TransitMap;
}) {
  const [routes, setRoutes] = useState(_routes);
  const [route, setRoute] = useState<TransitRoute | null>(null);

  function addRoute() {
    const name = prompt('Enter route name');
    if (name) {
      const route = createDefaultRoute(map);
      route.name = name;
      routes.add(route);
      setRoute(route);
      setRoutes(new Set(routes));
    }
  }

  return (
    <>
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
      {route ? (
        <RouteUi key={route.id} route={route} />
      ) : (
        <button onClick={addRoute}>Add route</button>
      )}
    </>
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
  const [innerColor, setInnerColor] = useState(style.innerColor);
  const [dottedWidth, setDottedWidth] = useState(style.dottedWidth);
  const [dottedSpacing, setDottedSpacing] = useState(style.dottedSpacing);
  const [dashedWidth, setDashedWidth] = useState(style.dashedWidth);
  const [dashedLength, setDashedLength] = useState(style.dashedLength);
  const [dashedSpacing, setDashedSpacing] = useState(style.dashedSpacing);
  const [dashedLineCap, setDashedLineCap] = useState(style.dashedLineCap);
  const [margin, setMargin] = useState(style.margin);
  const [roundRadius, setRoundRadius] = useState(style.roundRadius);
  const [roundDistInstead, setRoundDistInstead] = useState(
    style.roundDistInstead,
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Color:</div>
        <ColorInput color={color} setColor={c => setColor((style.color = c))} />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Line width:</div>
        <input
          type="number"
          value={lineWidth}
          min="0"
          onChange={e =>
            setLineWidth((style.lineWidth = parseFloat(e.target.value)))
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
        <>
          <label className="flex items-center gap-2">
            <div className="text-white">Inner width:</div>
            <input
              type="number"
              value={innerWidth}
              min="0"
              onChange={e =>
                setInnerWidth((style.innerWidth = parseFloat(e.target.value)))
              }
              className="bg-gray-900 text-white"
            />
          </label>
          <label className="flex items-center gap-2">
            <div className="text-white">Inner color:</div>
            <ColorInput
              color={innerColor}
              setColor={c => setInnerColor((style.innerColor = c))}
            />
          </label>
        </>
      ) : null}
      <label className="flex items-center gap-2">
        <div className="text-white">Dotted width:</div>
        <input
          type="number"
          value={dottedWidth}
          min="0"
          onChange={e =>
            setDottedWidth((style.dottedWidth = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dotted spacing:</div>
        <input
          type="number"
          value={dottedSpacing}
          min="0"
          onChange={e =>
            setDottedSpacing((style.dottedSpacing = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed width:</div>
        <input
          type="number"
          value={dashedWidth}
          min="0"
          onChange={e =>
            setDashedWidth((style.dashedWidth = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed length:</div>
        <input
          type="number"
          value={dashedLength}
          min="0"
          onChange={e =>
            setDashedLength((style.dashedLength = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed spacing:</div>
        <input
          type="number"
          value={dashedSpacing}
          min="0"
          onChange={e =>
            setDashedSpacing((style.dashedSpacing = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed line cap:</div>
        <select
          value={dashedLineCap}
          onChange={e =>
            setDashedLineCap(
              (style.dashedLineCap = e.target.value as CanvasLineCap),
            )
          }
          className="bg-gray-900 text-white"
        >
          <option value="butt">Butt</option>
          <option value="round">Round</option>
          <option value="square">Square</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Margin:</div>
        <input
          type="number"
          value={margin}
          min="0"
          onChange={e => setMargin((style.margin = parseFloat(e.target.value)))}
          className="bg-gray-900 text-white"
        />
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
//#endregion

//#region Label UI
function LabelUi({ label }: { label: Label }) {
  const { fonts, uploadFont } = useContext(EditorContext);
  const [text, setText] = useState(label.text);
  const [font, setFont] = useState(label.style.font);
  const [italic, setItalic] = useState(label.style.italic);
  const [size, setSize] = useState(label.style.size);
  const [weight, setWeight] = useState(label.style.weight);
  const [textAlign, setTextAlign] = useState(label.style.textAlign);
  const [textBaseline, setTextBaseline] = useState(label.style.textBaseline);
  const [color, setColor] = useState(label.style.color);

  const foundFont = fonts.find(f => f.family === font);

  const weightHasItalic = foundFont?.variants.some(
    v => v.weight === weight && v.italic,
  );
  const isWeightValid = foundFont?.variants.some(v => v.weight === weight);
  const weights = [...new Set(foundFont?.variants.map(v => v.weight))].sort();

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Text:</div>
        <input
          type="text"
          value={text}
          onChange={e => setText((label.text = e.target.value))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Font:</div>
        <select
          value={font}
          onChange={e => {
            setFont((label.style.font = e.target.value));
            const foundFont = fonts.find(f => f.family === e.target.value);
            const isWeightValid = foundFont?.variants.some(
              v => v.weight === weight,
            );
            const weightHasItalic = foundFont?.variants.some(
              v => v.weight === weight && v.italic,
            );
            if (!isWeightValid) {
              setWeight((label.style.weight = '400')); // they should all have 400
            }
            if (!weightHasItalic) {
              setItalic((label.style.italic = false));
            }
          }}
          className="bg-gray-900 text-white"
          style={{ fontFamily: `"${font}"` }}
        >
          {fonts.map(f => (
            <option
              key={f.family}
              value={f.family}
              style={{ fontFamily: `"${f.family}"` }}
            >
              {f.family}
            </option>
          ))}
        </select>
      </label>
      <label
        className={`flex items-center gap-2 ${!weightHasItalic ? 'opacity-50' : ''}`}
      >
        <div className="text-white">Italic:</div>
        <input
          type="checkbox"
          checked={italic}
          disabled={!weightHasItalic}
          onChange={() => setItalic((label.style.italic = !italic))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Size:</div>
        <input
          type="number"
          value={size}
          min="1"
          onChange={e =>
            setSize((label.style.size = parseFloat(e.target.value)))
          }
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Weight:</div>
        <select
          value={isWeightValid ? weight : ''}
          onChange={e => {
            setWeight((label.style.weight = e.target.value));
            if (!isWeightValid) {
              setItalic((label.style.italic = false));
            }
          }}
          className="bg-gray-900 text-white"
        >
          {!isWeightValid && (
            <option value="" disabled hidden>
              Choose
            </option>
          )}
          {weights.map(v => (
            <option
              key={v}
              value={v}
              style={{ fontFamily: font, fontWeight: v }}
            >
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Text align:</div>
        <select
          value={textAlign}
          onChange={e =>
            setTextAlign(
              (label.style.textAlign = e.target.value as CanvasTextAlign),
            )
          }
          className="bg-gray-900 text-white"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Text baseline:</div>
        <select
          value={textBaseline}
          onChange={e =>
            setTextBaseline(
              (label.style.textBaseline = e.target.value as CanvasTextBaseline),
            )
          }
          className="bg-gray-900 text-white"
        >
          <option value="top">Top</option>
          <option value="middle">Middle</option>
          <option value="bottom">Bottom</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Color:</div>
        <ColorInput
          color={color}
          setColor={c => setColor((label.style.color = c))}
        />
      </label>
      <details>
        <summary className="text-white">Upload font</summary>
        <input
          type="file"
          onChange={e => uploadFont(e.target.files![0])}
          className="bg-gray-900 text-white"
        />
      </details>
    </div>
  );
}
//#endregion
