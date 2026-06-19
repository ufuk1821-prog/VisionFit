import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';
import 'giris_ekrani.dart';

class KayitEkrani extends StatefulWidget {
  const KayitEkrani({super.key});
  @override
  State<KayitEkrani> createState() => _KayitEkraniState();
}

class _KayitEkraniState extends State<KayitEkrani> {
  final _adCtrl = TextEditingController();
  final _soyadCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _sifreCtrl = TextEditingController();
  bool _yukleniyor = false;
  bool _sifreGizli = true;
  String _hata = '';
  String _basari = '';

  bool get _uzunlukOk => _sifreCtrl.text.length >= 8;
  bool get _buyukHarfOk => _sifreCtrl.text.contains(RegExp(r'[A-Z]'));
  bool get _ozelKarakterOk => _sifreCtrl.text.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>]'));

  Future<void> _kayitOl() async {
    if (_adCtrl.text.isEmpty || _soyadCtrl.text.isEmpty ||
        _emailCtrl.text.isEmpty || _sifreCtrl.text.isEmpty) {
      setState(() { _hata = 'Tüm alanları doldurun.'; });
      return;
    }
    if (!_uzunlukOk || !_buyukHarfOk || !_ozelKarakterOk) {
      setState(() { _hata = 'Şifre koşullarını sağlamıyor.'; });
      return;
    }
    setState(() { _yukleniyor = true; _hata = ''; _basari = ''; });
    try {
      final yanit = await ApiServisi.kayitOl(
        _adCtrl.text.trim(), _soyadCtrl.text.trim(),
        _emailCtrl.text.trim(), _sifreCtrl.text,
      );
      if (yanit['mesaj'] != null || yanit['email'] != null) {
        setState(() { _basari = 'Kayıt başarılı! Email adresinize doğrulama linki gönderildi.'; });
      } else {
        setState(() { _hata = yanit['detail'] ?? 'Kayıt başarısız.'; });
      }
    } catch (e) {
      setState(() { _hata = 'Bir hata oluştu: $e'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg(context),
      appBar: AppBar(
        backgroundColor: kSurfaceLow(context),
        elevation: 0,
        iconTheme: IconThemeData(color: kText(context)),
        title: Text('KAYIT OL', style: kLabel(context, size: 13, color: kText(context))),
        centerTitle: false,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: kBorder(context)),
        ),
      ),
      body: Stack(
        children: [
          Positioned(
            top: 0, right: 0,
            child: Container(
              width: 300, height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [kRed.withOpacity(0.05), Colors.transparent]),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),
                  Text('Hesap Oluştur', style: kHeadline(context, size: 22, weight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text('Performans profilini başlat.', style: kBody(context, size: 13, color: kHint(context))),
                  const SizedBox(height: 28),
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
                        Row(children: [
                          Expanded(child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('AD', style: kLabel(context)),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _adCtrl,
                                style: kBody(context, color: kText(context)),
                                decoration: kInputDeko(context, '', Icons.person_outline),
                              ),
                            ],
                          )),
                          const SizedBox(width: 12),
                          Expanded(child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('SOYAD', style: kLabel(context)),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _soyadCtrl,
                                style: kBody(context, color: kText(context)),
                                decoration: kInputDeko(context, '', Icons.person_outline),
                              ),
                            ],
                          )),
                        ]),
                        const SizedBox(height: 20),
                        Text('EMAIL ADRESİ', style: kLabel(context)),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          style: kBody(context, color: kText(context)),
                          decoration: kInputDeko(context, '', Icons.mail_outline),
                        ),
                        const SizedBox(height: 20),
                        Text('ŞİFRE', style: kLabel(context)),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _sifreCtrl,
                          obscureText: _sifreGizli,
                          style: kBody(context, color: kText(context)),
                          onChanged: (_) => setState(() {}),
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
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: kSurfaceLowest(context),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: kBorder(context)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('GÜVENLİK KRİTERLERİ', style: kLabel(context, color: kHint(context))),
                              const SizedBox(height: 8),
                              _kosul(context, 'En az 8 karakter', _uzunlukOk),
                              _kosul(context, 'En az 1 büyük harf', _buyukHarfOk),
                              _kosul(context, 'En az 1 özel karakter (!@#\$ vb.)', _ozelKarakterOk),
                            ],
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
                        if (_basari.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: kGreen.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: kGreen.withOpacity(0.3)),
                            ),
                            child: Column(children: [
                              Row(children: [
                                const Icon(Icons.check_circle_outline, color: kGreen, size: 16),
                                const SizedBox(width: 8),
                                Expanded(child: Text(_basari, style: kBody(context, size: 12, color: kGreen))),
                              ]),
                              const SizedBox(height: 10),
                              GestureDetector(
                                onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const GirisEkrani())),
                                child: Text('Giriş ekranına git →', style: kLabel(context, color: kRed)),
                              ),
                            ]),
                          ),
                        ],
                        if (_basari.isEmpty) ...[
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity, height: 48,
                            child: ElevatedButton(
                              onPressed: _yukleniyor ? null : _kayitOl,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: kRed,
                                disabledBackgroundColor: kRed.withOpacity(0.5),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                elevation: 0,
                              ),
                              child: _yukleniyor
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : Text('KAYIT OL', style: kLabel(context, size: 13, color: Colors.white)),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('Zaten hesabın var mı? ', style: kBody(context, size: 13, color: kHint(context))),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Text('Giriş Yap', style: kBody(context, size: 13, color: kRed, weight: FontWeight.w700)),
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

  Widget _kosul(BuildContext context, String metin, bool tamam) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(children: [
        Icon(
          tamam ? Icons.check_circle : Icons.radio_button_unchecked,
          color: tamam ? kGreen : kHint(context), size: 16,
        ),
        const SizedBox(width: 8),
        Text(metin, style: kBody(context, size: 12, color: tamam ? kGreen : kHint(context))),
      ]),
    );
  }
}