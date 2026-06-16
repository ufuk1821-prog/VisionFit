import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';
import 'ana_ekran.dart';
import 'kayit_ekrani.dart';

class GirisEkrani extends StatefulWidget {
  const GirisEkrani({super.key});

  @override
  State<GirisEkrani> createState() => _GirisEkraniState();
}

class _GirisEkraniState extends State<GirisEkrani> {
  final _emailController = TextEditingController();
  final _sifreController = TextEditingController();
  bool _yukleniyor = false;
  bool _dogrulamaGerekli = false;
  bool _yenidenGonderiyor = false;
  String _hata = '';
  String _yenidenGonderiMesaj = '';

  Future<void> _girisYap() async {
    setState(() { _yukleniyor = true; _hata = ''; _dogrulamaGerekli = false; _yenidenGonderiMesaj = ''; });
    try {
      final yanit = await ApiServisi.girisYap(_emailController.text.trim(), _sifreController.text);
      if (yanit.containsKey('token')) {
        await ApiServisi.tokenKaydet(yanit['token']);
        if (!mounted) return;
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const AnaEkran()));
      } else if (yanit['status_code'] == 403) {
        setState(() { _hata = yanit['detail'] ?? ''; _dogrulamaGerekli = true; });
      } else {
        setState(() { _hata = 'Giriş başarısız. Email veya şifre hatalı.'; });
      }
    } catch (e) {
      setState(() { _hata = 'Giriş başarısız. Email veya şifre hatalı.'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  Future<void> _yenidenGonder() async {
    setState(() { _yenidenGonderiyor = true; _yenidenGonderiMesaj = ''; });
    try {
      final yanit = await ApiServisi.dogrulamaYenidenGonder(_emailController.text.trim());
      setState(() { _yenidenGonderiMesaj = yanit['mesaj'] ?? 'Gönderildi.'; });
    } catch (e) {
      setState(() { _yenidenGonderiMesaj = 'Bir hata oluştu, tekrar deneyin.'; });
    } finally {
      setState(() { _yenidenGonderiyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: Stack(
        children: [
          SafeArea(
            child: Row(
              children: [
                if (MediaQuery.of(context).size.width > 600) _solPanel(),
                Expanded(child: _formPanel()),
              ],
            ),
          ),
          if (_yukleniyor)
            Positioned(
              top: 0, left: 0, right: 0,
              child: Material(
                color: const Color(0xFFE8313F),
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Text('Sunucu uyandırılıyor, lütfen bekleyin...', style: TextStyle(color: Colors.white, fontSize: 13), textAlign: TextAlign.center),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _solPanel() {
    return Container(
      width: 320,
      color: const Color(0xFF1A1A1A),
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(color: const Color(0xFFE8313F), borderRadius: BorderRadius.circular(12)),
            child: Image.asset('assets/logo.png', width: 56, height: 56),
          ),
          const SizedBox(height: 24),
          const Text('En İyi Haline Ulaş', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          const Text('Yapay zeka destekli antrenman analizi, kişiye özel diyet planı ve gelişim takibi tek platformda.', style: TextStyle(color: Color(0xFF888888), fontSize: 14, height: 1.6)),
          const SizedBox(height: 32),
          _ozellikItem(Icons.fitness_center_outlined, 'Kamera ile Form Analizi'),
          _ozellikItem(Icons.restaurant_menu_outlined, 'Kişiye Özel Diyet Önerisi'),
          _ozellikItem(Icons.directions_walk_outlined, 'Adım ve Aktivite Takibi'),
          _ozellikItem(Icons.bar_chart_outlined, 'Gelişim Grafikleri'),
        ],
      ),
    );
  }

  Widget _ozellikItem(IconData ikon, String baslik) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(ikon, color: const Color(0xFFE8313F), size: 18),
          const SizedBox(width: 10),
          Text(baslik, style: const TextStyle(color: Color(0xFFCCCCCC), fontSize: 14)),
        ],
      ),
    );
  }

  Widget _formPanel() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          Center(
            child: Column(
              children: [
                Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(color: const Color(0xFFE8313F), borderRadius: BorderRadius.circular(12)),
                  child: Image.asset('assets/logo.png', width: 56, height: 56),
                ),
                const SizedBox(height: 8),
                const Text('VISIONFIT', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 3)),
              ],
            ),
          ),
          const SizedBox(height: 40),
          const Text('Giriş Yap', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 24),
          if (_hata.isNotEmpty)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFE8313F).withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
              child: Text(_hata, style: const TextStyle(color: Color(0xFFE8313F), fontSize: 13)),
            ),
          if (_dogrulamaGerekli)
            Center(
              child: Column(
                children: [
                  TextButton(
                    onPressed: _yenidenGonderiyor ? null : _yenidenGonder,
                    child: Text(_yenidenGonderiyor ? 'Gönderiliyor...' : 'Doğrulama E-postasını Yeniden Gönder', style: const TextStyle(color: Color(0xFFE8313F))),
                  ),
                  if (_yenidenGonderiMesaj.isNotEmpty)
                    Text(_yenidenGonderiMesaj, style: const TextStyle(color: Color(0xFFE8313F), fontSize: 13)),
                ],
              ),
            ),
          const Text('Email', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 6),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration(),
          ),
          const SizedBox(height: 16),
          const Text('Şifre', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 6),
          TextField(
            controller: _sifreController,
            obscureText: true,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration(),
            onSubmitted: (_) => _girisYap(),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _yukleniyor ? null : _girisYap,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE8313F),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                _yukleniyor ? 'Giriş Yapılıyor...' : 'Giriş Yap',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const KayitEkrani())),
              child: RichText(
                text: const TextSpan(
                  text: 'Hesabın yok mu? ',
                  style: TextStyle(color: Color(0xFF888888), fontSize: 14),
                  children: [TextSpan(text: 'Kayıt Ol', style: TextStyle(color: Color(0xFFE8313F), fontWeight: FontWeight.w600))],
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration() {
    return InputDecoration(
      filled: true,
      fillColor: const Color(0xFF1A1A1A),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF333333))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF333333))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE8313F))),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }
}