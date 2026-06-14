import os
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
        return False

    verify_link = f"{FRONTEND_URL}/verify-email?token={token}"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #e8313f;">VisionFit</h2>
      <p>Merhaba {ad},</p>
      <p>VisionFit hesabini olusturdugun icin tesekkurler. Hesabini aktiflestirmek icin asagidaki butona tikla.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{verify_link}" style="background: #e8313f; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">E-postami Dogrula</a>
      </p>
      <p>Eger butona tiklayamiyorsan bu baglantiyi tarayicina yapistir:</p>
      <p style="word-break: break-all; color: #666;">{verify_link}</p>
      <p>Bu islemi sen yapmadiysan bu e-postayi yok sayabilirsin.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "VisionFit - E-posta Dogrulama"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
        print(f"[EMAIL] Dogrulama maili gonderildi: {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL HATA] {to_email} icin mail gonderilemedi: {repr(e)}")
        return False