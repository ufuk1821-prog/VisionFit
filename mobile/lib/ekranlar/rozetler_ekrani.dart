import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';

class RozetlerEkrani extends StatefulWidget {
  const RozetlerEkrani({super.key});

  @override
  State<RozetlerEkrani> createState() => _RozetlerEkraniState();
}

class _RozetlerEkraniState extends State<RozetlerEkrani> {
  List _rozetler = [];
  bool _yukleniyor = true;

  final Map<String, Color> _seviyeRenk = {
    'Bronz': const Color(0xFFCD7F32),
    'Gumus': const Color(0xFFC0C0C0),
    'Altin': const Color(0xFFFFD700),
  };

  final Map<String, String> _seviyeEtiket = {
    'Bronz': 'Bronz',
    'Gumus': 'Gümüş',
    'Altin': 'Altın',
  };

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/badges');
      setState(() { _rozetler = veri is List ? veri : []; _yukleniyor = false; });
    } catch (e) {
      setState(() { _yukleniyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: Color(0xFFE8313F)));
    if (_rozetler.isEmpty) return const Center(child: Padding(
      padding: EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.military_tech_outlined, color: Color(0xFF444444), size: 56),
        SizedBox(height: 16),
        Text('Henüz rozet kazanılmadı', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
        SizedBox(height: 8),
        Text('Antrenman yaparak rozetleri kazanmaya başla.', style: TextStyle(color: Color(0xFF888888), fontSize: 13), textAlign: TextAlign.center),
      ]),
    ));

    final kazanilan = _rozetler.where((r) => r['kazanildi'] == true).length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rozetlerim ($kazanilan/${_rozetler.length})', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.85),
            itemCount: _rozetler.length,
            itemBuilder: (_, i) => _rozetKarti(_rozetler[i]),
          ),
        ],
      ),
    );
  }

  Widget _rozetKarti(Map rozet) {
    final kazanildi = rozet['kazanildi'] == true;
    final seviye = rozet['seviye'] as String? ?? 'Bronz';
    final renk = _seviyeRenk[seviye] ?? const Color(0xFFCD7F32);

    return Opacity(
      opacity: kazanildi ? 1.0 : 0.4,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kazanildi ? renk.withOpacity(0.4) : const Color(0xFF333333)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(color: renk.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
              child: Icon(kazanildi ? Icons.military_tech : Icons.lock_outline, color: renk, size: 28),
            ),
            const SizedBox(height: 10),
            Text(rozet['baslik'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
            const SizedBox(height: 4),
            Text(rozet['aciklama'] ?? '', style: const TextStyle(color: Color(0xFF888888), fontSize: 11), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
            if (kazanildi) ...[
              const SizedBox(height: 6),
              Text(_seviyeEtiket[seviye] ?? seviye, style: TextStyle(color: renk, fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ],
        ),
      ),
    );
  }
}