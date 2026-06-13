import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import Sidebar from '../components/sidebar';
import MuscleDiagram, { GROUP_TO_SLUG, SLUG_TO_GROUPS } from '../components/MuscleDiagram';
import { MUSCLE_GROUPS, EXERCISES } from '../data/exercises';

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.9, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 12 },
};

function Exercises() {
  const [selectedMuscle, setSelectedMuscle] = useState('ust_gogus');
  const [selectedExercise, setSelectedExercise] = useState(null);

  const muscleInfo = MUSCLE_GROUPS.find((m) => m.key === selectedMuscle);
  const exerciseList = EXERCISES[selectedMuscle] || [];

  const currentSlug = GROUP_TO_SLUG[selectedMuscle];
  const subGroups = SLUG_TO_GROUPS[currentSlug] || [selectedMuscle];

  return (
    <div>
      <Sidebar />
      <div className="section-title">Egzersiz Kütüphanesi</div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        Çalışmak istediğiniz kas grubunu vücut diyagramından seçin.
      </p>

      <MuscleDiagram selectedMuscle={selectedMuscle} onSelectMuscle={setSelectedMuscle} />

      {subGroups.length > 1 && (
        <div className="tab-switcher">
          {subGroups.map((key) => {
            const info = MUSCLE_GROUPS.find((m) => m.key === key);
            return (
              <button
                key={key}
                className={`tab-btn ${selectedMuscle === key ? 'active' : ''}`}
                onClick={() => setSelectedMuscle(key)}
              >
                {info?.ad}
              </button>
            );
          })}
        </div>
      )}

      <div className="section-title">{muscleInfo?.ad} Hareketleri</div>

      <div className="exercise-list">
        {exerciseList.map((ex, i) => (
          <div className="exercise-row" key={ex.ad} onClick={() => setSelectedExercise(ex)}>
            <span className="exercise-rank">{i + 1}</span>
            <div className="exercise-row-info">
              <span className="exercise-row-name">{ex.ad}</span>
              <span className="exercise-row-desc">{ex.kisa}</span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedExercise && (
          <motion.div
            className="food-modal-overlay"
            onClick={() => setSelectedExercise(null)}
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="food-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '500px', textAlign: 'left' }}
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <button className="food-modal-close" onClick={() => setSelectedExercise(null)}>
                <X size={20} />
              </button>
              <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px', color: 'var(--text)' }}>{selectedExercise.ad}</h2>
              <p style={{ color: 'var(--text)', marginBottom: '16px', lineHeight: '1.5' }}>{selectedExercise.detay}</p>
              <div className="exercise-tip">
                <Sparkles size={16} />
                <span>{selectedExercise.trickler}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Exercises;