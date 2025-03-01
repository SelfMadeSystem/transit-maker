import { StopStyle, StopStyleLayer } from '../../transit/TransitStop';
import { clone } from '../../utils/clone';
import { NumberInput } from '../NumberInput';
import { RouteColorEditor } from '../RouteColorEditor';
import { useState } from 'react';

function StopStyleLayerUi({ layer }: { layer: StopStyleLayer }) {
  const [fillColor, setFillColor] = useState(layer.fillColor);
  const [strokeColor, setStrokeColor] = useState(layer.strokeColor);
  const [edges, setEdges] = useState(layer.edges);
  const [edgeOrientation, setEdgeOrientation] = useState(layer.edgeOrientation);
  const [edgeFollowsRoute, setEdgeFollowsRoute] = useState(
    layer.edgeFollowsRoute,
  );
  const [radius, setRadius] = useState(layer.radius);
  const [rounding, setRounding] = useState(layer.rounding);
  const [stretch, setStretch] = useState(layer.stretch);
  const [strokeWidth, setStrokeWidth] = useState(layer.strokeWidth);
  const [lateralOffset, setLateralOffset] = useState(layer.lateralOffset);
  const [clearFill, setClearFill] = useState(layer.clearFill);
  const [clearStroke, setClearStroke] = useState(layer.clearStroke);

  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Fill color:</div>
        <RouteColorEditor
          color={fillColor}
          onChange={fill => setFillColor((layer.fillColor = fill))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Stroke color:</div>
        <RouteColorEditor
          color={strokeColor}
          onChange={stroke => setStrokeColor((layer.strokeColor = stroke))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Edges:</div>
        <select
          value={edges}
          onChange={e => setEdges((layer.edges = parseInt(e.target.value)))}
          className="bg-gray-900 text-white"
        >
          <option value="0">Circle</option>
          <option value="1">Rectangle</option>
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
                  (layer.edgeOrientation = parseInt(e.target.value)),
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
                  (layer.edgeFollowsRoute = !edgeFollowsRoute),
                )
              }
            />
          </label>
        </>
      ) : null}
      <label className="flex items-center gap-2">
        <div className="text-white">Radius:</div>
        <NumberInput
          value={radius}
          min={0}
          onChange={e => setRadius((layer.radius = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Stroke width:</div>
        <NumberInput
          value={strokeWidth}
          min={0}
          onChange={e => setStrokeWidth((layer.strokeWidth = e))}
          className="bg-gray-900 text-white"
        />
      </label>

      {edges > 0 ? (
        <label className="flex items-center gap-2">
          <div className="text-white">Rounding:</div>
          <NumberInput
            value={rounding}
            min={0}
            onChange={e => setRounding((layer.rounding = e))}
            className="bg-gray-900 text-white"
          />
        </label>
      ) : null}
      <label className="flex items-center gap-2">
        <div className="text-white">Stretch:</div>
        <NumberInput
          value={stretch}
          min={0}
          step={0.1}
          onChange={e => setStretch((layer.stretch = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Lateral offset:</div>
        <NumberInput
          value={lateralOffset}
          onChange={e => setLateralOffset((layer.lateralOffset = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Clear fill:</div>
        <input
          type="checkbox"
          checked={clearFill}
          onChange={() => setClearFill((layer.clearFill = !clearFill))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Clear stroke:</div>
        <input
          type="checkbox"
          checked={clearStroke}
          onChange={() => setClearStroke((layer.clearStroke = !clearStroke))}
        />
      </label>
    </>
  );
}

export function StopStyleUi({ style }: { style: StopStyle }) {
  const [layers, setLayers] = useState(style.layers);

  function addLayer() {
    setLayers((style.layers = [...layers, clone(layers[layers.length - 1])]));
  }

  function removeLayer(index: number) {
    if (layers.length === 1) return;
    setLayers((style.layers = layers.filter((_, i) => i !== index)));
  }

  return (
    <div className="flex flex-col gap-2">
      <button className="bg-gray-800 p-1 text-white" onClick={addLayer}>
        Add layer
      </button>
      <div className="ml-4">
        {layers.map((layer, i) => (
          <details key={i}>
            <summary className="text-white">Layer {i + 1}</summary>
            <StopStyleLayerUi layer={layer} />
            <button
              className="bg-gray-800 p-1 text-white"
              onClick={() => removeLayer(i)}
            >
              Remove layer
            </button>
          </details>
        ))}
      </div>
    </div>
  );
}
