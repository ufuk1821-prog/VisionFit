import 'dart:async';
import 'package:flutter/material.dart';

class ZamanlamayiciEkrani extends StatefulWidget {
  const ZamanlamayiciEkrani({super.key});

  @override
  State<ZamanlamayiciEkrani> createState() => _ZamanlamayiciEkraniState();
}

class _ZamanlamayiciEkraniState extends State<ZamanlamayiciEkrani> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        color: const Color(0xFF1A1A1A),
        child: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFE8313F),
          labelColor: const Color(0xFFE8313F),
          unselectedLabelColor: const Color(0xFF888888),
          tabs: const [Tab(text: 'Kronometre'), Tab(text: 'Zamanlayıcı')],
        ),
      ),
      Expanded(child: TabBarView(controller: _tabController, children: const [_Kronometre(), _Zamanlayici()])),
    ]);
  }
}

class _Kronometre extends StatefulWidget {
  const _Kronometre();

  @override
  State<_Kronometre> createState() => _KronometreState();
}

class _KronometreState extends State<_Kronometre> {
  int _gecenMs = 0;
  bool _calisiyor = false;
  List<int> _turlar = [];
  Timer? _timer;

  void _baslat() {
    _timer = Timer.periodic(const Duration(milliseconds: 10), (_) => setState(() { _gecenMs += 10; }));
    setState(() { _calisiyor = true; });
  }

  void _durdur() {
    _timer?.cancel();
    setState(() { _calisiyor = false; });
  }

  void _sifirla() {
    _timer?.cancel();
    setState(() { _gecenMs = 0; _calisiyor = false; _turlar = []; });
  }

  void _tur() {
    setState(() { _turlar.insert(0, _gecenMs); });
  }

  String _format(int ms) {
    final dk = ms ~/ 60000;
    final sn = (ms % 60000) ~/ 1000;
    final cs = (ms % 1000) ~/ 10;
    return '${dk.toString().padLeft(2, '0')}:${sn.toString().padLeft(2, '0')}.${cs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(children: [
        const SizedBox(height: 32),
        Text(_format(_gecenMs), style: const TextStyle(color: Colors.white, fontSize: 56, fontWeight: FontWeight.w200, fontFamily: 'monospace')),
        const SizedBox(height: 48),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _buton('Sıfırla', Icons.refresh, _sifirla, const Color(0xFF333333)),
          const SizedBox(width: 16),
          _buton(_calisiyor ? 'Durdur' : 'Başlat', _calisiyor ? Icons.pause : Icons.play_arrow, _calisiyor ? _durdur : _baslat, const Color(0xFFE8313F), buyuk: true),
          const SizedBox(width: 16),
          _buton('Tur', Icons.flag_outlined, _calisiyor ? _tur : () {}, const Color(0xFF333333)),
        ]),
        if (_turlar.isNotEmpty) ...[
          const SizedBox(height: 32),
          ..._turlar.asMap().entries.map((e) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Tur ${_turlar.length - e.key}', style: const TextStyle(color: Color(0xFF888888), fontSize: 14)),
              Text(_format(e.value), style: const TextStyle(color: Colors.white, fontSize: 14)),
            ]),
          )),
        ],
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              Icon(Icons.lightbulb_outline, color: Color(0xFFE8313F), size: 18),
              SizedBox(width: 8),
              Text('Dinlenme Süresi İpuçları', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
            ]),
            const SizedBox(height: 12),
            _ipucu('Kuvvet antrenmanı (ağır yük)', '2-5 dakika'),
            _ipucu('Hipertrofi (kas büyütme)', '60-90 saniye'),
            _ipucu('Dayanıklılık / kondisyon', '30-60 saniye'),
            _ipucu('Devre antrenmanı', '15-30 saniye'),
            _ipucu('Isınma setleri', '45-60 saniye'),
          ]),
        ),
      ]),
    );
  }

  Widget _buton(String label, IconData ikon, VoidCallback onTap, Color renk, {bool buyuk = false}) {
    final boyut = buyuk ? 72.0 : 56.0;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: boyut, height: boyut,
        decoration: BoxDecoration(color: renk, shape: BoxShape.circle),
        child: Icon(ikon, color: Colors.white, size: buyuk ? 28 : 22),
      ),
    );
  }

  Widget _ipucu(String baslik, String sure) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(children: [
        Expanded(child: Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 13))),
        Text(sure, style: const TextStyle(color: Color(0xFFE8313F), fontSize: 13, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

class _Zamanlayici extends StatefulWidget {
  const _Zamanlayici();

  @override
  State<_Zamanlayici> createState() => _ZamanlayiciState();
}

class _ZamanlayiciState extends State<_Zamanlayici> {
  int _toplamSn = 0;
  int _kalanSn = 0;
  bool _calisiyor = false;
  bool _bitti = false;
  Timer? _timer;
  final _dkController = TextEditingController(text: '0');
  final _snController = TextEditingController(text: '30');

  void _baslat() {
    final dk = int.tryParse(_dkController.text) ?? 0;
    final sn = int.tryParse(_snController.text) ?? 0;
    _toplamSn = dk * 60 + sn;
    if (_toplamSn <= 0) return;
    _kalanSn = _toplamSn;
    _bitti = false;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_kalanSn <= 0) {
        _timer?.cancel();
        setState(() { _bitti = true; _calisiyor = false; });
        return;
      }
      setState(() { _kalanSn--; });
    });
    setState(() { _calisiyor = true; });
  }

  void _durdur() {
    _timer?.cancel();
    setState(() { _calisiyor = false; });
  }

  void _sifirla() {
    _timer?.cancel();
    setState(() { _kalanSn = 0; _toplamSn = 0; _calisiyor = false; _bitti = false; });
  }

  String _format(int sn) {
    final dk = sn ~/ 60;
    final s = sn % 60;
    return '${dk.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  double get _ilerleme => _toplamSn > 0 ? _kalanSn / _toplamSn : 1.0;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(children: [
        const SizedBox(height: 24),
        Stack(alignment: Alignment.center, children: [
          SizedBox(
            width: 220, height: 220,
            child: CircularProgressIndicator(
              value: _ilerleme,
              strokeWidth: 10,
              backgroundColor: const Color(0xFF333333),
              color: _bitti ? const Color(0xFF4CAF50) : const Color(0xFFE8313F),
            ),
          ),
          Column(children: [
            Text(_calisiyor || _kalanSn > 0 ? _format(_kalanSn) : '00:00', style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.w200)),
            if (_bitti) const Text('Süre Doldu!', style: TextStyle(color: Color(0xFF4CAF50), fontSize: 14)),
          ]),
        ]),
        const SizedBox(height: 32),
        if (!_calisiyor && _kalanSn == 0) ...[
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            SizedBox(width: 80, child: TextField(
              controller: _dkController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 20),
              decoration: _inputDeko('dk'),
            )),
            const Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text(':', style: TextStyle(color: Colors.white, fontSize: 24))),
            SizedBox(width: 80, child: TextField(
              controller: _snController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 20),
              decoration: _inputDeko('sn'),
            )),
          ]),
          const SizedBox(height: 32),
        ],
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          GestureDetector(
            onTap: _sifirla,
            child: Container(width: 56, height: 56, decoration: const BoxDecoration(color: Color(0xFF333333), shape: BoxShape.circle), child: const Icon(Icons.refresh, color: Colors.white)),
          ),
          const SizedBox(width: 16),
          GestureDetector(
            onTap: _calisiyor ? _durdur : _baslat,
            child: Container(width: 72, height: 72, decoration: const BoxDecoration(color: Color(0xFFE8313F), shape: BoxShape.circle), child: Icon(_calisiyor ? Icons.pause : Icons.play_arrow, color: Colors.white, size: 28)),
          ),
        ]),
      ]),
    );
  }

  InputDecoration _inputDeko(String hint) {
    return InputDecoration(
      hintText: hint, hintStyle: const TextStyle(color: Color(0xFF555555)),
      filled: true, fillColor: const Color(0xFF1A1A1A),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }
}