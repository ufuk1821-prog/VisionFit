from unittest.mock import patch, MagicMock
from app.services import email


def test_eposta_yapilandirma_yok():
    with patch.object(email, "BREVO_API_KEY", None), patch.object(email, "EMAIL_FROM", None):
        assert email.send_verification_email("test@test.com", "Test", "token123") is False


def test_eposta_basarili_gonderim():
    with patch.object(email, "BREVO_API_KEY", "test_key"), patch.object(email, "EMAIL_FROM", "gonderen@test.com"):
        sahte_response = MagicMock()
        sahte_response.status_code = 201
        with patch("app.services.email.requests.post", return_value=sahte_response) as mock_post:
            sonuc = email.send_verification_email("test@test.com", "Test", "token123")
            assert sonuc is True
            assert mock_post.called


def test_eposta_basarisiz_yanit():
    with patch.object(email, "BREVO_API_KEY", "test_key"), patch.object(email, "EMAIL_FROM", "gonderen@test.com"):
        sahte_response = MagicMock()
        sahte_response.status_code = 400
        sahte_response.text = "Hatali istek"
        with patch("app.services.email.requests.post", return_value=sahte_response):
            assert email.send_verification_email("test@test.com", "Test", "token123") is False


def test_eposta_baglanti_hatasi():
    with patch.object(email, "BREVO_API_KEY", "test_key"), patch.object(email, "EMAIL_FROM", "gonderen@test.com"):
        with patch("app.services.email.requests.post", side_effect=Exception("baglanti hatasi")):
            assert email.send_verification_email("test@test.com", "Test", "token123") is False