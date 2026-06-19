import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import '../tema.dart';
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
    if (skor >= 75) return kGreen;
    if (skor >= 50) return kAmber;
    return kRed;
  }

  String _skorEtiket(int skor) {
    if (skor >= 75) return 'İyi Form ✓';
    if (skor >= 50) return 'Geliştirilebilir';
    return 'Form Düzeltmesi Gerekiyor';
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Fotoğraflı Analiz', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('Hareketi seç, fotoğraf çek, anında analiz al.', style: kBody(context, size: 13, color: kHint(context))),
          const SizedBox(height: 16),
          _sekmeler(context),
          const SizedBox(height: 16),
          _fotoAlani(context),
          const SizedBox(height: 16),
          if (_hata.isNotEmpty) _hataKarti(context),
          if (_sonuc != null) _sonucKarti(context),
          _bilgiKarti(context),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _sekmeler(BuildContext context) {
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
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: secili ? kRed : kSurfaceLow(context),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: secili ? kRed : kBorder(context)),
                ),
                child: Text(h['label'], style: kLabel(context, size: 11, color: secili ? Colors.white : kHint(context))),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _fotoAlani(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorderAlt(context))),
      child: Column(children: [
        if (_foto != null)
          ClipRRect(borderRadius: const BorderRadius.vertical(top: Radius.circular(14)), child: Image.file(_foto!, width: double.infinity, height: 280, fit: BoxFit.cover))
        else
          Container(
            height: 200,
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: kRed.withOpacity(0.1), shape: BoxShape.circle), child: const Icon(Icons.add_photo_alternate_outlined, color: kRed, size: 36)),
              const SizedBox(height: 12),
              Text('Fotoğraf seçin veya çekin', style: kBody(context, size: 14, weight: FontWeight.w600, color: kText(context))),
              const SizedBox(height: 4),
              Text('Yandan çekilmiş, tüm vücudunuzun göründüğü bir fotoğraf', style: kBody(context, size: 12, color: kHint(context)), textAlign: TextAlign.center),
            ]),
          ),
        if (_yukleniyor)
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: kRed, strokeWidth: 2)),
              const SizedBox(width: 10),
              Text('Analiz yapılıyor...', style: kBody(context, size: 13, color: kHint(context))),
            ]),
          ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            Expanded(child: OutlinedButton.icon(
              onPressed: _yukleniyor ? null : () => _fotoCek(ImageSource.gallery),
              icon: const Icon(Icons.photo_library_outlined, size: 18, color: kRed),
              label: Text('GALERİDEN SEÇ', style: kLabel(context, size: 10, color: kRed)),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: kRed), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 12)),
            )),
            const SizedBox(width: 8),
            Expanded(child: ElevatedButton.icon(
              onPressed: _yukleniyor ? null : () => _fotoCek(ImageSource.camera),
              icon: const Icon(Icons.camera_alt_outlined, size: 18, color: Colors.white),
              label: Text('KAMERAYLA ÇEK', style: kLabel(context, size: 10, color: Colors.white)),
              style: ElevatedButton.styleFrom(backgroundColor: kRed, disabledBackgroundColor: kRed.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 12), elevation: 0),
            )),
          ]),
        ),
      ]),
    );
  }

  Widget _hataKarti(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kRed.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kRed.withOpacity(0.4))),
      child: Row(children: [
        const Icon(Icons.warning_amber_outlined, color: kRed, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Text(_hata, style: kBody(context, size: 13, color: kRed))),
      ]),
    );
  }

  Widget _sonucKarti(BuildContext context) {
    final skor = _sonuc!['eminlik_skoru'] as int? ?? 0;
    final not = _sonuc!['antrenor_notu'] as String? ?? '';
    final renk = _skorRengi(skor);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: renk.withOpacity(0.4))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(color: renk.withOpacity(0.12), borderRadius: BorderRadius.circular(12), border: Border.all(color: renk.withOpacity(0.3))),
            child: Center(child: Text('$skor%', style: kHeadline(context, size: 18, weight: FontWeight.w900, color: renk))),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${_hareket['label']} Analiz Sonucu', style: kBody(context, size: 14, weight: FontWeight.w700, color: kText(context))),
            const SizedBox(height: 4),
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: renk.withOpacity(0.12), borderRadius: BorderRadius.circular(6)), child: Text(_skorEtiket(skor), style: kLabel(context, size: 10, color: renk))),
          ])),
        ]),
        if (not.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(height: 1, color: kBorder(context)),
          const SizedBox(height: 10),
          Text(not, style: kBody(context, size: 13, color: kText(context))),
        ],
      ]),
    );
  }

  Widget _bilgiKarti(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorder(context))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.check_circle_outline, color: kRed, size: 18),
          const SizedBox(width: 8),
          Text('${_hareket['label']} — Doğru Form', style: kBody(context, size: 14, weight: FontWeight.w700, color: kText(context))),
        ]),
        const SizedBox(height: 8),
        Text(_hareket['dogruForm'], style: kBody(context, size: 13, color: kText(context))),
        const SizedBox(height: 14),
        Row(children: [
          const Icon(Icons.info_outline, color: kBlue, size: 16),
          const SizedBox(width: 6),
          Text('Bu Analiz Nasıl Çalışır?', style: kBody(context, size: 13, weight: FontWeight.w600, color: kBlue)),
        ]),
        const SizedBox(height: 6),
        Text(_hareket['nasilCalisir'], style: kBody(context, size: 12, color: kHint(context))),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: kSurfaceLowest(context), borderRadius: BorderRadius.circular(8), border: Border.all(color: kBorder(context))),
          child: Column(children: [
            _ipucuSatir(context, '💡 Telefonu yere paralel, yandan bakacak şekilde konumlandırın.'),
            _ipucuSatir(context, '📐 Baştan ayağa tüm vücudunuz kadrajda olsun.'),
            _ipucuSatir(context, '☀️ Ortam aydınlık olsun, vücut hattınız net seçilsin.'),
            _ipucuSatir(context, '👕 Dar kıyafet daha doğru sonuç verir.'),
          ]),
        ),
      ]),
    );
  }

  Widget _ipucuSatir(BuildContext context, String metin) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: Text(metin, style: kBody(context, size: 12, color: kHint(context))))]),
    );
  }
}