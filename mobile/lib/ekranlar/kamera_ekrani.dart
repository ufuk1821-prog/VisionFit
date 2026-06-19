import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:camera/camera.dart';
import 'package:flutter_pose_detection/flutter_pose_detection.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import 'package:path_provider/path_provider.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';

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

List<double> pozuFlatListeCevirSenkron(Pose pose, double genislik, double yukseklik) {
  final liste = <double>[];
  for (final tip in mediapipeSirasi) {
    final lm = pose.getLandmark(tip);
    if (lm != null) {
      liste.addAll([lm.x / genislik, lm.y / yukseklik, lm.z / genislik, lm.visibility]);
    } else {
      liste.addAll([0.0, 0.0, 0.0, 0.0]);
    }
  }
  return liste;
}

class KameraEkrani extends StatefulWidget {
  final VoidCallback? geriDon;
  const KameraEkrani({super.key, this.geriDon});
  @override
  State<KameraEkrani> createState() => _KameraEkraniState();
}

class _KameraEkraniState extends State<KameraEkrani> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() { super.initState(); _tabController = TabController(length: 2, vsync: this); }

  @override
  void dispose() { _tabController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg(context),
      appBar: AppBar(
        backgroundColor: kSurfaceLow(context),
        elevation: 0,
        leading: IconButton(icon: Icon(Icons.arrow_back, color: kText(context)), onPressed: () => widget.geriDon?.call()),
        title: Text('Kamera Analizi', style: kHeadline(context, size: 18, weight: FontWeight.w700)),
        iconTheme: IconThemeData(color: kText(context)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: kRed, indicatorWeight: 2, labelColor: kRed, unselectedLabelColor: kHint(context),
          labelStyle: kLabel(context, size: 11, color: kRed), unselectedLabelStyle: kLabel(context, size: 11),
          tabs: const [Tab(text: 'CANLI ANALİZ'), Tab(text: 'VİDEO ANALİZİ')],
        ),
      ),
      body: TabBarView(controller: _tabController, children: const [_CanliAnalizSekme(), _VideoAnalizSekme()]),
    );
  }
}

class _CanliAnalizSekme extends StatefulWidget {
  const _CanliAnalizSekme();
  @override
  State<_CanliAnalizSekme> createState() => _CanliAnalizSekmeState();
}

class _CanliAnalizSekmeState extends State<_CanliAnalizSekme> {
  CameraController? _controller;
  List<CameraDescription> _cameras = [];
  int _secilenKamera = 0;
  bool _baslatildi = false;
  bool _yukleniyor = true;
  bool _izinReddedildi = false;
  int _geriSayim = 0;
  int _kalanSure = 30;
  int _toplananKare = 0;
  List<List<double>> _kareler = [];
  Map<String, dynamic>? _sonuc;
  bool _analizYukleniyor = false;
  String _hata = '';
  bool _iptalEdildi = false;
  NpuPoseDetector? _detector;

  @override
  void initState() { super.initState(); _kamerayiBaslat(); _detectorBaslat(); }

  Future<void> _detectorBaslat() async {
    _detector = NpuPoseDetector(config: PoseDetectorConfig.realtime());
    await _detector!.initialize();
  }

  Future<void> _kamerayiBaslat() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) { setState(() { _yukleniyor = false; _izinReddedildi = true; }); return; }
      await _kontrolcuBaslat(_secilenKamera);
    } catch (_) { setState(() { _yukleniyor = false; _izinReddedildi = true; }); }
  }

  Future<void> _kontrolcuBaslat(int index) async {
    await _controller?.dispose();
    final controller = CameraController(_cameras[index], ResolutionPreset.medium, enableAudio: false);
    try {
      await controller.initialize();
      if (!mounted) return;
      setState(() { _controller = controller; _secilenKamera = index; _yukleniyor = false; _izinReddedildi = false; });
    } catch (_) { setState(() { _yukleniyor = false; _izinReddedildi = true; }); }
  }

  Future<void> _kameraDegistir() async {
    if (_cameras.length < 2 || _baslatildi) return;
    setState(() { _yukleniyor = true; });
    await _kontrolcuBaslat(_secilenKamera == 0 ? 1 : 0);
  }

  Future<void> _analiziBaslat() async {
    setState(() { _baslatildi = true; _iptalEdildi = false; _kareler = []; _toplananKare = 0; _sonuc = null; _hata = ''; });
    for (int i = 3; i > 0; i--) {
      if (_iptalEdildi) return;
      setState(() { _geriSayim = i; });
      await Future.delayed(const Duration(seconds: 1));
    }
    setState(() { _geriSayim = 0; _kalanSure = 30; });
    for (int i = 0; i < 15; i++) {
      if (_iptalEdildi || !mounted) return;
      await _kareCek();
      setState(() { _kalanSure = 30 - ((i + 1) * 2); });
      if (i < 14) await Future.delayed(const Duration(seconds: 2));
    }
    if (_iptalEdildi) return;
    if (_kareler.isEmpty) { setState(() { _hata = 'Vücut tespit edilemedi. Yanınızdan çekim yapın.'; _baslatildi = false; }); return; }
    await _sonucGonder();
  }

  Future<void> _kareCek() async {
    if (_controller == null || !_controller!.value.isInitialized || _detector == null) return;
    try {
      final foto = await _controller!.takePicture();
      final goruntuBaytlari = await File(foto.path).readAsBytes();
      final sonuc = await _detector!.detectPose(goruntuBaytlari);
      if (sonuc.hasPoses) {
        final codec = await ui.instantiateImageCodec(goruntuBaytlari);
        final frame = await codec.getNextFrame();
        final genislik = frame.image.width.toDouble();
        final yukseklik = frame.image.height.toDouble();
        final lms = pozuFlatListeCevirSenkron(sonuc.firstPose!, genislik, yukseklik);
        if (mounted) setState(() { _kareler.add(lms); _toplananKare++; });
      }
      try { File(foto.path).deleteSync(); } catch (_) {}
    } catch (_) {}
  }

  Future<void> _sonucGonder() async {
    setState(() { _analizYukleniyor = true; _baslatildi = false; });
    try {
      final yanit = await ApiServisi.postJson('/api/analyze/session', {'frames': _kareler});
      setState(() { _sonuc = Map<String, dynamic>.from(yanit); _analizYukleniyor = false; });
    } catch (e) {
      setState(() { _hata = 'Analiz başarısız: $e'; _analizYukleniyor = false; });
    }
  }

  void _iptalEt() { setState(() { _iptalEdildi = true; _baslatildi = false; _geriSayim = 0; _kareler = []; _hata = ''; }); }

  @override
  void dispose() { _controller?.dispose(); _detector?.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: kRed));
    if (_izinReddedildi) {
      return Center(child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: kSurface(context), shape: BoxShape.circle, border: Border.all(color: kBorder(context))), child: Icon(Icons.camera_alt_outlined, color: kHint(context), size: 48)),
          const SizedBox(height: 16),
          Text('Kamera erişimi reddedildi.', style: kHeadline(context, size: 16)),
          const SizedBox(height: 8),
          Text('Kamera izni verilmeden analiz yapılamaz.', style: kBody(context, size: 13, color: kHint(context)), textAlign: TextAlign.center),
          const SizedBox(height: 24),
          ElevatedButton(onPressed: _kamerayiBaslat, style: ElevatedButton.styleFrom(backgroundColor: kRed, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: Text('TEKRAR DENE', style: kLabel(context, size: 11, color: Colors.white))),
        ]),
      ));
    }
    return Stack(children: [
      if (_controller != null && _controller!.value.isInitialized)
        SizedBox.expand(child: FittedBox(fit: BoxFit.cover, child: SizedBox(width: _controller!.value.previewSize!.height, height: _controller!.value.previewSize!.width, child: CameraPreview(_controller!)))),
      if (!_baslatildi && !_analizYukleniyor && _sonuc == null)
        Positioned(top: 12, left: 12, right: 12, child: Row(children: [
          Expanded(child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(10)),
            child: Row(children: [
              const Icon(Icons.lightbulb_outline, color: kRed, size: 16),
              const SizedBox(width: 6),
              Expanded(child: Text('Daha doğru analiz için kameranıza yandan bakacak şekilde durun.', style: kBody(context, size: 11, color: Colors.white))),
            ]),
          )),
          if (_cameras.length > 1) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _kameraDegistir,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(10)),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.flip_camera_android, color: Colors.white, size: 20),
                  Text(_secilenKamera == 0 ? 'Arka' : 'Ön', style: kLabel(context, size: 9, color: Colors.white)),
                ]),
              ),
            ),
          ],
        ])),
      if (_geriSayim > 0)
        Center(child: Text('$_geriSayim', style: kHeadline(context, size: 120, weight: FontWeight.w900, color: Colors.white).copyWith(shadows: const [Shadow(blurRadius: 20, color: Colors.black)]))),
      if (_baslatildi && _geriSayim == 0)
        Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
            decoration: BoxDecoration(color: Colors.black.withOpacity(0.75), borderRadius: BorderRadius.circular(16)),
            child: Column(children: [
              Text('$_kalanSure', style: kHeadline(context, size: 56, weight: FontWeight.w900, color: Colors.white)),
              Text('saniye kaldı', style: kBody(context, size: 14, color: kHint(context))),
              const SizedBox(height: 10),
              Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.check_circle_outline, color: kGreen, size: 16),
                const SizedBox(width: 4),
                Text('$_toplananKare kare toplandı', style: kBody(context, size: 13, weight: FontWeight.w600, color: kGreen)),
              ]),
              const SizedBox(height: 6),
              Text('Squat yapın! 🏋️', style: kBody(context, size: 15, weight: FontWeight.w600, color: Colors.white)),
            ]),
          ),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: _iptalEt,
            child: Container(padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12), decoration: BoxDecoration(color: kRed, borderRadius: BorderRadius.circular(10)), child: Text('İPTAL', style: kLabel(context, size: 12, color: Colors.white))),
          ),
        ])),
      if (_analizYukleniyor)
        Container(
          color: Colors.black.withOpacity(0.75),
          child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            const CircularProgressIndicator(color: kRed),
            const SizedBox(height: 16),
            Text('Squat analiz ediliyor...', style: kHeadline(context, size: 16, color: Colors.white)),
            const SizedBox(height: 6),
            Text('Yapay zeka hareketlerinizi değerlendiriyor', style: kBody(context, size: 13, color: kHint(context))),
          ])),
        ),
      if (_sonuc != null)
        Positioned(bottom: 0, left: 0, right: 0, child: Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
          decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: const BorderRadius.vertical(top: Radius.circular(24)), border: Border(top: BorderSide(color: kBorder(context)))),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: kBorder(context), borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Text('Squat Analiz Sonucu', style: kHeadline(context, size: 18, weight: FontWeight.w700)),
            const SizedBox(height: 16),
            Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
              _skorKarti(context, 'Genel Skor', '${(_sonuc!['genel_skor'] as num?)?.round() ?? 0}%', kRed),
              _skorKarti(context, 'Squat Kare', '${_sonuc!['squat_kare'] ?? 0}', kBlue),
              _skorKarti(context, 'Toplam Kare', '${_sonuc!['toplam_kare'] ?? 0}', kHint(context)),
            ]),
            const SizedBox(height: 14),
            if ((_sonuc!['olumlu_mesaj'] ?? '').isNotEmpty)
              Container(width: double.infinity, padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 8), decoration: BoxDecoration(color: kGreen.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kGreen.withOpacity(0.3))), child: Text('✅ ${_sonuc!['olumlu_mesaj']}', style: kBody(context, size: 13, color: kGreen))),
            if ((_sonuc!['gelistirilecek_mesaj'] ?? '').isNotEmpty)
              Container(width: double.infinity, padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 16), decoration: BoxDecoration(color: kRed.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kRed.withOpacity(0.3))), child: Text('💡 ${_sonuc!['gelistirilecek_mesaj']}', style: kBody(context, size: 13, color: kRed))),
            SizedBox(width: double.infinity, height: 48, child: ElevatedButton(onPressed: () => setState(() { _sonuc = null; }), style: ElevatedButton.styleFrom(backgroundColor: kRed, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0), child: Text('TEKRAR ANALİZ ET', style: kLabel(context, size: 12, color: Colors.white)))),
          ]),
        )),
      if (!_baslatildi && _sonuc == null && !_analizYukleniyor)
        Positioned(bottom: 0, left: 0, right: 0, child: Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
          decoration: BoxDecoration(color: Colors.black.withOpacity(0.75), borderRadius: const BorderRadius.vertical(top: Radius.circular(20))),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Row(children: [const Icon(Icons.check_circle_outline, color: kGreen, size: 16), const SizedBox(width: 6), Text('Hazır', style: kBody(context, size: 13, weight: FontWeight.w600, color: kGreen))]),
            const SizedBox(height: 4),
            Text('Squat yapın. Başlat\'a basın, 3\'ten geriye sayacak ve analiz başlayacak.', style: kBody(context, size: 12, color: kHint(context)), textAlign: TextAlign.center),
            if (_hata.isNotEmpty) ...[const SizedBox(height: 8), Text(_hata, style: kBody(context, size: 12, color: kRed), textAlign: TextAlign.center)],
            const SizedBox(height: 14),
            SizedBox(width: double.infinity, height: 50, child: ElevatedButton.icon(onPressed: _analiziBaslat, icon: const Icon(Icons.play_arrow, color: Colors.white, size: 24), label: Text('BAŞLAT', style: kLabel(context, size: 13, color: Colors.white)), style: ElevatedButton.styleFrom(backgroundColor: kRed, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0))),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: kSurfaceLow(context).withOpacity(0.9), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder(context))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [const Icon(Icons.warning_amber_outlined, color: kAmber, size: 16), const SizedBox(width: 6), Text('Sık Yapılan Hatalar', style: kBody(context, size: 13, weight: FontWeight.w600, color: kAmber))]),
                const SizedBox(height: 10),
                _hataItem(context, 'Dizlerin içe çökmesi'),
                _hataItem(context, 'Sırtın kamburlaşması'),
                _hataItem(context, 'Topukların yerden kalkması'),
                _hataItem(context, 'Yetersiz iniş derinliği'),
              ]),
            ),
          ]),
        )),
    ]);
  }

  Widget _skorKarti(BuildContext context, String baslik, String deger, Color renk) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(color: kSurfaceLowest(context), borderRadius: BorderRadius.circular(12)),
      child: Column(children: [
        Text(deger, style: kHeadline(context, size: 22, weight: FontWeight.w800, color: renk)),
        const SizedBox(height: 4),
        Text(baslik, style: kLabel(context, size: 10)),
      ]),
    );
  }

  Widget _hataItem(BuildContext context, String metin) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        const Text('✗', style: TextStyle(color: kRed, fontSize: 14, fontWeight: FontWeight.w700)),
        const SizedBox(width: 8),
        Text(metin, style: kBody(context, size: 12, color: kText(context))),
      ]),
    );
  }
}

class _VideoAnalizSekme extends StatefulWidget {
  const _VideoAnalizSekme();
  @override
  State<_VideoAnalizSekme> createState() => _VideoAnalizSekmeState();
}

class _VideoAnalizSekmeState extends State<_VideoAnalizSekme> {
  File? _video;
  VideoPlayerController? _playerController;
  bool _yukleniyor = false;
  Map<String, dynamic>? _sonuc;
  String _hata = '';
  int _ilerleme = 0;
  int _toplamKare = 0;
  NpuPoseDetector? _detector;
  final GlobalKey _repaintKey = GlobalKey();

  Future<NpuPoseDetector> _detectorAl() async {
    if (_detector != null) return _detector!;
    _detector = NpuPoseDetector();
    await _detector!.initialize();
    return _detector!;
  }

  Future<void> _videoSec() async {
    final picker = ImagePicker();
    final secilen = await picker.pickVideo(source: ImageSource.gallery);
    if (secilen == null) return;
    await _playerController?.dispose();
    setState(() { _video = File(secilen.path); _sonuc = null; _hata = ''; _playerController = null; });
  }

  Future<void> _analizEt() async {
    if (_video == null) return;
    setState(() { _yukleniyor = true; _hata = ''; _ilerleme = 0; _toplamKare = 0; });
    try {
      final detector = await _detectorAl();
      setState(() { _hata = 'Video hazırlanıyor...'; });
      final controller = VideoPlayerController.file(_video!);
      await controller.initialize();
      setState(() { _playerController = controller; });

      final sureMs = controller.value.duration.inMilliseconds;
      if (sureMs <= 0) {
        setState(() { _hata = 'Video okunamadı. Lütfen farklı bir video deneyin.'; _yukleniyor = false; });
        return;
      }

      await Future.delayed(const Duration(milliseconds: 300));

      const toplamKareSayisi = 16;
      final kareler = <List<double>>[];
      final geciciKlasor = await getTemporaryDirectory();

      setState(() { _hata = 'Videodaki kareler işleniyor...'; });

      for (int i = 0; i < toplamKareSayisi; i++) {
        final zamanMs = ((sureMs - 300) * i / (toplamKareSayisi - 1)).round().clamp(0, sureMs);
        try {
          await controller.seekTo(Duration(milliseconds: zamanMs));
          await controller.play();
          await Future.delayed(const Duration(milliseconds: 80));
          await controller.pause();
          await Future.delayed(const Duration(milliseconds: 150));

          final boundary = _repaintKey.currentContext?.findRenderObject();
          if (boundary is RenderRepaintBoundary) {
            final image = await boundary.toImage(pixelRatio: 3.0);
            final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
            if (byteData != null) {
              final goruntuBaytlari = byteData.buffer.asUint8List();
              final sonuc = await detector.detectPose(goruntuBaytlari);
              if (sonuc.hasPoses) {
                final lms = pozuFlatListeCevirSenkron(sonuc.firstPose!, image.width.toDouble(), image.height.toDouble());
                kareler.add(lms);
              }
            }
          }
        } catch (_) {}
        setState(() { _ilerleme = ((i + 1) / toplamKareSayisi * 100).round(); _toplamKare = i + 1; });
      }

      await controller.dispose();
      setState(() { _playerController = null; });

      if (kareler.isEmpty) {
        setState(() { _hata = 'Videoda vücut tespit edilemedi. Yandan çekilmiş, tüm vücudun göründüğü net bir video yükleyin.'; _yukleniyor = false; });
        return;
      }

      setState(() { _hata = 'Backend\'e gönderiliyor...'; });
      final yanit = await ApiServisi.postJson('/api/analyze/session', {'frames': kareler});
      setState(() { _sonuc = Map<String, dynamic>.from(yanit); _yukleniyor = false; _hata = ''; });
    } catch (e) {
      setState(() { _hata = 'Analiz başarısız: $e'; _yukleniyor = false; });
    }
  }

  @override
  void dispose() {
    _detector?.dispose();
    _playerController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorderAlt(context))),
          child: Row(children: [
            const Icon(Icons.lightbulb_outline, color: kRed, size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text('Yandan çekilmiş, tüm vücudunuzun göründüğü bir squat videosu yükleyin.', style: kBody(context, size: 13, color: kHint(context)))),
          ]),
        ),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: _yukleniyor ? null : _videoSec,
          child: Container(
            width: double.infinity, height: 180,
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: _video != null ? kRed.withOpacity(0.5) : kBorder(context), width: 2)),
            child: _video != null
                ? (_playerController != null && _playerController!.value.isInitialized
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: RepaintBoundary(
                          key: _repaintKey,
                          child: AspectRatio(aspectRatio: _playerController!.value.aspectRatio, child: VideoPlayer(_playerController!)),
                        ),
                      )
                    : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.videocam_outlined, color: kRed, size: 48),
                        const SizedBox(height: 12),
                        Text(_video!.path.split('/').last, style: kBody(context, size: 13, color: kText(context)), overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 4),
                        Text('Değiştirmek için tekrar tıkla', style: kLabel(context, size: 10)),
                      ]))
                : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: kSurfaceContainer(context), shape: BoxShape.circle), child: Icon(Icons.video_file_outlined, color: kHint(context), size: 36)),
                    const SizedBox(height: 12),
                    Text('Video seçilmedi', style: kBody(context, size: 14, color: kHint(context))),
                    const SizedBox(height: 4),
                    Text('Galerinizden video seçmek için tıklayın', style: kLabel(context, size: 10)),
                  ]),
          ),
        ),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: OutlinedButton.icon(onPressed: _yukleniyor ? null : _videoSec, icon: const Icon(Icons.folder_outlined, color: kRed, size: 18), label: Text('VİDEO SEÇ', style: kLabel(context, size: 10, color: kRed)), style: OutlinedButton.styleFrom(side: const BorderSide(color: kRed), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 14)))),
          if (_video != null) ...[
            const SizedBox(width: 12),
            Expanded(child: ElevatedButton.icon(
              onPressed: _yukleniyor ? null : _analizEt,
              icon: _yukleniyor ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.upload_outlined, color: Colors.white, size: 18),
              label: Text(_yukleniyor ? 'ANALİZ...' : 'VİDEO YÜKLE', style: kLabel(context, size: 10, color: Colors.white)),
              style: ElevatedButton.styleFrom(backgroundColor: kRed, disabledBackgroundColor: kRed.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 14), elevation: 0),
            )),
          ],
        ]),
        if (_yukleniyor) ...[
          const SizedBox(height: 20),
          ClipRRect(borderRadius: BorderRadius.circular(8), child: LinearProgressIndicator(value: _ilerleme / 100, backgroundColor: kBorder(context), color: kRed, minHeight: 6)),
          const SizedBox(height: 8),
          Text('%$_ilerleme tamamlandı  •  $_toplamKare kare işlendi', style: kLabel(context, size: 10), textAlign: TextAlign.center),
        ],
        if (_hata.isNotEmpty && !_yukleniyor) ...[
          const SizedBox(height: 12),
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
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: kRed.withOpacity(0.3))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Video Analiz Sonucu', style: kHeadline(context, size: 16, weight: FontWeight.w700)),
              const SizedBox(height: 14),
              Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                _skorKarti(context, 'Genel Skor', '${(_sonuc!['genel_skor'] as num?)?.round() ?? 0}%', kRed),
                _skorKarti(context, 'Squat Kare', '${_sonuc!['squat_kare'] ?? 0}', kBlue),
                _skorKarti(context, 'Toplam Kare', '${_sonuc!['toplam_kare'] ?? 0}', kHint(context)),
              ]),
              if ((_sonuc!['olumlu_mesaj'] ?? '').isNotEmpty) ...[const SizedBox(height: 14), Container(width: double.infinity, padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: kGreen.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kGreen.withOpacity(0.3))), child: Text('✅ ${_sonuc!['olumlu_mesaj']}', style: kBody(context, size: 13, color: kGreen)))],
              if ((_sonuc!['gelistirilecek_mesaj'] ?? '').isNotEmpty) ...[const SizedBox(height: 8), Container(width: double.infinity, padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: kRed.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kRed.withOpacity(0.3))), child: Text('💡 ${_sonuc!['gelistirilecek_mesaj']}', style: kBody(context, size: 13, color: kRed)))],
            ]),
          ),
        ],
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _skorKarti(BuildContext context, String baslik, String deger, Color renk) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(color: kSurfaceLowest(context), borderRadius: BorderRadius.circular(12)),
      child: Column(children: [
        Text(deger, style: kHeadline(context, size: 22, weight: FontWeight.w800, color: renk)),
        const SizedBox(height: 4),
        Text(baslik, style: kLabel(context, size: 10)),
      ]),
    );
  }
}