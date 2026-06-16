import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Calendar, Sparkles } from 'lucide-react';
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
    const hedef = kayitliHareketler[0];
    const agirliklar = rows
      .filter((r) => r.hareket === hedef.hareket && r.agirlik)
      .map((r) => parseFloat(r.agirlik))
      .filter((a) => !isNaN(a));
    try {
      const res = await axios.post(
        `${apiUrl}/api/yerel-ai/defter-analizi`,
        { hareket: hedef.hareket, agirliklar },
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
      <div className="section-title">Antrenman Defteri</div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        Yaptığınız hareketleri, set/tekrar sayılarını ve ağırlıkları kaydedin; geçmiş tarihlerle
        karşılaştırarak gelişiminizi (Progressive Overload) takip edin.
      </p>

      <div className="notebook-date-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Tarih</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>

        {availableDates.length > 0 && (
          <div className="form-group" style={{ marginBottom: 0, minWidth: '220px' }}>
            <label>Kayıtlı Tarihler</label>
            <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
              {!availableDates.includes(selectedDate) && (
                <option value={selectedDate}>{formatDateDisplay(selectedDate)}</option>
              )}
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {formatDateDisplay(d)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="notebook-date-display">
          <Calendar size={18} />
          {formatDateDisplay(selectedDate)}
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Yükleniyor...</div>
      ) : (
        <>
          <div className="notebook-table-wrapper">
            <table className="notebook-table">
              <thead>
                <tr>
                  <th>Hareket</th>
                  <th>Set Sayısı</th>
                  <th>Tekrar Sayısı</th>
                  <th>Ağırlık (kg)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="text"
                        placeholder="Örn: Barbell Bench Press"
                        value={row.hareket}
                        onChange={(e) => handleRowChange(i, 'hareket', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={row.set_sayisi}
                        onChange={(e) => handleRowChange(i, 'set_sayisi', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={row.tekrar_sayisi}
                        onChange={(e) => handleRowChange(i, 'tekrar_sayisi', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={row.agirlik}
                        onChange={(e) => handleRowChange(i, 'agirlik', e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRow(i)}
                        disabled={rows.length === 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="notebook-actions">
            <button className="quick-add-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleAddRow}>
              <Plus size={18} />
              Satır Ekle
            </button>
            <button
              className="submit-btn notebook-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={18} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>

          {savedMessage && <div className="info-banner" style={{ marginTop: '16px' }}>{savedMessage}</div>}

          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header">
              <div className="card-icon"><Sparkles size={18} /></div>
              <div className="card-title">AI İlerleme Analizi</div>
            </div>
            {!aiAnaliz && (
              <button className="timer-btn" style={{ marginTop: '8px', justifyContent: 'center', width: '100%' }} onClick={aiAnalizAl} disabled={aiYukleniyor}>
                <Sparkles size={16} /> {aiYukleniyor ? 'Analiz Hazırlanıyor...' : 'AI ile Analiz Et'}
              </button>
            )}
            {aiAnaliz && <p style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '8px', lineHeight: '1.6' }}>{aiAnaliz}</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default WorkoutNotebook;