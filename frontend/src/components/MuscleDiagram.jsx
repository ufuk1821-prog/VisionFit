const FRONT_SHAPES = [
  { muscle: 'on_omuz', type: 'ellipse', attrs: { cx: 58, cy: 62, rx: 13, ry: 12 } },
  { muscle: 'on_omuz', type: 'ellipse', attrs: { cx: 142, cy: 62, rx: 13, ry: 12 } },
  { muscle: 'yan_omuz', type: 'ellipse', attrs: { cx: 44, cy: 66, rx: 9, ry: 11 } },
  { muscle: 'yan_omuz', type: 'ellipse', attrs: { cx: 156, cy: 66, rx: 9, ry: 11 } },
  { muscle: 'ust_gogus', type: 'rect', attrs: { x: 72, y: 70, width: 24, height: 22, rx: 6 } },
  { muscle: 'ust_gogus', type: 'rect', attrs: { x: 104, y: 70, width: 24, height: 22, rx: 6 } },
  { muscle: 'alt_gogus', type: 'rect', attrs: { x: 74, y: 94, width: 22, height: 20, rx: 6 } },
  { muscle: 'alt_gogus', type: 'rect', attrs: { x: 104, y: 94, width: 22, height: 20, rx: 6 } },
  { muscle: 'biceps', type: 'rect', attrs: { x: 32, y: 78, width: 16, height: 50, rx: 8 } },
  { muscle: 'biceps', type: 'rect', attrs: { x: 152, y: 78, width: 16, height: 50, rx: 8 } },
  { muscle: 'core', type: 'rect', attrs: { x: 76, y: 116, width: 48, height: 78, rx: 8 } },
  { muscle: 'quadriceps', type: 'rect', attrs: { x: 74, y: 208, width: 24, height: 92, rx: 10 } },
  { muscle: 'quadriceps', type: 'rect', attrs: { x: 102, y: 208, width: 24, height: 92, rx: 10 } },
];

const BACK_SHAPES = [
  { muscle: 'trapez', type: 'path', attrs: { d: 'M 78 42 L 122 42 L 132 75 L 100 60 L 68 75 Z' } },
  { muscle: 'arka_omuz', type: 'ellipse', attrs: { cx: 55, cy: 66, rx: 13, ry: 12 } },
  { muscle: 'arka_omuz', type: 'ellipse', attrs: { cx: 145, cy: 66, rx: 13, ry: 12 } },
  { muscle: 'sirt_kanat', type: 'rect', attrs: { x: 70, y: 80, width: 26, height: 60, rx: 8 } },
  { muscle: 'sirt_kanat', type: 'rect', attrs: { x: 104, y: 80, width: 26, height: 60, rx: 8 } },
  { muscle: 'alt_sirt', type: 'rect', attrs: { x: 78, y: 142, width: 44, height: 30, rx: 6 } },
  { muscle: 'triceps', type: 'rect', attrs: { x: 32, y: 78, width: 16, height: 50, rx: 8 } },
  { muscle: 'triceps', type: 'rect', attrs: { x: 152, y: 78, width: 16, height: 50, rx: 8 } },
  { muscle: 'kalca', type: 'rect', attrs: { x: 76, y: 174, width: 22, height: 36, rx: 8 } },
  { muscle: 'kalca', type: 'rect', attrs: { x: 102, y: 174, width: 22, height: 36, rx: 8 } },
  { muscle: 'hamstring', type: 'rect', attrs: { x: 75, y: 212, width: 22, height: 86, rx: 10 } },
  { muscle: 'hamstring', type: 'rect', attrs: { x: 103, y: 212, width: 22, height: 86, rx: 10 } },
  { muscle: 'baldir', type: 'rect', attrs: { x: 76, y: 308, width: 18, height: 70, rx: 8 } },
  { muscle: 'baldir', type: 'rect', attrs: { x: 106, y: 308, width: 18, height: 70, rx: 8 } },
];

const DECOR_FRONT = [
  { type: 'ellipse', attrs: { cx: 100, cy: 22, rx: 15, ry: 17 } },
  { type: 'rect', attrs: { x: 92, y: 36, width: 16, height: 10 } },
  { type: 'rect', attrs: { x: 28, y: 128, width: 14, height: 45, rx: 7 } },
  { type: 'rect', attrs: { x: 158, y: 128, width: 14, height: 45, rx: 7 } },
  { type: 'ellipse', attrs: { cx: 35, cy: 180, rx: 8, ry: 10 } },
  { type: 'ellipse', attrs: { cx: 165, cy: 180, rx: 8, ry: 10 } },
  { type: 'rect', attrs: { x: 78, y: 300, width: 18, height: 75, rx: 8 } },
  { type: 'rect', attrs: { x: 104, y: 300, width: 18, height: 75, rx: 8 } },
  { type: 'ellipse', attrs: { cx: 85, cy: 385, rx: 14, ry: 8 } },
  { type: 'ellipse', attrs: { cx: 115, cy: 385, rx: 14, ry: 8 } },
];

const DECOR_BACK = [
  { type: 'ellipse', attrs: { cx: 100, cy: 22, rx: 15, ry: 17 } },
  { type: 'rect', attrs: { x: 92, y: 36, width: 16, height: 10 } },
  { type: 'rect', attrs: { x: 28, y: 128, width: 14, height: 45, rx: 7 } },
  { type: 'rect', attrs: { x: 158, y: 128, width: 14, height: 45, rx: 7 } },
  { type: 'ellipse', attrs: { cx: 35, cy: 180, rx: 8, ry: 10 } },
  { type: 'ellipse', attrs: { cx: 165, cy: 180, rx: 8, ry: 10 } },
  { type: 'ellipse', attrs: { cx: 85, cy: 385, rx: 14, ry: 8 } },
  { type: 'ellipse', attrs: { cx: 115, cy: 385, rx: 14, ry: 8 } },
];

function ShapeEl({ shape, fill, onClick, interactive }) {
  const common = {
    fill,
    stroke: 'var(--border)',
    strokeWidth: 1,
    className: interactive ? 'muscle-shape' : 'muscle-decor',
    onClick,
  };

  if (shape.type === 'ellipse') return <ellipse {...shape.attrs} {...common} />;
  if (shape.type === 'rect') return <rect {...shape.attrs} {...common} />;
  if (shape.type === 'path') return <path {...shape.attrs} {...common} />;
  return null;
}

function BodyFigure({ shapes, decor, selectedMuscle, onSelectMuscle, label }) {
  return (
    <div className="muscle-diagram">
      <svg viewBox="0 0 200 420">
        {decor.map((shape, i) => (
          <ShapeEl key={`decor-${i}`} shape={shape} fill="var(--surface-2)" interactive={false} />
        ))}
        {shapes.map((shape, i) => (
          <ShapeEl
            key={`${shape.muscle}-${i}`}
            shape={shape}
            fill={selectedMuscle === shape.muscle ? 'var(--accent)' : 'var(--surface-2)'}
            interactive
            onClick={() => onSelectMuscle(shape.muscle)}
          />
        ))}
      </svg>
      <div className="muscle-diagram-label">{label}</div>
    </div>
  );
}

function MuscleDiagram({ selectedMuscle, onSelectMuscle }) {
  return (
    <div className="muscle-diagram-wrapper">
      <BodyFigure shapes={FRONT_SHAPES} decor={DECOR_FRONT} selectedMuscle={selectedMuscle} onSelectMuscle={onSelectMuscle} label="Ön" />
      <BodyFigure shapes={BACK_SHAPES} decor={DECOR_BACK} selectedMuscle={selectedMuscle} onSelectMuscle={onSelectMuscle} label="Arka" />
    </div>
  );
}

export default MuscleDiagram;