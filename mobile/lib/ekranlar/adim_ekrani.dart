import 'package:flutter/material.dart';
import 'package:pedometer/pedometer.dart';
import 'package:permission_handler/permission_handler.dart';
import '../servisler/api_servisi.dart';

class AdimEkrani extends StatefulWidget {
  const AdimEkrani({super.key});

  @override
  State<AdimEkrani> createState() => _AdimEkraniState();
}

class _AdimEkraniState extends State<AdimEkrani> {
  final _adimController = TextEditingController();
  String _aktivite = '';
  List _kayitlar = [];
  bool _yukleniyor = false;
  String _hata = '';
  int _saglikAdim = 0;
  bool _saglikYukleniyor = false;

  final List<Map<String, String>> _aktiviteler = [
    {'value': 'yuruyus', 'label': 'Yürüyüş'},
    {'value': 'tempolu_yuruyus', 'label': 'Tempolu Yürüyüş'},
    {'value': 'kosu', 'label': 'Koşu'},
    {'value': 'tempolu_kosu', 'label': 'Tempolu Koşu'},
  ];

  @override
  void initState() {
    super.initState();
    _yukle();
    _saglikAdimAl();
  }

  Future<void> _saglikAdimAl() async {
    setState(() { _saglikYukleniyor = true; });
    try {
      final izin = await Permission.activityRecognition.request();
      if (!izin.isGranted) {
        setState(() { _saglikYukleniyor = false; });
        return;
      }
      Pedometer.stepCountStream.listen((event) {
        setState(() { _saglikAdim = event.steps; });
      });
    } catch (e) {
      setState(() { _saglikAdim = 0; });
    } finally {
      setState(() { _saglikYukleniyor = false; });
    }
  }

  Future<void> _yukle() async {
    final veri = await ApiServisi.getJson('/api/steps');
    setState(() { _kayitlar = veri is List ? veri : []; });
  }

  Future<void> _ekle() async {
    if (_adimController.text.isEmpty || _aktivite.isEmpty) {
      setState(() { _hata = 'Lütfen tüm alanları doldurun.'; });
      return;
    }
    setState(() { _yukleniyor = true; _hata = ''; });
    try {
      await ApiServisi.postJson('/api/steps', {
        'adim_sayisi': int.parse(_adimController.text),
        'aktivite_tipi': _aktivite,
      });
      _adimController.clear();
      setState(() { _aktivite = ''; });
      await _yukle();
    } catch (e) {
      setState(() { _hata = 'Kayıt eklenemedi.'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  Future<void> _sagliktatanEkle() async {
    if (_saglikAdim <= 0 || _aktivite.isEmpty) {
      setState(() { _hata = 'Önce aktivite tipi seçin.'; });
      return;
    }
    setState(() { _yukleniyor = true; _hata = ''; });
    try {
      await ApiServisi.postJson('/api/steps', {
        'adim_sayisi': _saglikAdim,
        'aktivite_tipi': _aktivite,
      });
      await _yukle();
    } catch (e) {
      setState(() { _hata = 'Kayıt eklenemedi.'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bugun = DateTime.now();
    final bugunKayitlar = _kayitlar.where((k) {
      final t = DateTime.tryParse(k['tarih'] ?? '');
      return t != null && t.year == bugun.year && t.month == bugun.month && t.day == bugun.day;
    }).toList();
    final toplamAdim = bugunKayitlar.fold<int>(0, (s, k) => s + (k['adim_sayisi'] as int? ?? 0));
    final toplamKalori = bugunKayitlar.fold<double>(0, (s, k) => s + (k['yakilan_kalori'] as num? ?? 0));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Adım Sayacı', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: _ozet('Bugünkü Adım', '$toplamAdim', Icons.directions_walk_outlined)),
            const SizedBox(width: 12),
            Expanded(child: _ozet('Yakılan Kalori', '${toplamKalori.round()} kcal', Icons.local_fire_department_outlined)),
          ]),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.4)),
            ),
            child: Row(children: [
              const Icon(Icons.health_and_safety_outlined, color: Color(0xFF3B82F6), size: 24),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Telefon Adım Sayacı', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                _saglikYukleniyor
                    ? const Text('İzin isteniyor...', style: TextStyle(color: Color(0xFF888888), fontSize: 12))
                    : Text('Anlık: $_saglikAdim adım', style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 13)),
              ])),
            ]),
          ),
          if (_saglikAdim > 0) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF333333))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Aktivite Tipi Seç ve Kaydet', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8, runSpacing: 6,
                  children: _aktiviteler.map((a) => GestureDetector(
                    onTap: () => setState(() { _aktivite = a['value']!; }),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _aktivite == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF0F0F0F),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: _aktivite == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF333333)),
                      ),
                      child: Text(a['label']!, style: TextStyle(color: _aktivite == a['value'] ? Colors.white : const Color(0xFF888888), fontSize: 12)),
                    ),
                  )).toList(),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity, height: 42,
                  child: ElevatedButton(
                    onPressed: _yukleniyor ? null : _sagliktatanEkle,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                    child: Text('$_saglikAdim Adımı Kaydet', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                  ),
                ),
              ]),
            ),
          ],
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Manuel Adım Ekle', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              const Text('Adım Sayısı', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
              const SizedBox(height: 6),
              TextField(
                controller: _adimController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDeko('Örn: 5000'),
              ),
              const SizedBox(height: 12),
              const Text('Aktivite Tipi', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: _aktiviteler.map((a) => GestureDetector(
                  onTap: () => setState(() { _aktivite = a['value']!; }),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: _aktivite == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF0F0F0F),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _aktivite == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF333333)),
                    ),
                    child: Text(a['label']!, style: TextStyle(color: _aktivite == a['value'] ? Colors.white : const Color(0xFF888888), fontSize: 13)),
                  ),
                )).toList(),
              ),
              if (_hata.isNotEmpty) ...[const SizedBox(height: 8), Text(_hata, style: const TextStyle(color: Color(0xFFE8313F), fontSize: 13))],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity, height: 48,
                child: ElevatedButton(
                  onPressed: _yukleniyor ? null : _ekle,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: _yukleniyor ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Ekle', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 16),
          if (_kayitlar.isNotEmpty) ...[
            const Text('Geçmiş Kayıtlar', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            ..._kayitlar.take(20).map((k) {
              final t = DateTime.tryParse(k['tarih'] ?? '');
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF333333))),
                child: Row(children: [
                  const Icon(Icons.directions_walk_outlined, color: Color(0xFFE8313F), size: 20),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('${k['adim_sayisi']} adım', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                    Text('${(k['yakilan_kalori'] as num?)?.round()} kcal • ${k['aktivite_tipi']}', style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
                  ])),
                  if (t != null) Text('${t.day}.${t.month}.${t.year}', style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
                ]),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _ozet(String baslik, String deger, IconData ikon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(ikon, color: const Color(0xFFE8313F), size: 18),
        const SizedBox(height: 8),
        Text(deger, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
        Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 11)),
      ]),
    );
  }

  InputDecoration _inputDeko(String hint) {
    return InputDecoration(
      hintText: hint, hintStyle: const TextStyle(color: Color(0xFF555555)),
      filled: true, fillColor: const Color(0xFF0F0F0F),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE8313F))),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }
}