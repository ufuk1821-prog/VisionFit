import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';

const Map<String, String> hareketEtiketler = {
  'squat_session': 'Squat Oturum Analizi', 'dogru_squat': 'Squat Anlık', 'yanlis_squat': 'Squat Anlık',
  'plank': 'Plank', 'sinav': 'Şınav', 'kopru': 'Köprü', 'yan_plank': 'Yan Plank',
  'duvar_squat': 'Duvar Squat', 'supermen': 'Süpermen',
};
const Map<String, String> hareketEmoji = {
  'squat_session': '🏋️', 'dogru_squat': '🏋️', 'yanlis_squat': '🏋️',
  'plank': '🧘', 'sinav': '💪', 'kopru': '🌉', 'yan_plank': '↔️',
  'duvar_squat': '🧱', 'supermen': '🦸',
};
const List<String> aciGostermeyenHareketler = ['plank', 'sinav', 'kopru', 'yan_plank', 'supermen'];

class GecmisEkrani extends StatefulWidget {
  const GecmisEkrani({super.key});
  @override
  State<GecmisEkrani> createState() => _GecmisEkraniState();
}

class _GecmisEkraniState extends State<GecmisEkrani> {
  List _kayitlar = [];
  bool _yukleniyor = true;
  String _filtre = 'tumu';
  int? _acikKart;

  @override
  void initState() { super.initState(); _yukle(); }

  Future<void> _yukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/analyze/history');
      setState(() { _kayitlar = veri is List ? veri : []; _yukleniyor = false; });
    } catch (_) { setState(() { _yukleniyor = false; }); }
  }

  Future<void> _sil(int id) async {
    await ApiServisi.deleteJson('/api/analyze/history/$id');
    setState(() { _kayitlar.removeWhere((k) => k['id'] == id); });
  }


  Color _skorRengi(int skor) {
    if (skor >= 75) return kGreen;
    if (skor >= 50) return kAmber;
    return kRed;
  }

  String _skorEtiket(int skor) {
    if (skor >= 75) return 'İyi Form ✓';
    if (skor >= 50) return 'Geliştirilebilir';
    return 'Düzeltme Gerekli';
  }

  List get _filtreliKayitlar {
    if (_filtre == 'oturum') return _kayitlar.where((k) => k['hareket_adi'] == 'squat_session').toList();
    if (_filtre == 'anlik') return _kayitlar.where((k) => k['hareket_adi'] != 'squat_session').toList();
    return _kayitlar;
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: kRed));
    final liste = _filtreliKayitlar;

    return RefreshIndicator(
      color: kRed,
      onRefresh: _yukle,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Geçmiş Antrenmanlar', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
              Text('${_kayitlar.length} KAYIT', style: kLabel(context)),
            ]),
            const SizedBox(height: 4),
            Text('Geçmiş performansını ve analiz kayıtlarını incele.', style: kBody(context, size: 13, color: kHint(context))),
            const SizedBox(height: 16),
            _filtreSatiri(context),

            const SizedBox(height: 16),
            if (liste.isEmpty) _bosEkran(context) else ...liste.map((k) => _kayitKarti(context, k)),
          ],
        ),
      ),
    );
  }

  Widget _bosEkran(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: kSurface(context), shape: BoxShape.circle, border: Border.all(color: kBorder(context))),
            child: const Text('🏋️', style: TextStyle(fontSize: 40)),
          ),
          const SizedBox(height: 20),
          Text('Henüz antrenman kaydı yok', style: kHeadline(context, size: 16)),
          const SizedBox(height: 8),
          Text('Kamera veya fotoğraflı analiz yaparak\nilk kaydını oluştur!', style: kBody(context, size: 13, color: kHint(context)), textAlign: TextAlign.center),
        ]),
      ),
    );
  }

  Widget _filtreSatiri(BuildContext context) {
    final filtreler = [
      ('tumu', 'Tümü', _kayitlar.length),
      ('oturum', 'Oturum', _kayitlar.where((k) => k['hareket_adi'] == 'squat_session').length),
      ('anlik', 'Anlık', _kayitlar.where((k) => k['hareket_adi'] != 'squat_session').length),
    ];

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: kSurfaceContainer(context),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kBorder(context)),
      ),
      child: Row(
        children: filtreler.map((f) => Expanded(
          child: GestureDetector(
            onTap: () => setState(() { _filtre = f.$1; }),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: _filtre == f.$1 ? kRed : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(children: [
                Text('${f.$3}', style: kHeadline(context, size: 16, weight: FontWeight.w700, color: _filtre == f.$1 ? Colors.white : kHint(context))),
                Text(f.$2, style: kLabel(context, size: 10, color: _filtre == f.$1 ? Colors.white70 : kHint(context))),
              ]),
            ),
          ),
        )).toList(),
      ),
    );
  }


  Widget _kayitKarti(BuildContext context, Map kayit) {
    final id = kayit['id'] as int;
    final hareket = kayit['hareket_adi'] as String? ?? '';
    final etiket = hareketEtiketler[hareket] ?? hareket;
    final emoji = hareketEmoji[hareket] ?? '💪';
    final skor = (kayit['eminlik_skoru'] as num?)?.toInt() ?? 0;
    final not = kayit['antrenor_notu'] as String? ?? '';
    final tarih = DateTime.tryParse(kayit['tarih'] ?? '');
    final acik = _acikKart == id;
    final renk = _skorRengi(skor);

    return GestureDetector(
      onTap: () => setState(() { _acikKart = acik ? null : id; }),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: kSurfaceLow(context),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: acik ? kRed.withOpacity(0.4) : kBorder(context)),
        ),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: renk.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                child: Center(child: Text(emoji, style: const TextStyle(fontSize: 20))),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(etiket, style: kBody(context, size: 14, weight: FontWeight.w600, color: kText(context))),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: renk.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
                  child: Text('$skor% — ${_skorEtiket(skor)}', style: kLabel(context, size: 10, color: renk)),
                ),
                if (tarih != null) ...[
                  const SizedBox(height: 2),
                  Text('${tarih.day}.${tarih.month}.${tarih.year}  ${tarih.hour.toString().padLeft(2, '0')}:${tarih.minute.toString().padLeft(2, '0')}', style: kLabel(context, size: 10, color: kHint(context))),
                ],
              ])),
              Icon(acik ? Icons.expand_less : Icons.expand_more, color: kHint(context), size: 20),
              const SizedBox(width: 4),
              PopupMenuButton(
                icon: Icon(Icons.more_vert, color: kHint(context), size: 20),
                color: kSurface(context),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: BorderSide(color: kBorder(context))),
                itemBuilder: (_) => [
                  PopupMenuItem(
                    onTap: () => _sil(id),
                    child: Row(children: [
                      const Icon(Icons.delete_outline, color: kRed, size: 18),
                      const SizedBox(width: 8),
                      Text('Kaydı Sil', style: kBody(context, size: 13, color: kRed)),
                    ]),
                  ),
                ],
              ),
            ]),
          ),
          if (acik)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Divider(color: kBorder(context).withOpacity(0.5)),
                const SizedBox(height: 6),
                if (!aciGostermeyenHareketler.contains(hareket) && kayit['diz_acisi'] != null)
                  _detay(context, '📐 Diz Açısı', '${(kayit['diz_acisi'] as num).round()}°'),
                if (not.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: kSurfaceLowest(context), borderRadius: BorderRadius.circular(8), border: Border.all(color: kBorder(context))),
                    child: Text(not, style: kBody(context, size: 12, color: kText(context))),
                  ),
                ],
              ]),
            ),
        ]),
      ),
    );
  }

  Widget _detay(BuildContext context, String baslik, String deger) {
    return Row(children: [
      Text(baslik, style: kBody(context, size: 12, color: kHint(context))),
      const SizedBox(width: 8),
      Text(deger, style: kBody(context, size: 12, weight: FontWeight.w600, color: kText(context))),
    ]);
  }
}