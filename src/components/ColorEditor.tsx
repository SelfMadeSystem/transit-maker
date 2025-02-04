export function ColorEditor({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
