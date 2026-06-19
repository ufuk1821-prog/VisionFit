import 'package:flutter/material.dart';
import 'package:pedometer/pedometer.dart';
import 'package:permission_handler/permission_handler.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';

class AdimEkrani extends StatefulWidget {
  const AdimEkrani({super.key});
  @override
  State<AdimEkrani> createState() => _AdimEkraniState();
}

class _AdimEkraniState extends State<AdimEkrani> {
  final _adimCtrl = TextEditingController();
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
    try {
      final veri = await ApiServisi.getJson('/api/steps');
      setState(() { _kayitlar = veri is List ? veri : []; });
    } catch (_) {}
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
      if (t != null) gunler.add('${t.year}-${t.month.toString().padLeft(2, '0')}-${t.day.toString().padLeft(2, '0')}');
    }
    final bugun = DateTime.now();
    gunler.add('${bugun.year}-${bugun.month.toString().padLeft(2, '0')}-${bugun.day.toString().padLeft(2, '0')}');
    final liste = gunler.toList()..sort((a, b) => b.compareTo(a));
    return liste;
  }

  Future<void> _ekle() async {
    final adim = int.tryParse(_adimCtrl.text.trim());
    if (adim == null || adim <= 0) { setState(() { _hata = 'Geçerli bir adım sayısı girin.'; }); return; }
    if (_aktivite.isEmpty) { setState(() { _hata = 'Aktivite tipi seçin.'; }); return; }
    setState(() { _yukleniyor = true; _hata = ''; });
    try {
      await ApiServisi.postJson('/api/steps', {'adim_sayisi': adim, 'aktivite_tipi': _aktivite});
      _adimCtrl.clear();
      setState(() { _aktivite = ''; });
      await _yukle();
    } catch (e) {
      setState(() { _hata = 'Kayıt eklenemedi: $e'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  Future<void> _sagliktatanEkle() async {
    if (_saglikAdim <= 0) { setState(() { _hata = 'Telefon adım verisi alınamadı.'; }); return; }
    if (_aktivite.isEmpty) { setState(() { _hata = 'Önce aktivite tipi seçin.'; }); return; }
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

  String _ayKisa(int ay) {
    const aylar = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return aylar[ay];
  }

  @override
  Widget build(BuildContext context) {
    final seciliKayitlar = _gunKayitlari(_seciliTarih);
    final toplamAdim = seciliKayitlar.fold<int>(0, (s, k) => s + (k['adim_sayisi'] as int? ?? 0));
    final toplamKalori = seciliKayitlar.fold<double>(0, (s, k) => s + (k['yakilan_kalori'] as num? ?? 0));
    final hedef = 10000;
    final yuzde = (toplamAdim / hedef).clamp(0.0, 1.0);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _tarihPaneli(context),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Adım Sayacı', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('HAREKET PROFİLİ', style: kLabel(context, color: kRed)),
                const SizedBox(height: 16),
                _buyukAdimKarti(context, toplamAdim, toplamKalori, hedef, yuzde),
                const SizedBox(height: 12),
                _saglikSenkronKarti(context),
                const SizedBox(height: 12),
                if (_saglikAdim > 0) ...[_saglikKaydetKarti(context), const SizedBox(height: 12)],
                _ekleFormu(context),
                const SizedBox(height: 20),
                Row(children: [
                  Text('AKTİVİTE GEÇMİŞİ', style: kLabel(context)),
                  const SizedBox(width: 8),
                  Expanded(child: Container(height: 1, color: kBorder(context))),
                ]),
                const SizedBox(height: 12),
                if (seciliKayitlar.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder(context))),
                    child: Center(child: Column(children: [
                      Icon(Icons.directions_walk_outlined, color: kBorder(context), size: 40),
                      const SizedBox(height: 12),
                      Text('${_tarihGoster(_seciliTarih)} için kayıt yok', style: kBody(context, size: 14, weight: FontWeight.w600, color: kText(context))),
                      const SizedBox(height: 4),
                      Text('Yukarıdaki formdan adım ekleyerek takibe başla.', style: kBody(context, size: 12, color: kHint(context)), textAlign: TextAlign.center),
                    ])),
                  )
                else
                  ...seciliKayitlar.map((k) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder(context))),
                    child: Row(children: [
                      Container(width: 40, height: 40, decoration: BoxDecoration(color: kRed.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.directions_walk_outlined, color: kRed, size: 20)),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('${k['adim_sayisi']} adım', style: kBody(context, size: 13, weight: FontWeight.w600, color: kText(context))),
                        Text('${(k['yakilan_kalori'] as num?)?.round()} kcal  •  ${k['aktivite_tipi']}', style: kLabel(context, size: 10)),
                      ])),
                    ]),
                  )),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buyukAdimKarti(BuildContext context, int toplamAdim, double toplamKalori, int hedef, double yuzde) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(16), border: Border.all(color: kBorderAlt(context))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('BUGÜNKÜ ADIMLAR', style: kLabel(context)),
            const SizedBox(height: 4),
            Row(crossAxisAlignment: CrossAxisAlignment.end, mainAxisSize: MainAxisSize.min, children: [
              Flexible(child: FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.bottomLeft, child: Text('$toplamAdim', style: kHeadline(context, size: 40, weight: FontWeight.w900, color: kRed)))),
              const SizedBox(width: 6),
              Padding(padding: const EdgeInsets.only(bottom: 6), child: Text('/ $hedef', style: kBody(context, size: 14, color: kHint(context)))),
            ]),
          ])),
          const SizedBox(width: 12),
          SizedBox(width: 64, height: 64, child: Stack(alignment: Alignment.center, children: [
            CircularProgressIndicator(value: yuzde, strokeWidth: 6, backgroundColor: kBorder(context), color: kRed),
            Text('%${(yuzde * 100).round()}', style: kLabel(context, size: 9, color: kRed)),
          ])),
        ]),
        const SizedBox(height: 16),
        Container(height: 1, color: kBorder(context)),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('KALORİ', style: kLabel(context, size: 9)),
            Text('${toplamKalori.round()}', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
            Text('kcal', style: kLabel(context, size: 9)),
          ])),
          Container(width: 1, height: 40, color: kBorder(context)),
          Expanded(child: Padding(padding: const EdgeInsets.only(left: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('HEDEF', style: kLabel(context, size: 9)),
            Text('$hedef', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
            Text('adım / gün', style: kLabel(context, size: 9)),
          ]))),
        ]),
      ]),
    );
  }

  Widget _saglikSenkronKarti(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: kBlue.withOpacity(0.08), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBlue.withOpacity(0.3))),
      child: Row(children: [
        Container(width: 40, height: 40, decoration: BoxDecoration(color: kBlue.withOpacity(0.15), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.health_and_safety_outlined, color: kBlue, size: 20)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('TELEFON ADIM SAYACI', style: kLabel(context, color: kText(context))),
          const SizedBox(height: 2),
          _saglikYukleniyor ? Text('İzin isteniyor...', style: kBody(context, size: 12, color: kHint(context))) : Text('Anlık: $_saglikAdim adım', style: kBody(context, size: 12, color: kBlue, weight: FontWeight.w600)),
        ])),
        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: kBlue.withOpacity(0.15), borderRadius: BorderRadius.circular(6)), child: Text('CANLI', style: kLabel(context, size: 9, color: kBlue))),
      ]),
    );
  }

  Widget _saglikKaydetKarti(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder(context))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('TELEFON VERİSİNİ KAYDET', style: kLabel(context, color: kText(context))),
        const SizedBox(height: 4),
        Text('Aktivite tipini seç ve $_saglikAdim adımı kaydet', style: kBody(context, size: 12, color: kHint(context))),
        const SizedBox(height: 10),
        Wrap(spacing: 6, runSpacing: 6, children: _aktiviteler.map((a) => GestureDetector(
          onTap: () => setState(() { _aktivite = a['value']!; }),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _aktivite == a['value'] ? kRed : kSurfaceContainer(context),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _aktivite == a['value'] ? kRed : kBorder(context)),
            ),
            child: Text(a['label']!, style: kLabel(context, size: 10, color: _aktivite == a['value'] ? Colors.white : kHint(context))),
          ),
        )).toList()),
        const SizedBox(height: 10),
        SizedBox(width: double.infinity, height: 40, child: ElevatedButton(
          onPressed: _yukleniyor ? null : _sagliktatanEkle,
          style: ElevatedButton.styleFrom(backgroundColor: kBlue, disabledBackgroundColor: kBlue.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0),
          child: _yukleniyor ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : Text('$_saglikAdim ADIMI KAYDET', style: kLabel(context, size: 11, color: Colors.white)),
        )),
      ]),
    );
  }

  Widget _ekleFormu(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorderAlt(context))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('MANUEL ADIM EKLE', style: kLabel(context, color: kText(context))),
        const SizedBox(height: 10),
        TextField(controller: _adimCtrl, keyboardType: TextInputType.number, style: kBody(context, color: kText(context)), decoration: kInputDeko(context, 'Adım sayısı', Icons.directions_walk_outlined)),
        const SizedBox(height: 10),
        Wrap(spacing: 6, runSpacing: 6, children: _aktiviteler.map((a) => GestureDetector(
          onTap: () => setState(() { _aktivite = a['value']!; }),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _aktivite == a['value'] ? kRed : kSurfaceContainer(context),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _aktivite == a['value'] ? kRed : kBorder(context)),
            ),
            child: Text(a['label']!, style: kLabel(context, size: 10, color: _aktivite == a['value'] ? Colors.white : kHint(context))),
          ),
        )).toList()),
        if (_hata.isNotEmpty) ...[
          const SizedBox(height: 8),
          Row(children: [const Icon(Icons.warning_amber_outlined, color: kRed, size: 14), const SizedBox(width: 6), Text(_hata, style: kBody(context, size: 12, color: kRed))]),
        ],
        const SizedBox(height: 12),
        SizedBox(width: double.infinity, height: 44, child: ElevatedButton(
          onPressed: _yukleniyor ? null : _ekle,
          style: ElevatedButton.styleFrom(backgroundColor: kRed, disabledBackgroundColor: kRed.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0),
          child: _yukleniyor ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : Text('EKLE', style: kLabel(context, size: 12, color: Colors.white)),
        )),
      ]),
    );
  }

  Widget _tarihPaneli(BuildContext context) {
    return Container(
      width: 76,
      decoration: BoxDecoration(color: kSurfaceLow(context), border: Border(right: BorderSide(color: kBorder(context)))),
      child: ListView(
        children: _mevcutGunler.map((tarih) {
          final secili = _seciliTarih == tarih;
          final t = DateTime.tryParse(tarih);
          return GestureDetector(
            onTap: () => setState(() { _seciliTarih = tarih; }),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
              decoration: BoxDecoration(color: secili ? kRed.withOpacity(0.12) : Colors.transparent, border: Border(left: BorderSide(color: secili ? kRed : Colors.transparent, width: 3))),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text(t != null ? _ayKisa(t.month) : '', style: kLabel(context, size: 9, color: secili ? kRed : kHint(context)), maxLines: 1),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(t != null ? '${t.day}' : '', style: kHeadline(context, size: 18, weight: FontWeight.w800, color: secili ? kRed : kText(context))),
                ),
                if (_gunKayitlari(tarih).isNotEmpty) Container(width: 5, height: 5, margin: const EdgeInsets.only(top: 3), decoration: const BoxDecoration(color: kRed, shape: BoxShape.circle)),
              ]),
            ),
          );
        }).toList(),
      ),
    );
  }
}