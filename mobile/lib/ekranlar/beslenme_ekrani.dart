import 'package:flutter/material.dart';
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
  final _gramController = TextEditingController();
  final _suController = TextEditingController();
  DateTime _seciliTarih = DateTime.now();

  final List<Map<String, String>> _ogunTipleri = [
    {'value': 'kahvalti', 'label': 'Kahvaltı'},
    {'value': 'ogle', 'label': 'Öğle'},
    {'value': 'aksam', 'label': 'Akşam'},
    {'value': 'ara_ogun', 'label': 'Ara Öğün'},
  ];

  final List<int> _suSecenekleri = [200, 250, 330, 500];
  static const int _suHedef = 2500;

  String get _tarihParam {
    return '${_seciliTarih.year}-${_seciliTarih.month.toString().padLeft(2, '0')}-${_seciliTarih.day.toString().padLeft(2, '0')}';
  }

  @override
  void initState() {
    super.initState();
    _yukle();
  }

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
    if (_secilenBesin == null || _gramController.text.isEmpty) return;
    try {
      await ApiServisi.postJson('/api/nutrition/meals', {
        'besin_anahtari': _secilenBesin!['anahtar'],
        'gram': double.parse(_gramController.text),
        'ogun_tipi': _ogunTipi,
      });
      setState(() { _secilenBesin = null; _gramController.clear(); });
      await _yukle();
    } catch (_) {}
  }

  Future<void> _suEkle(int ml) async {
    final bugun = DateTime.now();
    final secilenBugun = _seciliTarih.year == bugun.year && _seciliTarih.month == bugun.month && _seciliTarih.day == bugun.day;
    if (!secilenBugun) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sadece bugüne su ekleyebilirsiniz.'), backgroundColor: Color(0xFFE8313F)));
      return;
    }
    try {
      await ApiServisi.postJson('/api/nutrition/water', {'miktar_ml': ml});
      await _yukle();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hata: $e'), backgroundColor: const Color(0xFFE8313F)));
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
        color: const Color(0xFF1A1A1A),
        child: Row(children: [
          _sekmeButonu('Yemek Takibi', 0),
          _sekmeButonu('Su Takibi', 1),
        ]),
      ),
      Expanded(child: _aktifSekme == 0 ? _yemekEkrani() : _suEkrani()),
    ]);
  }

  Widget _sekmeButonu(String label, int index) {
    return Expanded(child: GestureDetector(
      onTap: () => setState(() { _aktifSekme = index; }),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: _aktifSekme == index ? const Color(0xFFE8313F) : Colors.transparent, width: 2)),
        ),
        child: Text(label, textAlign: TextAlign.center, style: TextStyle(color: _aktifSekme == index ? const Color(0xFFE8313F) : const Color(0xFF888888), fontSize: 14, fontWeight: _aktifSekme == index ? FontWeight.w600 : FontWeight.normal)),
      ),
    ));
  }

  Widget _tarihSatiri() {
    final bugun = DateTime.now();
    final gunler = List.generate(30, (i) => bugun.subtract(Duration(days: i)));
    return SizedBox(
      height: 72,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: gunler.length,
        itemBuilder: (_, i) {
          final gun = gunler[i];
          final secili = gun.year == _seciliTarih.year && gun.month == _seciliTarih.month && gun.day == _seciliTarih.day;
          final bugunMu = gun.year == bugun.year && gun.month == bugun.month && gun.day == bugun.day;
          const aylar = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
          return GestureDetector(
            onTap: () { setState(() { _seciliTarih = gun; }); _yukle(); },
            child: Container(
              width: 52,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: secili ? const Color(0xFFE8313F) : const Color(0xFF1A1A1A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: secili ? const Color(0xFFE8313F) : bugunMu ? const Color(0xFFE8313F).withOpacity(0.5) : const Color(0xFF333333)),
              ),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(aylar[gun.month], style: TextStyle(color: secili ? Colors.white : const Color(0xFF888888), fontSize: 10)),
                Text('${gun.day}', style: TextStyle(color: secili ? Colors.white : Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                if (bugunMu) Text('Bugün', style: TextStyle(color: secili ? Colors.white70 : const Color(0xFFE8313F), fontSize: 9)),
              ]),
            ),
          );
        },
      ),
    );
  }

  Widget _yemekEkrani() {
    final toplam = _ogunler.fold<double>(0, (s, o) => s + (o['kalori'] as num? ?? 0));
    final filtreliBesinler = _besinler.where((b) => (b['ad'] as String? ?? '').toLowerCase().contains(_aramaMetni.toLowerCase())).take(20).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Beslenme Takibi', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        _tarihSatiri(),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _makroOzet('Kalori', '${toplam.round()} kcal', const Color(0xFFE8313F))),
          const SizedBox(width: 8),
          Expanded(child: _makroOzet('Protein', '${_ogunler.fold<double>(0, (s, o) => s + (o['protein_g'] as num? ?? 0)).round()} g', const Color(0xFF3B82F6))),
          const SizedBox(width: 8),
          Expanded(child: _makroOzet('Karb', '${_ogunler.fold<double>(0, (s, o) => s + (o['karbonhidrat_g'] as num? ?? 0)).round()} g', const Color(0xFF10B981))),
          const SizedBox(width: 8),
          Expanded(child: _makroOzet('Yağ', '${_ogunler.fold<double>(0, (s, o) => s + (o['yag_g'] as num? ?? 0)).round()} g', const Color(0xFFF59E0B))),
        ]),
        const SizedBox(height: 16),
        TextField(
          onChanged: (v) => setState(() { _aramaMetni = v; }),
          style: const TextStyle(color: Colors.white),
          decoration: _inputDeko('Besin ara...', Icons.search),
        ),
        if (_secilenBesin != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE8313F))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_secilenBesin!['ad'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(children: [
                Expanded(child: _dropdown(_ogunTipleri, _ogunTipi, (v) => setState(() { _ogunTipi = v!; }))),
                const SizedBox(width: 8),
                SizedBox(width: 80, child: TextField(controller: _gramController, keyboardType: TextInputType.number, style: const TextStyle(color: Colors.white), decoration: _inputDeko('gram', null))),
                const SizedBox(width: 8),
                ElevatedButton(onPressed: _ogunEkle, style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F)), child: const Text('Ekle', style: TextStyle(color: Colors.white))),
              ]),
            ]),
          ),
        ],
        if (_aramaMetni.isNotEmpty) ...[
          const SizedBox(height: 8),
          ...filtreliBesinler.map((b) => ListTile(
            title: Text(b['ad'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 13)),
            subtitle: Text('${b['kalori_per_100g'] ?? b['kalori']} kcal/100g', style: const TextStyle(color: Color(0xFF888888), fontSize: 11)),
            onTap: () => setState(() { _secilenBesin = Map<String, dynamic>.from(b); _aramaMetni = ''; }),
            tileColor: const Color(0xFF1A1A1A),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          )),
        ],
        const SizedBox(height: 16),
        if (_ogunler.isEmpty)
          Center(child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(children: [
              const Text('🍽️', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 12),
              const Text('Bu gün için öğün eklenmedi', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              const Text('Yukarıdan besin arayarak öğün ekleyebilirsin.', style: TextStyle(color: Color(0xFF888888), fontSize: 13), textAlign: TextAlign.center),
            ]),
          ))
        else ...[
          const Text('Bugünkü Öğünler', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ..._ogunler.map((o) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFF333333))),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${o['besin_ad'] ?? o['besin_adi'] ?? o['ad'] ?? o['anahtar'] ?? ''}', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                Text('${o['miktar_gram'] ?? o['gram'] ?? '?'}g • ${(o['kalori'] as num?)?.round() ?? '?'} kcal', style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
              ])),
              IconButton(icon: const Icon(Icons.close, color: Color(0xFF666666), size: 18), onPressed: () => _ogunSil(o['id'])),
            ]),
          )),
        ],
      ]),
    );
  }

  Widget _suEkrani() {
    final toplamSu = _suKayitlari.fold<int>(0, (s, k) => s + (k['miktar_ml'] as int? ?? 0));
    final yuzde = (toplamSu / _suHedef).clamp(0.0, 1.0);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Su Takibi', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        _tarihSatiri(),
        const SizedBox(height: 24),
        Center(child: Stack(alignment: Alignment.center, children: [
          SizedBox(width: 180, height: 180, child: CircularProgressIndicator(value: yuzde, strokeWidth: 12, backgroundColor: const Color(0xFF333333), color: const Color(0xFF3B82F6))),
          Column(children: [
            const Icon(Icons.water_drop_outlined, color: Color(0xFF3B82F6), size: 28),
            const SizedBox(height: 4),
            Text('$toplamSu ml', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
            Text('/ $_suHedef ml', style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
          ]),
        ])),
        const SizedBox(height: 32),
        const Text('Hızlı Ekle', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        Row(children: _suSecenekleri.map((ml) => Expanded(child: Padding(
          padding: const EdgeInsets.only(right: 8),
          child: ElevatedButton(
            onPressed: () => _suEkle(ml),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A1A1A), side: const BorderSide(color: Color(0xFF333333)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: Text('$ml ml', style: const TextStyle(color: Colors.white, fontSize: 12)),
          ),
        ))).toList()),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: TextField(controller: _suController, keyboardType: TextInputType.number, style: const TextStyle(color: Colors.white), decoration: _inputDeko('Özel miktar (ml)', null))),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () { final ml = int.tryParse(_suController.text); if (ml != null) { _suEkle(ml); _suController.clear(); } },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: const Text('Ekle', style: TextStyle(color: Colors.white)),
          ),
        ]),
        if (_suKayitlari.isEmpty)
          Center(child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(children: [
              const Text('💧', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 12),
              const Text('Bu gün için su kaydı yok', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              const Text('Yukarıdan su ekleyerek takibe başla.', style: TextStyle(color: Color(0xFF888888), fontSize: 13), textAlign: TextAlign.center),
            ]),
          ))
        else ...[
          const SizedBox(height: 20),
          const Text('Kayıtlar', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ..._suKayitlari.map((k) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(children: [
              const Icon(Icons.water_drop_outlined, color: Color(0xFF3B82F6), size: 16),
              const SizedBox(width: 8),
              Text('${k['miktar_ml']} ml', style: const TextStyle(color: Colors.white, fontSize: 13)),
            ]),
          )),
        ],
      ]),
    );
  }

  Widget _makroOzet(String baslik, String deger, Color renk) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(color: renk.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: renk.withOpacity(0.3))),
      child: Column(children: [
        Text(deger, style: TextStyle(color: renk, fontSize: 13, fontWeight: FontWeight.w700)),
        Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 10)),
      ]),
    );
  }

  Widget _dropdown(List<Map<String, String>> secenekler, String value, void Function(String?) onChanged) {
    return DropdownButtonFormField<String>(
      value: value.isEmpty ? null : value,
      dropdownColor: const Color(0xFF1A1A1A),
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: _inputDeko('', null),
      items: secenekler.map((s) => DropdownMenuItem(value: s['value'], child: Text(s['label']!, style: const TextStyle(fontSize: 12)))).toList(),
      onChanged: onChanged,
    );
  }

  InputDecoration _inputDeko(String hint, IconData? ikon) {
    return InputDecoration(
      hintText: hint, hintStyle: const TextStyle(color: Color(0xFF555555)),
      prefixIcon: ikon != null ? Icon(ikon, color: const Color(0xFF888888), size: 20) : null,
      filled: true, fillColor: const Color(0xFF1A1A1A),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE8313F))),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }
}