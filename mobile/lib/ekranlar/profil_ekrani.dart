import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';

class ProfilEkrani extends StatefulWidget {
  const ProfilEkrani({super.key});

  @override
  State<ProfilEkrani> createState() => _ProfilEkraniState();
}

class _ProfilEkraniState extends State<ProfilEkrani> {
  final _adController = TextEditingController();
  final _soyadController = TextEditingController();
  final _boyController = TextEditingController();
  final _kiloController = TextEditingController();
  final _yasController = TextEditingController();
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
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/users/me');
      setState(() {
        _adController.text = veri['ad'] ?? '';
        _soyadController.text = veri['soyad'] ?? '';
        _boyController.text = veri['boy']?.toString() ?? '';
        _kiloController.text = veri['kilo']?.toString() ?? '';
        _yasController.text = veri['yas']?.toString() ?? '';
        _cinsiyet = veri['cinsiyet'] ?? '';
        _aktiflik = veri['aktiflik_seviyesi'] ?? '';
        _hedef = veri['hedef'] ?? '';
        _yukleniyor = false;
      });
    } catch (_) {
      setState(() { _yukleniyor = false; });
    }
  }

  Future<void> _kaydet() async {
    setState(() { _kaydediliyor = true; _mesaj = ''; });
    try {
      await ApiServisi.putJson('/api/users/me', {
        'ad': _adController.text,
        'soyad': _soyadController.text,
        'boy': double.tryParse(_boyController.text),
        'kilo': double.tryParse(_kiloController.text),
        'yas': int.tryParse(_yasController.text),
        'cinsiyet': _cinsiyet.isEmpty ? null : _cinsiyet,
        'aktiflik_seviyesi': _aktiflik.isEmpty ? null : _aktiflik,
        'hedef': _hedef.isEmpty ? null : _hedef,
      });
      setState(() { _mesaj = 'Profil güncellendi! ✓'; });
    } catch (_) {
      setState(() { _mesaj = 'Güncelleme başarısız.'; });
    } finally {
      setState(() { _kaydediliyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: Color(0xFFE8313F)));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Profilim', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Kişisel bilgilerini güncel tut, daha iyi öneriler al.', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 20),
          _bolum('Kişisel Bilgiler', Icons.person_outline),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _input('Ad', _adController)),
            const SizedBox(width: 12),
            Expanded(child: _input('Soyad', _soyadController)),
          ]),
          const SizedBox(height: 20),
          _bolum('Vücut Ölçüleri', Icons.monitor_weight_outlined),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _input('Boy (cm)', _boyController, sayi: true)),
            const SizedBox(width: 8),
            Expanded(child: _input('Kilo (kg)', _kiloController, sayi: true)),
            const SizedBox(width: 8),
            Expanded(child: _input('Yaş', _yasController, sayi: true)),
          ]),
          const SizedBox(height: 20),
          _bolum('Cinsiyet', Icons.wc_outlined),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _secim('Erkek', _cinsiyet == 'Erkek', () => setState(() { _cinsiyet = 'Erkek'; }))),
            const SizedBox(width: 8),
            Expanded(child: _secim('Kadın', _cinsiyet == 'Kadın', () => setState(() { _cinsiyet = 'Kadın'; }))),
          ]),
          const SizedBox(height: 20),
          _bolum('Aktivite Seviyesi', Icons.directions_run_outlined),
          const SizedBox(height: 12),
          ..._aktiflikler.map((a) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              onTap: () => setState(() { _aktiflik = a['value']!; }),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: _aktiflik == a['value'] ? const Color(0xFFE8313F).withOpacity(0.1) : const Color(0xFF1A1A1A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: _aktiflik == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF333333)),
                ),
                child: Row(children: [
                  Icon(_aktiflik == a['value'] ? Icons.radio_button_checked : Icons.radio_button_off, color: _aktiflik == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF888888), size: 18),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(a['label']!, style: TextStyle(color: _aktiflik == a['value'] ? const Color(0xFFE8313F) : Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                    Text(a['aciklama']!, style: const TextStyle(color: Color(0xFF888888), fontSize: 11)),
                  ])),
                ]),
              ),
            ),
          )),
          const SizedBox(height: 20),
          _bolum('Hedef', Icons.flag_outlined),
          const SizedBox(height: 12),
          Row(children: _hedefler.map((h) => Expanded(child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() { _hedef = h['value']!; }),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _hedef == h['value'] ? const Color(0xFFE8313F) : const Color(0xFF1A1A1A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: _hedef == h['value'] ? const Color(0xFFE8313F) : const Color(0xFF333333)),
                ),
                child: Column(children: [
                  Text(h['emoji']!, style: const TextStyle(fontSize: 20)),
                  const SizedBox(height: 4),
                  Text(h['label']!, style: TextStyle(color: _hedef == h['value'] ? Colors.white : const Color(0xFF888888), fontSize: 12, fontWeight: FontWeight.w600)),
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
                color: _mesaj.contains('başarısız') ? const Color(0xFFE8313F).withOpacity(0.1) : const Color(0xFF4CAF50).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _mesaj.contains('başarısız') ? const Color(0xFFE8313F) : const Color(0xFF4CAF50)),
              ),
              child: Text(_mesaj, style: TextStyle(color: _mesaj.contains('başarısız') ? const Color(0xFFE8313F) : const Color(0xFF4CAF50), fontSize: 13, fontWeight: FontWeight.w600)),
            ),
          SizedBox(
            width: double.infinity, height: 52,
            child: ElevatedButton.icon(
              onPressed: _kaydediliyor ? null : _kaydet,
              icon: _kaydediliyor ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.save_outlined, color: Colors.white),
              label: Text(_kaydediliyor ? 'Kaydediliyor...' : 'Kaydet', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _bolum(String baslik, IconData ikon) {
    return Row(children: [
      Icon(ikon, color: const Color(0xFFE8313F), size: 18),
      const SizedBox(width: 8),
      Text(baslik, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
    ]);
  }

  Widget _input(String label, TextEditingController controller, {bool sayi = false}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
      const SizedBox(height: 4),
      TextField(
        controller: controller,
        keyboardType: sayi ? TextInputType.number : TextInputType.text,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          filled: true, fillColor: const Color(0xFF1A1A1A),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE8313F))),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
      ),
    ]);
  }

  Widget _secim(String label, bool secili, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: secili ? const Color(0xFFE8313F) : const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: secili ? const Color(0xFFE8313F) : const Color(0xFF333333)),
        ),
        child: Center(child: Text(label, style: TextStyle(color: secili ? Colors.white : const Color(0xFF888888), fontSize: 13, fontWeight: FontWeight.w600))),
      ),
    );
  }
}