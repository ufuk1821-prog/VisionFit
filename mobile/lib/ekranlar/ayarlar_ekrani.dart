import '../main.dart';
import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';
import 'giris_ekrani.dart';

class AyarlarEkrani extends StatefulWidget {
  const AyarlarEkrani({super.key});
  @override
  State<AyarlarEkrani> createState() => _AyarlarEkraniState();
}

class _AyarlarEkraniState extends State<AyarlarEkrani> {
  final _mevcutSifreCtrl = TextEditingController();
  final _yeniSifreCtrl = TextEditingController();
  final _yeniSifreTekrarCtrl = TextEditingController();
  String _sifreMesaj = '';
  bool _sifreHata = false;
  bool _sifreYukleniyor = false;
  bool _silModalAcik = false;
  bool _silYukleniyor = false;

  Future<void> _sifreDegistir() async {
    if (_yeniSifreCtrl.text != _yeniSifreTekrarCtrl.text) {
      setState(() { _sifreMesaj = 'Yeni şifreler eşleşmiyor.'; _sifreHata = true; });
      return;
    }
    setState(() { _sifreYukleniyor = true; _sifreMesaj = ''; });
    try {
      await ApiServisi.putJson('/api/users/me/password', {
        'mevcut_sifre': _mevcutSifreCtrl.text,
        'yeni_sifre': _yeniSifreCtrl.text,
      });
      setState(() { _sifreMesaj = 'ok'; _sifreHata = false; });
      _mevcutSifreCtrl.clear();
      _yeniSifreCtrl.clear();
      _yeniSifreTekrarCtrl.clear();
    } catch (_) {
      setState(() { _sifreMesaj = 'hata'; _sifreHata = true; });
    } finally {
      setState(() { _sifreYukleniyor = false; });
    }
  }

  Future<void> _hesapSil() async {
    setState(() { _silYukleniyor = true; });
    try {
      await ApiServisi.deleteJson('/api/users/me');
      await ApiServisi.tokenSil();
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const GirisEkrani()));
    } catch (_) {
      setState(() { _silYukleniyor = false; _silModalAcik = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = VisionFitApp.of(context);
    final karanlikMi = app?.themeMode == ThemeMode.dark;

    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Ayarlar', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text('Hesap ve uygulama tercihleri', style: kBody(context, size: 13, color: kHint(context))),
              const SizedBox(height: 24),
              _bolumBasligi(context, 'Görünüm', Icons.palette_outlined),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorderAlt(context))),
                child: Row(children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(color: kRed.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                    child: Icon(karanlikMi ? Icons.dark_mode_outlined : Icons.light_mode_outlined, color: kRed, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Tema', style: kBody(context, size: 14, weight: FontWeight.w600, color: kText(context))),
                    Text(karanlikMi ? 'Karanlık mod aktif' : 'Aydınlık mod aktif', style: kLabel(context, size: 10, color: kHint(context))),
                  ])),
                  GestureDetector(
                    onTap: () {
                      if (app != null) {
                        app.temaDegistir(karanlikMi ? ThemeMode.light : ThemeMode.dark);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(color: kRed.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: kRed.withOpacity(0.4))),
                      child: Text('DEĞİŞTİR', style: kLabel(context, size: 10, color: kRed)),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: 24),
              _bolumBasligi(context, 'Şifre Değiştir', Icons.lock_outline),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorderAlt(context))),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _inputAlani(context, 'MEVCUT ŞİFRE', _mevcutSifreCtrl, gizli: true),
                  const SizedBox(height: 12),
                  _inputAlani(context, 'YENİ ŞİFRE', _yeniSifreCtrl, gizli: true),
                  const SizedBox(height: 12),
                  _inputAlani(context, 'YENİ ŞİFRE TEKRAR', _yeniSifreTekrarCtrl, gizli: true),
                  if (_sifreMesaj.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: _sifreHata ? kRed.withOpacity(0.1) : kGreen.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: _sifreHata ? kRed.withOpacity(0.3) : kGreen.withOpacity(0.3)),
                      ),
                      child: Row(children: [
                        Icon(_sifreHata ? Icons.warning_amber_outlined : Icons.check_circle_outline, color: _sifreHata ? kRed : kGreen, size: 16),
                        const SizedBox(width: 8),
                        Text(_sifreMesaj == 'ok' ? 'Şifre başarıyla değiştirildi.' : 'Şifre değiştirilemedi.', style: kBody(context, size: 12, color: _sifreHata ? kRed : kGreen)),
                      ]),
                    ),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity, height: 44,
                    child: ElevatedButton(
                      onPressed: _sifreYukleniyor ? null : _sifreDegistir,
                      style: ElevatedButton.styleFrom(backgroundColor: kRed, disabledBackgroundColor: kRed.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0),
                      child: _sifreYukleniyor
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text('ŞİFREYİ DEĞİŞTİR', style: kLabel(context, size: 11, color: Colors.white)),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: 24),
              _bolumBasligi(context, 'Tehlikeli Bölge', Icons.warning_amber_outlined),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: kRed.withOpacity(0.05), borderRadius: BorderRadius.circular(12), border: Border.all(color: kRed.withOpacity(0.3))),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    const Icon(Icons.delete_outline, color: kRed, size: 20),
                    const SizedBox(width: 8),
                    Text('Hesabı Sil', style: kBody(context, size: 14, weight: FontWeight.w700, color: kText(context))),
                  ]),
                  const SizedBox(height: 8),
                  Text('Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.', style: kBody(context, size: 12, color: kHint(context))),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity, height: 44,
                    child: OutlinedButton(
                      onPressed: () => setState(() { _silModalAcik = true; }),
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: kRed), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                      child: Text('HESABIMI SİL', style: kLabel(context, size: 11, color: kRed)),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
        if (_silModalAcik)
          GestureDetector(
            onTap: () => setState(() { _silModalAcik = false; }),
            child: Container(
              color: Colors.black.withOpacity(0.7),
              child: Center(
                child: GestureDetector(
                  onTap: () {},
                  child: Container(
                    margin: const EdgeInsets.all(24),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(16), border: Border.all(color: kRed.withOpacity(0.3))),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Container(
                        width: 56, height: 56,
                        decoration: BoxDecoration(color: kRed.withOpacity(0.1), shape: BoxShape.circle, border: Border.all(color: kRed.withOpacity(0.3))),
                        child: const Icon(Icons.warning_amber_outlined, color: kRed, size: 28),
                      ),
                      const SizedBox(height: 16),
                      Text('Hesabı Sil', style: kHeadline(context, size: 18, weight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      Text('Bu işlem geri alınamaz.\nTüm verileriniz kalıcı olarak silinecek.', style: kBody(context, size: 13, color: kHint(context)), textAlign: TextAlign.center),
                      const SizedBox(height: 24),
                      Row(children: [
                        Expanded(child: OutlinedButton(
                          onPressed: () => setState(() { _silModalAcik = false; }),
                          style: OutlinedButton.styleFrom(side: BorderSide(color: kBorder(context)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 12)),
                          child: Text('İPTAL', style: kLabel(context, size: 11, color: kText(context))),
                        )),
                        const SizedBox(width: 12),
                        Expanded(child: ElevatedButton(
                          onPressed: _silYukleniyor ? null : _hesapSil,
                          style: ElevatedButton.styleFrom(backgroundColor: kRed, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 12), elevation: 0),
                          child: _silYukleniyor
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : Text('SİL', style: kLabel(context, size: 11, color: Colors.white)),
                        )),
                      ]),
                    ]),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _bolumBasligi(BuildContext context, String baslik, IconData ikon) {
    return Row(children: [
      Icon(ikon, color: kRed, size: 18),
      const SizedBox(width: 8),
      Text(baslik, style: kBody(context, size: 15, weight: FontWeight.w700, color: kText(context))),
    ]);
  }

  Widget _inputAlani(BuildContext context, String label, TextEditingController ctrl, {bool gizli = false}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: kLabel(context)),
      const SizedBox(height: 6),
      TextField(
        controller: ctrl,
        obscureText: gizli,
        style: kBody(context, color: kText(context)),
        decoration: InputDecoration(
          filled: true, fillColor: kSurfaceContainer(context),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed, width: 1.5)),
        ),
      ),
    ]);
  }
}