import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';

const Map<String, String> hareketEtiketler = {
  'squat_session': 'Squat Oturum Analizi',
  'dogru_squat': 'Squat Anlık',
  'yanlis_squat': 'Squat Anlık',
  'plank': 'Plank',
  'sinav': 'Şınav',
  'kopru': 'Köprü',
  'yan_plank': 'Yan Plank',
  'duvar_squat': 'Duvar Squat',
  'supermen': 'Süpermen',
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
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/analyze/history');
      setState(() { _kayitlar = veri is List ? veri : []; _yukleniyor = false; });
    } catch (_) {
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
    } catch (_) {
      setState(() { _analizSonuc = 'Analiz alınamadı, lütfen tekrar deneyin.'; });
    } finally {
      setState(() { _analizYukleniyor = false; });
    }
  }

  Color _skorRengi(int skor) {
    if (skor >= 75) return const Color(0xFF4CAF50);
    if (skor >= 50) return const Color(0xFFF59E0B);
    return const Color(0xFFE8313F);
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
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: Color(0xFFE8313F)));

    final liste = _filtreliKayitlar;

    return RefreshIndicator(
      color: const Color(0xFFE8313F),
      onRefresh: _yukle,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Geçmiş Antrenmanlar', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
              Text('${_kayitlar.length} kayıt', style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
            ]),
            const SizedBox(height: 16),
            _filtreSatiri(),
            const SizedBox(height: 16),
            _analizKarti(),
            const SizedBox(height: 16),
            if (liste.isEmpty)
              _bosEkran()
            else
              ...liste.map((k) => _kayitKarti(k)),
          ],
        ),
      ),
    );
  }

  Widget _bosEkran() {
    return Center(child: Padding(
      padding: const EdgeInsets.all(40),
      child: Column(children: [
        Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: const Color(0xFF333333), shape: BoxShape.circle), child: const Text('🏋️', style: TextStyle(fontSize: 40))),
        const SizedBox(height: 20),
        const Text('Henüz antrenman kaydı yok', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        const Text('Kamera veya fotoğraflı analiz yaparak\nilk kaydını oluştur!', style: TextStyle(color: Color(0xFF888888), fontSize: 13), textAlign: TextAlign.center),
      ]),
    ));
  }

  Widget _filtreSatiri() {
    final filtreler = [('tumu', 'Tümü', _kayitlar.length), ('oturum', 'Oturum', _kayitlar.where((k) => k['hareket_adi'] == 'squat_session').length), ('anlik', 'Anlık', _kayitlar.where((k) => k['hareket_adi'] != 'squat_session').length)];
    return Row(
      children: filtreler.map((f) => Expanded(child: Padding(
        padding: const EdgeInsets.only(right: 8),
        child: GestureDetector(
          onTap: () => setState(() { _filtre = f.$1; }),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: _filtre == f.$1 ? const Color(0xFFE8313F) : const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _filtre == f.$1 ? const Color(0xFFE8313F) : const Color(0xFF333333)),
            ),
            child: Column(children: [
              Text('${f.$3}', style: TextStyle(color: _filtre == f.$1 ? Colors.white : const Color(0xFF888888), fontSize: 16, fontWeight: FontWeight.w700)),
              Text(f.$2, style: TextStyle(color: _filtre == f.$1 ? Colors.white70 : const Color(0xFF666666), fontSize: 11)),
            ]),
          ),
        ),
      ))).toList(),
    );
  }

  Widget _analizKarti() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF333333)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.auto_awesome, color: Color(0xFFE8313F), size: 18),
          SizedBox(width: 8),
          Text('AI Antrenman Analizi', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 4),
        const Text('Son antrenmalarını yapay zeka ile analiz et', style: TextStyle(color: Color(0xFF888888), fontSize: 12)),
        const SizedBox(height: 12),
        Row(children: [
          const Text('Son ', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          SizedBox(
            width: 56,
            child: TextFormField(
              initialValue: '$_analizSayi',
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                filled: true, fillColor: const Color(0xFF0F0F0F),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF333333))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF333333))),
                contentPadding: const EdgeInsets.symmetric(vertical: 6),
              ),
              onChanged: (v) { final n = int.tryParse(v); if (n != null && n >= 1 && n <= 30) setState(() { _analizSayi = n; }); },
            ),
          ),
          const Text(' antrenmanı', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const Spacer(),
          ElevatedButton.icon(
            onPressed: _analizYukleniyor ? null : _analizEt,
            icon: _analizYukleniyor ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.play_arrow, size: 16),
            label: Text(_analizYukleniyor ? 'Analiz...' : 'Analiz Et'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
          ),
        ]),
        if (_analizSonuc.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFF0F0F0F), borderRadius: BorderRadius.circular(8)), child: Text(_analizSonuc, style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.6))),
        ],
      ]),
    );
  }

  Widget _kayitKarti(Map kayit) {
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
          color: const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: acik ? const Color(0xFFE8313F).withOpacity(0.4) : const Color(0xFF333333)),
        ),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: renk.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                child: Center(child: Text(emoji, style: const TextStyle(fontSize: 20))),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(etiket, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: renk.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                    child: Text('$skor% — ${_skorEtiket(skor)}', style: TextStyle(color: renk, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                ]),
                if (tarih != null) Text('${tarih.day}.${tarih.month}.${tarih.year} ${tarih.hour.toString().padLeft(2, '0')}:${tarih.minute.toString().padLeft(2, '0')}', style: const TextStyle(color: Color(0xFF666666), fontSize: 11)),
              ])),
              Icon(acik ? Icons.expand_less : Icons.expand_more, color: const Color(0xFF888888)),
              const SizedBox(width: 4),
              PopupMenuButton(
                icon: const Icon(Icons.more_vert, color: Color(0xFF888888), size: 20),
                color: const Color(0xFF1A1A1A),
                itemBuilder: (_) => [
                  PopupMenuItem(
                    onTap: () => _sil(id),
                    child: const Row(children: [Icon(Icons.delete_outline, color: Color(0xFFE8313F), size: 18), SizedBox(width: 8), Text('Sil', style: TextStyle(color: Color(0xFFE8313F)))]),
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
                const Divider(color: Color(0xFF333333)),
                const SizedBox(height: 6),
                if (!aciGostermeyenHareketler.contains(hareket) && kayit['diz_acisi'] != null)
                  _detay('📐 Diz Açısı', '${(kayit['diz_acisi'] as num).round()}°'),
                if (not.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: const Color(0xFF0F0F0F), borderRadius: BorderRadius.circular(8)),
                    child: Text(not, style: const TextStyle(color: Color(0xFFCCCCCC), fontSize: 12, height: 1.5)),
                  ),
                ],
              ]),
            ),
        ]),
      ),
    );
  }

  Widget _detay(String baslik, String deger) {
    return Row(children: [
      Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
      const SizedBox(width: 8),
      Text(deger, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
    ]);
  }
}