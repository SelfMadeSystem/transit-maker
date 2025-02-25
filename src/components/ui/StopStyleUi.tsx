import { StopStyle } from '../../transit/TransitStop';
import { RouteColorEditor } from '../RouteColorEditor';
import { useState } from 'react';

export function StopStyleUi({ style }: { style: StopStyle }) {
  const [fillColor, setFillColor] = useState(style.fillColor);
  const [strokeColor, setStrokeColor] = useState(style.strokeColor);
  const [edges, setEdges] = useState(style.edges);
  const [edgeOrientation, setEdgeOrientation] = useState(style.edgeOrientation);
  const [edgeFollowsRoute, setEdgeFollowsRoute] = useState(
    style.edgeFollowsRoute,
  );
  const [radius, setRadius] = useState(style.radius);
  const [strokeWidth, setStrokeWidth] = useState(style.strokeWidth);
  const [margin, setMargin] = useState(style.margin);
  const [clearFill, setClearFill] = useState(style.clearFill);
  const [clearStroke, setClearStroke] = useState(style.clearStroke);

  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Fill color:</div>
        <RouteColorEditor
          color={fillColor}
          onChange={fill => setFillColor((style.fillColor = fill))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Stroke color:</div>
        <RouteColorEditor
          color={strokeColor}
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
        <div className="text-white">Clear fill:</div>
        <input
          type="checkbox"
          checked={clearFill}
          onChange={() => setClearFill((style.clearFill = !clearFill))}
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Clear stroke:</div>
        <input
          type="checkbox"
          checked={clearStroke}
          onChange={() => setClearStroke((style.clearStroke = !clearStroke))}
        />
      </label>
    </>
  );
}
