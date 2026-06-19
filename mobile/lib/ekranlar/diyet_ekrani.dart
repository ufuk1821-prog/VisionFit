import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';

class DiyetEkrani extends StatefulWidget {
  const DiyetEkrani({super.key});
  @override
  State<DiyetEkrani> createState() => _DiyetEkraniState();
}

class _DiyetEkraniState extends State<DiyetEkrani> {
  final _boyCtrl = TextEditingController();
  final _kiloCtrl = TextEditingController();
  final _yasCtrl = TextEditingController();
  final _istekCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  String _cinsiyet = '';
  String _aktiflik = '';
  String _hedef = '';
  Map<String, dynamic>? _sonuc;
  bool _yukleniyor = false;
  String _hata = '';
  String _aiOneri = '';
  bool _aiYukleniyor = false;

  final List<Map<String, String>> _aktiflikler = [
    {'value': 'sedanter', 'label': 'Hareketsiz (ofis işi)'},
    {'value': 'az_hareketli', 'label': 'Az Hareketli (haftada 1-3 gün)'},
    {'value': 'orta_hareketli', 'label': 'Orta Hareketli (haftada 3-5 gün)'},
    {'value': 'cok_hareketli', 'label': 'Çok Hareketli (haftada 6-7 gün)'},
    {'value': 'asiri_hareketli', 'label': 'Aşırı Hareketli (günde 2 kez)'},
  ];
  final List<Map<String, String>> _hedefler = [
    {'value': 'kilo_verme', 'label': 'Kilo Ver', 'emoji': '📉'},
    {'value': 'kilo_koruma', 'label': 'Koru', 'emoji': '⚖️'},
    {'value': 'kilo_alma', 'label': 'Kilo Al', 'emoji': '📈'},
  ];

  Future<void> _hesapla() async {
    if (_boyCtrl.text.isEmpty || _kiloCtrl.text.isEmpty || _yasCtrl.text.isEmpty || _cinsiyet.isEmpty || _aktiflik.isEmpty || _hedef.isEmpty) {
      setState(() { _hata = 'Lütfen tüm alanları doldurun.'; });
      return;
    }
    setState(() { _yukleniyor = true; _hata = ''; _sonuc = null; _aiOneri = ''; });
    try {
      final yanit = await ApiServisi.postJson('/api/users/diet/calculate', {
        'boy': double.tryParse(_boyCtrl.text) ?? 0, 'kilo': double.tryParse(_kiloCtrl.text) ?? 0,
        'yas': int.tryParse(_yasCtrl.text) ?? 0, 'cinsiyet': _cinsiyet,
        'aktiflik_seviyesi': _aktiflik, 'hedef': _hedef, 'istek': _istekCtrl.text.trim(),
      });
      setState(() { _sonuc = Map<String, dynamic>.from(yanit); });
      Future.delayed(const Duration(milliseconds: 300), () {
        _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 500), curve: Curves.easeOut);
      });
    } catch (_) {
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
        'bmi': _sonuc!['bmi'], 'bmi_kategori': _sonuc!['bmi_kategori'], 'hedef': _sonuc!['hedef'],
        'hedef_kalori': _sonuc!['hedef_kalori'], 'protein_g': plan['protein_g'] ?? 0,
        'karbonhidrat_g': plan['karbonhidrat_g'] ?? 0, 'yag_g': plan['yag_g'] ?? 0, 'istek': _istekCtrl.text.trim(),
      });
      setState(() { _aiOneri = yanit['yorum'] ?? ''; });
    } catch (_) {
      setState(() { _aiOneri = 'AI önerisi alınamadı.'; });
    } finally {
      setState(() { _aiYukleniyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      controller: _scrollCtrl,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Diyet Önerisi', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('Kişisel verilerinle kalori ve makro hesapla.', style: kBody(context, size: 13, color: kHint(context))),
          const SizedBox(height: 20),
          _formKarti(context),
          if (_hata.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: kRed.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: kRed.withOpacity(0.3))),
              child: Row(children: [
                const Icon(Icons.warning_amber_outlined, color: kRed, size: 16),
                const SizedBox(width: 8),
                Text(_hata, style: kBody(context, size: 12, color: kRed)),
              ]),
            ),
          ],
          if (_sonuc != null) ...[
            const SizedBox(height: 20),
            _sonucKarti(context),
            const SizedBox(height: 12),
            _aiKarti(context),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _formKarti(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorderAlt(context))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: _inputAlani(context, 'BOY (CM)', _boyCtrl)),
          const SizedBox(width: 12),
          Expanded(child: _inputAlani(context, 'KİLO (KG)', _kiloCtrl)),
        ]),
        const SizedBox(height: 14),
        _inputAlani(context, 'YAŞ', _yasCtrl),
        const SizedBox(height: 14),
        Text('CİNSİYET', style: kLabel(context)),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: _secimButonu(context, 'Erkek', _cinsiyet == 'Erkek', () => setState(() { _cinsiyet = 'Erkek'; }))),
          const SizedBox(width: 8),
          Expanded(child: _secimButonu(context, 'Kadın', _cinsiyet == 'Kadın', () => setState(() { _cinsiyet = 'Kadın'; }))),
        ]),
        const SizedBox(height: 14),
        Text('AKTİVİTE SEVİYESİ', style: kLabel(context)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _aktiflik.isEmpty ? null : _aktiflik,
          dropdownColor: kSurfaceLow(context),
          style: kBody(context, size: 13, color: kText(context)),
          hint: Text('Seçin...', style: kBody(context, size: 13, color: kHint(context))),
          decoration: InputDecoration(
            filled: true, fillColor: kSurfaceContainer(context),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed, width: 1.5)),
          ),
          items: _aktiflikler.map((a) => DropdownMenuItem(value: a['value'], child: Text(a['label']!, style: kBody(context, size: 12, color: kText(context))))).toList(),
          onChanged: (v) => setState(() { _aktiflik = v!; }),
        ),
        const SizedBox(height: 14),
        Text('HEDEF', style: kLabel(context)),
        const SizedBox(height: 8),
        Row(children: _hedefler.map((h) => Expanded(child: Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => setState(() { _hedef = h['value']!; }),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: _hedef == h['value'] ? kRed : kSurfaceContainer(context),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _hedef == h['value'] ? kRed : kBorder(context)),
              ),
              child: Column(children: [
                Text(h['emoji']!, style: const TextStyle(fontSize: 20)),
                const SizedBox(height: 4),
                Text(h['label']!, style: kLabel(context, size: 10, color: _hedef == h['value'] ? Colors.white : kHint(context))),
              ]),
            ),
          ),
        ))).toList()),
        const SizedBox(height: 14),
        Text('ÖZEL İSTEK (OPSİYONEL)', style: kLabel(context)),
        const SizedBox(height: 8),
        TextField(
          controller: _istekCtrl,
          style: kBody(context, color: kText(context)),
          maxLines: 2,
          decoration: InputDecoration(
            hintText: 'Örn: vejetaryenim, yumurtaya alerjim var...', hintStyle: kBody(context, size: 13, color: kHint(context)),
            filled: true, fillColor: kSurfaceContainer(context),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed, width: 1.5)),
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity, height: 48,
          child: ElevatedButton(
            onPressed: _yukleniyor ? null : _hesapla,
            style: ElevatedButton.styleFrom(backgroundColor: kRed, disabledBackgroundColor: kRed.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0),
            child: _yukleniyor ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : Text('HESAPLA', style: kLabel(context, size: 12, color: Colors.white)),
          ),
        ),
      ]),
    );
  }

  Widget _sonucKarti(BuildContext context) {
    final bmi = _sonuc!['bmi'];
    final bmiKategori = _sonuc!['bmi_kategori'] ?? '';
    final hedefKalori = _sonuc!['hedef_kalori'];
    final planlar = _sonuc!['planlar'] as List? ?? [];
    final bmiRenkler = {'Zayif': kBlue, 'Normal': kGreen, 'Kilolu': kAmber, 'Obez': kRed};
    final bmiEtiketler = {'Zayif': 'Zayıf', 'Normal': 'Normal', 'Kilolu': 'Kilolu', 'Obez': 'Obez'};
    final bmiRenk = bmiRenkler[bmiKategori] ?? kRed;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Text('SONUÇLAR', style: kLabel(context)),
        const SizedBox(width: 8),
        Expanded(child: Container(height: 1, color: kBorder(context))),
      ]),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: bmiRenk.withOpacity(0.4))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('VKİ (BMI)', style: kLabel(context)),
            const SizedBox(height: 8),
            Text('$bmi', style: kHeadline(context, size: 28, weight: FontWeight.w900, color: bmiRenk)),
            Container(
              margin: const EdgeInsets.only(top: 4),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: bmiRenk.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
              child: Text(bmiEtiketler[bmiKategori] ?? bmiKategori, style: kLabel(context, size: 10, color: bmiRenk)),
            ),
          ]),
        )),
        const SizedBox(width: 12),
        Expanded(child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kRed.withOpacity(0.4))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('HEDEF KALORİ', style: kLabel(context)),
            const SizedBox(height: 8),
            Text('$hedefKalori', style: kHeadline(context, size: 28, weight: FontWeight.w900, color: kRed)),
            Text('kcal / gün', style: kLabel(context, size: 10)),
          ]),
        )),
      ]),
      const SizedBox(height: 12),
      ...planlar.map((plan) => _planKarti(context, plan)),
    ]);
  }

  Widget _planKarti(BuildContext context, dynamic plan) {
    final ogunler = plan['ornek_ogunler'] as List? ?? [];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorderAlt(context))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(plan['baslik'] ?? '', style: kBody(context, size: 15, weight: FontWeight.w700, color: kText(context))),
        const SizedBox(height: 6),
        Row(children: [
          _makroCip(context, '${plan['kalori']} kcal', kRed),
          const SizedBox(width: 6),
          _makroCip(context, 'P: ${plan['protein_g']}g', kBlue),
          const SizedBox(width: 6),
          _makroCip(context, 'K: ${plan['karbonhidrat_g']}g', kGreen),
          const SizedBox(width: 6),
          _makroCip(context, 'Y: ${plan['yag_g']}g', kAmber),
        ]),
        if (ogunler.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(height: 1, color: kBorder(context)),
          const SizedBox(height: 10),
          ...ogunler.map((o) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Icon(Icons.arrow_right, color: kRed, size: 18),
              const SizedBox(width: 4),
              Expanded(child: Text('$o', style: kBody(context, size: 13, color: kText(context)))),
            ]),
          )),
        ],
      ]),
    );
  }

  Widget _makroCip(BuildContext context, String label, Color renk) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: renk.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
      child: Text(label, style: kLabel(context, size: 9, color: renk)),
    );
  }

  Widget _aiKarti(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kPurple.withOpacity(0.4))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.auto_awesome, color: kPurple, size: 18),
          const SizedBox(width: 8),
          Text('AI DİYET ÖNERİSİ', style: kLabel(context, color: kText(context))),
        ]),
        const SizedBox(height: 4),
        Text('Kişiselleştirilmiş beslenme önerisi al', style: kBody(context, size: 12, color: kHint(context))),
        const SizedBox(height: 14),
        if (_aiOneri.isEmpty)
          SizedBox(
            width: double.infinity, height: 44,
            child: ElevatedButton(
              onPressed: _aiYukleniyor ? null : _aiOneriAl,
              style: ElevatedButton.styleFrom(backgroundColor: kPurple, disabledBackgroundColor: kPurple.withOpacity(0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0),
              child: _aiYukleniyor ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : Text('AI ÖNERİSİ AL', style: kLabel(context, size: 11, color: Colors.white)),
            ),
          )
        else
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: kSurfaceLowest(context), borderRadius: BorderRadius.circular(8), border: Border.all(color: kBorder(context))),
            child: Text(_aiOneri, style: kBody(context, size: 13, color: kText(context))),
          ),
      ]),
    );
  }

  Widget _inputAlani(BuildContext context, String label, TextEditingController ctrl) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: kLabel(context)),
      const SizedBox(height: 6),
      TextField(
        controller: ctrl, keyboardType: TextInputType.number, style: kBody(context, color: kText(context)),
        decoration: InputDecoration(
          filled: true, fillColor: kSurfaceContainer(context),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder(context))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kRed, width: 1.5)),
        ),
      ),
    ]);
  }

  Widget _secimButonu(BuildContext context, String label, bool secili, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(color: secili ? kRed : kSurfaceContainer(context), borderRadius: BorderRadius.circular(8), border: Border.all(color: secili ? kRed : kBorder(context))),
        child: Center(child: Text(label, style: kBody(context, size: 13, weight: secili ? FontWeight.w600 : FontWeight.w400, color: secili ? Colors.white : kHint(context)))),
      ),
    );
  }
}