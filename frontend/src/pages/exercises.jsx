import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, Search } from 'lucide-react';
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

      <header style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.8rem', textTransform: 'uppercase' }}>EGZERSİZ KÜTÜPHANESİ</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '6px' }}>
            Biyo-Mekanik Veritabanı v2.4
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '16px' }} className="exercises-grid">
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
          <MuscleDiagram selectedMuscle={selectedMuscle} onSelectMuscle={setSelectedMuscle} />

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Egzersiz</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{exerciseList.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Seçili</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>{muscleInfo?.ad}</div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase' }}>{muscleInfo?.ad} Egzersizleri</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exerciseList.length} SONUÇ</span>
          </div>

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
        </section>
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