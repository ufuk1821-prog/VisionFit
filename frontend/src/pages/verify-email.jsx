import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Geçersiz doğrulama bağlantısı.');
      return;
    }
    axios.get(`${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.mesaj);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Doğrulama başarısız oldu.');
      });
  }, [token]);

  return (
    <div className="auth-layout">
      <div className="auth-form-panel">
        <div className="auth-box fade-in" style={{ textAlign: 'center' }}>
          {status === 'loading' && <p className="loading-text">Doğrulanıyor...</p>}
          {status === 'success' && (
            <>
              <CheckCircle size={48} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
              <h2>Doğrulandı!</h2>
              <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>{message}</p>
              <Link to="/login" className="submit-btn" style={{ display: 'block', textDecoration: 'none' }}>Giriş Yap</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
              <h2>Doğrulama Başarısız</h2>
              <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>{message}</p>
              <Link to="/login" className="link-text">Giriş sayfasına dön</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;