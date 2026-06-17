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
  String _seciliTarih = '';

  final List<Map<String, String>> _aktiviteler = [
    {'value': 'yuruyus', 'label': 'Yürüyüş'},
    {'value': 'tempolu_yuruyus', 'label': 'Tempolu Yürüyüş'},
    {'value': 'kosu', 'label': 'Koşu'},
    {'value': 'tempolu_kosu', 'label': 'Tempolu Koşu'},
  ];

  @override
  void initState() {
    super.initState();
    final bugun = DateTime.now();
    _seciliTarih = '${bugun.year}-${bugun.month.toString().padLeft(2, '0')}-${bugun.day.toString().padLeft(2, '0')}';
    _yukle();
    _saglikAdimAl();
  }

  Future<void> _saglikAdimAl() async {
    setState(() { _saglikYukleniyor = true; });
    try {
      final izin = await Permission.activityRecognition.request();
      if (!izin.isGranted) { setState(() { _saglikYukleniyor = false; }); return; }
      Pedometer.stepCountStream.listen((event) {
        if (mounted) setState(() { _saglikAdim = event.steps; });
      });
    } catch (_) {
      setState(() { _saglikAdim = 0; });
    } finally {
      setState(() { _saglikYukleniyor = false; });
    }
  }

  Future<void> _yukle() async {
    final veri = await ApiServisi.getJson('/api/steps');
    setState(() { _kayitlar = veri is List ? veri : []; });
  }

  List _gunKayitlari(String tarih) {
    return _kayitlar.where((k) {
      final t = DateTime.tryParse(k['tarih'] ?? '');
      if (t == null) return false;
      final str = '${t.year}-${t.month.toString().padLeft(2, '0')}-${t.day.toString().padLeft(2, '0')}';
      return str == tarih;
    }).toList();
  }

  List<String> get _mevcutGunler {
    final gunler = <String>{};
    for (final k in _kayitlar) {
      final t = DateTime.tryParse(k['tarih'] ?? '');
      if (t != null) {
        gunler.add('${t.year}-${t.month.toString().padLeft(2, '0')}-${t.day.toString().padLeft(2, '0')}');
      }
    }
    final bugun = DateTime.now();
    gunler.add('${bugun.year}-${bugun.month.toString().padLeft(2, '0')}-${bugun.day.toString().padLeft(2, '0')}');
    final liste = gunler.toList()..sort((a, b) => b.compareTo(a));
    return liste;
  }

  Future<void> _ekle() async {
    if (_adimController.text.isEmpty || _aktivite.isEmpty) {
      setState(() { _hata = 'Lütfen tüm alanları doldurun.'; }); return;
    }
    setState(() { _yukleniyor = true; _hata = ''; });
    try {
      await ApiServisi.postJson('/api/steps', {'adim_sayisi': int.parse(_adimController.text), 'aktivite_tipi': _aktivite});
      _adimController.clear();
      setState(() { _aktivite = ''; });
      await _yukle();
    } catch (_) {
      setState(() { _hata = 'Kayıt eklenemedi.'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  Future<void> _sagliktatanEkle() async {
    if (_saglikAdim <= 0 || _aktivite.isEmpty) {
      setState(() { _hata = 'Önce aktivite tipi seçin.'; }); return;
    }
    setState(() { _yukleniyor = true; _hata = ''; });
    try {
      await ApiServisi.postJson('/api/steps', {'adim_sayisi': _saglikAdim, 'aktivite_tipi': _aktivite});
      await _yukle();
    } catch (_) {
      setState(() { _hata = 'Kayıt eklenemedi.'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  String _tarihGoster(String tarih) {
    final t = DateTime.tryParse(tarih);
    if (t == null) return tarih;
    final bugun = DateTime.now();
    final dun = bugun.subtract(const Duration(days: 1));
    if (t.year == bugun.year && t.month == bugun.month && t.day == bugun.day) return 'Bugün';
    if (t.year == dun.year && t.month == dun.month && t.day == dun.day) return 'Dün';
    return '${t.day}.${t.month}.${t.year}';
  }

  @override
  Widget build(BuildContext context) {
    final seciliKayitlar = _gunKayitlari(_seciliTarih);
    final toplamAdim = seciliKayitlar.fold<int>(0, (s, k) => s + (k['adim_sayisi'] as int? ?? 0));
    final toplamKalori = seciliKayitlar.fold<double>(0, (s, k) => s + (k['yakilan_kalori'] as num? ?? 0));

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _tarihPaneli(),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Adım Sayacı', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: _ozet('Adım', '$toplamAdim', Icons.directions_walk_outlined)),
                  const SizedBox(width: 8),
                  Expanded(child: _ozet('Kalori', '${toplamKalori.round()}', Icons.local_fire_department_outlined)),
                ]),
                const SizedBox(height: 12),
                _saglikKarti(),
                if (_saglikAdim > 0) ...[
                  const SizedBox(height: 8),
                  _saglikKaydetKarti(),
                ],
                const SizedBox(height: 12),
                _ekleFormu(),
                const SizedBox(height: 16),
                if (seciliKayitlar.isEmpty)
                  Center(child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      const Icon(Icons.directions_walk_outlined, color: Color(0xFF444444), size: 48),
                      const SizedBox(height: 12),
                      Text('${_tarihGoster(_seciliTarih)} için kayıt yok', style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      const Text('Yukarıdaki formdan adım sayını ekleyerek takibe başla.', style: TextStyle(color: Color(0xFF888888), fontSize: 13), textAlign: TextAlign.center),
                    ]),
                  ))
                else ...[
                  Text('${_tarihGoster(_seciliTarih)} Kayıtları', style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  ...seciliKayitlar.map((k) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF333333))),
                    child: Row(children: [
                      const Icon(Icons.directions_walk_outlined, color: Color(0xFFE8313F), size: 18),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('${k['adim_sayisi']} adım', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                        Text('${(k['yakilan_kalori'] as num?)?.round()} kcal • ${k['aktivite_tipi']}', style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
                      ])),
                    ]),
                  )),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _tarihPaneli() {
    return Container(
      width: 80,
      color: const Color(0xFF1A1A1A),
      child: ListView(
        children: _mevcutGunler.map((tarih) {
          final secili = _seciliTarih == tarih;
          final t = DateTime.tryParse(tarih);
          return GestureDetector(
            onTap: () => setState(() { _seciliTarih = tarih; }),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
              decoration: BoxDecoration(
                color: secili ? const Color(0xFFE8313F).withOpacity(0.15) : Colors.transparent,
                border: Border(left: BorderSide(color: secili ? const Color(0xFFE8313F) : Colors.transparent, width: 3)),
              ),
              child: Column(children: [
                Text(t != null ? _ayKisa(t.month) : '', style: TextStyle(color: secili ? const Color(0xFFE8313F) : const Color(0xFF888888), fontSize: 10)),
                Text(t != null ? '${t.day}' : '', style: TextStyle(color: secili ? const Color(0xFFE8313F) : Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                if (_gunKayitlari(tarih).isNotEmpty)
                  Container(width: 6, height: 6, margin: const EdgeInsets.only(top: 3), decoration: const BoxDecoration(color: Color(0xFFE8313F), shape: BoxShape.circle)),
              ]),
            ),
          );
        }).toList(),
      ),
    );
  }

  String _ayKisa(int ay) {
    const aylar = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return aylar[ay];
  }

  Widget _saglikKarti() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.4))),
      child: Row(children: [
        const Icon(Icons.health_and_safety_outlined, color: Color(0xFF3B82F6), size: 20),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Telefon Adım Sayacı', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
          _saglikYukleniyor
              ? const Text('İzin isteniyor...', style: TextStyle(color: Color(0xFF888888), fontSize: 11))
              : Text('Anlık: $_saglikAdim adım', style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 12)),
        ])),
      ]),
    );
  }

  Widget _saglikKaydetKarti() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Aktivite Seç ve Kaydet', style: TextStyle(color: Color(0xFF888888), fontSize: 12)),
        const SizedBox(height: 6),
        Wrap(spacing: 6, runSpacing: 4, children: _aktiviteler.map((a) => GestureDetector(
          onTap: () => setState(() { _aktivite = a['value']!; }),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: _aktivite == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF0F0F0F), borderRadius: BorderRadius.circular(12), border: Border.all(color: _aktivite == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF333333))),
            child: Text(a['label']!, style: TextStyle(color: _aktivite == a['value'] ? Colors.white : const Color(0xFF888888), fontSize: 11)),
          ),
        )).toList()),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity, height: 38,
          child: ElevatedButton(
            onPressed: _yukleniyor ? null : _sagliktatanEkle,
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            child: Text('$_saglikAdim adımı kaydet', style: const TextStyle(color: Colors.white, fontSize: 13)),
          ),
        ),
      ]),
    );
  }

  Widget _ekleFormu() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Manuel Adım Ekle', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
        const SizedBox(height: 10),
        TextField(
          controller: _adimController,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Adım sayısı',
            hintStyle: const TextStyle(color: Color(0xFF555555)),
            filled: true, fillColor: const Color(0xFF0F0F0F),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF333333))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF333333))),
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(spacing: 6, runSpacing: 4, children: _aktiviteler.map((a) => GestureDetector(
          onTap: () => setState(() { _aktivite = a['value']!; }),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(color: _aktivite == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF0F0F0F), borderRadius: BorderRadius.circular(16), border: Border.all(color: _aktivite == a['value'] ? const Color(0xFFE8313F) : const Color(0xFF333333))),
            child: Text(a['label']!, style: TextStyle(color: _aktivite == a['value'] ? Colors.white : const Color(0xFF888888), fontSize: 12)),
          ),
        )).toList()),
        if (_hata.isNotEmpty) ...[const SizedBox(height: 6), Text(_hata, style: const TextStyle(color: Color(0xFFE8313F), fontSize: 12))],
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity, height: 42,
          child: ElevatedButton(
            onPressed: _yukleniyor ? null : _ekle,
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: _yukleniyor ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Ekle', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ),
      ]),
    );
  }

  Widget _ozet(String baslik, String deger, IconData ikon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(ikon, color: const Color(0xFFE8313F), size: 16),
        const SizedBox(height: 6),
        Text(deger, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
        Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 10)),
      ]),
    );
  }
}