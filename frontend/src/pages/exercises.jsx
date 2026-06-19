import { useState } from 'react';
import Sidebar from '../components/sidebar';
import MuscleDiagram, { GROUP_TO_SLUG, SLUG_TO_GROUPS } from '../components/MuscleDiagram';
import { MUSCLE_GROUPS, EXERCISES } from '../data/exercises';

function Exercises() {
  const [selectedMuscle, setSelectedMuscle] = useState('ust_gogus');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [onArka, setOnArka] = useState('on');
  const [activeTab, setActiveTab] = useState('diyagram');

  const muscleInfo = MUSCLE_GROUPS.find((m) => m.key === selectedMuscle);
  const exerciseList = EXERCISES[selectedMuscle] || [];
  const currentSlug = GROUP_TO_SLUG[selectedMuscle];
  const subGroups = SLUG_TO_GROUPS[currentSlug] || [selectedMuscle];

  return (
    <div>
      <Sidebar />
      <main className="md:ml-64 min-h-screen pt-20 md:pt-10 pb-20 px-4 md:px-section-padding">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg uppercase tracking-tight">EGZERSİZ KÜTÜPHANESİ</h1>
            <p className="text-on-surface-variant font-label-mono text-label-mono uppercase mt-2">Biyo-Mekanik Veritabanı v2.4</p>
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant">
            <button
              onClick={() => setActiveTab('diyagram')}
              className={`px-6 py-2 font-label-mono text-label-mono uppercase rounded-md transition-all ${activeTab === 'diyagram' ? 'bg-primary text-on-primary-container shadow-lg' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Vücut Diyagramı
            </button>
            <button
              onClick={() => setActiveTab('liste')}
              className={`px-6 py-2 font-label-mono text-label-mono uppercase rounded-md transition-all ${activeTab === 'liste' ? 'bg-primary text-on-primary-container shadow-lg' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Kas Listesi
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-bento-gap max-w-[1400px] mx-auto">
          {activeTab === 'diyagram' ? (
            <section className="lg:col-span-5 bg-surface-container rounded-xl border border-outline-variant p-6 relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest text-[10px]">Aktif Katman</span>
                <span className="px-2 py-1 bg-brand-red/10 border border-brand-red text-brand-red font-label-mono text-label-mono uppercase">Kas Sistemi</span>
              </div>

              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <button
                  onClick={() => setOnArka('on')}
                  className={`p-2 border rounded-lg ${onArka === 'on' ? 'bg-surface-container-high border-primary text-primary' : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline'}`}
                >
                  <span className="material-symbols-outlined">accessibility</span>
                  <span className="block text-[8px] font-bold mt-1">ÖN</span>
                </button>
                <button
                  onClick={() => setOnArka('arka')}
                  className={`p-2 border rounded-lg ${onArka === 'arka' ? 'bg-surface-container-high border-primary text-primary' : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline'}`}
                >
                  <span className="material-symbols-outlined">settings_accessibility</span>
                  <span className="block text-[8px] font-bold mt-1">ARKA</span>
                </button>
              </div>

              <div className="relative w-full mt-16 mb-4 flex justify-center">
                <MuscleDiagram selectedMuscle={selectedMuscle} onSelectMuscle={setSelectedMuscle} onArka={onArka} />
              </div>

              <div className="mt-auto w-full pt-4 border-t border-outline-variant flex justify-between items-center">
                <div className="flex gap-4">
                  <div>
                    <div className="text-[10px] font-label-mono text-on-surface-variant uppercase">Egzersiz</div>
                    <div className="text-headline-md font-display-lg text-primary">{exerciseList.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-label-mono text-on-surface-variant uppercase">Seçili</div>
                    <div className="text-headline-md font-display-lg text-primary uppercase">{muscleInfo?.ad}</div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="lg:col-span-5 bg-surface-container rounded-xl border border-outline-variant p-6">
              <div className="grid grid-cols-2 gap-2">
                {MUSCLE_GROUPS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setSelectedMuscle(m.key)}
                    className={`p-3 rounded-lg border font-label-mono text-label-mono uppercase text-xs text-left transition-all ${
                      selectedMuscle === m.key ? 'border-brand-red bg-brand-red/10 text-brand-red' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {m.ad}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="lg:col-span-7 flex flex-col gap-bento-gap">
            {subGroups.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {subGroups.map((key) => {
                  const info = MUSCLE_GROUPS.find((m) => m.key === key);
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedMuscle(key)}
                      className={`px-4 py-2 rounded-lg border font-label-mono text-label-mono uppercase text-xs ${selectedMuscle === key ? 'bg-brand-red border-brand-red text-white' : 'border-outline-variant text-on-surface-variant'}`}
                    >
                      {info?.ad}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between px-2">
              <h2 className="font-headline-md text-headline-md uppercase">{muscleInfo?.ad} EGZERSİZLERİ</h2>
              <span className="text-label-mono font-label-mono text-on-surface-variant">{exerciseList.length} SONUÇ BULUNDU</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-bento-gap">
              {exerciseList.map((ex, i) => (
                <div
                  key={ex.ad}
                  className="bento-card bg-surface-container border border-outline-variant p-4 rounded-xl cursor-pointer group"
                  onClick={() => setSelectedExercise(ex)}
                >
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 border border-outline-variant bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-5xl opacity-30">fitness_center</span>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-brand-red text-white font-label-mono text-[10px] rounded">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-headline-md text-lg uppercase tracking-tight group-hover:text-primary transition-colors">{ex.ad}</h3>
                      <p className="text-on-surface-variant text-xs font-label-mono uppercase">{ex.kisa}</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {selectedExercise && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedExercise(null)}></div>
          <div className="relative bg-surface-container-high w-full max-w-2xl border border-outline-variant rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant bg-surface-container-highest">
              <div>
                <h2 className="font-display-lg text-headline-md uppercase text-primary">{selectedExercise.ad}</h2>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-brand-red/20 text-brand-red font-label-mono text-[10px] border border-brand-red/50 uppercase">{muscleInfo?.ad}</span>
                </div>
              </div>
              <button className="p-2 text-on-surface-variant hover:text-white" onClick={() => setSelectedExercise(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <h4 className="font-label-mono text-label-mono uppercase text-on-surface-variant tracking-widest text-xs">Egzersiz Açıklaması</h4>
                <p className="text-on-surface leading-relaxed">{selectedExercise.detay}</p>
              </div>

              <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <span className="material-symbols-outlined text-sm">science</span>
                  <span className="font-label-mono text-label-mono uppercase text-xs font-bold">Bilimsel İpucu</span>
                </div>
                <p className="text-sm italic text-on-surface/80">{selectedExercise.trickler}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exercises;