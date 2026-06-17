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

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    try {
      final veri = await ApiServisi.getJson('/api/badges');
      setState(() { _rozetler = veri is List ? veri : []; _yukleniyor = false; });
    } catch (_) {
      setState(() { _yukleniyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_yukleniyor) return const Center(child: CircularProgressIndicator(color: Color(0xFFE8313F)));

    final kazanilan = _rozetler.where((r) => r['kazanildi'] == true).toList();
    final kazanilmayan = _rozetler.where((r) => r['kazanildi'] != true).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Text('Rozetlerim', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: const Color(0xFFE8313F).withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
              child: Text('${kazanilan.length}/${_rozetler.length}', style: const TextStyle(color: Color(0xFFE8313F), fontWeight: FontWeight.w700)),
            ),
          ]),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: _rozetler.isEmpty ? 0 : kazanilan.length / _rozetler.length,
              backgroundColor: const Color(0xFF333333),
              color: const Color(0xFFE8313F),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 20),
          if (_rozetler.isEmpty)
            Center(child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(children: [
                const Text('🏅', style: TextStyle(fontSize: 56)),
                const SizedBox(height: 16),
                const Text('Henüz rozet yok', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                const Text('Antrenman yaparak rozetleri kazanmaya başla!', style: TextStyle(color: Color(0xFF888888), fontSize: 13), textAlign: TextAlign.center),
              ]),
            ))
          else ...[
            if (kazanilan.isNotEmpty) ...[
              const Text('Kazanılan Rozetler 🎉', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.9),
                itemCount: kazanilan.length,
                itemBuilder: (_, i) => _rozetKarti(kazanilan[i], true),
              ),
              const SizedBox(height: 20),
            ],
            if (kazanilmayan.isNotEmpty) ...[
              const Text('Kazanılacak Rozetler', style: TextStyle(color: Color(0xFF888888), fontSize: 15, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.9),
                itemCount: kazanilmayan.length,
                itemBuilder: (_, i) => _rozetKarti(kazanilmayan[i], false),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _rozetKarti(Map rozet, bool kazanildi) {
    final seviye = rozet['seviye'] as String? ?? 'Bronz';
    final Map<String, Color> seviyeRenk = {'Bronz': const Color(0xFFCD7F32), 'Gumus': const Color(0xFFC0C0C0), 'Altin': const Color(0xFFFFD700)};
    final Map<String, String> seviyeEmoji = {'Bronz': '🥉', 'Gumus': '🥈', 'Altin': '🥇'};
    final renk = seviyeRenk[seviye] ?? const Color(0xFFCD7F32);

    return Opacity(
      opacity: kazanildi ? 1.0 : 0.45,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kazanildi ? renk.withOpacity(0.5) : const Color(0xFF333333), width: kazanildi ? 1.5 : 1),
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(kazanildi ? (seviyeEmoji[seviye] ?? '🏅') : '🔒', style: const TextStyle(fontSize: 36)),
          const SizedBox(height: 10),
          Text(rozet['baslik'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700), textAlign: TextAlign.center),
          const SizedBox(height: 4),
          Text(rozet['aciklama'] ?? '', style: const TextStyle(color: Color(0xFF888888), fontSize: 11), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
          if (kazanildi) ...[
            const SizedBox(height: 8),
            Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3), decoration: BoxDecoration(color: renk.withOpacity(0.15), borderRadius: BorderRadius.circular(8)), child: Text(seviye, style: TextStyle(color: renk, fontSize: 11, fontWeight: FontWeight.w600))),
          ],
        ]),
      ),
    );
  }
}