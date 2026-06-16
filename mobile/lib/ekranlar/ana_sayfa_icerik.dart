import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';

const Map<String, String> bmiEtiketler = {
  'Zayif': 'Zayıf', 'Normal': 'Normal', 'Kilolu': 'Kilolu', 'Obez': 'Obez',
};

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
  List _adimlar = [];
  int _bugunAdim = 0;
  int _bugunKalori = 0;
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
      ]);
      final adimlar = List<Map<String, dynamic>>.from(sonuclar[3] is List ? sonuclar[3] : []);
      final bugun = DateTime.now();
      final bugunAdimlar = adimlar.where((k) {
        final t = DateTime.tryParse(k['tarih'] ?? '');
        return t != null && t.year == bugun.year && t.month == bugun.month && t.day == bugun.day;
      }).toList();
      setState(() {
        _profil = sonuclar[0] is Map ? Map<String, dynamic>.from(sonuclar[0]) : null;
        _diyet = sonuclar[1] is Map ? Map<String, dynamic>.from(sonuclar[1]) : null;
        _antrenmanlar = sonuclar[2] is List ? sonuclar[2] : [];
        _adimlar = adimlar;
        _bugunAdim = bugunAdimlar.fold(0, (s, k) => s + (k['adim_sayisi'] as int? ?? 0));
        _bugunKalori = bugunAdimlar.fold(0.0, (s, k) => s + (k['yakilan_kalori'] as num? ?? 0)).round();
        _yukleniyor = false;
      });
    } catch (e) {
      setState(() { _yukleniyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: Color(0xFFE8313F)));

    final now = DateTime.now();
    final haftaBasi = now.subtract(const Duration(days: 7));
    final buHaftaAntrenman = _antrenmanlar.where((w) => DateTime.tryParse(w['tarih'] ?? '')?.isAfter(haftaBasi) ?? false).toList();
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
            Text('Merhaba, ${_profil?['ad'] ?? 'Sporcu'}!', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
            Text(_tarihFormat(now), style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
            if (!profilTam) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: const Color(0xFFE8313F).withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                child: Row(
                  children: [
                    const Expanded(child: Text('Profilinizi tamamlayarak diyet önerisi alabilirsiniz.', style: TextStyle(color: Colors.white, fontSize: 13))),
                    TextButton(onPressed: () => widget.sayfayaGit('profil'), child: const Text('Tamamla', style: TextStyle(color: Color(0xFFE8313F)))),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),
            GridView.count(
              crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12,
              shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.4,
              children: [
                _ozet('Vücut Kitle Endeksi', _diyet != null ? '${_diyet!['bmi']}' : '—', Icons.monitor_weight_outlined,
                  alt: _diyet != null ? bmiEtiketler[_diyet!['bmi_kategori']] ?? '' : ''),
                _ozet('Hedef Kalori', _diyet != null ? '${_diyet!['hedef_kalori']} kcal' : '—', Icons.local_fire_department_outlined),
                _ozet('Bugünkü Adım', '$_bugunAdim', Icons.directions_walk_outlined, alt: '$_bugunKalori kcal yakıldı'),
                _ozet('Son Antrenman', sonAntrenman != null ? '${sonAntrenman['eminlik_skoru']}%' : 'Henüz yok', Icons.fitness_center_outlined,
                  alt: sonAntrenman != null ? _tarihKisa(sonAntrenman['tarih']) : ''),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Haftalık Özet', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _haftalik('Antrenman', '${buHaftaAntrenman.length}', Icons.fitness_center_outlined)),
                const SizedBox(width: 12),
                Expanded(child: _haftalik('Haftalık Adım', '${_adimlar.where((s) => DateTime.tryParse(s['tarih'] ?? '')?.isAfter(haftaBasi) ?? false).fold(0, (a, s) => a + (s['adim_sayisi'] as int? ?? 0))}', Icons.directions_walk_outlined)),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Hızlı Erişim', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12,
              shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 2.5,
              children: [
                _hizliErisim('Kamera Analizi', Icons.videocam_outlined, () => widget.sayfayaGit('kamera')),
                _hizliErisim('Diyet Önerisi', Icons.restaurant_menu_outlined, () => widget.sayfayaGit('diyet')),
                _hizliErisim('Adım Ekle', Icons.directions_walk_outlined, () => widget.sayfayaGit('adim')),
                _hizliErisim('Zamanlayıcı', Icons.timer_outlined, () => widget.sayfayaGit('zamanlayici')),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _ozet(String baslik, String deger, IconData ikon, {String? alt}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [Icon(ikon, color: const Color(0xFFE8313F), size: 18), const SizedBox(width: 6), Expanded(child: Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 11), overflow: TextOverflow.ellipsis))]),
          const SizedBox(height: 8),
          Text(deger, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
          if (alt != null && alt.isNotEmpty) Text(alt, style: const TextStyle(color: Color(0xFF888888), fontSize: 11)),
        ],
      ),
    );
  }

  Widget _haftalik(String baslik, String deger, IconData ikon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Row(
        children: [
          Icon(ikon, color: const Color(0xFFE8313F), size: 20),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
            Text(deger, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          ]),
        ],
      ),
    );
  }

  Widget _hizliErisim(String baslik, IconData ikon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF333333))),
        child: Row(children: [
          Icon(ikon, color: const Color(0xFFE8313F), size: 18),
          const SizedBox(width: 8),
          Text(baslik, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
        ]),
      ),
    );
  }

  String _tarihFormat(DateTime d) {
    const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return '${gunler[d.weekday % 7]}, ${d.day} ${aylar[d.month - 1]} ${d.year}';
  }

  String _tarihKisa(String? tarih) {
    if (tarih == null) return '';
    final d = DateTime.tryParse(tarih);
    if (d == null) return '';
    return '${d.day}.${d.month}.${d.year}';
  }
}