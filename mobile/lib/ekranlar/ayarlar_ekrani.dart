import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';
import 'giris_ekrani.dart';

class AyarlarEkrani extends StatefulWidget {
  const AyarlarEkrani({super.key});

  @override
  State<AyarlarEkrani> createState() => _AyarlarEkraniState();
}

class _AyarlarEkraniState extends State<AyarlarEkrani> {
  final _mevcutSifreController = TextEditingController();
  final _yeniSifreController = TextEditingController();
  final _yeniSifreTekrarController = TextEditingController();
  String _sifreMesaj = '';
  bool _sifreHata = false;
  bool _sifreYukleniyor = false;
  bool _silModalAcik = false;
  bool _silYukleniyor = false;

  Future<void> _sifreDegistir() async {
    if (_yeniSifreController.text != _yeniSifreTekrarController.text) {
      setState(() { _sifreMesaj = 'Yeni şifreler eşleşmiyor.'; _sifreHata = true; });
      return;
    }
    setState(() { _sifreYukleniyor = true; _sifreMesaj = ''; });
    try {
      await ApiServisi.putJson('/api/users/me/password', {
        'mevcut_sifre': _mevcutSifreController.text,
        'yeni_sifre': _yeniSifreController.text,
      });
      setState(() { _sifreMesaj = 'Şifre başarıyla değiştirildi.'; _sifreHata = false; });
      _mevcutSifreController.clear();
      _yeniSifreController.clear();
      _yeniSifreTekrarController.clear();
    } catch (e) {
      setState(() { _sifreMesaj = 'Şifre değiştirilemedi.'; _sifreHata = true; });
    } finally {
      setState(() { _sifreYukleniyor = false; });
    }
  }

  Future<void> _hesapSil() async {
    setState(() { _silYukleniyor = true; });
    try {
      await ApiServisi.deleteJson('/api/users/me');
      await ApiServisi.tokenSil();
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const GirisEkrani()));
    } catch (e) {
      setState(() { _silYukleniyor = false; _silModalAcik = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Ayarlar', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          _sifreDegistirKarti(),
          const SizedBox(height: 16),
          _hesapSilKarti(),
          if (_silModalAcik) _silModal(),
        ],
      ),
    );
  }

  Widget _sifreDegistirKarti() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.lock_outline, color: Color(0xFFE8313F), size: 20),
          SizedBox(width: 8),
          Text('Şifre Değiştir', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 16),
        _input('Mevcut Şifre', _mevcutSifreController, gizli: true),
        const SizedBox(height: 12),
        _input('Yeni Şifre', _yeniSifreController, gizli: true),
        const SizedBox(height: 12),
        _input('Yeni Şifre Tekrar', _yeniSifreTekrarController, gizli: true),
        if (_sifreMesaj.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(_sifreMesaj, style: TextStyle(color: _sifreHata ? const Color(0xFFE8313F) : const Color(0xFF4CAF50), fontSize: 13)),
        ],
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity, height: 44,
          child: ElevatedButton(
            onPressed: _sifreYukleniyor ? null : _sifreDegistir,
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: _sifreYukleniyor ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Şifreyi Değiştir', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ),
      ]),
    );
  }

  Widget _hesapSilKarti() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF333333))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.delete_outline, color: Color(0xFFE8313F), size: 20),
          SizedBox(width: 8),
          Text('Hesabı Sil', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 8),
        const Text('Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir.', style: TextStyle(color: Color(0xFF888888), fontSize: 13)),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity, height: 44,
          child: OutlinedButton(
            onPressed: () => setState(() { _silModalAcik = true; }),
            style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFFE8313F)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: const Text('Hesabımı Sil', style: TextStyle(color: Color(0xFFE8313F), fontWeight: FontWeight.w700)),
          ),
        ),
      ]),
    );
  }

  Widget _silModal() {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: const Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(16)),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.warning_amber_outlined, color: Color(0xFFE8313F), size: 48),
            const SizedBox(height: 16),
            const Text('Hesabı Sil', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            const Text('Bu işlem geri alınamaz. Tüm verileriniz silinecek.', style: TextStyle(color: Color(0xFF888888), fontSize: 14), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Row(children: [
              Expanded(child: OutlinedButton(
                onPressed: () => setState(() { _silModalAcik = false; }),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFF333333))),
                child: const Text('İptal', style: TextStyle(color: Colors.white)),
              )),
              const SizedBox(width: 12),
              Expanded(child: ElevatedButton(
                onPressed: _silYukleniyor ? null : _hesapSil,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8313F)),
                child: _silYukleniyor ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Sil', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              )),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _input(String label, TextEditingController controller, {bool gizli = false}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: Color(0xFF888888), fontSize: 13)),
      const SizedBox(height: 6),
      TextField(controller: controller, obscureText: gizli, style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          filled: true, fillColor: const Color(0xFF0F0F0F),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF333333))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE8313F))),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        )),
    ]);
  }
}