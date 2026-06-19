import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';

class AnaSayfaIcerik extends StatefulWidget {
  final void Function(String) sayfayaGit;
  const AnaSayfaIcerik({super.key, required this.sayfayaGit});
  @override
  State<AnaSayfaIcerik> createState() => _AnaSayfaIcerikState();
}

class _AnaSayfaIcerikState extends State<AnaSayfaIcerik> {
  Map<String, dynamic>? _profil;
  Map<String, dynamic>? _diyet;
  List _antrenmanlar = [];
  int _bugunAdim = 0;
  int _bugunKalori = 0;
  double _bugunSu = 0;
  bool _yukleniyor = true;

  @override
  void initState() { super.initState(); _veriYukle(); }

  Future<void> _veriYukle() async {
    try {
      final sonuclar = await Future.wait([
        ApiServisi.getJson('/api/users/me'),
        ApiServisi.getJson('/api/users/me/diet'),
        ApiServisi.getJson('/api/analyze/history'),
        ApiServisi.getJson('/api/steps'),
        ApiServisi.getJson('/api/nutrition/water/today'),
      ]);
      final adimlar = sonuclar[3] is List ? List<Map<String, dynamic>>.from(sonuclar[3]) : [];
      final suKayitlari = sonuclar[4] is List ? sonuclar[4] : [];
      final bugun = DateTime.now();
      final bugunAdimlar = adimlar.where((k) {
        final t = DateTime.tryParse(k['tarih'] ?? '');
        return t != null && t.year == bugun.year && t.month == bugun.month && t.day == bugun.day;
      }).toList();
      setState(() {
        _profil = sonuclar[0] is Map ? Map<String, dynamic>.from(sonuclar[0]) : null;
        _diyet = sonuclar[1] is Map ? Map<String, dynamic>.from(sonuclar[1]) : null;
        _antrenmanlar = sonuclar[2] is List ? sonuclar[2] : [];
        _bugunAdim = bugunAdimlar.fold(0, (s, k) => s + (k['adim_sayisi'] as int? ?? 0));
        _bugunKalori = bugunAdimlar.fold(0.0, (s, k) => s + (k['yakilan_kalori'] as num? ?? 0)).round();
        _bugunSu = (suKayitlari as List).fold<double>(0, (s, k) => s + (k['miktar_ml'] as num? ?? 0));
        _yukleniyor = false;
      });
    } catch (_) { setState(() { _yukleniyor = false; }); }
  }

  String _selamlama() {
    final s = DateTime.now().hour;
    if (s < 12) return 'Günaydın';
    if (s < 18) return 'İyi Günler';
    return 'İyi Akşamlar';
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: kRed));
    final ad = _profil?['ad'] ?? 'Sporcu';
    final bugun = DateTime.now();
    const aylar = ['', 'OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];
    const gunler = ['', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'];
    final tarihStr = 'BUGÜN ${bugun.day} ${aylar[bugun.month]} ${gunler[bugun.weekday]}';
    final profilTam = _profil?['boy'] != null && _profil?['kilo'] != null;
    final bmi = _diyet?['bmi'];
    final bmiKategori = _diyet?['bmi_kategori'] ?? '';
    final hedefKalori = _diyet?['hedef_kalori'];

    return RefreshIndicator(
      color: kRed,
      onRefresh: _veriYukle,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _baslik(context, ad, tarihStr),
            const SizedBox(height: 16),
            if (!profilTam) _profilUyarisi(context),
            _seriKarti(context),
            const SizedBox(height: 16),
            _metrikler(context, bmi, bmiKategori, hedefKalori),
            const SizedBox(height: 20),
            _motivasyonKarti(context),
            const SizedBox(height: 20),
            _hizliErisim(context),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _baslik(BuildContext context, String ad, String tarih) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('${_selamlama()}, $ad 👋', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
      const SizedBox(height: 2),
      Text(tarih, style: kLabel(context)),
    ]);
  }

  Widget _profilUyarisi(BuildContext context) {
    return GestureDetector(
      onTap: () => widget.sayfayaGit('profil'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: kRed.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: kRed.withOpacity(0.3)),
        ),
        child: Row(children: [
          const Icon(Icons.info_outline, color: kRed, size: 16),
          const SizedBox(width: 8),
          Expanded(child: Text('PROFİLİ TAMAMLA → KİŞİSEL DİYET PLANI AL', style: kLabel(context, color: kRed))),
          const Icon(Icons.chevron_right, color: kRed, size: 18),
        ]),
      ),
    );
  }

  Widget _seriKarti(BuildContext context) {
    final toplam = _antrenmanlar.length;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: kRed.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: kRed.withOpacity(0.2)),
      ),
      child: Row(children: [
        const Icon(Icons.local_fire_department_outlined, color: kRed, size: 18),
        const SizedBox(width: 8),
        Text('$toplam TOPLAM ANTRENMAN', style: kLabel(context, color: kRed)),
        const Spacer(),
        Text('GEÇMİŞİ GÖR →', style: kLabel(context, size: 10, color: kHint(context))),
      ]),
    );
  }

  Widget _metrikler(BuildContext context, dynamic bmi, String bmiKat, dynamic hedefKalori) {
    final bmiRenk = bmiKat == 'Normal' ? kGreen : bmiKat == 'Kilolu' ? kAmber : kRed;
    final adimYuzde = (_bugunAdim / 10000).clamp(0.0, 1.0);
    final suYuzde = (_bugunSu / 3000).clamp(0.0, 1.0);

    return GridView.count(
      crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10,
      shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.35,
      children: [
        _bentoKart(context, baslik: 'VKİ (BMI)', deger: bmi != null ? '$bmi' : '—', alt: bmiKat.isEmpty ? '' : bmiKat.toUpperCase(), renk: bmiRenk),
        _bentoKart(context, baslik: 'KALORİ HEDEFİ', deger: hedefKalori != null ? '$hedefKalori' : '—', alt: 'KCAL / GÜN', renk: kRed),
        _bentoKart(context, baslik: 'ADIMLAR', deger: '$_bugunAdim', alt: '$_bugunKalori KCAL', renk: kBlue, progress: adimYuzde),
        _bentoKart(context, baslik: 'SU TÜKETİMİ', deger: '${(_bugunSu / 1000).toStringAsFixed(1)}L', alt: '/ 3L  %${(suYuzde * 100).round()}', renk: const Color(0xFF70D6D8), progress: suYuzde),
      ],
    );
  }

  Widget _bentoKart(BuildContext context, {required String baslik, required String deger, required String alt, required Color renk, double? progress}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kSurfaceLow(context),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorderAlt(context)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(baslik, style: kLabel(context)),
          const Spacer(),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            child: Text(deger, key: ValueKey(deger), style: kHeadline(context, size: 26, weight: FontWeight.w900, color: renk)),
          ),
          if (alt.isNotEmpty) Text(alt, style: kLabel(context, size: 10)),
          if (progress != null) ...[
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: progress, minHeight: 3,
                backgroundColor: kBorder(context),
                valueColor: AlwaysStoppedAnimation<Color>(renk),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _motivasyonKarti(BuildContext context) {
    final sayi = _antrenmanlar.length;
    String mesaj; String emoji;
    if (sayi == 0) { mesaj = 'İLK ANTRENMANINI YAP VE YOLCULUĞUNU BAŞLAT'; emoji = '🚀'; }
    else if (sayi < 5) { mesaj = 'HARIKA BAŞLANGIÇ! DÜZENLİ ANTRENMANA DEVAM ET'; emoji = '💪'; }
    else if (sayi < 20) { mesaj = 'RİTME GİRİYORSUN, BU TEMPOYU KORU'; emoji = '🔥'; }
    else { mesaj = 'TUTARLILIK ŞAMPİYONUSUN, DEVAM ET'; emoji = '🏆'; }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [kRed, Color(0xFFB91C1C)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [
        Text(emoji, style: const TextStyle(fontSize: 28)),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('MOTİVASYON', style: kLabel(context, size: 10, color: Colors.white70)),
          const SizedBox(height: 4),
          Text(mesaj, style: kLabel(context, size: 11, color: Colors.white)),
        ])),
      ]),
    );
  }

  Widget _hizliErisim(BuildContext context) {
    final butonlar = [
      ('kamera', Icons.videocam_outlined, 'KAMERA ANALİZİ', kRed),
      ('fotograf', Icons.image_outlined, 'FOTOĞRAF ANALİZİ', const Color(0xFF8B5CF6)),
      ('gecmis', Icons.history_outlined, 'GEÇMİŞ', kGreen),
      ('diyet', Icons.restaurant_outlined, 'DİYET', kAmber),
      ('beslenme', Icons.food_bank_outlined, 'BESLENME', const Color(0xFF70D6D8)),
      ('rozetler', Icons.workspace_premium_outlined, 'ROZETLER', kBlue),
    ];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('HIZLI ERİŞİM', style: kLabel(context)),
        Text('TÜMÜ', style: kLabel(context, size: 10, color: kRed)),
      ]),
      const SizedBox(height: 10),
      ...butonlar.map((b) => GestureDetector(
        onTap: () => widget.sayfayaGit(b.$1),
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: kSurfaceLow(context),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: b.$4.withOpacity(0.2)),
          ),
          child: Row(children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: b.$4.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
              child: Icon(b.$2, color: b.$4, size: 20),
            ),
            const SizedBox(width: 14),
            Text(b.$3, style: kLabel(context, size: 11, color: kText(context))),
            const Spacer(),
            Icon(Icons.chevron_right, color: kHint(context), size: 18),
          ]),
        ),
      )),
    ]);
  }
}