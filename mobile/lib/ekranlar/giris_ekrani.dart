import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';
import 'ana_ekran.dart';
import 'kayit_ekrani.dart';

class GirisEkrani extends StatefulWidget {
  const GirisEkrani({super.key});
  @override
  State<GirisEkrani> createState() => _GirisEkraniState();
}

class _GirisEkraniState extends State<GirisEkrani> {
  final _emailCtrl = TextEditingController();
  final _sifreCtrl = TextEditingController();
  bool _yukleniyor = false;
  bool _dogrulamaGerekli = false;
  bool _yenidenGonderiyor = false;
  bool _sifreGizli = true;
  String _hata = '';
  String _yenidenGonderiMesaj = '';

  Future<void> _girisYap() async {
    if (_emailCtrl.text.trim().isEmpty || _sifreCtrl.text.isEmpty) {
      setState(() { _hata = 'Email ve şifre boş bırakılamaz.'; });
      return;
    }
    setState(() { _yukleniyor = true; _hata = ''; _dogrulamaGerekli = false; _yenidenGonderiMesaj = ''; });
    try {
      final yanit = await ApiServisi.girisYap(_emailCtrl.text.trim(), _sifreCtrl.text);
      if (yanit.containsKey('token')) {
        await ApiServisi.tokenKaydet(yanit['token']);
        if (!mounted) return;
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const AnaEkran()));
      } else if (yanit['status_code'] == 403) {
        setState(() { _hata = yanit['detail'] ?? ''; _dogrulamaGerekli = true; });
      } else {
        setState(() { _hata = 'Email veya şifre hatalı.'; });
      }
    } catch (_) {
      setState(() { _hata = 'Bağlantı hatası. 30 saniye bekleyip tekrar deneyin.'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  Future<void> _yenidenGonder() async {
    setState(() { _yenidenGonderiyor = true; _yenidenGonderiMesaj = ''; });
    try {
      final yanit = await ApiServisi.dogrulamaYenidenGonder(_emailCtrl.text.trim());
      setState(() { _yenidenGonderiMesaj = yanit['mesaj'] ?? 'Gönderildi.'; });
    } catch (_) {
      setState(() { _yenidenGonderiMesaj = 'Bir hata oluştu, tekrar deneyin.'; });
    } finally {
      setState(() { _yenidenGonderiyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg(context),
      body: Stack(
        children: [
          Positioned(
            top: 0, right: 0,
            child: Container(
              width: 400, height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [kRed.withOpacity(0.05), Colors.transparent]),
              ),
            ),
          ),
          Positioned(
            bottom: 0, left: 0,
            child: Container(
              width: 250, height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [kRed.withOpacity(0.07), Colors.transparent]),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  const SizedBox(height: 56),
                  Container(
                    width: 76,
                    height: 76,
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: kRed.withOpacity(0.18),
                          blurRadius: 24,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.asset(
                        'assets/logo.png',
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('VisionFit', style: kHeadline(context, size: 26, weight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  Text('EN İYİ HALİNE ULAŞ.', style: kLabel(context)),
                  const SizedBox(height: 40),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: kSurfaceLow(context),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: kBorderAlt(context)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('EMAIL ADRESİ', style: kLabel(context)),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          style: kBody(context, color: kText(context)),
                          decoration: kInputDeko(context, 'adiniz@ornek.com', Icons.mail_outline),
                        ),
                        const SizedBox(height: 20),
                        Text('ŞİFRE', style: kLabel(context)),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _sifreCtrl,
                          obscureText: _sifreGizli,
                          style: kBody(context, color: kText(context)),
                          onSubmitted: (_) => _girisYap(),
                          decoration: kInputDeko(context, '••••••••', Icons.lock_outline).copyWith(
                            suffixIcon: IconButton(
                              icon: Icon(
                                _sifreGizli ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                color: kHint(context), size: 20,
                              ),
                              onPressed: () => setState(() { _sifreGizli = !_sifreGizli; }),
                            ),
                          ),
                        ),
                        if (_hata.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: kRed.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: kRed.withOpacity(0.3)),
                            ),
                            child: Row(children: [
                              const Icon(Icons.warning_amber_outlined, color: kRed, size: 16),
                              const SizedBox(width: 8),
                              Expanded(child: Text(_hata, style: kBody(context, size: 12, color: kRed))),
                            ]),
                          ),
                        ],
                        if (_dogrulamaGerekli) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: kSurface(context),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: kBorder(context)),
                            ),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('Email adresinizi doğrulamanız gerekiyor.', style: kBody(context, size: 12, color: kText(context))),
                              const SizedBox(height: 6),
                              GestureDetector(
                                onTap: _yenidenGonderiyor ? null : _yenidenGonder,
                                child: Text(
                                  _yenidenGonderiyor ? 'Gönderiliyor...' : 'Doğrulama maili gönder →',
                                  style: kLabel(context, color: kRed),
                                ),
                              ),
                              if (_yenidenGonderiMesaj.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(_yenidenGonderiMesaj, style: kBody(context, size: 11, color: kGreen)),
                              ],
                            ]),
                          ),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity, height: 48,
                          child: ElevatedButton(
                            onPressed: _yukleniyor ? null : _girisYap,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: kRed,
                              disabledBackgroundColor: kRed.withOpacity(0.5),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              elevation: 0,
                            ),
                            child: _yukleniyor
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text('GİRİŞ YAP', style: kLabel(context, size: 13, color: Colors.white)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('Hesabın yok mu? ', style: kBody(context, size: 13, color: kHint(context))),
                    GestureDetector(
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const KayitEkrani())),
                      child: Text('Kayıt Ol', style: kBody(context, size: 13, color: kRed, weight: FontWeight.w700)),
                    ),
                  ]),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}