import 'dart:async';
import 'package:flutter/material.dart';
import '../tema.dart';

class ZamanlamayiciEkrani extends StatefulWidget {
  const ZamanlamayiciEkrani({super.key});
  @override
  State<ZamanlamayiciEkrani> createState() => _ZamanlamayiciEkraniState();
}

class _ZamanlamayiciEkraniState extends State<ZamanlamayiciEkrani> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() { super.initState(); _tabController = TabController(length: 2, vsync: this); }
  @override
  void dispose() { _tabController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        color: kSurfaceLow(context),
        child: TabBar(
          controller: _tabController, indicatorColor: kRed, indicatorWeight: 2, labelColor: kRed,
          unselectedLabelColor: kHint(context), labelStyle: kLabel(context, size: 11, color: kRed),
          unselectedLabelStyle: kLabel(context, size: 11),
          tabs: const [Tab(text: 'KRONOMETRE'), Tab(text: 'ZAMANLAYICI')],
        ),
      ),
      Container(height: 1, color: kBorder(context)),
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

  void _baslat() { _timer = Timer.periodic(const Duration(milliseconds: 10), (_) => setState(() { _gecenMs += 10; })); setState(() { _calisiyor = true; }); }
  void _durdur() { _timer?.cancel(); setState(() { _calisiyor = false; }); }
  void _sifirla() { _timer?.cancel(); setState(() { _gecenMs = 0; _calisiyor = false; _turlar = []; }); }
  void _tur() { setState(() { _turlar.insert(0, _gecenMs); }); }

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
        Text(_format(_gecenMs), style: kHeadline(context, size: 52, weight: FontWeight.w200).copyWith(letterSpacing: 2)),
        const SizedBox(height: 8),
        Text('KRONOMETRE', style: kLabel(context)),
        const SizedBox(height: 48),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _yuvarlakButon(context, 'SIFIRLA', Icons.refresh, _sifirla, kSurfaceHigh(context)),
          const SizedBox(width: 16),
          _yuvarlakButon(context, _calisiyor ? 'DURDUR' : 'BAŞLAT', _calisiyor ? Icons.pause : Icons.play_arrow, _calisiyor ? _durdur : _baslat, kRed, buyuk: true),
          const SizedBox(width: 16),
          _yuvarlakButon(context, 'TUR', Icons.flag_outlined, _calisiyor ? _tur : () {}, kSurfaceHigh(context)),
        ]),
        if (_turlar.isNotEmpty) ...[
          const SizedBox(height: 32),
          Container(
            decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder(context))),
            child: Column(children: _turlar.asMap().entries.map((e) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(border: e.key < _turlar.length - 1 ? Border(bottom: BorderSide(color: kBorder(context))) : null),
              child: Row(children: [
                Text('TUR ${_turlar.length - e.key}', style: kLabel(context)),
                const Spacer(),
                Text(_format(e.value), style: kBody(context, size: 14, weight: FontWeight.w600, color: kText(context))),
              ]),
            )).toList()),
          ),
        ],
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorderAlt(context))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [const Icon(Icons.lightbulb_outline, color: kRed, size: 18), const SizedBox(width: 8), Text('DİNLENME SÜRESİ İPUÇLARI', style: kLabel(context, color: kText(context)))]),
            const SizedBox(height: 14),
            _ipucu(context, 'Kuvvet antrenmanı (ağır yük)', '2-5 dakika'),
            _ipucu(context, 'Hipertrofi (kas büyütme)', '60-90 saniye'),
            _ipucu(context, 'Dayanıklılık / kondisyon', '30-60 saniye'),
            _ipucu(context, 'Devre antrenmanı', '15-30 saniye'),
            _ipucu(context, 'Isınma setleri', '45-60 saniye'),
          ]),
        ),
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _yuvarlakButon(BuildContext context, String label, IconData ikon, VoidCallback onTap, Color renk, {bool buyuk = false}) {
    final boyut = buyuk ? 72.0 : 56.0;
    return GestureDetector(
      onTap: onTap,
      child: Column(children: [
        Container(width: boyut, height: boyut, decoration: BoxDecoration(color: renk, shape: BoxShape.circle), child: Icon(ikon, color: buyuk ? Colors.white : kText(context), size: buyuk ? 28 : 22)),
        const SizedBox(height: 6),
        Text(label, style: kLabel(context, size: 9)),
      ]),
    );
  }

  Widget _ipucu(BuildContext context, String baslik, String sure) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        Expanded(child: Text(baslik, style: kBody(context, size: 13, color: kHint(context)))),
        Text(sure, style: kLabel(context, size: 11, color: kRed)),
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
  final _dkCtrl = TextEditingController(text: '0');
  final _snCtrl = TextEditingController(text: '30');

  void _baslat() {
    final dk = int.tryParse(_dkCtrl.text) ?? 0;
    final sn = int.tryParse(_snCtrl.text) ?? 0;
    _toplamSn = dk * 60 + sn;
    if (_toplamSn <= 0) return;
    _kalanSn = _toplamSn;
    _bitti = false;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_kalanSn <= 0) { _timer?.cancel(); setState(() { _bitti = true; _calisiyor = false; }); return; }
      setState(() { _kalanSn--; });
    });
    setState(() { _calisiyor = true; });
  }

  void _durdur() { _timer?.cancel(); setState(() { _calisiyor = false; }); }
  void _sifirla() { _timer?.cancel(); setState(() { _kalanSn = 0; _toplamSn = 0; _calisiyor = false; _bitti = false; }); }

  String _format(int sn) {
    final dk = sn ~/ 60;
    final s = sn % 60;
    return '${dk.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  double get _ilerleme => _toplamSn > 0 ? _kalanSn / _toplamSn : 1.0;

  @override
  Widget build(BuildContext context) {
    final progress = _bitti ? kGreen : kRed;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(children: [
        const SizedBox(height: 24),
        Stack(alignment: Alignment.center, children: [
          SizedBox(width: 220, height: 220, child: CircularProgressIndicator(value: _ilerleme, strokeWidth: 8, backgroundColor: kBorder(context), color: progress)),
          Column(mainAxisSize: MainAxisSize.min, children: [
            Text(_calisiyor || _kalanSn > 0 ? _format(_kalanSn) : '00:00', style: kHeadline(context, size: 46, weight: FontWeight.w200)),
            if (_bitti) Text('SÜRE DOLDU!', style: kLabel(context, color: kGreen)) else Text('ZAMANLAYICI', style: kLabel(context)),
          ]),
        ]),
        const SizedBox(height: 32),
        if (!_calisiyor && _kalanSn == 0) ...[
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            SizedBox(width: 80, child: TextField(controller: _dkCtrl, keyboardType: TextInputType.number, textAlign: TextAlign.center, style: kHeadline(context, size: 20), decoration: _inputDeko(context, 'DK'))),
            Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Text(':', style: kHeadline(context, size: 24))),
            SizedBox(width: 80, child: TextField(controller: _snCtrl, keyboardType: TextInputType.number, textAlign: TextAlign.center, style: kHeadline(context, size: 20), decoration: _inputDeko(context, 'SN'))),
          ]),
          const SizedBox(height: 32),
        ],
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          GestureDetector(
            onTap: _sifirla,
            child: Column(children: [
              Container(width: 56, height: 56, decoration: BoxDecoration(color: kSurfaceHigh(context), shape: BoxShape.circle), child: Icon(Icons.refresh, color: kText(context))),
              const SizedBox(height: 6),
              Text('SIFIRLA', style: kLabel(context, size: 9)),
            ]),
          ),
          const SizedBox(width: 16),
          GestureDetector(
            onTap: _calisiyor ? _durdur : _baslat,
            child: Column(children: [
              Container(width: 72, height: 72, decoration: const BoxDecoration(color: kRed, shape: BoxShape.circle), child: Icon(_calisiyor ? Icons.pause : Icons.play_arrow, color: Colors.white, size: 28)),
              const SizedBox(height: 6),
              Text(_calisiyor ? 'DURDUR' : 'BAŞLAT', style: kLabel(context, size: 9)),
            ]),
          ),
        ]),
        const SizedBox(height: 24),
      ]),
    );
  }

  InputDecoration _inputDeko(BuildContext context, String hint) {
    return InputDecoration(
      hintText: hint, hintStyle: kLabel(context),
      filled: true, fillColor: kSurfaceLow(context),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed, width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }
}