import { Dumbbell, Sparkles, Clock } from 'lucide-react';
import Sidebar from '../components/sidebar';

const EXERCISES = [
  {
    ad: 'Squat',
    aciklama: 'Bacak ve kalça kaslarını çalıştıran temel bir egzersizdir. Sırt düz, dizler ayak ucunu geçmeyecek şekilde çökülür.',
    kas_gruplari: 'Quadriceps, Kalça, Hamstring',
    seviye: 'Baslangic',
    ai_destegi: true,
  },
  {
    ad: 'Plank',
    aciklama: 'Gövde stabilitesini ve karın kaslarını geliştiren statik bir egzersizdir. Vücut düz bir hat oluşturmalıdır.',
    kas_gruplari: 'Core, Karın, Sırt',
    seviye: 'Baslangic',
    ai_destegi: false,
  },
  {
    ad: 'Lunge (Adım Atma)',
    aciklama: 'Tek bacak üzerinde denge ve güç geliştiren bir egzersizdir. Ön diz, ayak ucunu geçmemelidir.',
    kas_gruplari: 'Quadriceps, Kalça, Hamstring',
    seviye: 'Orta',
    ai_destegi: false,
  },
  {
    ad: 'Push-Up (Şınav)',
    aciklama: 'Üst gövde gücünü geliştiren klasik bir egzersizdir. Gövde düz tutularak göğüs yere yaklaştırılır.',
    kas_gruplari: 'Göğüs, Omuz, Triceps',
    seviye: 'Orta',
    ai_destegi: false,
  },
  {
    ad: 'Glute Bridge',
    aciklama: 'Kalça ve alt sırt kaslarını güçlendiren, sırt üstü yapılan bir egzersizdir.',
    kas_gruplari: 'Kalça, Hamstring, Core',
    seviye: 'Baslangic',
    ai_destegi: false,
  },
  {
    ad: 'Mountain Climber',
    aciklama: 'Kardiyo ve core güçlendirmeyi birleştiren dinamik bir egzersizdir.',
    kas_gruplari: 'Core, Bacak, Omuz',
    seviye: 'Orta',
    ai_destegi: false,
  },
  {
    ad: 'Bicycle Crunch',
    aciklama: 'Karın kaslarını ve oblik kaslarını hedefleyen dinamik bir egzersizdir.',
    kas_gruplari: 'Karın, Oblik',
    seviye: 'Orta',
    ai_destegi: false,
  },
  {
    ad: 'Deadlift (Romanian)',
    aciklama: 'Arka zincir kaslarını güçlendiren, sırt düz tutularak yapılan bir egzersizdir.',
    kas_gruplari: 'Hamstring, Kalça, Sırt',
    seviye: 'Ileri',
    ai_destegi: false,
  },
];

const SEVIYE_RENK = {
  Baslangic: 'var(--accent)',
  Orta: 'var(--accent-2)',
  Ileri: 'var(--danger)',
};

const SEVIYE_ETIKET = {
  Baslangic: 'Başlangıç',
  Orta: 'Orta',
  Ileri: 'İleri',
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
              <span className="exercise-tag" style={{ color: SEVIYE_RENK[ex.seviye] }}>{SEVIYE_ETIKET[ex.seviye]}</span>
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