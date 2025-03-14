import { SvgPath } from './utils/svg/svgPath';
import { Vector2 } from './utils/vec';
import React, { useEffect, useRef, useState } from 'react';

const EllipseDemo: React.FC = () => {
  const [point, setPoint] = useState<Vector2>(new Vector2(50, 50));
  const [svgPath] = useState<SvgPath>(
    SvgPath.fromString(
      'M50 50 300 300C355 355 450 345 450 175Q350 105 295 190A8 5 30 01240 90',
    ),
  );
  const [closestPoint, setClosestPoint] = useState<Vector2>(new Vector2(0, 0));
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const distance = closestPoint.dist(point);

  const handlePointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPoint(prev => {
      const point = new Vector2(
        name === 'x' ? +value : prev.x,
        name === 'y' ? +value : prev.y,
      );
      setClosestPoint(svgPath.getClosestPoint(point));
      return point;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = new Vector2(x, y);
    setPoint(point);
    setClosestPoint(svgPath.getClosestPoint(point));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = new Vector2(x, y);
    setPoint(point);
    setClosestPoint(svgPath.getClosestPoint(point));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw path
    ctx.strokeStyle = 'white';
    ctx.stroke(svgPath.toPath2D());

    // Draw point
    const radius = point.dist(closestPoint);
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = radius < 15 ? '#00f' : 'red';
    ctx.fill();

    // Draw closest point
    ctx.beginPath();
    ctx.arc(closestPoint.x, closestPoint.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'blue';
    ctx.fill();

    // Draw circle from point to closest point
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#0f0';
    ctx.stroke();
  }, [svgPath, point, closestPoint]);

  return (
    <div className="flex flex-col items-center">
      <h1>Ellipse Demo</h1>
      <div>
        <label>
          Point X:
          <input
            type="number"
            name="x"
            className="w-20"
            value={point.x}
            onChange={handlePointChange}
          />
        </label>
        <label>
          Point Y:
          <input
            type="number"
            name="y"
            className="w-20"
            value={point.y}
            onChange={handlePointChange}
          />
        </label>
      </div>
      <div className="w-64 text-center">
        <p>Closest Point:</p>
        <p>
          x: {closestPoint.x.toFixed(2)}, y: {closestPoint.y.toFixed(2)}
        </p>
        <p>Distance: {distance.toFixed(2)}</p>
      </div>
      <canvas
        className="outline-1 outline-white"
        ref={canvasRef}
        width="500"
        height="500"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      ></canvas>
    </div>
  );
};

export default EllipseDemo;
