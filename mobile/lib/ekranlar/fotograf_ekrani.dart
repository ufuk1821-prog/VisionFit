import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import '../servisler/api_servisi.dart';

const List<Map<String, dynamic>> hareketler = [
  {'id': 'plank', 'label': 'Plank', 'endpoint': 'plank', 'dogruForm': 'Omuzlar, kalça ve ayak bilekleri tek düz çizgi üzerinde olmalı. Karın ve kalça kasları sıkı, bel ne yukarı kalkmalı ne aşağı çökmeli.', 'nasilCalisir': 'Sistem omuz, kalça ve ayak bileği noktalarını tespit eder ve düz hat oluşturup oluşturmadığını hesaplar.'},
  {'id': 'sinav', 'label': 'Şınav', 'endpoint': 'sinav', 'dogruForm': 'Alt pozisyonda omuzlar, kalça ve ayak bilekleri tek düz hat üzerinde olmalı. Kalça yukarı kalkmamalı, bel çökmemeli.', 'nasilCalisir': 'Şınavın alt pozisyonundaki fotoğrafta omuz, kalça ve ayak bileği noktaları plank ile aynı mantıkla kontrol edilir.'},
  {'id': 'kopru', 'label': 'Köprü', 'endpoint': 'kopru', 'dogruForm': 'Tepe noktasında omuzlar, kalça ve dizler tek düz hat oluşturmalı. Kalça ne çok düşük ne çok yukarı olmalı.', 'nasilCalisir': 'Omuz, kalça ve diz noktaları tespit edilir; kalçanın omuz-diz hattıyla aynı seviyede olup olmadığı hesaplanır.'},
  {'id': 'yan_plank', 'label': 'Yan Plank', 'endpoint': 'yan-plank', 'dogruForm': 'Baştan ayağa tek düz çizgi oluşturmalı. Kalça düşmemeli, aşırı yukarı kalkmamalı.', 'nasilCalisir': 'Yandan çekilmiş fotoğrafta omuz, kalça ve ayak bileği noktaları incelenir.'},
  {'id': 'duvar_squat', 'label': 'Duvar Squat', 'endpoint': 'duvar-squat', 'dogruForm': 'Sırtınız duvara yaslı, dizleriniz yaklaşık 90 derece açıda olmalı. Ağırlığınız topuklarınızda.', 'nasilCalisir': 'Kalça, diz ve ayak bileği noktalarından diz açısı hesaplanır.'},
  {'id': 'supermen', 'label': 'Süpermen', 'endpoint': 'supermen', 'dogruForm': 'Yüzüstü pozisyonda kollar ve bacaklar aynı anda yukarı kaldırılmalı, omurga doğal kavisinde.', 'nasilCalisir': 'Kol ve bacakların kalçaya göre ne kadar yukarı kaldırıldığı ölçülür.'},
  {'id': 'lunge', 'label': 'Lunge', 'endpoint': 'lunge', 'dogruForm': 'Öne adım at, ön diz 90° açıda olsun. Gövden dik, arka diz yere yakın. Ön diz ayak ucunu geçmesin.', 'nasilCalisir': 'Ön bacağın kalça-diz-ayak bileği açısı ve gövde eğimi ölçülür.'},
  {'id': 'omuz_acikligi', 'label': 'Omuz Açıklığı', 'endpoint': 'omuz-acikligi', 'dogruForm': 'Kollar tam olarak yanlara, omuz hizasında T şeklinde açık. Her iki kol aynı seviyede.', 'nasilCalisir': 'Bilek konumları omuz hizasıyla karşılaştırılır, kol açıları ölçülür.'},
  {'id': 'one_egilme', 'label': 'Öne Eğilme', 'endpoint': 'one-egilme', 'dogruForm': 'Ayakta dur, öne doğru eğil. Dizler düz veya hafif bükülü, eller yere mümkün olduğunca yakın.', 'nasilCalisir': 'Kalça açısı ve ellerin zemine mesafesi ölçülerek esneklik belirlenir.'},
  {'id': 'ters_kopru', 'label': 'Ters Köprü', 'endpoint': 'ters-kopru', 'dogruForm': 'Yere otur, ellerini arkanıza koy, kalçanı yukarı kaldır. Diz açısı ~90°, gövde düz.', 'nasilCalisir': 'Kalça yüksekliği ve diz açısı ölçülerek form değerlendirilir.'},
];

class FotografEkrani extends StatefulWidget {
  const FotografEkrani({super.key});

  @override
  State<FotografEkrani> createState() => _FotografEkraniState();
}

class _FotografEkraniState extends State<FotografEkrani> {
  String _secili = 'plank';
  File? _foto;
  bool _yukleniyor = false;
  Map<String, dynamic>? _sonuc;
  String _hata = '';

  Map<String, dynamic> get _hareket => hareketler.firstWhere((h) => h['id'] == _secili);

  Future<void> _fotoCek(ImageSource kaynak) async {
    final picker = ImagePicker();
    final secilen = await picker.pickImage(source: kaynak, imageQuality: 85);
    if (secilen == null) return;
    setState(() { _foto = File(secilen.path); _sonuc = null; _hata = ''; });
    _analizEt();
  }

  Future<void> _analizEt() async {
    if (_foto == null) return;
    setState(() { _yukleniyor = true; _hata = ''; _sonuc = null; });
    try {
      final poseDetector = PoseDetector(options: PoseDetectorOptions(mode: PoseDetectionMode.single));
      final inputImage = InputImage.fromFile(_foto!);
      final poses = await poseDetector.processImage(inputImage);
      poseDetector.close();

      if (poses.isEmpty) {
        setState(() { _hata = 'Fotoğrafta vücut tespit edilemedi. Lütfen tüm vücudunuzun göründüğü, yandan çekilmiş bir fotoğraf yükleyin.'; _yukleniyor = false; });
        return;
      }

      final pose = poses.first;
      final landmarks = pose.landmarks.values.map((lm) => [lm.x, lm.y, lm.z, lm.likelihood]).toList();

      final yanit = await ApiServisi.postJson('/api/analyze/${_hareket['endpoint']}', {'landmarks': landmarks});
      setState(() { _sonuc = Map<String, dynamic>.from(yanit); });

      if (_sonuc != null && _sonuc!['antrenor_notu'] != null) {
        final not = _sonuc!['antrenor_notu'] as String;
        final hedefHareket = _hareket['label'] as String;
        if (!not.toLowerCase().contains(hedefHareket.toLowerCase()) && _sonuc!['eminlik_skoru'] != null) {
          final skor = _sonuc!['eminlik_skoru'] as int;
          if (skor < 30) {
            setState(() { _hata = '$hedefHareket fotoğrafı bekleniyor. Lütfen doğru hareketi seçtiğinizden emin olun.'; });
          }
        }
      }
    } catch (e) {
      setState(() { _hata = 'Analiz sırasında hata oluştu: $e'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  Color _skorRengi(int skor) {
    if (skor >= 75) return const Color(0xFF4CAF50);
    if (skor >= 50) return const Color(0xFFF59E0B);
    return const Color(0xFFE8313F);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Fotoğraflı Analiz', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          _sekmeler(),
          const SizedBox(height: 16),
          _fotoAlani(),
          const SizedBox(height: 16),
          if (_hata.isNotEmpty) _hataKarti(),
          if (_sonuc != null) _sonucKarti(),
          const SizedBox(height: 16),
          _bilgiKarti(),
        ],
      ),
    );
  }

  Widget _sekmeler() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: hareketler.map((h) {
          final secili = _secili == h['id'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() { _secili = h['id']; _sonuc = null; _hata = ''; _foto = null; }),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: secili ? const Color(0xFFE8313F) : const Color(0xFF1A1A1A),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: secili ? const Color(0xFFE8313F) : const Color(0xFF333333)),
                ),
                child: Text(h['label'], style: TextStyle(color: secili ? Colors.white : const Color(0xFF888888), fontSize: 13, fontWeight: secili ? FontWeight.w600 : FontWeight.normal)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _fotoAlani() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFF333333))),
      child: Column(children: [
        if (_foto != null)
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Image.file(_foto!, width: double.infinity, height: 280, fit: BoxFit.cover),
          ),
        if (_foto == null)
          Container(
            height: 200,
            decoration: const BoxDecoration(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.add_photo_alternate_outlined, color: Color(0xFF888888), size: 48),
              const SizedBox(height: 12),
              const Text('Fotoğraf seçin veya çekin', style: TextStyle(color: Color(0xFF888888), fontSize: 14)),
              const SizedBox(height: 4),
              const Text('Yandan çekilmiş, tüm vücudunuzun göründüğü bir fotoğraf', style: TextStyle(color: Color(0xFF555555), fontSize: 12), textAlign: TextAlign.center),
            ]),
          ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            Expanded(child: OutlinedButton.icon(
              onPressed: _yukleniyor ? null : () => _fotoCek(ImageSource.gallery),
              icon: const Icon(Icons.photo_library_outlined, size: 18, color: Color(0xFFE8313F)),
              label: const Text('Galeriden Seç', style: TextStyle(color: Color(0xFFE8313F))),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFFE8313F)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            )),
            const SizedBox(width: 8),
            Expanded(child: ElevatedButton.icon(
              onPressed: _yukleniyor ? null : () => _fotoCek(ImageSource.camera),
              icon: const Icon(Icons.camera_alt_outlined, size: 18, color: Colors.white),
              label: Text(_yukleniyor ? 'Analiz...' : 'Kamera ile Çek', style: const TextStyle(color: Colors.white)),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            )),
          ]),
        ),
      ]),
    );
  }

  Widget _hataKarti() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFFE8313F).withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE8313F).withOpacity(0.4))),
      child: Row(children: [
        const Icon(Icons.warning_amber_outlined, color: Color(0xFFE8313F), size: 20),
        const SizedBox(width: 10),
        Expanded(child: Text(_hata, style: const TextStyle(color: Color(0xFFE8313F), fontSize: 13))),
      ]),
    );
  }

  Widget _sonucKarti() {
    final skor = _sonuc!['eminlik_skoru'] as int? ?? 0;
    final not = _sonuc!['antrenor_notu'] as String? ?? '';
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: _skorRengi(skor).withOpacity(0.4))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(color: _skorRengi(skor).withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
            child: Center(child: Text('$skor%', style: TextStyle(color: _skorRengi(skor), fontWeight: FontWeight.w800, fontSize: 16))),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${_hareket['label']} Analiz Sonucu', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(skor >= 75 ? 'İyi Form ✓' : skor >= 50 ? 'Geliştirilebilir' : 'Form Düzeltmesi Gerekiyor', style: TextStyle(color: _skorRengi(skor), fontSize: 13)),
          ])),
        ]),
        if (not.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Divider(color: Color(0xFF333333)),
          const SizedBox(height: 8),
          Text(not, style: const TextStyle(color: Color(0xFFCCCCCC), fontSize: 13, height: 1.6)),
        ],
      ]),
    );
  }

  Widget _bilgiKarti() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('${_hareket['label']} — Doğru Form', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        Text(_hareket['dogruForm'], style: const TextStyle(color: Color(0xFFCCCCCC), fontSize: 13, height: 1.6)),
        const SizedBox(height: 12),
        const Row(children: [
          Icon(Icons.info_outline, color: Color(0xFF3B82F6), size: 16),
          SizedBox(width: 6),
          Text('Bu Analiz Nasıl Çalışır?', style: TextStyle(color: Color(0xFF3B82F6), fontSize: 13, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 6),
        Text(_hareket['nasilCalisir'], style: const TextStyle(color: Color(0xFF888888), fontSize: 12, height: 1.5)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: const Color(0xFF0F0F0F), borderRadius: BorderRadius.circular(8)),
          child: const Column(children: [
            _ipucu('💡 Telefonu yere paralel, yandan bakacak şekilde konumlandırın.'),
            _ipucu('📐 Baştan ayağa tüm vücudunuz kadrajda olsun.'),
            _ipucu('☀️ Ortam aydınlık olsun, vücut hattınız net seçilsin.'),
            _ipucu('👕 Dar kıyafet daha doğru sonuç verir.'),
          ]),
        ),
      ]),
    );
  }
}

class _ipucu extends StatelessWidget {
  final String metin;
  const _ipucu(this.metin);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: Text(metin, style: const TextStyle(color: Color(0xFF888888), fontSize: 12, height: 1.4))),
      ]),
    );
  }
}