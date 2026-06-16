import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';

const Map<String, String> hareketEtiketler = {
  'squat_session': 'Squat - Tüm Vücut Analizi',
  'dogru_squat': 'Squat - Anlık Kayıt',
  'yanlis_squat': 'Squat - Anlık Kayıt',
  'plank': 'Plank Analizi',
  'sinav': 'Şınav Analizi',
  'kopru': 'Köprü Analizi',
  'yan_plank': 'Yan Plank Analizi',
  'duvar_squat': 'Duvar Squat Analizi',
  'supermen': 'Süpermen Analizi',
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
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/analyze/history');
      setState(() { _kayitlar = veri is List ? veri : []; _yukleniyor = false; });
    } catch (e) {
      setState(() { _yukleniyor = false; });
    }
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
    } catch (e) {
      setState(() { _analizSonuc = 'Analiz alınamadı, lütfen tekrar deneyin.'; });
    } finally {
      setState(() { _analizYukleniyor = false; });
    }
  }

  Color _skorRengi(int skor) {
    if (skor >= 75) return const Color(0xFFE8313F);
    if (skor >= 50) return const Color(0xFF3B82F6);
    return const Color(0xFFEF4444);
  }

  List _filtreliKayitlar() {
    if (_filtre == 'tumu') return _kayitlar;
    if (_filtre == 'oturum') return _kayitlar.where((k) => k['hareket_adi'] == 'squat_session').toList();
    return _kayitlar.where((k) => k['hareket_adi'] != 'squat_session').toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: Color(0xFFE8313F)));

    final liste = _filtreliKayitlar();

    return RefreshIndicator(
      color: const Color(0xFFE8313F),
      onRefresh: _yukle,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Geçmiş Antrenmanlar', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            _filtreSatiri(),
            const SizedBox(height: 16),
            _analizKarti(),
            const SizedBox(height: 16),
            if (liste.isEmpty)
              const Center(child: Padding(
                padding: EdgeInsets.all(32),
                child: Text('Henüz antrenman kaydı yok.', style: TextStyle(color: Color(0xFF888888))),
              ))
            else
              ...liste.map((k) => _kayitKarti(k)),
          ],
        ),
      ),
    );
  }

  Widget _filtreSatiri() {
    final filtreler = [('tumu', 'Tümü'), ('oturum', 'Oturum'), ('anlik', 'Anlık')];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filtreler.map((f) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => setState(() { _filtre = f.$1; }),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: _filtre == f.$1 ? const Color(0xFFE8313F) : const Color(0xFF1A1A1A),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _filtre == f.$1 ? const Color(0xFFE8313F) : const Color(0xFF333333)),
              ),
              child: Text(f.$2, style: TextStyle(color: _filtre == f.$1 ? Colors.white : const Color(0xFF888888), fontSize: 13)),
            ),
          ),
        )).toList(),
      ),
    );
  }

  Widget _analizKarti() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [
            Icon(Icons.auto_awesome, color: Color(0xFFE8313F), size: 18),
            SizedBox(width: 8),
            Text('Antrenmanlarımı Analiz Et', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            const Text('Son ', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
            SizedBox(
              width: 60,
              child: TextFormField(
                initialValue: '$_analizSayi',
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                textAlign: TextAlign.center,
                decoration: InputDecoration(
                  filled: true, fillColor: const Color(0xFF0F0F0F),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF333333))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF333333))),
                  contentPadding: const EdgeInsets.symmetric(vertical: 8),
                ),
                onChanged: (v) {
                  final n = int.tryParse(v);
                  if (n != null && n >= 1 && n <= 30) setState(() { _analizSayi = n; });
                },
              ),
            ),
            const SizedBox(width: 8),
            const Text('antrenmanı analiz et', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
            const Spacer(),
            ElevatedButton(
              onPressed: _analizYukleniyor ? null : _analizEt,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
              child: Text(_analizYukleniyor ? 'Analiz ediliyor...' : 'Analiz Et', style: const TextStyle(color: Colors.white, fontSize: 12)),
            ),
          ]),
          if (_analizSonuc.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(_analizSonuc, style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.6)),
          ],
        ],
      ),
    );
  }

  Widget _kayitKarti(Map kayit) {
    final id = kayit['id'] as int;
    final hareket = kayit['hareket_adi'] as String? ?? '';
    final etiket = hareketEtiketler[hareket] ?? hareket;
    final skor = kayit['eminlik_skoru'] as int? ?? 0;
    final not = kayit['antrenor_notu'] as String? ?? '';
    final tarih = DateTime.tryParse(kayit['tarih'] ?? '');
    final acik = _acikKart == id;

    return GestureDetector(
      onTap: () => setState(() { _acikKart = acik ? null : id; }),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: _skorRengi(skor).withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                    child: Center(child: Text('$skor%', style: TextStyle(color: _skorRengi(skor), fontWeight: FontWeight.w700, fontSize: 13))),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(etiket, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                      if (tarih != null) Text('${tarih.day}.${tarih.month}.${tarih.year}', style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
                    ],
                  )),
                  Icon(acik ? Icons.expand_less : Icons.expand_more, color: const Color(0xFF888888)),
                  const SizedBox(width: 4),
                  PopupMenuButton(
                    icon: const Icon(Icons.more_vert, color: Color(0xFF888888), size: 20),
                    color: const Color(0xFF1A1A1A),
                    itemBuilder: (_) => [
                      PopupMenuItem(
                        onTap: () => _sil(id),
                        child: const Row(children: [Icon(Icons.delete_outline, color: Color(0xFFE8313F), size: 18), SizedBox(width: 8), Text('Bu Kaydı Sil', style: TextStyle(color: Color(0xFFE8313F)))]),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (acik)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Divider(color: Color(0xFF333333)),
                    if (!aciGostermeyenHareketler.contains(hareket))
                      _detayItem('Ortalama Diz Açısı', '${(kayit['diz_acisi'] as num?)?.round() ?? '-'}°'),
                    _detayItem('Skor', '$skor%'),
                    if (not.isNotEmpty) _detayItem('Antrenör Notu', not),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _detayItem(String baslik, String deger) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        Text('$baslik: ', style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
        Expanded(child: Text(deger, style: const TextStyle(color: Colors.white, fontSize: 13))),
      ]),
    );
  }
}