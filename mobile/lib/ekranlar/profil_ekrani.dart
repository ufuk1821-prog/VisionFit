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
  String _mesaj = '';

  final List<Map<String, String>> _aktiflikler = [
    {'value': 'sedanter', 'label': 'Hareketsiz'},
    {'value': 'az_hareketli', 'label': 'Az Hareketli'},
    {'value': 'orta_hareketli', 'label': 'Orta Hareketli'},
    {'value': 'cok_hareketli', 'label': 'Çok Hareketli'},
    {'value': 'asiri_hareketli', 'label': 'Aşırı Hareketli'},
  ];

  final List<Map<String, String>> _hedefler = [
    {'value': 'kilo_verme', 'label': 'Kilo Verme'},
    {'value': 'kilo_koruma', 'label': 'Kilo Koruma'},
    {'value': 'kilo_alma', 'label': 'Kilo Alma'},
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
    } catch (e) {
      setState(() { _yukleniyor = false; });
    }
  }

  Future<void> _kaydet() async {
    setState(() { _mesaj = ''; });
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
      setState(() { _mesaj = 'Profil güncellendi!'; });
    } catch (e) {
      setState(() { _mesaj = 'Güncelleme başarısız.'; });
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
          const SizedBox(height: 16),
          _input('Ad', _adController),
          const SizedBox(height: 12),
          _input('Soyad', _soyadController),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _input('Boy (cm)', _boyController, sayi: true)),
            const SizedBox(width: 12),
            Expanded(child: _input('Kilo (kg)', _kiloController, sayi: true)),
            const SizedBox(width: 12),
            Expanded(child: _input('Yaş', _yasController, sayi: true)),
          ]),
          const SizedBox(height: 12),
          const Text('Cinsiyet', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 6),
          Row(children: [
            Expanded(child: _secim('Erkek', _cinsiyet == 'Erkek', () => setState(() { _cinsiyet = 'Erkek'; }))),
            const SizedBox(width: 8),
            Expanded(child: _secim('Kadın', _cinsiyet == 'Kadın', () => setState(() { _cinsiyet = 'Kadın'; }))),
          ]),
          const SizedBox(height: 12),
          const Text('Aktivite Seviyesi', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 6),
          ..._aktiflikler.map((a) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: _secim(a['label']!, _aktiflik == a['value'], () => setState(() { _aktiflik = a['value']!; }), tam: true),
          )),
          const SizedBox(height: 8),
          const Text('Hedef', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 6),
          Row(children: _hedefler.map((h) => Expanded(child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _secim(h['label']!, _hedef == h['value'], () => setState(() { _hedef = h['value']!; })),
          ))).toList()),
          const SizedBox(height: 20),
          if (_mesaj.isNotEmpty) ...[
            Text(_mesaj, style: TextStyle(color: _mesaj.contains('başarısız') ? const Color(0xFFE8313F) : const Color(0xFF4CAF50), fontSize: 13)),
            const SizedBox(height: 8),
          ],
          SizedBox(
            width: double.infinity, height: 48,
            child: ElevatedButton(
              onPressed: _kaydet,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('Kaydet', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _input(String label, TextEditingController controller, {bool sayi = false}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
      const SizedBox(height: 6),
      TextField(controller: controller, keyboardType: sayi ? TextInputType.number : TextInputType.text, style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          filled: true, fillColor: const Color(0xFF1A1A1A),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE8313F))),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        )),
    ]);
  }

  Widget _secim(String label, bool secili, VoidCallback onTap, {bool tam = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: tam ? double.infinity : null,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: secili ? const Color(0xFFE8313F) : const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: secili ? const Color(0xFFE8313F) : const Color(0xFF333333)),
        ),
        child: Center(child: Text(label, style: TextStyle(color: secili ? Colors.white : const Color(0xFF888888), fontSize: 13, fontWeight: secili ? FontWeight.w600 : FontWeight.normal))),
      ),
    );
  }
}