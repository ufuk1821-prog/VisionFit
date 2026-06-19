import 'package:flutter/material.dart';
import '../tema.dart';
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
  int _yuklemeSayaci = 0;

  static Map<String, dynamic> _bosKayit() => {'hareket': '', 'set_sayisi': '', 'tekrar_sayisi': '', 'agirlik': ''};

  String get _tarihStr => '${_seciliTarih.year}-${_seciliTarih.month.toString().padLeft(2, '0')}-${_seciliTarih.day.toString().padLeft(2, '0')}';

  @override
  void initState() { super.initState(); _tarihleriYukle(); _yukle(); }

  Future<void> _tarihleriYukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/workout-notes/dates');
      setState(() { _kayitliTarihler = veri is List ? List<String>.from(veri) : []; });
    } catch (_) {}
  }

  Future<void> _yukle() async {
    setState(() { _satirlar = [_bosKayit()]; });
    try {
      final veri = await ApiServisi.getJson('/api/workout-notes/$_tarihStr');
      if (veri is List && veri.isNotEmpty) {
        setState(() {
          _satirlar = veri.map<Map<String, dynamic>>((r) => {
            'hareket': r['hareket'] ?? '', 'set_sayisi': '${r['set_sayisi'] ?? ''}',
            'tekrar_sayisi': '${r['tekrar_sayisi'] ?? ''}', 'agirlik': '${r['agirlik'] ?? ''}',
          }).toList();
          _kaydedildiMesaj = ''; _aiAnaliz = ''; _yuklemeSayaci++;
        });
      } else {
        setState(() { _satirlar = [_bosKayit()]; _kaydedildiMesaj = ''; _aiAnaliz = ''; _yuklemeSayaci++; });
      }
    } catch (_) { setState(() { _satirlar = [_bosKayit()]; _yuklemeSayaci++; }); }
  }

  Future<void> _kaydet() async {
    setState(() { _kaydediliyor = true; _kaydedildiMesaj = ''; });
    try {
      final kayitlar = _satirlar.where((r) => (r['hareket'] as String).isNotEmpty).map((r) => {
        'hareket': r['hareket'], 'set_sayisi': int.tryParse(r['set_sayisi'] ?? '') ?? 0,
        'tekrar_sayisi': int.tryParse(r['tekrar_sayisi'] ?? '') ?? 0, 'agirlik': double.tryParse(r['agirlik'] ?? ''),
      }).toList();
      await ApiServisi.putJson('/api/workout-notes/$_tarihStr', kayitlar);
      setState(() { _kaydedildiMesaj = 'ok'; });
      await _tarihleriYukle();
    } catch (_) {
      setState(() { _kaydedildiMesaj = 'hata'; });
    } finally {
      setState(() { _kaydediliyor = false; });
    }
  }

  Future<void> _aiAnalizAl() async {
    final kayitlilar = _satirlar.where((r) => (r['hareket'] as String).isNotEmpty && (r['agirlik'] as String).isNotEmpty).toList();
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
          Text('Antrenman Defteri', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('Antrenmanlarını kaydet ve AI ile analiz et.', style: kBody(context, size: 13, color: kHint(context))),
          const SizedBox(height: 16),
          _tarihSatiri(context),
          if (_tarihlerAcik) _kayitliTarihlerListesi(context),
          const SizedBox(height: 16),
          _tablo(context),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton.icon(
              onPressed: () => setState(() { _satirlar.add(_bosKayit()); }),
              icon: const Icon(Icons.add, color: kRed, size: 18),
              label: Text('SATIR EKLE', style: kLabel(context, size: 10, color: kRed)),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: kRed), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 12)),
            )),
            const SizedBox(width: 12),
            Expanded(child: ElevatedButton.icon(
              onPressed: _kaydediliyor ? null : _kaydet,
              icon: _kaydediliyor ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.save_outlined, size: 18, color: Colors.white),
              label: Text(_kaydediliyor ? 'KAYDEDİLİYOR...' : 'KAYDET', style: kLabel(context, size: 10, color: Colors.white)),
              style: ElevatedButton.styleFrom(backgroundColor: kRed, disabledBackgroundColor: kRed.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 12), elevation: 0),
            )),
          ]),
          if (_kaydedildiMesaj.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _kaydedildiMesaj == 'ok' ? kGreen.withOpacity(0.1) : kRed.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _kaydedildiMesaj == 'ok' ? kGreen.withOpacity(0.3) : kRed.withOpacity(0.3)),
              ),
              child: Row(children: [
                Icon(_kaydedildiMesaj == 'ok' ? Icons.check_circle_outline : Icons.warning_amber_outlined, color: _kaydedildiMesaj == 'ok' ? kGreen : kRed, size: 16),
                const SizedBox(width: 8),
                Text(_kaydedildiMesaj == 'ok' ? 'Kaydedildi!' : 'Kayıt başarısız.', style: kBody(context, size: 12, color: _kaydedildiMesaj == 'ok' ? kGreen : kRed)),
              ]),
            ),
          ],
          const SizedBox(height: 16),
          _aiKarti(context),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _tarihSatiri(BuildContext context) {
    return Row(children: [
      Expanded(child: GestureDetector(
        onTap: () async {
          final secilen = await showDatePicker(
            context: context, initialDate: _seciliTarih, firstDate: DateTime(2020), lastDate: DateTime.now(),
            builder: (ctx, child) => Theme(data: ThemeData.dark().copyWith(colorScheme: const ColorScheme.dark(primary: kRed)), child: child!),
          );
          if (secilen != null) { _seciliTarih = secilen; _tarihlerAcik = false; setState(() {}); _yukle(); }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorderAlt(context))),
          child: Row(children: [
            const Icon(Icons.calendar_today_outlined, color: kRed, size: 18),
            const SizedBox(width: 10),
            Text('${_seciliTarih.day}.${_seciliTarih.month}.${_seciliTarih.year}', style: kBody(context, size: 15, weight: FontWeight.w600, color: kText(context))),
            const Spacer(),
            Icon(Icons.expand_more, color: kHint(context), size: 20),
          ]),
        ),
      )),
      const SizedBox(width: 8),
      GestureDetector(
        onTap: () => setState(() { _tarihlerAcik = !_tarihlerAcik; }),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: _tarihlerAcik ? kRed.withOpacity(0.1) : kSurfaceLow(context),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: _tarihlerAcik ? kRed : kBorder(context)),
          ),
          child: Row(children: [
            Icon(Icons.history_outlined, color: _tarihlerAcik ? kRed : kHint(context), size: 18),
            const SizedBox(width: 6),
            Text('KAYITLAR', style: kLabel(context, size: 10, color: _tarihlerAcik ? kRed : kHint(context))),
            const SizedBox(width: 4),
            Icon(_tarihlerAcik ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: _tarihlerAcik ? kRed : kHint(context), size: 16),
          ]),
        ),
      ),
    ]);
  }

  Widget _kayitliTarihlerListesi(BuildContext context) {
    if (_kayitliTarihler.isEmpty) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder(context))),
        child: Center(child: Text('Henüz kayıtlı antrenman yok.', style: kBody(context, size: 13, color: kHint(context)))),
      );
    }
    return Container(
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder(context))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 8), child: Text('KAYITLI TARİHLER (${_kayitliTarihler.length})', style: kLabel(context))),
        Container(height: 1, color: kBorder(context)),
        ..._kayitliTarihler.take(10).map((tarih) {
          final secili = tarih == _tarihStr;
          return GestureDetector(
            onTap: () {
              final t = DateTime.tryParse(tarih);
              if (t != null) { _seciliTarih = t; _tarihlerAcik = false; setState(() {}); _yukle(); }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(color: secili ? kRed.withOpacity(0.08) : Colors.transparent, border: Border(bottom: BorderSide(color: kBorder(context), width: 0.5))),
              child: Row(children: [
                Container(width: 8, height: 8, decoration: BoxDecoration(color: secili ? kRed : kGreen, shape: BoxShape.circle)),
                const SizedBox(width: 12),
                Text(_tarihGoster(tarih), style: kBody(context, size: 14, weight: secili ? FontWeight.w700 : FontWeight.w400, color: secili ? kRed : kText(context))),
                if (secili) ...[const Spacer(), const Icon(Icons.check, color: kRed, size: 16)],
              ]),
            ),
          );
        }),
        if (_kayitliTarihler.length > 10)
          Padding(padding: const EdgeInsets.all(12), child: Center(child: Text('+ ${_kayitliTarihler.length - 10} daha...', style: kBody(context, size: 12, color: kHint(context))))),
      ]),
    );
  }

  Widget _tablo(BuildContext context) {
    return Container(
      key: ValueKey('$_tarihStr-$_yuklemeSayaci'),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorderAlt(context))),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(color: kSurfaceLowest(context), borderRadius: const BorderRadius.vertical(top: Radius.circular(12))),
          child: Row(children: [
            Expanded(flex: 3, child: Text('HAREKET', style: kLabel(context))),
            Expanded(child: Text('SET', style: kLabel(context), textAlign: TextAlign.center)),
            Expanded(child: Text('TEK.', style: kLabel(context), textAlign: TextAlign.center)),
            Expanded(child: Text('AĞIRLIK', style: kLabel(context), textAlign: TextAlign.center)),
            const SizedBox(width: 32),
          ]),
        ),
        Container(height: 1, color: kBorder(context)),
        ...List.generate(_satirlar.length, (i) => _satir(context, i)),
      ]),
    );
  }

  Widget _satir(BuildContext context, int i) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(border: i < _satirlar.length - 1 ? Border(bottom: BorderSide(color: kBorder(context), width: 0.5)) : null),
      child: Row(children: [
        Expanded(flex: 3, child: _input(context, i, 'hareket', 'Hareket')),
        const SizedBox(width: 4),
        Expanded(child: _input(context, i, 'set_sayisi', '0', sayi: true)),
        const SizedBox(width: 4),
        Expanded(child: _input(context, i, 'tekrar_sayisi', '0', sayi: true)),
        const SizedBox(width: 4),
        Expanded(child: _input(context, i, 'agirlik', '0', sayi: true)),
        GestureDetector(
          onTap: _satirlar.length <= 1 ? null : () => setState(() { _satirlar.removeAt(i); }),
          child: Padding(padding: const EdgeInsets.all(8), child: Icon(Icons.close, color: _satirlar.length <= 1 ? kBorder(context) : kHint(context), size: 18)),
        ),
      ]),
    );
  }

  Widget _input(BuildContext context, int satirIndex, String alan, String hint, {bool sayi = false}) {
    return TextFormField(
      key: ValueKey('$_tarihStr-$_yuklemeSayaci-$satirIndex-$alan'),
      initialValue: _satirlar[satirIndex][alan] ?? '',
      keyboardType: sayi ? TextInputType.number : TextInputType.text,
      style: kBody(context, size: 12, color: kText(context)),
      textAlign: sayi ? TextAlign.center : TextAlign.start,
      decoration: InputDecoration(
        hintText: hint, hintStyle: kBody(context, size: 12, color: kHint(context)),
        filled: true, fillColor: kSurfaceLowest(context),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide(color: kBorder(context))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: kRed, width: 1.5)),
      ),
      onChanged: (v) { _satirlar[satirIndex][alan] = v; },
    );
  }

  Widget _aiKarti(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kPurple.withOpacity(0.4))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.auto_awesome, color: kPurple, size: 18),
          const SizedBox(width: 8),
          Text('AI İLERLEME ANALİZİ', style: kLabel(context, color: kText(context))),
        ]),
        const SizedBox(height: 4),
        Text('Ağırlık geçmişini yapay zeka ile değerlendir', style: kBody(context, size: 12, color: kHint(context))),
        const SizedBox(height: 14),
        if (_aiAnaliz.isEmpty)
          SizedBox(
            width: double.infinity, height: 44,
            child: ElevatedButton(
              onPressed: _aiYukleniyor ? null : _aiAnalizAl,
              style: ElevatedButton.styleFrom(backgroundColor: kPurple, disabledBackgroundColor: kPurple.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0),
              child: _aiYukleniyor ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : Text('AI İLE ANALİZ ET', style: kLabel(context, size: 11, color: Colors.white)),
            ),
          )
        else
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: kSurfaceLowest(context), borderRadius: BorderRadius.circular(8), border: Border.all(color: kBorder(context))),
            child: Text(_aiAnaliz, style: kBody(context, size: 13, color: kText(context))),
          ),
      ]),
    );
  }
}