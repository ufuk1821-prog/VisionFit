import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';

const List<Map<String, String>> _tumRozetler = [
  {'baslik': 'İlk Adım', 'aciklama': 'İlk analizini tamamla', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Isınma Turu', 'aciklama': '5 analiz tamamla', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Devamlılık', 'aciklama': '10 analiz tamamla', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Squat Çırağı', 'aciklama': '20 squat analizi yap', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Erken Kalkan', 'aciklama': '7 gün sabah idmanı', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Form Takipçisi', 'aciklama': 'Plank analizini tamamla', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Su İçici', 'aciklama': '7 gün su takibi yap', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Adımcı', 'aciklama': 'Günde 5.000 adım at', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Defter Tutucu', 'aciklama': 'İlk antrenman notunu ekle', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Kalori Takipçisi', 'aciklama': '7 gün beslenme takibi yap', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Çok Yönlü', 'aciklama': '5 farklı hareket dene', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Kütüphane Meraklısı', 'aciklama': 'Egzersiz kütüphanesinde 10 hareket incele', 'seviye': 'Bronz', 'emoji': '🥉'},
  {'baslik': 'Hız Canavarı', 'aciklama': '50 analiz tamamla', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'Form Koçu', 'aciklama': '10 farklı hareketi analiz et', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'Adım Şampiyonu', 'aciklama': 'Günde 10.000 adım at', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'Hidrasyon Pro', 'aciklama': '30 gün su takibi yap', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'Haftalık Savaşçı', 'aciklama': '7 gün üst üste analiz yap', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'Squat Ustası', 'aciklama': '100 squat analizi tamamla', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'Diyet Takipçisi', 'aciklama': '30 gün beslenme takibi yap', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'Kondisyon Ustası', 'aciklama': '8 farklı hareket kategorisi dene', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'Aylık Sporcu', 'aciklama': '30 gün üst üste analiz yap', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'AI Dostu', 'aciklama': '10 AI analizi kullan', 'seviye': 'Gumus', 'emoji': '🥈'},
  {'baslik': 'Kusursuz Form', 'aciklama': '100 AI onaylı squat', 'seviye': 'Altin', 'emoji': '🥇'},
  {'baslik': 'Yılın Sporcusu', 'aciklama': '365 gün devamlılık', 'seviye': 'Altin', 'emoji': '🥇'},
  {'baslik': 'VisionFit Efsanesi', 'aciklama': '500 analiz tamamla', 'seviye': 'Altin', 'emoji': '🥇'},
];

class RozetlerEkrani extends StatefulWidget {
  const RozetlerEkrani({super.key});
  @override
  State<RozetlerEkrani> createState() => _RozetlerEkraniState();
}

class _RozetlerEkraniState extends State<RozetlerEkrani> {
  List _rozetler = [];
  bool _yukleniyor = true;

  @override
  void initState() { super.initState(); _yukle(); }

  Future<void> _yukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/badges');
      setState(() { _rozetler = veri is List ? veri : []; _yukleniyor = false; });
    } catch (_) { setState(() { _yukleniyor = false; }); }
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: kRed));

    final kazanilan = _rozetler.where((r) => r['kazanildi'] == true).cast<Map>().toList();
    final kazanilmayanApi = _rozetler.where((r) => r['kazanildi'] != true).cast<Map>().toList();
    final toplam = _rozetler.isEmpty ? _tumRozetler.length : _rozetler.length;
    final kazanilanSayi = kazanilan.length;
    final yuzde = toplam == 0 ? 0.0 : kazanilanSayi / toplam;
    final gosterilecekKazanilmayan = _rozetler.isEmpty
        ? _tumRozetler.map((r) => <String, dynamic>{...r, 'kazanildi': false}).toList()
        : kazanilmayanApi;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text('Rozetlerim', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: kRed.withOpacity(0.12), borderRadius: BorderRadius.circular(20), border: Border.all(color: kRed.withOpacity(0.3))),
              child: Text('$kazanilanSayi/$toplam', style: kLabel(context, size: 12, color: kRed)),
            ),
          ]),
          const SizedBox(height: 4),
          Text('$kazanilanSayi/$toplam Rozet Kilidi Açıldı', style: kBody(context, size: 13, color: kHint(context))),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: Container(
                height: 8,
                decoration: BoxDecoration(color: kSurfaceHigh(context), borderRadius: BorderRadius.circular(99), border: Border.all(color: kBorder(context))),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: yuzde,
                  child: Container(decoration: BoxDecoration(color: kRed, borderRadius: BorderRadius.circular(99))),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text('%${(yuzde * 100).round()} TAMAMLANDI', style: kLabel(context, size: 10, color: kRed)),
          ]),
          const SizedBox(height: 24),
          if (kazanilan.isNotEmpty) ...[
            _bolumBasligi(context, 'Kazanılan Rozetler', Icons.stars, kRed),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.85),
              itemCount: kazanilan.length,
              itemBuilder: (_, i) => _rozetKarti(context, kazanilan[i], true),
            ),
            const SizedBox(height: 24),
          ],
          _bolumBasligi(context, 'Kazanılacak Rozetler', Icons.lock_outline, kHint(context)),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.85),
            itemCount: gosterilecekKazanilmayan.length,
            itemBuilder: (_, i) => _rozetKarti(context, gosterilecekKazanilmayan[i], false),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _bolumBasligi(BuildContext context, String baslik, IconData ikon, Color renk) {
    return Row(children: [
      Icon(ikon, color: renk, size: 18),
      const SizedBox(width: 8),
      Text(baslik, style: kBody(context, size: 15, weight: FontWeight.w700, color: renk == kHint(context) ? kHint(context) : kText(context))),
      const SizedBox(width: 8),
      Expanded(child: Container(height: 1, color: kBorder(context))),
    ]);
  }

  Widget _rozetKarti(BuildContext context, Map rozet, bool kazanildi) {
    final seviye = rozet['seviye'] as String? ?? 'Bronz';
    final Map<String, Color> seviyeRenk = {'Bronz': const Color(0xFFCD7F32), 'Gumus': const Color(0xFFC0C0C0), 'Altin': const Color(0xFFFFD700)};
    final Map<String, String> seviyeLabel = {'Bronz': 'BRONZ', 'Gumus': 'GÜMÜŞ', 'Altin': 'ALTIN'};
    final renk = seviyeRenk[seviye] ?? const Color(0xFFCD7F32);
    final emoji = rozet['emoji'] as String? ?? '🏅';

    return Opacity(
      opacity: kazanildi ? 1.0 : 0.4,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: kSurfaceLow(context),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kazanildi ? renk.withOpacity(0.5) : kBorder(context), width: kazanildi ? 1.5 : 1),
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              color: kazanildi ? renk.withOpacity(0.12) : kSurfaceContainer(context),
              shape: BoxShape.circle,
              border: Border.all(color: kazanildi ? renk.withOpacity(0.3) : kBorder(context)),
            ),
            child: Center(child: Text(kazanildi ? emoji : '🔒', style: const TextStyle(fontSize: 28))),
          ),
          const SizedBox(height: 10),
          if (kazanildi)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: renk.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
              child: Text(seviyeLabel[seviye] ?? seviye, style: kLabel(context, size: 9, color: renk)),
            ),
          const SizedBox(height: 4),
          Text(rozet['baslik'] ?? '', style: kBody(context, size: 12, weight: FontWeight.w700, color: kText(context)), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Text(rozet['aciklama'] ?? '', style: kLabel(context, size: 9, color: kHint(context)), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
        ]),
      ),
    );
  }
}