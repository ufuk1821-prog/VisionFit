import os
import socket
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://vision-fit-ashy.vercel.app")


def send_verification_email(to_email: str, ad: str, token: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[EMAIL HATA] SMTP_USER veya SMTP_PASSWORD tanımlı değil. SMTP_USER={'var' if SMTP_USER else 'yok'}, SMTP_PASSWORD={'var' if SMTP_PASSWORD else 'yok'}")
        return False

    verify_link = f"{FRONTEND_URL}/verify-email?token={token}"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #e8313f;">VisionFit</h2>
      <p>Merhaba {ad},</p>
      <p>VisionFit hesabını oluşturduğun için teşekkürler. Hesabını aktifleştirmek için aşağıdaki butona tıkla.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{verify_link}" style="background: #e8313f; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">E-postamı Doğrula</a>
      </p>
      <p>Eğer butona tıklayamıyorsan bu bağlantıyı tarayıcına yapıştır:</p>
      <p style="word-break: break-all; color: #666;">{verify_link}</p>
      <p>Bu işlemi sen yapmadıysan bu e-postayı yok sayabilirsin.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "VisionFit - E-posta Doğrulama"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    original_getaddrinfo = socket.getaddrinfo

    def ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        return original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

    try:
        socket.getaddrinfo = ipv4_getaddrinfo
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
        print(f"[EMAIL] Doğrulama maili gönderildi: {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL HATA] {to_email} için mail gönderilemedi: {repr(e)}")
        return False
    finally:
        socket.getaddrinfo = original_getaddrinfo