import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';

class DefterEkrani extends StatefulWidget {
  const DefterEkrani({super.key});

  @override
  State<DefterEkrani> createState() => _DefterEkraniState();
}

class _DefterEkraniState extends State<DefterEkrani> {
  DateTime _seciliTarih = DateTime.now();
  List<Map<String, dynamic>> _satirlar = [_bosKayit()];
  List<String> _kayitliTarihler = [];
  bool _kaydediliyor = false;
  String _kaydedildiMesaj = '';
  String _aiAnaliz = '';
  bool _aiYukleniyor = false;
  bool _tarihlerAcik = false;

  static Map<String, dynamic> _bosKayit() => {
    'hareket': '', 'set_sayisi': '', 'tekrar_sayisi': '', 'agirlik': ''
  };

  String get _tarihStr =>
      '${_seciliTarih.year}-${_seciliTarih.month.toString().padLeft(2, '0')}-${_seciliTarih.day.toString().padLeft(2, '0')}';

  @override
  void initState() {
    super.initState();
    _tarihleriYukle();
    _yukle();
  }

  Future<void> _tarihleriYukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/workout-notes/dates');
      setState(() {
        _kayitliTarihler = veri is List ? List<String>.from(veri) : [];
      });
    } catch (_) {}
  }

  Future<void> _yukle() async {
    try {
      debugPrint('YUKLE: $_tarihStr');
      final veri = await ApiServisi.getJson('/api/workout-notes/$_tarihStr');
      debugPrint('VERI: $veri');
      if (veri is List && veri.isNotEmpty) {
        setState(() {
          _satirlar = veri.map<Map<String, dynamic>>((r) => {
            'hareket': r['hareket'] ?? '',
            'set_sayisi': '${r['set_sayisi'] ?? ''}',
            'tekrar_sayisi': '${r['tekrar_sayisi'] ?? ''}',
            'agirlik': '${r['agirlik'] ?? ''}',
          }).toList();
          _kaydedildiMesaj = '';
          _aiAnaliz = '';
        });
      } else {
        setState(() {
          _satirlar = [_bosKayit()];
          _kaydedildiMesaj = '';
          _aiAnaliz = '';
        });
      }
    } catch (_) {
      setState(() { _satirlar = [_bosKayit()]; });
    }
  }

  Future<void> _kaydet() async {
    setState(() { _kaydediliyor = true; _kaydedildiMesaj = ''; });
    try {
      final kayitlar = _satirlar
          .where((r) => (r['hareket'] as String).isNotEmpty)
          .map((r) => {
                'hareket': r['hareket'],
                'set_sayisi': int.tryParse(r['set_sayisi'] ?? '') ?? 0,
                'tekrar_sayisi': int.tryParse(r['tekrar_sayisi'] ?? '') ?? 0,
                'agirlik': double.tryParse(r['agirlik'] ?? ''),
              })
          .toList();
      await ApiServisi.putJson('/api/workout-notes/$_tarihStr', kayitlar);
      setState(() { _kaydedildiMesaj = 'Kaydedildi!'; });
      await _tarihleriYukle();
    } catch (e) {
      debugPrint('KAYIT HATA: $e');
      setState(() { _kaydedildiMesaj = 'Kayıt başarısız: $e'; });
    }
    finally {
      setState(() { _kaydediliyor = false; });
    }
  }

  Future<void> _aiAnalizAl() async {
    final kayitlilar = _satirlar
        .where((r) => (r['hareket'] as String).isNotEmpty && (r['agirlik'] as String).isNotEmpty)
        .toList();
    if (kayitlilar.isEmpty) return;
    setState(() { _aiYukleniyor = true; _aiAnaliz = ''; });
    final gruplar = <String, List<double>>{};
    for (final r in kayitlilar) {
      final h = r['hareket'] as String;
      final a = double.tryParse(r['agirlik'] as String);
      if (a != null) gruplar[h] = [...(gruplar[h] ?? []), a];
    }
    final hareketler = gruplar.entries.map((e) => {'hareket': e.key, 'agirliklar': e.value}).toList();
    try {
      final yanit = await ApiServisi.postJson('/api/yerel-ai/defter-analizi', {'hareketler': hareketler});
      setState(() { _aiAnaliz = yanit['yorum'] ?? ''; });
    } catch (_) {
      setState(() { _aiAnaliz = 'AI analizi alınamadı.'; });
    } finally {
      setState(() { _aiYukleniyor = false; });
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
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Antrenman Defteri', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          _tarihSatiri(),
          if (_tarihlerAcik) _kayitliTarihlerListesi(),
          const SizedBox(height: 16),
          _tablo(),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => setState(() { _satirlar.add(_bosKayit()); }),
                icon: const Icon(Icons.add, color: Color(0xFFE8313F), size: 18),
                label: const Text('Satır Ekle', style: TextStyle(color: Color(0xFFE8313F))),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFFE8313F)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _kaydediliyor ? null : _kaydet,
                icon: const Icon(Icons.save_outlined, size: 18, color: Colors.white),
                label: Text(_kaydediliyor ? 'Kaydediliyor...' : 'Kaydet', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              ),
            ),
          ]),
          if (_kaydedildiMesaj.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(_kaydedildiMesaj, style: TextStyle(color: _kaydedildiMesaj.contains('başarısız') ? const Color(0xFFE8313F) : const Color(0xFF4CAF50), fontSize: 13)),
          ],
          const SizedBox(height: 16),
          _aiKarti(),
        ],
      ),
    );
  }

  Widget _tarihSatiri() {
    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () async {
              final secilen = await showDatePicker(
                context: context,
                initialDate: _seciliTarih,
                firstDate: DateTime(2020),
                lastDate: DateTime.now(),
                builder: (ctx, child) => Theme(
                  data: ThemeData.dark().copyWith(colorScheme: const ColorScheme.dark(primary: Color(0xFFE8313F))),
                  child: child!,
                ),
              );
              if (secilen != null) {
                setState(() { _seciliTarih = secilen; _tarihlerAcik = false; });
                _yukle();
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF333333))),
              child: Row(children: [
                const Icon(Icons.calendar_today_outlined, color: Color(0xFFE8313F), size: 18),
                const SizedBox(width: 10),
                Text('${_seciliTarih.day}.${_seciliTarih.month}.${_seciliTarih.year}', style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                const Spacer(),
                const Icon(Icons.expand_more, color: Color(0xFF888888)),
              ]),
            ),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () => setState(() { _tarihlerAcik = !_tarihlerAcik; }),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: _tarihlerAcik ? const Color(0xFFE8313F).withOpacity(0.15) : const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _tarihlerAcik ? const Color(0xFFE8313F) : const Color(0xFF333333)),
            ),
            child: Row(children: [
              Icon(Icons.history_outlined, color: _tarihlerAcik ? const Color(0xFFE8313F) : const Color(0xFF888888), size: 18),
              const SizedBox(width: 6),
              Text('Kayıtlar', style: TextStyle(color: _tarihlerAcik ? const Color(0xFFE8313F) : const Color(0xFF888888), fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(width: 4),
              Icon(_tarihlerAcik ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: _tarihlerAcik ? const Color(0xFFE8313F) : const Color(0xFF888888), size: 16),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _kayitliTarihlerListesi() {
    if (_kayitliTarihler.isEmpty) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF333333))),
        child: const Text('Henüz kayıtlı antrenman yok.', style: TextStyle(color: Color(0xFF888888), fontSize: 13), textAlign: TextAlign.center),
      );
    }

    return Container(
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF333333))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text('Kayıtlı Tarihler (${_kayitliTarihler.length})', style: const TextStyle(color: Color(0xFF888888), fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          const Divider(color: Color(0xFF333333), height: 1),
          ...(_kayitliTarihler.take(10).map((tarih) {
            final secili = tarih == _tarihStr;
            return GestureDetector(
              onTap: () {
                final t = DateTime.tryParse(tarih);
                if (t != null) {
                  setState(() { _seciliTarih = t; _tarihlerAcik = false; });
                  _yukle();
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: secili ? const Color(0xFFE8313F).withOpacity(0.1) : Colors.transparent,
                  border: Border(bottom: BorderSide(color: const Color(0xFF333333), width: 0.5)),
                ),
                child: Row(children: [
                  Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(color: secili ? const Color(0xFFE8313F) : const Color(0xFF4CAF50), shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 12),
                  Text(_tarihGoster(tarih), style: TextStyle(color: secili ? const Color(0xFFE8313F) : Colors.white, fontSize: 14, fontWeight: secili ? FontWeight.w700 : FontWeight.normal)),
                  if (secili) ...[
                    const Spacer(),
                    const Icon(Icons.check, color: Color(0xFFE8313F), size: 16),
                  ],
                ]),
              ),
            );
          })),
          if (_kayitliTarihler.length > 10)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text('+ ${_kayitliTarihler.length - 10} daha...', style: const TextStyle(color: Color(0xFF888888), fontSize: 12), textAlign: TextAlign.center),
            ),
        ],
      ),
    );
  }

  Widget _tablo() {
    return Container(
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: const BoxDecoration(color: Color(0xFF0F0F0F), borderRadius: BorderRadius.vertical(top: Radius.circular(14))),
          child: const Row(children: [
            Expanded(flex: 3, child: Text('Hareket', style: TextStyle(color: Color(0xFF888888), fontSize: 12))),
            Expanded(child: Text('Set', style: TextStyle(color: Color(0xFF888888), fontSize: 12), textAlign: TextAlign.center)),
            Expanded(child: Text('Tek.', style: TextStyle(color: Color(0xFF888888), fontSize: 12), textAlign: TextAlign.center)),
            Expanded(child: Text('Ağırlık', style: TextStyle(color: Color(0xFF888888), fontSize: 12), textAlign: TextAlign.center)),
            SizedBox(width: 32),
          ]),
        ),
        ...List.generate(_satirlar.length, (i) => _satir(i)),
      ]),
    );
  }

  Widget _satir(int i) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(children: [
        Expanded(flex: 3, child: _input(_satirlar[i]['hareket'] ?? '', (v) => _satirlar[i]['hareket'] = v, 'Hareket adı')),
        const SizedBox(width: 4),
        Expanded(child: _input(_satirlar[i]['set_sayisi'] ?? '', (v) => _satirlar[i]['set_sayisi'] = v, '0', sayi: true)),
        const SizedBox(width: 4),
        Expanded(child: _input(_satirlar[i]['tekrar_sayisi'] ?? '', (v) => _satirlar[i]['tekrar_sayisi'] = v, '0', sayi: true)),
        const SizedBox(width: 4),
        Expanded(child: _input(_satirlar[i]['agirlik'] ?? '', (v) => _satirlar[i]['agirlik'] = v, '0', sayi: true)),
        IconButton(
          icon: const Icon(Icons.close, color: Color(0xFF666666), size: 18),
          onPressed: _satirlar.length <= 1 ? null : () => setState(() { _satirlar.removeAt(i); }),
        ),
      ]),
    );
  }

  Widget _input(String val, void Function(String) onChange, String hint, {bool sayi = false}) {
    return TextFormField(
      initialValue: val,
      keyboardType: sayi ? TextInputType.number : TextInputType.text,
      style: const TextStyle(color: Colors.white, fontSize: 12),
      textAlign: sayi ? TextAlign.center : TextAlign.start,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF555555), fontSize: 12),
        filled: true,
        fillColor: const Color(0xFF0F0F0F),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF333333))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF333333))),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      ),
      onChanged: (v) { setState(() { onChange(v); }); },
    );
  }

  Widget _aiKarti() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.auto_awesome, color: Color(0xFFE8313F), size: 18),
          SizedBox(width: 8),
          Text('AI İlerleme Analizi', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 12),
        if (_aiAnaliz.isEmpty)
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: _aiYukleniyor ? null : _aiAnalizAl,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              child: _aiYukleniyor
                  ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                  : const Text('AI ile Analiz Et', style: TextStyle(color: Colors.white)),
            ),
          )
        else
          Text(_aiAnaliz, style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.6)),
      ]),
    );
  }
}