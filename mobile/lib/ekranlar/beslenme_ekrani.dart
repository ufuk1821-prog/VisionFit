import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';

class BeslenmeEkrani extends StatefulWidget {
  const BeslenmeEkrani({super.key});
  @override
  State<BeslenmeEkrani> createState() => _BeslenmeEkraniState();
}

class _BeslenmeEkraniState extends State<BeslenmeEkrani> {
  int _aktifSekme = 0;
  List _besinler = [];
  List _ogunler = [];
  List _suKayitlari = [];
  String _aramaMetni = '';
  String _ogunTipi = 'kahvalti';
  Map<String, dynamic>? _secilenBesin;
  final _gramCtrl = TextEditingController();
  final _suCtrl = TextEditingController();
  DateTime _seciliTarih = DateTime.now();

  final List<Map<String, String>> _ogunTipleri = [
    {'value': 'kahvalti', 'label': 'Kahvaltı'},
    {'value': 'ogle', 'label': 'Öğle'},
    {'value': 'aksam', 'label': 'Akşam'},
    {'value': 'ara_ogun', 'label': 'Ara Öğün'},
  ];
  final List<int> _suSecenekleri = [200, 250, 330, 500];
  static const int _suHedef = 2500;

  String get _tarihParam => '${_seciliTarih.year}-${_seciliTarih.month.toString().padLeft(2, '0')}-${_seciliTarih.day.toString().padLeft(2, '0')}';

  @override
  void initState() { super.initState(); _yukle(); }

  Future<void> _yukle() async {
    try {
      final besinler = await ApiServisi.getJson('/api/nutrition/foods');
      final ogunler = await ApiServisi.getJson('/api/nutrition/meals/today?tarih=$_tarihParam');
      final su = await ApiServisi.getJson('/api/nutrition/water/today?tarih=$_tarihParam');
      setState(() {
        _besinler = besinler is List ? besinler : [];
        _ogunler = ogunler is List ? ogunler : [];
        _suKayitlari = su is List ? su : [];
      });
    } catch (_) {}
  }

  Future<void> _ogunEkle() async {
    if (_secilenBesin == null || _gramCtrl.text.isEmpty) return;
    try {
      await ApiServisi.postJson('/api/nutrition/meals', {
        'besin_anahtari': _secilenBesin!['anahtar'], 'gram': double.parse(_gramCtrl.text),
        'ogun_tipi': _ogunTipi, 'tarih': _tarihParam,
      });
      setState(() { _secilenBesin = null; _gramCtrl.clear(); });
      await _yukle();
    } catch (_) {}
  }

  Future<void> _suEkle(int ml) async {
    try {
      await ApiServisi.postJson('/api/nutrition/water', {'miktar_ml': ml, 'tarih': _tarihParam});
      await _yukle();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hata: $e'), backgroundColor: kRed));
    }
  }

  Future<void> _ogunSil(int id) async {
    await ApiServisi.deleteJson('/api/nutrition/meals/$id');
    await _yukle();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        color: kSurfaceLow(context),
        child: Row(children: [
          _sekmeButonu(context, 'YEMEK TAKİBİ', 0),
          _sekmeButonu(context, 'SU TAKİBİ', 1),
        ]),
      ),
      Container(height: 1, color: kBorder(context)),
      Expanded(child: _aktifSekme == 0 ? _yemekEkrani(context) : _suEkrani(context)),
    ]);
  }

  Widget _sekmeButonu(BuildContext context, String label, int index) {
    final aktif = _aktifSekme == index;
    return Expanded(child: GestureDetector(
      onTap: () => setState(() { _aktifSekme = index; }),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: aktif ? kRed : Colors.transparent, width: 2))),
        child: Text(label, textAlign: TextAlign.center, style: kLabel(context, size: 11, color: aktif ? kRed : kHint(context))),
      ),
    ));
  }

  Widget _tarihSatiri(BuildContext context) {
    final bugun = DateTime.now();
    final gunler = List.generate(30, (i) => bugun.subtract(Duration(days: i)));
    const aylar = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    return SizedBox(
      height: 72,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: gunler.length,
        itemBuilder: (_, i) {
          final gun = gunler[i];
          final secili = gun.year == _seciliTarih.year && gun.month == _seciliTarih.month && gun.day == _seciliTarih.day;
          final bugunMu = gun.year == bugun.year && gun.month == bugun.month && gun.day == bugun.day;
          return GestureDetector(
            onTap: () { setState(() { _seciliTarih = gun; _aramaMetni = ''; }); _yukle(); },
            child: Container(
              width: 52,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: secili ? kRed : kSurfaceLow(context),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: secili ? kRed : bugunMu ? kRed.withOpacity(0.4) : kBorder(context)),
              ),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(aylar[gun.month], style: kLabel(context, size: 9, color: secili ? Colors.white70 : kHint(context))),
                Text('${gun.day}', style: kHeadline(context, size: 18, weight: FontWeight.w800, color: secili ? Colors.white : kText(context))),
                if (bugunMu) Text('BUGÜN', style: kLabel(context, size: 8, color: secili ? Colors.white70 : kRed)),
              ]),
            ),
          );
        },
      ),
    );
  }

  Widget _yemekEkrani(BuildContext context) {
    final toplam = _ogunler.fold<double>(0, (s, o) => s + (o['kalori'] as num? ?? 0));
    final protein = _ogunler.fold<double>(0, (s, o) => s + (o['protein_g'] as num? ?? 0));
    final karb = _ogunler.fold<double>(0, (s, o) => s + (o['karbonhidrat_g'] as num? ?? 0));
    final yag = _ogunler.fold<double>(0, (s, o) => s + (o['yag_g'] as num? ?? 0));
    final filtreliBesinler = _besinler.where((b) => (b['ad'] as String? ?? '').toLowerCase().contains(_aramaMetni.toLowerCase())).take(20).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Beslenme Takibi', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
        const SizedBox(height: 12),
        _tarihSatiri(context),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: _makroKart(context, 'KALORİ', '${toplam.round()}', 'kcal', kRed)),
          const SizedBox(width: 8),
          Expanded(child: _makroKart(context, 'PROTEİN', '${protein.round()}', 'g', kBlue)),
          const SizedBox(width: 8),
          Expanded(child: _makroKart(context, 'KARB', '${karb.round()}', 'g', kGreen)),
          const SizedBox(width: 8),
          Expanded(child: _makroKart(context, 'YAĞ', '${yag.round()}', 'g', kAmber)),
        ]),
        const SizedBox(height: 16),
        TextField(
          key: ValueKey(_seciliTarih.toString()),
          onChanged: (v) => setState(() { _aramaMetni = v; }),
          style: kBody(context, color: kText(context)),
          decoration: InputDecoration(
            hintText: 'Besin ara...', hintStyle: kBody(context, color: kHint(context)),
            prefixIcon: Icon(Icons.search, color: kHint(context), size: 20),
            filled: true, fillColor: kSurfaceContainer(context),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed, width: 1.5)),
          ),
        ),
        if (_secilenBesin != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(10), border: Border.all(color: kRed.withOpacity(0.5))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.check_circle_outline, color: kRed, size: 16),
                const SizedBox(width: 6),
                Expanded(child: Text(_secilenBesin!['ad'] ?? '', style: kBody(context, size: 13, weight: FontWeight.w600, color: kText(context)))),
                GestureDetector(onTap: () => setState(() { _secilenBesin = null; }), child: Icon(Icons.close, color: kHint(context), size: 18)),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(child: DropdownButtonFormField<String>(
                  value: _ogunTipi,
                  dropdownColor: kSurfaceLow(context),
                  style: kBody(context, size: 13, color: kText(context)),
                  decoration: InputDecoration(
                    filled: true, fillColor: kSurfaceContainer(context),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed)),
                  ),
                  items: _ogunTipleri.map((s) => DropdownMenuItem(value: s['value'], child: Text(s['label']!, style: kBody(context, size: 12, color: kText(context))))).toList(),
                  onChanged: (v) => setState(() { _ogunTipi = v!; }),
                )),
                const SizedBox(width: 8),
                SizedBox(width: 80, child: TextField(
                  controller: _gramCtrl, keyboardType: TextInputType.number, style: kBody(context, color: kText(context)),
                  decoration: InputDecoration(
                    hintText: 'gram', hintStyle: kBody(context, color: kHint(context)),
                    filled: true, fillColor: kSurfaceContainer(context),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed)),
                  ),
                )),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _ogunEkle,
                  style: ElevatedButton.styleFrom(backgroundColor: kRed, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), elevation: 0),
                  child: Text('EKLE', style: kLabel(context, size: 10, color: Colors.white)),
                ),
              ]),
            ]),
          ),
        ],
        if (_aramaMetni.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder(context))),
            child: Column(
              children: filtreliBesinler.asMap().entries.map((e) => GestureDetector(
                onTap: () => setState(() { _secilenBesin = Map<String, dynamic>.from(e.value); _aramaMetni = ''; }),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(border: e.key < filtreliBesinler.length - 1 ? Border(bottom: BorderSide(color: kBorder(context))) : null),
                  child: Row(children: [
                    Expanded(child: Text(e.value['ad'] ?? '', style: kBody(context, size: 13, color: kText(context)))),
                    Text('${e.value['kalori_per_100g'] ?? e.value['kalori'] ?? '?'} kcal/100g', style: kLabel(context, size: 10, color: kHint(context))),
                  ]),
                ),
              )).toList(),
            ),
          ),
        ],
        const SizedBox(height: 16),
        if (_ogunler.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder(context))),
            child: Center(child: Column(children: [
              const Text('🍽️', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 12),
              Text('Bu gün için öğün eklenmedi', style: kBody(context, size: 14, weight: FontWeight.w600, color: kText(context))),
              const SizedBox(height: 4),
              Text('Yukarıdan besin arayarak öğün ekleyebilirsin.', style: kBody(context, size: 12, color: kHint(context)), textAlign: TextAlign.center),
            ])),
          )
        else ...[
          Row(children: [
            Text('BUGÜNKÜ ÖĞÜNLER', style: kLabel(context)),
            const SizedBox(width: 8),
            Expanded(child: Container(height: 1, color: kBorder(context))),
          ]),
          const SizedBox(height: 10),
          ..._ogunler.map((o) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder(context))),
            child: Row(children: [
              Container(width: 36, height: 36, decoration: BoxDecoration(color: kRed.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.restaurant_outlined, color: kRed, size: 18)),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${o['besin_ad'] ?? o['besin_adi'] ?? o['ad'] ?? o['anahtar'] ?? ''}', style: kBody(context, size: 13, weight: FontWeight.w600, color: kText(context))),
                Text('${o['miktar_gram'] ?? o['gram'] ?? '?'}g  •  ${(o['kalori'] as num?)?.round() ?? '?'} kcal', style: kLabel(context, size: 10, color: kHint(context))),
              ])),
              GestureDetector(onTap: () => _ogunSil(o['id']), child: Icon(Icons.close, color: kHint(context), size: 18)),
            ]),
          )),
        ],
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _suEkrani(BuildContext context) {
    final toplamSu = _suKayitlari.fold<int>(0, (s, k) => s + (k['miktar_ml'] as int? ?? 0));
    final yuzde = (toplamSu / _suHedef).clamp(0.0, 1.0);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Su Takibi', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
        const SizedBox(height: 12),
        _tarihSatiri(context),
        const SizedBox(height: 24),
        Center(child: Stack(alignment: Alignment.center, children: [
          SizedBox(width: 180, height: 180, child: CircularProgressIndicator(value: yuzde, strokeWidth: 10, backgroundColor: kBorder(context), color: kBlue)),
          Column(children: [
            const Icon(Icons.water_drop_outlined, color: kBlue, size: 28),
            const SizedBox(height: 4),
            Text('$toplamSu', style: kHeadline(context, size: 28, weight: FontWeight.w900, color: kText(context))),
            Text('ml / $_suHedef ml', style: kBody(context, size: 13, color: kHint(context))),
            Text('%${(yuzde * 100).round()} TAMAMLANDI', style: kLabel(context, size: 10, color: kBlue)),
          ]),
        ])),
        const SizedBox(height: 28),
        Text('HIZLI EKLE', style: kLabel(context)),
        const SizedBox(height: 10),
        Row(children: _suSecenekleri.map((ml) => Expanded(child: Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => _suEkle(ml),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(10), border: Border.all(color: kBlue.withOpacity(0.3))),
              child: Column(children: [
                const Icon(Icons.water_drop_outlined, color: kBlue, size: 16),
                const SizedBox(height: 4),
                Text('$ml', style: kHeadline(context, size: 14, weight: FontWeight.w700, color: kText(context))),
                Text('ml', style: kLabel(context, size: 9, color: kHint(context))),
              ]),
            ),
          ),
        ))).toList()),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: TextField(
            controller: _suCtrl, keyboardType: TextInputType.number, style: kBody(context, color: kText(context)),
            decoration: InputDecoration(
              hintText: 'Özel miktar (ml)', hintStyle: kBody(context, color: kHint(context)),
              filled: true, fillColor: kSurfaceContainer(context),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed, width: 1.5)),
            ),
          )),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () { final ml = int.tryParse(_suCtrl.text); if (ml != null && ml > 0) { _suEkle(ml); _suCtrl.clear(); } },
            style: ElevatedButton.styleFrom(backgroundColor: kBlue, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14), elevation: 0),
            child: Text('EKLE', style: kLabel(context, size: 11, color: Colors.white)),
          ),
        ]),
        if (_suKayitlari.isNotEmpty) ...[
          const SizedBox(height: 20),
          Row(children: [
            Text('KAYITLAR', style: kLabel(context)),
            const SizedBox(width: 8),
            Expanded(child: Container(height: 1, color: kBorder(context))),
          ]),
          const SizedBox(height: 10),
          ..._suKayitlari.map((k) => Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(8), border: Border.all(color: kBorder(context))),
            child: Row(children: [
              const Icon(Icons.water_drop_outlined, color: kBlue, size: 16),
              const SizedBox(width: 8),
              Text('${k['miktar_ml']} ml', style: kBody(context, size: 13, weight: FontWeight.w600, color: kText(context))),
            ]),
          )),
        ],
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _makroKart(BuildContext context, String baslik, String deger, String birim, Color renk) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(color: renk.withOpacity(0.08), borderRadius: BorderRadius.circular(10), border: Border.all(color: renk.withOpacity(0.25))),
      child: Column(children: [
        Text(deger, style: kHeadline(context, size: 14, weight: FontWeight.w800, color: renk)),
        Text(birim, style: kLabel(context, size: 9, color: renk.withOpacity(0.7))),
        const SizedBox(height: 2),
        Text(baslik, style: kLabel(context, size: 9, color: kHint(context))),
      ]),
    );
  }
}