import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';
import 'giris_ekrani.dart';

class KayitEkrani extends StatefulWidget {
  const KayitEkrani({super.key});

  @override
  State<KayitEkrani> createState() => _KayitEkraniState();
}

class _KayitEkraniState extends State<KayitEkrani> {
  final _adController = TextEditingController();
  final _soyadController = TextEditingController();
  final _emailController = TextEditingController();
  final _sifreController = TextEditingController();
  final _sifreTekrarController = TextEditingController();
  bool _yukleniyor = false;
  bool _basarili = false;
  bool _yenidenGonderiyor = false;
  String _hata = '';
  String _yenidenGonderiMesaj = '';

  @override
  void initState() {
    super.initState();
    _sifreController.addListener(() => setState(() {}));
    _sifreTekrarController.addListener(() => setState(() {}));
  }

  bool _kuralGecti(String kural) {
    final s = _sifreController.text;
    switch (kural) {
      case 'uzunluk': return s.length >= 8;
      case 'buyuk': return s.contains(RegExp(r'[A-Z]'));
      case 'ozel': return s.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>]'));
      default: return false;
    }
  }

  bool get _sifreGecerli => _kuralGecti('uzunluk') && _kuralGecti('buyuk') && _kuralGecti('ozel');

  Future<void> _kayitOl() async {
    if (!_sifreGecerli) { setState(() { _hata = 'Şifre gereksinimleri karşılanmıyor.'; }); return; }
    if (_sifreController.text != _sifreTekrarController.text) { setState(() { _hata = 'Şifreler eşleşmiyor.'; }); return; }
    setState(() { _yukleniyor = true; _hata = ''; });
    try {
      final yanit = await ApiServisi.kayitOl(_adController.text.trim(), _soyadController.text.trim(), _emailController.text.trim(), _sifreController.text);
      if (yanit.containsKey('mesaj')) {
        setState(() { _basarili = true; });
      } else {
        final detail = yanit['detail'] ?? '';
        setState(() { _hata = detail == 'Bu email zaten kayitli.' ? 'Bu email adresiyle zaten bir hesap mevcut.' : detail.isNotEmpty ? detail : 'Kayıt başarısız.'; });
      }
    } catch (e) {
      setState(() { _hata = 'Sunucuya bağlanılamadı.'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  Future<void> _yenidenGonder() async {
    setState(() { _yenidenGonderiyor = true; });
    try {
      final yanit = await ApiServisi.dogrulamaYenidenGonder(_emailController.text.trim());
      setState(() { _yenidenGonderiMesaj = yanit['mesaj'] ?? 'Gönderildi.'; });
    } catch (e) {
      setState(() { _yenidenGonderiMesaj = 'Bir hata oluştu.'; });
    } finally {
      setState(() { _yenidenGonderiyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F0F),
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Kayıt Ol', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _basarili ? _basariliEkran() : _form(),
        ),
      ),
    );
  }

  Widget _basariliEkran() {
    return Column(
      children: [
        const SizedBox(height: 40),
        const Icon(Icons.mark_email_read_outlined, color: Color(0xFFE8313F), size: 64),
        const SizedBox(height: 24),
        const Text('E-postanı Kontrol Et', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Text('${_emailController.text} adresine bir doğrulama bağlantısı gönderdik.', style: const TextStyle(color: Color(0xFF888888), fontSize: 14), textAlign: TextAlign.center),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity, height: 52,
          child: ElevatedButton(
            onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const GirisEkrani())),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Giriş Sayfasına Git', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: _yenidenGonderiyor ? null : _yenidenGonder,
          child: Text(_yenidenGonderiyor ? 'Gönderiliyor...' : 'E-postayı Tekrar Gönder', style: const TextStyle(color: Color(0xFFE8313F))),
        ),
        if (_yenidenGonderiMesaj.isNotEmpty)
          Text(_yenidenGonderiMesaj, style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
      ],
    );
  }

  Widget _form() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _inputAlani('Ad', _adController),
        _inputAlani('Soyad', _soyadController),
        _inputAlani('Email', _emailController, klavye: TextInputType.emailAddress),
        _inputAlani('Şifre', _sifreController, gizli: true),
        if (_sifreController.text.isNotEmpty) ...[
          const SizedBox(height: 8),
          _sifreKural('En az 8 karakter', _kuralGecti('uzunluk')),
          _sifreKural('En az 1 büyük harf', _kuralGecti('buyuk')),
          _sifreKural('En az 1 özel karakter (!@#\$% vb.)', _kuralGecti('ozel')),
        ],
        _inputAlani('Şifre Tekrar', _sifreTekrarController, gizli: true,
          hataMesaji: _sifreTekrarController.text.isNotEmpty && _sifreController.text != _sifreTekrarController.text ? 'Şifreler eşleşmiyor.' : null),
        const SizedBox(height: 8),
        if (_hata.isNotEmpty)
          Container(
            width: double.infinity, margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFFE8313F).withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
            child: Text(_hata, style: const TextStyle(color: Color(0xFFE8313F), fontSize: 13)),
          ),
        SizedBox(
          width: double.infinity, height: 52,
          child: ElevatedButton(
            onPressed: _yukleniyor ? null : _kayitOl,
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: _yukleniyor ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Hesap Oluştur', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ),
        const SizedBox(height: 20),
        Center(
          child: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: RichText(
              text: const TextSpan(
                text: 'Zaten hesabın var mı? ',
                style: TextStyle(color: Color(0xFF888888), fontSize: 14),
                children: [TextSpan(text: 'Giriş Yap', style: TextStyle(color: Color(0xFFE8313F), fontWeight: FontWeight.w600))],
              ),
            ),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _inputAlani(String label, TextEditingController controller, {bool gizli = false, TextInputType klavye = TextInputType.text, String? hataMesaji}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Text(label, style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: gizli,
          keyboardType: klavye,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            filled: true, fillColor: const Color(0xFF1A1A1A),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF333333))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: hataMesaji != null ? const Color(0xFFE8313F) : const Color(0xFF333333))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE8313F))),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
        if (hataMesaji != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(hataMesaji, style: const TextStyle(color: Color(0xFFE8313F), fontSize: 12)),
          ),
      ],
    );
  }

  Widget _sifreKural(String metin, bool gecti) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(gecti ? Icons.check_circle : Icons.radio_button_unchecked, size: 16, color: gecti ? const Color(0xFF4CAF50) : const Color(0xFF888888)),
          const SizedBox(width: 6),
          Text(metin, style: TextStyle(color: gecti ? const Color(0xFF4CAF50) : const Color(0xFF888888), fontSize: 12)),
        ],
      ),
    );
  }
}