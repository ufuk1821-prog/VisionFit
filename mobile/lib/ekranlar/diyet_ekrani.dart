import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';

class DiyetEkrani extends StatefulWidget {
  const DiyetEkrani({super.key});

  @override
  State<DiyetEkrani> createState() => _DiyetEkraniState();
}

class _DiyetEkraniState extends State<DiyetEkrani> {
  final _boyController = TextEditingController();
  final _kiloController = TextEditingController();
  final _yasController = TextEditingController();
  final _istekController = TextEditingController();
  String _cinsiyet = '';
  String _aktiflik = '';
  String _hedef = '';
  Map<String, dynamic>? _sonuc;
  bool _yukleniyor = false;
  String _hata = '';
  String _aiOneri = '';
  bool _aiYukleniyor = false;
  final _scrollController = ScrollController();

  final List<Map<String, String>> _aktiflikSecenekler = [
    {'value': 'sedanter', 'label': 'Hareketsiz (ofis işi)'},
    {'value': 'az_hareketli', 'label': 'Az Hareketli (haftada 1-3 gün)'},
    {'value': 'orta_hareketli', 'label': 'Orta Hareketli (haftada 3-5 gün)'},
    {'value': 'cok_hareketli', 'label': 'Çok Hareketli (haftada 6-7 gün)'},
    {'value': 'asiri_hareketli', 'label': 'Aşırı Hareketli (günde 2 kez)'},
  ];

  final List<Map<String, String>> _hedefSecenekler = [
    {'value': 'kilo_verme', 'label': 'Kilo Ver'},
    {'value': 'kilo_koruma', 'label': 'Kiloyu Koru'},
    {'value': 'kilo_alma', 'label': 'Kilo Al'},
  ];

  Future<void> _hesapla() async {
    if (_boyController.text.isEmpty || _kiloController.text.isEmpty || _yasController.text.isEmpty || _cinsiyet.isEmpty || _aktiflik.isEmpty || _hedef.isEmpty) {
      setState(() { _hata = 'Lütfen tüm alanları doldurun.'; });
      return;
    }
    setState(() { _yukleniyor = true; _hata = ''; _sonuc = null; _aiOneri = ''; });
    try {
      final yanit = await ApiServisi.postJson('/api/users/diet/calculate', {
        'boy': double.tryParse(_boyController.text) ?? 0,
        'kilo': double.tryParse(_kiloController.text) ?? 0,
        'yas': int.tryParse(_yasController.text) ?? 0,
        'cinsiyet': _cinsiyet,
        'aktiflik_seviyesi': _aktiflik,
        'hedef': _hedef,
        'istek': _istekController.text.trim(),
      });
      setState(() { _sonuc = Map<String, dynamic>.from(yanit); });
      Future.delayed(const Duration(milliseconds: 300), () {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent, duration: const Duration(milliseconds: 500), curve: Curves.easeOut);
      });
    } catch (e) {
      setState(() { _hata = 'Hesaplama başarısız.'; });
    } finally {
      setState(() { _yukleniyor = false; });
    }
  }

  Future<void> _aiOneriAl() async {
    if (_sonuc == null) return;
    setState(() { _aiYukleniyor = true; _aiOneri = ''; });
    try {
      final planlar = _sonuc!['planlar'] as List?;
      final plan = planlar?.isNotEmpty == true ? planlar!.first : {};
      final yanit = await ApiServisi.postJson('/api/yerel-ai/diyet-onerisi', {
        'bmi': _sonuc!['bmi'],
        'bmi_kategori': _sonuc!['bmi_kategori'],
        'hedef': _sonuc!['hedef'],
        'hedef_kalori': _sonuc!['hedef_kalori'],
        'protein_g': plan['protein_g'] ?? 0,
        'karbonhidrat_g': plan['karbonhidrat_g'] ?? 0,
        'yag_g': plan['yag_g'] ?? 0,
        'istek': _istekController.text.trim(),
      });
      setState(() { _aiOneri = yanit['yorum'] ?? ''; });
    } catch (e) {
      setState(() { _aiOneri = 'AI önerisi alınamadı.'; });
    } finally {
      setState(() { _aiYukleniyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Diyet Önerisi', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          _formKarti(),
          if (_hata.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(_hata, style: const TextStyle(color: Color(0xFFE8313F), fontSize: 13)),
          ],
          if (_sonuc != null) ...[
            const SizedBox(height: 20),
            _sonucKarti(),
            const SizedBox(height: 12),
            _aiKarti(),
          ],
        ],
      ),
    );
  }

  Widget _formKarti() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(child: _sayiInput('Boy (cm)', _boyController)),
            const SizedBox(width: 12),
            Expanded(child: _sayiInput('Kilo (kg)', _kiloController)),
          ]),
          const SizedBox(height: 12),
          _sayiInput('Yaş', _yasController),
          const SizedBox(height: 12),
          const Text('Cinsiyet', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 6),
          Row(children: [
            Expanded(child: _secimButonu('Erkek', _cinsiyet == 'Erkek', () => setState(() { _cinsiyet = 'Erkek'; }))),
            const SizedBox(width: 8),
            Expanded(child: _secimButonu('Kadın', _cinsiyet == 'Kadın', () => setState(() { _cinsiyet = 'Kadın'; }))),
          ]),
          const SizedBox(height: 12),
          const Text('Aktivite Seviyesi', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 6),
          _dropdown(_aktiflikSecenekler, _aktiflik, (v) => setState(() { _aktiflik = v!; })),
          const SizedBox(height: 12),
          const Text('Hedef', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 6),
          Row(children: _hedefSecenekler.map((h) => Expanded(child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _secimButonu(h['label']!, _hedef == h['value'], () => setState(() { _hedef = h['value']!; })),
          ))).toList()),
          const SizedBox(height: 12),
          const Text('Özel İstek (opsiyonel)', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
          const SizedBox(height: 6),
          TextField(
            controller: _istekController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: _inputDeko('Örn: vejetaryenim, yumurtaya alerjim var...'),
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity, height: 48,
            child: ElevatedButton(
              onPressed: _yukleniyor ? null : _hesapla,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: _yukleniyor ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Hesapla', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sonucKarti() {
    final bmi = _sonuc!['bmi'];
    final bmiKategori = _sonuc!['bmi_kategori'] ?? '';
    final hedefKalori = _sonuc!['hedef_kalori'];
    final planlar = _sonuc!['planlar'] as List? ?? [];

    final bmiRenkler = {'Zayif': Colors.blue, 'Normal': const Color(0xFF4CAF50), 'Kilolu': Colors.orange, 'Obez': const Color(0xFFE8313F)};
    final bmiEtiketler = {'Zayif': 'Zayıf', 'Normal': 'Normal', 'Kilolu': 'Kilolu', 'Obez': 'Obez'};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Expanded(child: _ozet('BMI', '$bmi', Icons.monitor_weight_outlined,
            alt: bmiEtiketler[bmiKategori] ?? bmiKategori,
            renk: bmiRenkler[bmiKategori] ?? const Color(0xFFE8313F))),
          const SizedBox(width: 12),
          Expanded(child: _ozet('Hedef Kalori', '$hedefKalori kcal', Icons.local_fire_department_outlined)),
        ]),
        const SizedBox(height: 12),
        ...planlar.map((plan) => _planKarti(plan)),
      ],
    );
  }

  Widget _planKarti(dynamic plan) {
    final ogunler = plan['ornek_ogunler'] as List? ?? [];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(plan['baslik'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('${plan['kalori']} kcal • P: ${plan['protein_g']}g • K: ${plan['karbonhidrat_g']}g • Y: ${plan['yag_g']}g',
            style: const TextStyle(color: Color(0xFF888888), fontSize: 12)),
          const SizedBox(height: 12),
          ...ogunler.map((o) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text('• $o', style: const TextStyle(color: Color(0xFFCCCCCC), fontSize: 13, height: 1.5)),
          )),
        ],
      ),
    );
  }

  Widget _aiKarti() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [
            Icon(Icons.auto_awesome, color: Color(0xFFE8313F), size: 18),
            SizedBox(width: 8),
            Text('AI Diyet Önerisi', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
          ]),
          const SizedBox(height: 12),
          if (_aiOneri.isEmpty)
            SizedBox(
              width: double.infinity, height: 44,
              child: ElevatedButton(
                onPressed: _aiYukleniyor ? null : _aiOneriAl,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                child: _aiYukleniyor ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('AI Önerisi Al', style: TextStyle(color: Colors.white)),
              ),
            )
          else
            Text(_aiOneri, style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.6)),
        ],
      ),
    );
  }

  Widget _ozet(String baslik, String deger, IconData ikon, {String? alt, Color? renk}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(ikon, color: renk ?? const Color(0xFFE8313F), size: 18),
        const SizedBox(height: 8),
        Text(deger, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
        Text(baslik, style: const TextStyle(color: Color(0xFF888888), fontSize: 11)),
        if (alt != null) Text(alt, style: TextStyle(color: renk ?? const Color(0xFFE8313F), fontSize: 12, fontWeight: FontWeight.w600)),
      ]),
    );
  }

  Widget _sayiInput(String label, TextEditingController controller) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
      const SizedBox(height: 6),
      TextField(controller: controller, keyboardType: TextInputType.number, style: const TextStyle(color: Colors.white), decoration: _inputDeko(''),),
    ]);
  }

  Widget _secimButonu(String label, bool secili, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: secili ? const Color(0xFFE8313F) : const Color(0xFF0F0F0F),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: secili ? const Color(0xFFE8313F) : const Color(0xFF333333)),
        ),
        child: Center(child: Text(label, style: TextStyle(color: secili ? Colors.white : const Color(0xFF888888), fontSize: 13, fontWeight: secili ? FontWeight.w600 : FontWeight.normal))),
      ),
    );
  }

  Widget _dropdown(List<Map<String, String>> secenekler, String value, void Function(String?) onChanged) {
    return DropdownButtonFormField<String>(
      value: value.isEmpty ? null : value,
      dropdownColor: const Color(0xFF1A1A1A),
      style: const TextStyle(color: Colors.white, fontSize: 13),
      hint: const Text('Seçin...', style: TextStyle(color: Color(0xFF555555))),
      decoration: _inputDeko(''),
      items: secenekler.map((s) => DropdownMenuItem(value: s['value'], child: Text(s['label']!))).toList(),
      onChanged: onChanged,
    );
  }

  InputDecoration _inputDeko(String hint) {
    return InputDecoration(
      hintText: hint, hintStyle: const TextStyle(color: Color(0xFF555555)),
      filled: true, fillColor: const Color(0xFF0F0F0F),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE8313F))),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }
}