import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';

class ProfilEkrani extends StatefulWidget {
  const ProfilEkrani({super.key});
  @override
  State<ProfilEkrani> createState() => _ProfilEkraniState();
}

class _ProfilEkraniState extends State<ProfilEkrani> {
  final _adCtrl = TextEditingController();
  final _soyadCtrl = TextEditingController();
  final _boyCtrl = TextEditingController();
  final _kiloCtrl = TextEditingController();
  final _yasCtrl = TextEditingController();
  String _cinsiyet = '';
  String _aktiflik = '';
  String _hedef = '';
  bool _yukleniyor = true;
  bool _kaydediliyor = false;
  String _mesaj = '';

  final List<Map<String, String>> _aktiflikler = [
    {'value': 'sedanter', 'label': 'Hareketsiz', 'aciklama': 'Ofis işi, az hareket'},
    {'value': 'az_hareketli', 'label': 'Az Hareketli', 'aciklama': 'Haftada 1-3 gün'},
    {'value': 'orta_hareketli', 'label': 'Orta Hareketli', 'aciklama': 'Haftada 3-5 gün'},
    {'value': 'cok_hareketli', 'label': 'Çok Hareketli', 'aciklama': 'Haftada 6-7 gün'},
    {'value': 'asiri_hareketli', 'label': 'Aşırı Hareketli', 'aciklama': 'Günde 2 kez'},
  ];
  final List<Map<String, String>> _hedefler = [
    {'value': 'kilo_verme', 'label': 'Kilo Ver', 'emoji': '📉'},
    {'value': 'kilo_koruma', 'label': 'Koru', 'emoji': '⚖️'},
    {'value': 'kilo_alma', 'label': 'Kilo Al', 'emoji': '📈'},
  ];

  @override
  void initState() { super.initState(); _yukle(); }

  Future<void> _yukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/users/me');
      setState(() {
        _adCtrl.text = veri['ad'] ?? '';
        _soyadCtrl.text = veri['soyad'] ?? '';
        _boyCtrl.text = veri['boy']?.toString() ?? '';
        _kiloCtrl.text = veri['kilo']?.toString() ?? '';
        _yasCtrl.text = veri['yas']?.toString() ?? '';
        _cinsiyet = veri['cinsiyet'] ?? '';
        _aktiflik = veri['aktiflik_seviyesi'] ?? '';
        _hedef = veri['hedef'] ?? '';
        _yukleniyor = false;
      });
    } catch (_) { setState(() { _yukleniyor = false; }); }
  }

  Future<void> _kaydet() async {
    setState(() { _kaydediliyor = true; _mesaj = ''; });
    try {
      await ApiServisi.putJson('/api/users/me', {
        'ad': _adCtrl.text, 'soyad': _soyadCtrl.text,
        'boy': double.tryParse(_boyCtrl.text), 'kilo': double.tryParse(_kiloCtrl.text),
        'yas': int.tryParse(_yasCtrl.text),
        'cinsiyet': _cinsiyet.isEmpty ? null : _cinsiyet,
        'aktiflik_seviyesi': _aktiflik.isEmpty ? null : _aktiflik,
        'hedef': _hedef.isEmpty ? null : _hedef,
      });
      setState(() { _mesaj = 'ok'; });
    } catch (_) {
      setState(() { _mesaj = 'hata'; });
    } finally {
      setState(() { _kaydediliyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: kRed));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Profilim', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('Kişisel bilgilerini güncel tut, daha iyi öneriler al.', style: kBody(context, size: 13, color: kHint(context))),
          const SizedBox(height: 24),
          _bolum(context, 'Kişisel Bilgiler', Icons.person_outline),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _inputAlani(context, 'AD', _adCtrl)),
            const SizedBox(width: 12),
            Expanded(child: _inputAlani(context, 'SOYAD', _soyadCtrl)),
          ]),
          const SizedBox(height: 24),
          _bolum(context, 'Vücut Ölçüleri', Icons.monitor_weight_outlined),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _inputAlani(context, 'BOY (CM)', _boyCtrl, sayi: true)),
            const SizedBox(width: 8),
            Expanded(child: _inputAlani(context, 'KİLO (KG)', _kiloCtrl, sayi: true)),
            const SizedBox(width: 8),
            Expanded(child: _inputAlani(context, 'YAŞ', _yasCtrl, sayi: true)),
          ]),
          const SizedBox(height: 24),
          _bolum(context, 'Cinsiyet', Icons.wc_outlined),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _secimButonu(context, 'Erkek', _cinsiyet == 'Erkek', () => setState(() { _cinsiyet = 'Erkek'; }))),
            const SizedBox(width: 8),
            Expanded(child: _secimButonu(context, 'Kadın', _cinsiyet == 'Kadın', () => setState(() { _cinsiyet = 'Kadın'; }))),
          ]),
          const SizedBox(height: 24),
          _bolum(context, 'Aktivite Seviyesi', Icons.directions_run_outlined),
          const SizedBox(height: 12),
          ..._aktiflikler.map((a) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              onTap: () => setState(() { _aktiflik = a['value']!; }),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: _aktiflik == a['value'] ? kRed.withOpacity(0.1) : kSurfaceLow(context),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: _aktiflik == a['value'] ? kRed : kBorder(context)),
                ),
                child: Row(children: [
                  Icon(_aktiflik == a['value'] ? Icons.radio_button_checked : Icons.radio_button_off, color: _aktiflik == a['value'] ? kRed : kHint(context), size: 18),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(a['label']!, style: kBody(context, size: 13, weight: FontWeight.w600, color: _aktiflik == a['value'] ? kRed : kText(context))),
                    Text(a['aciklama']!, style: kLabel(context, size: 10, color: kHint(context))),
                  ])),
                ]),
              ),
            ),
          )),
          const SizedBox(height: 24),
          _bolum(context, 'Hedef', Icons.flag_outlined),
          const SizedBox(height: 12),
          Row(children: _hedefler.map((h) => Expanded(child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() { _hedef = h['value']!; }),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: _hedef == h['value'] ? kRed : kSurfaceLow(context),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: _hedef == h['value'] ? kRed : kBorder(context)),
                ),
                child: Column(children: [
                  Text(h['emoji']!, style: const TextStyle(fontSize: 22)),
                  const SizedBox(height: 6),
                  Text(h['label']!, style: kLabel(context, size: 10, color: _hedef == h['value'] ? Colors.white : kHint(context))),
                ]),
              ),
            ),
          ))).toList()),
          const SizedBox(height: 24),
          if (_mesaj.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _mesaj == 'ok' ? kGreen.withOpacity(0.1) : kRed.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _mesaj == 'ok' ? kGreen : kRed),
              ),
              child: Row(children: [
                Icon(_mesaj == 'ok' ? Icons.check_circle_outline : Icons.warning_amber_outlined, color: _mesaj == 'ok' ? kGreen : kRed, size: 16),
                const SizedBox(width: 8),
                Text(_mesaj == 'ok' ? 'Profil güncellendi! ✓' : 'Güncelleme başarısız.', style: kBody(context, size: 13, weight: FontWeight.w600, color: _mesaj == 'ok' ? kGreen : kRed)),
              ]),
            ),
          SizedBox(
            width: double.infinity, height: 48,
            child: ElevatedButton.icon(
              onPressed: _kaydediliyor ? null : _kaydet,
              icon: _kaydediliyor
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.save_outlined, color: Colors.white, size: 18),
              label: Text(_kaydediliyor ? 'KAYDEDİLİYOR...' : 'KAYDET', style: kLabel(context, size: 12, color: Colors.white)),
              style: ElevatedButton.styleFrom(backgroundColor: kRed, disabledBackgroundColor: kRed.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), elevation: 0),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _bolum(BuildContext context, String baslik, IconData ikon) {
    return Row(children: [
      Icon(ikon, color: kRed, size: 18),
      const SizedBox(width: 8),
      Text(baslik, style: kBody(context, size: 15, weight: FontWeight.w700, color: kText(context))),
    ]);
  }

  Widget _inputAlani(BuildContext context, String label, TextEditingController ctrl, {bool sayi = false}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: kLabel(context)),
      const SizedBox(height: 6),
      TextField(
        controller: ctrl,
        keyboardType: sayi ? TextInputType.number : TextInputType.text,
        style: kBody(context, color: kText(context)),
        decoration: InputDecoration(
          filled: true, fillColor: kSurfaceContainer(context),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed, width: 1.5)),
        ),
      ),
    ]);
  }

  Widget _secimButonu(BuildContext context, String label, bool secili, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: secili ? kRed : kSurfaceLow(context),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: secili ? kRed : kBorder(context)),
        ),
        child: Center(child: Text(label, style: kBody(context, size: 13, weight: FontWeight.w600, color: secili ? Colors.white : kHint(context)))),
      ),
    );
  }
}