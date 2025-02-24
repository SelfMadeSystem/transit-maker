import { StrokeType, TransitRoute } from '../../transit/TransitRoute';
import ColorInput from '../color/ColorInput';
import { useState } from 'react';

export function RouteStyleUi({ style }: { style: TransitRoute['style'] }) {
  const [color, setColor] = useState(style.color);
  const [lineWidth, setLineWidth] = useState(style.lineWidth);
  const [strokeType, setStrokeType] = useState(style.strokeType);
  const [lineCap, setLineCap] = useState(style.lineCap);
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
  const [zIndex, setZIndex] = useState(style.zIndex);

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

      <label className="flex items-center gap-2">
        <div className="text-white">Line cap:</div>
        <select
          value={lineCap}
          onChange={e =>
            setLineCap((style.lineCap = e.target.value as CanvasLineCap))
          }
          className="bg-gray-900 text-white"
        >
          <option value="butt">Butt</option>
          <option value="round">Round</option>
          <option value="square">Square</option>
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
