import { Dumbbell, Sparkles, Clock } from 'lucide-react';
import Sidebar from '../components/sidebar';

const EXERCISES = [
  {
    ad: 'Squat',
    aciklama: 'Bacak ve kalça kaslarını calistiran temel bir egzersizdir. Sirt duz, dizler ayak ucunu gecmeyecek sekilde cokulur.',
    kas_gruplari: 'Quadriceps, Kalca, Hamstring',
    seviye: 'Baslangic',
    ai_destegi: true,
  },
  {
    ad: 'Plank',
    aciklama: 'Govde stabilitesini ve karin kaslarini gelistiren statik bir egzersizdir. Vucut duz bir hat olusturmalidir.',
    kas_gruplari: 'Core, Karin, Sirt',
    seviye: 'Baslangic',
    ai_destegi: false,
  },
  {
    ad: 'Lunge (Adim Atma)',
    aciklama: 'Tek bacak uzerinde denge ve guc gelistiren bir egzersizdir. On diz, ayak ucunu gecmemelidir.',
    kas_gruplari: 'Quadriceps, Kalca, Hamstring',
    seviye: 'Orta',
    ai_destegi: false,
  },
  {
    ad: 'Push-Up (Sinav)',
    aciklama: 'Ust govde gucunu gelistiren klasik bir egzersizdir. Govde duz tutularak gogus yere yaklastirilir.',
    kas_gruplari: 'Gogus, Omuz, Triceps',
    seviye: 'Orta',
    ai_destegi: false,
  },
  {
    ad: 'Glute Bridge',
    aciklama: 'Kalca ve alt sirt kaslarini guclendiren, sirt ustu yapilan bir egzersizdir.',
    kas_gruplari: 'Kalca, Hamstring, Core',
    seviye: 'Baslangic',
    ai_destegi: false,
  },
  {
    ad: 'Mountain Climber',
    aciklama: 'Kardiyo ve core guclendirmeyi birlestiren dinamik bir egzersizdir.',
    kas_gruplari: 'Core, Bacak, Omuz',
    seviye: 'Orta',
    ai_destegi: false,
  },
  {
    ad: 'Bicycle Crunch',
    aciklama: 'Karin kaslarini ve obliklerini hedefleyen dinamik bir egzersizdir.',
    kas_gruplari: 'Karin, Oblik',
    seviye: 'Orta',
    ai_destegi: false,
  },
  {
    ad: 'Deadlift (Romanian)',
    aciklama: 'Arka zincir kaslarini guclendiren, sirt duz tutularak yapilan bir egzersizdir.',
    kas_gruplari: 'Hamstring, Kalca, Sirt',
    seviye: 'Ileri',
    ai_destegi: false,
  },
];

const SEVIYE_RENK = {
  Baslangic: 'var(--accent)',
  Orta: 'var(--accent-2)',
  Ileri: 'var(--danger)',
};

function Exercises() {
  return (
    <div>
      <Sidebar />
      <div className="section-title">Egzersiz Kütüphanesi</div>

      <div className="exercise-grid">
        {EXERCISES.map((ex) => (
          <div className="exercise-card" key={ex.ad}>
            <div className="exercise-card-header">
              <div className="card-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Dumbbell size={18} />
              </div>
              <span className="exercise-title">{ex.ad}</span>
            </div>

            <p className="exercise-desc">{ex.aciklama}</p>

            <div className="exercise-meta">
              <span className="exercise-tag" style={{ color: SEVIYE_RENK[ex.seviye] }}>{ex.seviye}</span>
              <span className="exercise-muscle">{ex.kas_gruplari}</span>
            </div>

            {ex.ai_destegi ? (
              <div className="exercise-badge ai-active">
                <Sparkles size={14} />
                AI Analizi Mevcut
              </div>
            ) : (
              <div className="exercise-badge ai-soon">
                <Clock size={14} />
                AI Analizi Yakında
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Exercises;