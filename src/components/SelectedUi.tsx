import { EditorContext } from '../EditorContext';
import { TransitStop } from '../transit/TransitStop';
import { ColorEditor } from './ColorEditor';
import { useContext, useState } from 'react';

export function SelectedUi() {
  const { selected } = useContext(EditorContext);

  if (selected instanceof TransitStop) {
    return <TransitStopUi stop={selected} />;
  }
}

function TransitStopUi({ stop }: { stop: TransitStop }) {
  const [hidden, setHidden] = useState(stop.hidden);
  const [fillColor, setFillColor] = useState(stop.style.fillColor);
  const [strokeColor, setStrokeColor] = useState(stop.style.strokeColor);
  const [edges, setEdges] = useState(stop.style.edges);
  const [edgeOrientation, setEdgeOrientation] = useState(
    stop.style.edgeOrientation,
  );
  const [edgeFollowsRoute, setEdgeFollowsRoute] = useState(
    stop.style.edgeFollowsRoute,
  );

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

        <div className="flex items-center gap-2">
          <div className="text-white">Fill color:</div>
          <ColorEditor
            stopColor={fillColor}
            onChange={fill => setFillColor((stop.style.fillColor = fill))}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-white">Stroke color:</div>
          <ColorEditor
            stopColor={strokeColor}
            onChange={stroke =>
              setStrokeColor((stop.style.strokeColor = stroke))
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-white">Edges:</div>
          <select
            value={edges}
            onChange={e =>
              setEdges((stop.style.edges = parseInt(e.target.value)))
            }
            className="bg-gray-900 text-white"
          >
            <option value="0">Circle</option>
            <option value="3">Triangle</option>
            <option value="4">Square</option>
            <option value="5">Pentagon</option>
            <option value="6">Hexagon</option>
          </select>
        </div>
        {edges > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <div className="text-white">Edge orientation:</div>
              <select
                value={edgeOrientation}
                onChange={e =>
                  setEdgeOrientation(
                    (stop.style.edgeOrientation = parseInt(e.target.value)),
                  )
                }
                className="bg-gray-900 text-white"
              >
                <option value="0">A</option>
                <option value="1">B</option>
                <option value="2">C</option>
                <option value="3">D</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <div className="text-white">Edge follows route:</div>
              <input
                type="checkbox"
                checked={edgeFollowsRoute}
                onChange={() =>
                  setEdgeFollowsRoute(
                    (stop.style.edgeFollowsRoute = !edgeFollowsRoute),
                  )
                }
              />
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
}
