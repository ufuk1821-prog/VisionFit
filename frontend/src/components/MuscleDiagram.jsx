const SILHOUETTE = [
  { type: 'circle', attrs: { cx: 120, cy: 26, r: 17 } },
  { type: 'path', attrs: { d: 'M 108 42 L 132 42 L 132 56 L 108 56 Z' } },
  { type: 'path', attrs: { d: 'M 68 60 Q 60 110 95 188 L 145 188 Q 180 110 172 60 Q 146 50 120 50 Q 94 50 68 60 Z' } },
  { type: 'path', attrs: { d: 'M 95 188 Q 80 205 88 222 L 152 222 Q 160 205 145 188 Z' } },
  { type: 'path', attrs: { d: 'M 58 62 C 50 90 45 140 50 200 L 76 200 C 74 140 76 90 80 62 Z' } },
  { type: 'path', attrs: { d: 'M 182 62 C 190 90 195 140 190 200 L 164 200 C 166 140 164 90 160 62 Z' } },
  { type: 'path', attrs: { d: 'M 88 220 C 82 280 80 360 85 425 L 112 425 C 110 360 112 280 110 220 Z' } },
  { type: 'path', attrs: { d: 'M 152 220 C 158 280 160 360 155 425 L 128 425 C 130 360 128 280 130 220 Z' } },
  { type: 'ellipse', attrs: { cx: 98, cy: 435, rx: 18, ry: 9 } },
  { type: 'ellipse', attrs: { cx: 142, cy: 435, rx: 18, ry: 9 } },
];

const ABS_LINES = [
  { x1: 100, y1: 120, x2: 138, y2: 120 },
  { x1: 100, y1: 142, x2: 138, y2: 142 },
  { x1: 100, y1: 164, x2: 138, y2: 164 },
  { x1: 120, y1: 98, x2: 120, y2: 186 },
];

const FRONT_SHAPES = [
  { muscle: 'on_omuz', type: 'ellipse', attrs: { cx: 66, cy: 64, rx: 15, ry: 14 } },
  { muscle: 'on_omuz', type: 'ellipse', attrs: { cx: 174, cy: 64, rx: 15, ry: 14 } },
  { muscle: 'yan_omuz', type: 'ellipse', attrs: { cx: 58, cy: 80, rx: 11, ry: 13 } },
  { muscle: 'yan_omuz', type: 'ellipse', attrs: { cx: 182, cy: 80, rx: 11, ry: 13 } },
  { muscle: 'ust_gogus', type: 'path', attrs: { d: 'M 100 64 C 108 60 118 62 122 68 C 120 78 108 84 96 80 C 92 74 94 68 100 64 Z' } },
  { muscle: 'ust_gogus', type: 'path', attrs: { d: 'M 140 64 C 132 60 122 62 118 68 C 120 78 132 84 144 80 C 148 74 146 68 140 64 Z' } },
  { muscle: 'alt_gogus', type: 'path', attrs: { d: 'M 96 82 C 104 80 116 82 122 90 C 122 100 106 106 92 100 C 88 92 90 86 96 82 Z' } },
  { muscle: 'alt_gogus', type: 'path', attrs: { d: 'M 144 82 C 136 80 124 82 118 90 C 118 100 134 106 148 100 C 152 92 150 86 144 82 Z' } },
  { muscle: 'biceps', type: 'path', attrs: { d: 'M 53 82 C 49 102 48 126 51 146 L 71 146 C 71 126 71 102 75 82 Z' } },
  { muscle: 'biceps', type: 'path', attrs: { d: 'M 187 82 C 191 102 192 126 189 146 L 169 146 C 169 126 169 102 165 82 Z' } },
  { muscle: 'on_kol', type: 'path', attrs: { d: 'M 52 149 C 50 166 49 186 53 201 L 69 201 C 71 186 71 166 70 149 Z' } },
  { muscle: 'on_kol', type: 'path', attrs: { d: 'M 188 149 C 190 166 191 186 187 201 L 171 201 C 169 186 169 166 170 149 Z' } },
  { muscle: 'core', type: 'rect', attrs: { x: 98, y: 98, width: 44, height: 88, rx: 10 } },
  { muscle: 'quadriceps', type: 'path', attrs: { d: 'M 86 224 C 82 270 80 320 84 360 L 112 360 C 112 320 112 270 110 224 Z' } },
  { muscle: 'quadriceps', type: 'path', attrs: { d: 'M 154 224 C 158 270 160 320 156 360 L 128 360 C 128 320 128 270 130 224 Z' } },
];

const BACK_SHAPES = [
  { muscle: 'trapez', type: 'path', attrs: { d: 'M 120 50 L 168 64 C 160 90 140 100 120 96 C 100 100 80 90 72 64 Z' } },
  { muscle: 'arka_omuz', type: 'ellipse', attrs: { cx: 66, cy: 64, rx: 15, ry: 14 } },
  { muscle: 'arka_omuz', type: 'ellipse', attrs: { cx: 174, cy: 64, rx: 15, ry: 14 } },
  { muscle: 'sirt_kanat', type: 'path', attrs: { d: 'M 76 82 C 70 110 74 150 92 178 C 100 160 100 120 96 86 Z' } },
  { muscle: 'sirt_kanat', type: 'path', attrs: { d: 'M 164 82 C 170 110 166 150 148 178 C 140 160 140 120 144 86 Z' } },
  { muscle: 'alt_sirt', type: 'ellipse', attrs: { cx: 120, cy: 185, rx: 22, ry: 14 } },
  { muscle: 'triceps', type: 'path', attrs: { d: 'M 53 82 C 49 102 48 126 51 146 L 71 146 C 71 126 71 102 75 82 Z' } },
  { muscle: 'triceps', type: 'path', attrs: { d: 'M 187 82 C 191 102 192 126 189 146 L 169 146 C 169 126 169 102 165 82 Z' } },
  { muscle: 'on_kol', type: 'path', attrs: { d: 'M 52 149 C 50 166 49 186 53 201 L 69 201 C 71 186 71 166 70 149 Z' } },
  { muscle: 'on_kol', type: 'path', attrs: { d: 'M 188 149 C 190 166 191 186 187 201 L 171 201 C 169 186 169 166 170 149 Z' } },
  { muscle: 'kalca', type: 'path', attrs: { d: 'M 88 200 C 80 215 82 232 96 238 C 110 234 114 218 110 202 Z' } },
  { muscle: 'kalca', type: 'path', attrs: { d: 'M 152 200 C 160 215 158 232 144 238 C 130 234 126 218 130 202 Z' } },
  { muscle: 'hamstring', type: 'path', attrs: { d: 'M 86 224 C 82 270 80 320 84 360 L 112 360 C 112 320 112 270 110 224 Z' } },
  { muscle: 'hamstring', type: 'path', attrs: { d: 'M 154 224 C 158 270 160 320 156 360 L 128 360 C 128 320 128 270 130 224 Z' } },
  { muscle: 'baldir', type: 'path', attrs: { d: 'M 88 365 C 82 382 84 402 93 416 C 102 405 103 384 98 368 Z' } },
  { muscle: 'baldir', type: 'path', attrs: { d: 'M 152 365 C 158 382 156 402 147 416 C 138 405 137 384 142 368 Z' } },
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
  if (shape.type === 'circle') return <circle {...shape.attrs} {...common} />;
  return null;
}

function BodyFigure({ shapes, selectedMuscle, onSelectMuscle, label, showAbsLines }) {
  return (
    <div className="muscle-diagram">
      <svg viewBox="0 0 240 460">
        {SILHOUETTE.map((shape, i) => (
          <ShapeEl key={`silhouette-${i}`} shape={shape} fill="var(--surface-2)" interactive={false} />
        ))}
        {shapes.map((shape, i) => (
          <ShapeEl
            key={`${shape.muscle}-${i}`}
            shape={shape}
            fill={selectedMuscle === shape.muscle ? 'var(--accent)' : 'var(--surface)'}
            interactive
            onClick={() => onSelectMuscle(shape.muscle)}
          />
        ))}
        {showAbsLines && ABS_LINES.map((line, i) => (
          <line key={`absline-${i}`} {...line} stroke="var(--border)" strokeWidth="1" pointerEvents="none" />
        ))}
      </svg>
      <div className="muscle-diagram-label">{label}</div>
    </div>
  );
}

function MuscleDiagram({ selectedMuscle, onSelectMuscle }) {
  return (
    <div className="muscle-diagram-wrapper">
      <BodyFigure shapes={FRONT_SHAPES} selectedMuscle={selectedMuscle} onSelectMuscle={onSelectMuscle} label="Ön" showAbsLines />
      <BodyFigure shapes={BACK_SHAPES} selectedMuscle={selectedMuscle} onSelectMuscle={onSelectMuscle} label="Arka" />
    </div>
  );
}

export default MuscleDiagram;