import os
import requests

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://vision-fit-ashy.vercel.app")


def send_verification_email(to_email: str, ad: str, token: str) -> bool:
    if not BREVO_API_KEY or not EMAIL_FROM:
        print(f"[EMAIL HATA] BREVO_API_KEY veya EMAIL_FROM tanımlı değil. BREVO_API_KEY={'var' if BREVO_API_KEY else 'yok'}, EMAIL_FROM={'var' if EMAIL_FROM else 'yok'}")
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

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "sender": {"name": "VisionFit", "email": EMAIL_FROM},
                "to": [{"email": to_email}],
                "subject": "VisionFit - E-posta Doğrulama",
                "htmlContent": html,
            },
            timeout=10,
        )

        if response.status_code in (200, 201):
            print(f"[EMAIL] Doğrulama maili gönderildi: {to_email}")
            return True

        print(f"[EMAIL HATA] {to_email} için mail gönderilemedi: {response.status_code} {response.text}")
        return False
    except Exception as e:
        print(f"[EMAIL HATA] {to_email} için mail gönderilemedi: {repr(e)}")
        return False