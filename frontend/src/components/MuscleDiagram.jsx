import Model from 'react-body-highlighter';

export const GROUP_TO_SLUG = {
  ust_gogus: 'chest',
  alt_gogus: 'chest',
  sirt_kanat: 'upper-back',
  trapez: 'trapezius',
  alt_sirt: 'lower-back',
  on_omuz: 'front-deltoids',
  yan_omuz: 'front-deltoids',
  arka_omuz: 'back-deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  on_kol: 'forearm',
  core: 'abs',
  quadriceps: 'quadriceps',
  hamstring: 'hamstring',
  kalca: 'gluteal',
  baldir: 'calves',
};

export const SLUG_TO_GROUPS = {
  chest: ['ust_gogus', 'alt_gogus'],
  'upper-back': ['sirt_kanat'],
  trapezius: ['trapez'],
  'lower-back': ['alt_sirt'],
  'front-deltoids': ['on_omuz', 'yan_omuz'],
  'back-deltoids': ['arka_omuz'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearm: ['on_kol'],
  abs: ['core'],
  obliques: ['core'],
  quadriceps: ['quadriceps'],
  adductor: ['quadriceps'],
  hamstring: ['hamstring'],
  gluteal: ['kalca'],
  abductors: ['kalca'],
  calves: ['baldir'],
};

function MuscleDiagram({ selectedMuscle, onSelectMuscle }) {
  const slug = GROUP_TO_SLUG[selectedMuscle];
  const data = slug ? [{ name: 'secili', muscles: [slug], frequency: 1 }] : [];

  const handleClick = ({ muscle }) => {
    const groups = SLUG_TO_GROUPS[muscle];
    if (!groups) return;
    onSelectMuscle(groups[0]);
  };

  const modelStyle = {
    width: '200px',
    padding: '0',
    cursor: 'pointer',
  };

  const svgStyle = {
    width: '200px',
    height: 'auto',
  };

  return (
    <div className="muscle-diagram-wrapper">
      <div className="muscle-diagram">
        <Model
          type="anterior"
          data={data}
          onClick={handleClick}
          bodyColor="#c4956a"
          highlightedColors={['#39ff88']}
          style={modelStyle}
          svgStyle={svgStyle}
        />
        <div className="muscle-diagram-label">Ön</div>
      </div>
      <div className="muscle-diagram">
        <Model
          type="posterior"
          data={data}
          onClick={handleClick}
          bodyColor="#c4956a"
          highlightedColors={['#39ff88']}
          style={modelStyle}
          svgStyle={svgStyle}
        />
        <div className="muscle-diagram-label">Arka</div>
      </div>
    </div>
  );
}

export default MuscleDiagram;