import 'package:flutter/material.dart';
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
  void initState() {
    super.initState();
    _veriYukle();
  }

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
    } catch (_) {
      setState(() { _yukleniyor = false; });
    }
  }

  String _selamlama() {
    final saat = DateTime.now().hour;
    if (saat < 12) return 'Günaydın';
    if (saat < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: Color(0xFFE8313F)));

    final ad = _profil?['ad'] ?? 'Sporcu';
    final bugun = DateTime.now();
    const aylar = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const gunler = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    final tarih = '${gunler[bugun.weekday]}, ${bugun.day} ${aylar[bugun.month]}';

    final buHaftaBasi = bugun.subtract(Duration(days: bugun.weekday - 1));
    final buHaftaAntrenman = _antrenmanlar.where((a) {
      final t = DateTime.tryParse(a['tarih'] ?? '');
      return t != null && t.isAfter(buHaftaBasi.subtract(const Duration(days: 1)));
    }).length;

    final sonAntrenman = _antrenmanlar.isNotEmpty ? _antrenmanlar.first : null;
    final profilTam = _profil != null && _profil!['boy'] != null && _profil!['kilo'] != null;

    return RefreshIndicator(
      color: const Color(0xFFE8313F),
      onRefresh: _veriYukle,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _baslik(ad, tarih),
            const SizedBox(height: 16),
            if (!profilTam) _profilUyarisi(),
            _ozet4lu(),
            const SizedBox(height: 20),
            _haftalikOzet(buHaftaAntrenman, sonAntrenman),
            const SizedBox(height: 20),
            _motivasyonKarti(),
            const SizedBox(height: 20),
            _hizliErisim(),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _baslik(String ad, String tarih) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${_selamlama()}, $ad! 👋', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(tarih, style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
        ]),
        GestureDetector(
          onTap: () => widget.sayfayaGit('profil'),
          child: Container(
            width: 42, height: 42,
            decoration: BoxDecoration(color: const Color(0xFFE8313F).withOpacity(0.15), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE8313F).withOpacity(0.4))),
            child: const Icon(Icons.person_outline, color: Color(0xFFE8313F), size: 22),
          ),
        ),
      ],
    );
  }

  Widget _profilUyarisi() {
    return GestureDetector(
      onTap: () => widget.sayfayaGit('profil'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [const Color(0xFFE8313F).withOpacity(0.2), const Color(0xFFE8313F).withOpacity(0.05)]),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE8313F).withOpacity(0.4)),
        ),
        child: const Row(children: [
          Icon(Icons.info_outline, color: Color(0xFFE8313F), size: 20),
          SizedBox(width: 10),
          Expanded(child: Text('Profili tamamla → Kişisel diyet planı al', style: TextStyle(color: Colors.white, fontSize: 13))),
          Icon(Icons.chevron_right, color: Color(0xFFE8313F), size: 18),
        ]),
      ),
    );
  }

  Widget _ozet4lu() {
    final bmi = _diyet?['bmi'];
    final bmiKategori = _diyet?['bmi_kategori'] ?? '';
    final hedefKalori = _diyet?['hedef_kalori'];

    final bmiRenk = bmiKategori == 'Normal' ? const Color(0xFF4CAF50) :
                    bmiKategori == 'Kilolu' ? const Color(0xFFF59E0B) :
                    bmiKategori == 'Obez' ? const Color(0xFFE8313F) : const Color(0xFF3B82F6);

    final suYuzde = (_bugunSu / 2500).clamp(0.0, 1.0);

    return GridView.count(
      crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12,
      shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5,
      children: [
        _ozetKart('BMI', bmi != null ? '$bmi' : '—', Icons.monitor_weight_outlined, bmiRenk, alt: bmiKategori == 'Normal' ? 'Normal ✓' : bmiKategori),
        _ozetKart('Hedef Kalori', hedefKalori != null ? '$hedefKalori kcal' : '—', Icons.local_fire_department_outlined, const Color(0xFFE8313F)),
        _ozetKart('Bugün Adım', '$_bugunAdim', Icons.directions_walk_outlined, const Color(0xFF3B82F6), alt: '$_bugunKalori kcal yakıldı'),
        _ozetKart('Günlük Su', '${_bugunSu.round()} ml', Icons.water_drop_outlined, const Color(0xFF06B6D4), alt: '%${(suYuzde * 100).round()} hedef'),
      ],
    );
  }

  Widget _ozetKart(String baslik, String deger, IconData ikon, Color renk, {String? alt}) {
    final gosterilecek = deger == 'null' || deger == 'null kcal' ? '—' : deger;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF333333)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: renk.withOpacity(0.15), borderRadius: BorderRadius.circular(8)), child: Icon(ikon, color: renk, size: 16)),
          const Spacer(),
        ]),
        const SizedBox(height: 8),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 400),
          child: Text(gosterilecek, key: ValueKey(gosterilecek), style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
        ),
        Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 11)),
        if (alt != null && alt != 'null') Text(alt, style: TextStyle(color: renk, fontSize: 10, fontWeight: FontWeight.w500)),
      ]),
    );
  }

  Widget _haftalikOzet(int antrenmanSayisi, dynamic sonAntrenman) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.bar_chart_outlined, color: Color(0xFFE8313F), size: 18),
          SizedBox(width: 8),
          Text('Bu Hafta', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: _haftaItem('🏋️', 'Antrenman', '$antrenmanSayisi kez')),
          Container(width: 1, height: 40, color: const Color(0xFF333333)),
          Expanded(child: _haftaItem('👟', 'Toplam Adım', '$_bugunAdim')),
          Container(width: 1, height: 40, color: const Color(0xFF333333)),
          Expanded(child: _haftaItem('🔥', 'Kalori', '$_bugunKalori kcal')),
        ]),
        if (sonAntrenman != null) ...[
          const SizedBox(height: 12),
          const Divider(color: Color(0xFF333333)),
          const SizedBox(height: 8),
          Row(children: [
            const Icon(Icons.access_time_outlined, color: Color(0xFF888888), size: 14),
            const SizedBox(width: 6),
            Text('Son antrenman: %${sonAntrenman['eminlik_skoru'] ?? 0} skor', style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
          ]),
        ],
      ]),
    );
  }

  Widget _haftaItem(String emoji, String baslik, String deger) {
    return Column(children: [
      Text(emoji, style: const TextStyle(fontSize: 20)),
      const SizedBox(height: 4),
      Text(deger, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
      Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 10)),
    ]);
  }

  Widget _motivasyonKarti() {
    final sayi = _antrenmanlar.length;
    String mesaj;
    String emoji;
    if (sayi == 0) { mesaj = 'İlk antrenmanını yap ve yolculuğunu başlat!'; emoji = '🚀'; }
    else if (sayi < 5) { mesaj = 'Harika başlangıç! Düzenli antrenmana devam et.'; emoji = '💪'; }
    else if (sayi < 20) { mesaj = 'Ritme giriyorsun, bu tempoyu koru!'; emoji = '🔥'; }
    else { mesaj = 'Tutarlılık şampiyonusun, devam et!'; emoji = '🏆'; }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFE8313F), Color(0xFFB91C1C)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(children: [
        Text(emoji, style: const TextStyle(fontSize: 32)),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Motivasyon', style: TextStyle(color: Colors.white70, fontSize: 11)),
          const SizedBox(height: 4),
          Text(mesaj, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600, height: 1.4)),
        ])),
      ]),
    );
  }

  Widget _hizliErisim() {
    final butonlar = [
      ('kamera', Icons.videocam_outlined, 'Kamera\nAnalizi', const Color(0xFFE8313F)),
      ('fotograf', Icons.image_outlined, 'Fotoğraflı\nAnaliz', const Color(0xFF8B5CF6)),
      ('diyet', Icons.restaurant_menu_outlined, 'Diyet\nÖnerisi', const Color(0xFF10B981)),
      ('defter', Icons.book_outlined, 'Antrenman\nDefteri', const Color(0xFFF59E0B)),
      ('beslenme', Icons.food_bank_outlined, 'Beslenme\nTakibi', const Color(0xFF06B6D4)),
      ('adim', Icons.directions_walk_outlined, 'Adım\nSayacı', const Color(0xFF3B82F6)),
    ];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Hızlı Erişim', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
      const SizedBox(height: 12),
      GridView.count(
        crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10,
        shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 1.1,
        children: butonlar.map((b) => GestureDetector(
          onTap: () => widget.sayfayaGit(b.$1),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: b.$4.withOpacity(0.3)),
            ),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: b.$4.withOpacity(0.15), borderRadius: BorderRadius.circular(10)), child: Icon(b.$2, color: b.$4, size: 20)),
              const SizedBox(height: 6),
              Text(b.$3, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
            ]),
          ),
        )).toList(),
      ),
    ]);
  }
}