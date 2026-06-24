import 'dart:io';
import 'dart:ui' as ui;
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_pose_detection/flutter_pose_detection.dart';
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

const List<LandmarkType> mediapipeSirasi = [
  LandmarkType.nose, LandmarkType.leftEyeInner, LandmarkType.leftEye, LandmarkType.leftEyeOuter,
  LandmarkType.rightEyeInner, LandmarkType.rightEye, LandmarkType.rightEyeOuter,
  LandmarkType.leftEar, LandmarkType.rightEar, LandmarkType.mouthLeft, LandmarkType.mouthRight,
  LandmarkType.leftShoulder, LandmarkType.rightShoulder, LandmarkType.leftElbow, LandmarkType.rightElbow,
  LandmarkType.leftWrist, LandmarkType.rightWrist, LandmarkType.leftPinky, LandmarkType.rightPinky,
  LandmarkType.leftIndex, LandmarkType.rightIndex, LandmarkType.leftThumb, LandmarkType.rightThumb,
  LandmarkType.leftHip, LandmarkType.rightHip, LandmarkType.leftKnee, LandmarkType.rightKnee,
  LandmarkType.leftAnkle, LandmarkType.rightAnkle, LandmarkType.leftHeel, LandmarkType.rightHeel,
  LandmarkType.leftFootIndex, LandmarkType.rightFootIndex,
];

Future<List<double>> pozuFlatListeCevir(Pose pose, Uint8List goruntuBaytlari) async {
  final liste = <double>[];
  for (final tip in mediapipeSirasi) {
    final lm = pose.getLandmark(tip);
    liste.addAll([lm.x, lm.y, lm.z, lm.visibility]);
  }
  return liste;
}

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
  NpuPoseDetector? _detector;

  Map<String, dynamic> get _hareket => hareketler.firstWhere((h) => h['id'] == _secili);

  Future<NpuPoseDetector> _detectorAl() async {
    if (_detector != null) return _detector!;
    _detector = NpuPoseDetector();
    await _detector!.initialize();
    return _detector!;
  }

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
      final detector = await _detectorAl();
      final goruntuBaytlari = await _foto!.readAsBytes();
      final sonuc = await detector.detectPose(goruntuBaytlari);
      if (!sonuc.hasPoses) {
        setState(() { _hata = 'Fotoğrafta vücut tespit edilemedi. Lütfen tüm vücudunuzun göründüğü, yandan çekilmiş bir fotoğraf yükleyin.'; _yukleniyor = false; });
        return;
      }
      final pose = sonuc.firstPose!;
      final landmarks = await pozuFlatListeCevir(pose, goruntuBaytlari);
      final yanit = await ApiServisi.postJson('/api/analyze/${_hareket['endpoint']}', {'landmarks': landmarks});
      setState(() { _sonuc = Map<String, dynamic>.from(yanit); });
    } catch (e) {
      setState(() { _hata = 'Analiz sırasında hata oluştu: $e'; });
    } finally {
      if (mounted) setState(() { _yukleniyor = false; });
    }
  }

  int _sonucSkoruOku() {
    final sonuc = _sonuc;
    if (sonuc == null) return 0;
    final adaylar = [
      sonuc['skor'],
      sonuc['eminlik_skoru'],
      sonuc['eminlik'],
      sonuc['genel_skor'],
    ];
    for (final aday in adaylar) {
      if (aday is num) return aday.round().clamp(0, 100);
      final donusen = num.tryParse(aday?.toString() ?? '');
      if (donusen != null) return donusen.round().clamp(0, 100);
    }
    return 0;
  }

  String _sonucMesajiOku() {
    final sonuc = _sonuc;
    if (sonuc == null) return '';
    final adaylar = [
      sonuc['antrenor_mesaji'],
      sonuc['antrenor_notu'],
      sonuc['mesaj'],
      sonuc['durum'],
    ];
    for (final aday in adaylar) {
      final metin = aday?.toString().trim() ?? '';
      if (metin.isNotEmpty && metin.toLowerCase() != 'null') return metin;
    }
    return 'Analiz tamamlandı.';
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
  void dispose() {
    _detector?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Fotoğraflı Analiz', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text('Hareket seç, fotoğraf yükle, yapay zeka formunu değerlendirsin.', style: kBody(context, size: 13, color: kHint(context))),
        const SizedBox(height: 16),
        SizedBox(
          height: 40,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: hareketler.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final h = hareketler[i];
              final secili = h['id'] == _secili;
              return GestureDetector(
                onTap: () => setState(() { _secili = h['id']; _foto = null; _sonuc = null; _hata = ''; }),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: secili ? kRed : kSurfaceLow(context),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: secili ? kRed : kBorder(context)),
                  ),
                  alignment: Alignment.center,
                  child: Text(h['label'].toString().toUpperCase(), style: kLabel(context, size: 11, color: secili ? Colors.white : kHint(context))),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: _yukleniyor ? null : () => _fotoCek(ImageSource.gallery),
          child: Container(
            width: double.infinity, height: 220,
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorder(context))),
            child: _foto != null
                ? ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.file(_foto!, fit: BoxFit.cover, width: double.infinity, height: 220))
                : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.image_outlined, color: kHint(context), size: 40),
                    const SizedBox(height: 10),
                    Text('Fotoğraf seçmek için dokun', style: kBody(context, size: 13, color: kHint(context))),
                  ]),
          ),
        ),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: OutlinedButton.icon(onPressed: _yukleniyor ? null : () => _fotoCek(ImageSource.gallery), icon: const Icon(Icons.folder_outlined, color: kRed, size: 18), label: Text('GALERİ', style: kLabel(context, size: 10, color: kRed)), style: OutlinedButton.styleFrom(side: const BorderSide(color: kRed), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 14)))),
          const SizedBox(width: 12),
          Expanded(child: ElevatedButton.icon(onPressed: _yukleniyor ? null : () => _fotoCek(ImageSource.camera), icon: const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 18), label: Text('KAMERA', style: kLabel(context, size: 10, color: Colors.white)), style: ElevatedButton.styleFrom(backgroundColor: kRed, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 14), elevation: 0))),
        ]),
        if (_yukleniyor) ...[
          const SizedBox(height: 20),
          const Center(child: CircularProgressIndicator(color: kRed)),
        ],
        if (_hata.isNotEmpty && !_yukleniyor) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: kRed.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kRed.withOpacity(0.3))),
            child: Row(children: [const Icon(Icons.warning_amber_outlined, color: kRed, size: 18), const SizedBox(width: 8), Expanded(child: Text(_hata, style: kBody(context, size: 13, color: kRed)))]),
          ),
        ],
        if (_sonuc != null) ...[
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: _skorRengi(_sonucSkoruOku()).withOpacity(0.4))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text('%${_sonucSkoruOku()}', style: kHeadline(context, size: 32, weight: FontWeight.w900, color: _skorRengi(_sonucSkoruOku()))),
                const SizedBox(width: 10),
                Text(_skorEtiket(_sonucSkoruOku()), style: kBody(context, size: 14, color: _skorRengi(_sonucSkoruOku()), weight: FontWeight.w600)),
              ]),
              const SizedBox(height: 12),
              Text(_sonucMesajiOku(), style: kBody(context, size: 13, color: kText(context))),
            ]),
          ),
        ],
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder(context))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('DOĞRU FORM', style: kLabel(context)),
            const SizedBox(height: 6),
            Text(_hareket['dogruForm'], style: kBody(context, size: 13, color: kText(context))),
            const SizedBox(height: 12),
            Text('NASIL ÇALIŞIR', style: kLabel(context)),
            const SizedBox(height: 6),
            Text(_hareket['nasilCalisir'], style: kBody(context, size: 13, color: kText(context))),
          ]),
        ),
        const SizedBox(height: 24),
      ]),
    );
  }
}