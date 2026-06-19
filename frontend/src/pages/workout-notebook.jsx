import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Calendar, Sparkles, Dumbbell } from 'lucide-react';
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
  const yil = d.getFullYear();
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const gun = String(d.getDate()).padStart(2, '0');
  return `${yil}-${ay}-${gun}`;
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
    axios
      .get(`${apiUrl}/api/workout-notes/dates`, { headers })
      .then((res) => setAvailableDates(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    setSavedMessage('');
    axios
      .get(`${apiUrl}/api/workout-notes/${selectedDate}`, { headers })
      .then((res) => {
        if (res.data.length > 0) {
          setRows(
            res.data.map((r) => ({
              hareket: r.hareket,
              set_sayisi: r.set_sayisi ?? '',
              tekrar_sayisi: r.tekrar_sayisi ?? '',
              agirlik: r.agirlik ?? '',
            }))
          );
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

  const handleDeleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage('');

    const payload = rows
      .filter((r) => r.hareket.trim() !== '')
      .map((r) => ({
        hareket: r.hareket.trim(),
        set_sayisi: r.set_sayisi === '' ? null : Number(r.set_sayisi),
        tekrar_sayisi: r.tekrar_sayisi === '' ? null : Number(r.tekrar_sayisi),
        agirlik: r.agirlik === '' ? null : Number(r.agirlik),
      }));

    try {
      const res = await axios.put(`${apiUrl}/api/workout-notes/${selectedDate}`, payload, { headers });

      if (res.data.length > 0) {
        setRows(
          res.data.map((r) => ({
            hareket: r.hareket,
            set_sayisi: r.set_sayisi ?? '',
            tekrar_sayisi: r.tekrar_sayisi ?? '',
            agirlik: r.agirlik ?? '',
          }))
        );
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
    const hareketListesi = Object.entries(hareketGruplari).map(([hareket, agirliklar]) => ({
      hareket,
      agirliklar: agirliklar.filter((a) => !isNaN(a)),
    }));
    try {
      const res = await axios.post(
        `${apiUrl}/api/yerel-ai/defter-analizi`,
        { hareketler: hareketListesi },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

      <header style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.8rem', textTransform: 'uppercase', lineHeight: 1 }}>ANTRENMAN GÜNLÜĞÜ</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-2)', marginTop: '8px', textTransform: 'uppercase' }}>
            Yaptığınız hareketleri kaydedin, gelişiminizi takip edin
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
          />
          {availableDates.length > 0 && (
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
            >
              {!availableDates.includes(selectedDate) && (
                <option value={selectedDate}>{formatDateDisplay(selectedDate)}</option>
              )}
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {formatDateDisplay(d)}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: '16px' }} className="notebook-grid">
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
              <Dumbbell size={20} color="var(--accent)" />
              {formatDateDisplay(selectedDate)}
            </h3>
            <button
              onClick={handleAddRow}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(232,49,63,0.12)', color: 'var(--accent)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Plus size={18} />
            </button>
          </div>

          {loading ? (
            <div className="loading-text">Yükleniyor...</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', textAlign: 'left' }}>
                      <th style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Egzersiz</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Set</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Tekrar</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Ağırlık (kg)</th>
                      <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <input
                            type="text"
                            placeholder="Örn: Barbell Bench Press"
                            value={row.hareket}
                            onChange={(e) => handleRowChange(i, 'hareket', e.target.value)}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            value={row.set_sayisi}
                            onChange={(e) => handleRowChange(i, 'set_sayisi', e.target.value)}
                            style={{ width: '48px', background: 'var(--surface-lowest, #0e0e0e)', border: '1px solid var(--border)', color: 'var(--text)', textAlign: 'center', borderRadius: '6px', padding: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            value={row.tekrar_sayisi}
                            onChange={(e) => handleRowChange(i, 'tekrar_sayisi', e.target.value)}
                            style={{ width: '48px', background: 'var(--surface-lowest, #0e0e0e)', border: '1px solid var(--border)', color: 'var(--text)', textAlign: 'center', borderRadius: '6px', padding: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={row.agirlik}
                            onChange={(e) => handleRowChange(i, 'agirlik', e.target.value)}
                            style={{ width: '64px', background: 'var(--surface-lowest, #0e0e0e)', border: '1px solid var(--border)', color: 'var(--text)', textAlign: 'center', borderRadius: '6px', padding: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteRow(i)}
                            disabled={rows.length === 1}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', opacity: rows.length === 1 ? 0.4 : 1 }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--surface-2)' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px',
                    background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Kaydediliyor...' : 'Günlüğü Tamamla'}
                </button>
              </div>

              {savedMessage && <div className="info-banner" style={{ margin: '16px 24px' }}>{savedMessage}</div>}
            </>
          )}
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#8d99ae', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              <Sparkles size={16} /> AI İLERLEME ANALİZİ
            </h4>
            {!aiAnaliz && (
              <button
                onClick={aiAnalizAl}
                disabled={aiYukleniyor}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '10px', background: '#8d99ae', color: '#fff', border: 'none',
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                <Sparkles size={16} /> {aiYukleniyor ? 'Analiz Hazırlanıyor...' : 'AI ile Analiz Et'}
              </button>
            )}
            {aiAnaliz && <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.6', fontStyle: 'italic' }}>{aiAnaliz}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default WorkoutNotebook;