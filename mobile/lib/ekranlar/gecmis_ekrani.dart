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
  int _analizSayi = 10;
  String _analizSonuc = '';
  bool _analizYukleniyor = false;

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

  Future<void> _analizEt() async {
    setState(() { _analizYukleniyor = true; _analizSonuc = ''; });
    try {
      final yanit = await ApiServisi.postJson('/api/yerel-ai/gecmis-analizi?sayi=$_analizSayi', {});
      setState(() { _analizSonuc = yanit['yorum'] ?? ''; });
    } catch (_) {
      setState(() { _analizSonuc = 'Analiz alınamadı, lütfen tekrar deneyin.'; });
    } finally {
      setState(() { _analizYukleniyor = false; });
    }
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
            Text('Geçmiş performansını ve AI analizlerini incele.', style: kBody(context, size: 13, color: kHint(context))),
            const SizedBox(height: 16),
            _filtreSatiri(context),
            const SizedBox(height: 16),
            _analizKarti(context),
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

  Widget _analizKarti(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kSurfaceLow(context),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorderAlt(context)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.auto_awesome, color: kPurple, size: 18),
          const SizedBox(width: 8),
          Text('AI ANTRENMAN ANALİZİ', style: kLabel(context, color: kText(context))),
        ]),
        const SizedBox(height: 4),
        Text('Son antrenmalarını yapay zeka ile analiz et', style: kBody(context, size: 12, color: kHint(context))),
        const SizedBox(height: 14),
        Row(children: [
          Text('Son ', style: kBody(context, size: 13, color: kHint(context))),
          SizedBox(
            width: 52,
            child: TextFormField(
              initialValue: '$_analizSayi',
              keyboardType: TextInputType.number,
              style: kBody(context, color: kText(context)),
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                filled: true, fillColor: kSurfaceLowest(context),
                contentPadding: const EdgeInsets.symmetric(vertical: 6),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed, width: 1.5)),
              ),
              onChanged: (v) { final n = int.tryParse(v); if (n != null && n >= 1 && n <= 30) setState(() { _analizSayi = n; }); },
            ),
          ),
          Text(' antrenmanı', style: kBody(context, size: 13, color: kHint(context))),
          const Spacer(),
          SizedBox(
            height: 36,
            child: ElevatedButton.icon(
              onPressed: _analizYukleniyor ? null : _analizEt,
              icon: _analizYukleniyor
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.play_arrow, size: 16),
              label: Text(_analizYukleniyor ? 'ANALİZ...' : 'ANALİZ ET', style: kLabel(context, size: 10, color: Colors.white)),
              style: ElevatedButton.styleFrom(backgroundColor: kRed, padding: const EdgeInsets.symmetric(horizontal: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0),
            ),
          ),
        ]),
        if (_analizSonuc.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: kSurfaceLowest(context), borderRadius: BorderRadius.circular(8), border: Border.all(color: kBorder(context))),
            child: Text(_analizSonuc, style: kBody(context, size: 13, color: kText(context))),
          ),
        ],
      ]),
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