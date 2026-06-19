import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/sidebar';

const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [yil, ay, gun] = dateStr.split('-');
  const d = new Date(`${dateStr}T00:00:00`);
  return `${gun}.${ay}.${yil} - ${GUN_ADLARI[d.getDay()]}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const emptyRow = () => ({ hareket: '', set_sayisi: '', tekrar_sayisi: '', agirlik: '' });

function WorkoutNotebook() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [rows, setRows] = useState([emptyRow()]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [aiAnaliz, setAiAnaliz] = useState('');
  const [aiYukleniyor, setAiYukleniyor] = useState(false);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${apiUrl}/api/workout-notes/dates`, { headers }).then((res) => setAvailableDates(res.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    setSavedMessage('');
    axios.get(`${apiUrl}/api/workout-notes/${selectedDate}`, { headers })
      .then((res) => {
        if (res.data.length > 0) {
          setRows(res.data.map((r) => ({ hareket: r.hareket, set_sayisi: r.set_sayisi ?? '', tekrar_sayisi: r.tekrar_sayisi ?? '', agirlik: r.agirlik ?? '' })));
        } else {
          setRows([emptyRow()]);
        }
      })
      .catch(() => setRows([emptyRow()]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleRowChange = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleAddRow = () => setRows((prev) => [...prev, emptyRow()]);
  const handleDeleteRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage('');
    const payload = rows.filter((r) => r.hareket.trim() !== '').map((r) => ({
      hareket: r.hareket.trim(),
      set_sayisi: r.set_sayisi === '' ? null : Number(r.set_sayisi),
      tekrar_sayisi: r.tekrar_sayisi === '' ? null : Number(r.tekrar_sayisi),
      agirlik: r.agirlik === '' ? null : Number(r.agirlik),
    }));
    try {
      const res = await axios.put(`${apiUrl}/api/workout-notes/${selectedDate}`, payload, { headers });
      if (res.data.length > 0) {
        setRows(res.data.map((r) => ({ hareket: r.hareket, set_sayisi: r.set_sayisi ?? '', tekrar_sayisi: r.tekrar_sayisi ?? '', agirlik: r.agirlik ?? '' })));
      } else {
        setRows([emptyRow()]);
      }
      setSavedMessage('Kaydedildi.');
      if (payload.length > 0 && !availableDates.includes(selectedDate)) {
        setAvailableDates((prev) => [selectedDate, ...prev].sort((a, b) => b.localeCompare(a)));
      }
    } catch {
      setSavedMessage('Kaydedilemedi, lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const aiAnalizAl = async () => {
    const kayitliHareketler = rows.filter((r) => r.hareket && r.agirlik);
    if (kayitliHareketler.length === 0) return;
    setAiYukleniyor(true);
    setAiAnaliz('');
    const hareketGruplari = {};
    kayitliHareketler.forEach((r) => {
      if (!hareketGruplari[r.hareket]) hareketGruplari[r.hareket] = [];
      hareketGruplari[r.hareket].push(parseFloat(r.agirlik));
    });
    const hareketListesi = Object.entries(hareketGruplari).map(([hareket, agirliklar]) => ({ hareket, agirliklar: agirliklar.filter((a) => !isNaN(a)) }));
    try {
      const res = await axios.post(`${apiUrl}/api/yerel-ai/defter-analizi`, { hareketler: hareketListesi }, { headers: { Authorization: `Bearer ${token}` } });
      setAiAnaliz(res.data.yorum);
    } catch {
      setAiAnaliz('AI analizi alınamadı, lütfen tekrar deneyin.');
    } finally {
      setAiYukleniyor(false);
    }
  };

  return (
    <div>
      <Sidebar />
      <main className="md:ml-64 pt-20 md:pt-10 px-gutter md:px-10 pb-24 md:pb-10 min-h-screen">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-none">ANTRENMAN GÜNLÜĞÜ</h2>
            <p className="font-label-mono text-label-mono text-primary-container mt-2">{formatDateDisplay(selectedDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-mono text-xs focus:border-primary-container focus:ring-0"
            />
            {availableDates.length > 0 && (
              <select
                value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-surface-container-high border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-mono text-xs"
              >
                {!availableDates.includes(selectedDate) && <option value={selectedDate}>{formatDateDisplay(selectedDate)}</option>}
                {availableDates.map((d) => <option key={d} value={d}>{formatDateDisplay(d)}</option>)}
              </select>
            )}
          </div>
        </header>

        <div className="grid grid-cols-12 gap-bento-gap">
          <section className="col-span-12 lg:col-span-8 bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fitness_center</span>
                Bugünkü Antrenman
              </h3>
              <button onClick={handleAddRow} className="p-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>

            {loading ? (
              <div className="loading-text p-8 text-center">Yükleniyor...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-left font-label-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                        <th className="p-4 border-b border-outline-variant">Egzersiz</th>
                        <th className="p-4 border-b border-outline-variant text-center">Set</th>
                        <th className="p-4 border-b border-outline-variant text-center">Tekrar</th>
                        <th className="p-4 border-b border-outline-variant text-center">Ağırlık (kg)</th>
                        <th className="p-4 border-b border-outline-variant text-right">Eylem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="group hover:bg-surface-container-high transition-colors border-b border-outline-variant/30">
                          <td className="p-4">
                            <input
                              type="text" placeholder="Egzersiz adı" value={row.hareket}
                              onChange={(e) => handleRowChange(i, 'hareket', e.target.value)}
                              className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 p-0 outline-none"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="number" min="0" value={row.set_sayisi}
                              onChange={(e) => handleRowChange(i, 'set_sayisi', e.target.value)}
                              className="w-12 bg-surface-container-lowest border border-outline-variant text-center text-on-surface font-label-mono rounded text-sm py-1"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="number" min="0" value={row.tekrar_sayisi}
                              onChange={(e) => handleRowChange(i, 'tekrar_sayisi', e.target.value)}
                              className="w-12 bg-surface-container-lowest border border-outline-variant text-center text-on-surface font-label-mono rounded text-sm py-1"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="number" min="0" step="0.5" value={row.agirlik}
                              onChange={(e) => handleRowChange(i, 'agirlik', e.target.value)}
                              className="w-16 bg-surface-container-lowest border border-outline-variant text-center text-on-surface font-label-mono rounded text-sm py-1"
                            />
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteRow(i)} disabled={rows.length === 1}
                              className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 flex justify-end gap-4 bg-surface-container-low">
                  <button
                    onClick={handleSave} disabled={saving}
                    className="px-6 py-2 bg-primary text-on-primary font-label-mono text-xs uppercase font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Kaydediliyor...' : 'Günlüğü Tamamla'}
                  </button>
                </div>

                {savedMessage && <div className="mx-6 mb-4 p-3 bg-primary-container/10 border border-primary-container/30 rounded-lg text-sm">{savedMessage}</div>}
              </>
            )}
          </section>

          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-bento-gap">
            <div className="bg-surface-container rounded-xl border border-outline-variant p-6">
              <h4 className="font-label-mono text-xs text-secondary-container font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                AI Gelişim Analizi
              </h4>

              {!aiAnaliz && (
                <button
                  onClick={aiAnalizAl} disabled={aiYukleniyor}
                  className="w-full py-3 bg-secondary-container text-white rounded-lg font-label-mono text-label-mono uppercase hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {aiYukleniyor ? 'Analiz Hazırlanıyor...' : 'AI ile Analiz Et'}
                </button>
              )}
              {aiAnaliz && <p className="text-body-sm text-on-surface-variant italic leading-relaxed">{aiAnaliz}</p>}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default WorkoutNotebook;