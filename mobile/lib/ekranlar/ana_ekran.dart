import 'package:flutter/material.dart';
import '../servisler/api_servisi.dart';
import 'giris_ekrani.dart';
import 'ana_sayfa_icerik.dart';
import 'gecmis_ekrani.dart';
import 'diyet_ekrani.dart';
import 'defter_ekrani.dart';
import 'adim_ekrani.dart';
import 'zamanlayici_ekrani.dart';
import 'rozetler_ekrani.dart';
import 'ayarlar_ekrani.dart';
import 'profil_ekrani.dart';
import 'beslenme_ekrani.dart';

class AnaEkran extends StatefulWidget {
  const AnaEkran({super.key});

  @override
  State<AnaEkran> createState() => _AnaEkranState();
}

class _AnaEkranState extends State<AnaEkran> {
  String _aktifSayfa = 'ana';

  Widget _sayfaGetir() {
    switch (_aktifSayfa) {
      case 'ana': return AnaSayfaIcerik(sayfayaGit: _sayfayaGit);
      case 'gecmis': return const GecmisEkrani();
      case 'diyet': return const DiyetEkrani();
      case 'defter': return const DefterEkrani();
      case 'adim': return const AdimEkrani();
      case 'zamanlayici': return const ZamanlamayiciEkrani();
      case 'rozetler': return const RozetlerEkrani();
      case 'ayarlar': return const AyarlarEkrani();
      case 'profil': return const ProfilEkrani();
      case 'beslenme': return const BeslenmeEkrani();
      default: return AnaSayfaIcerik(sayfayaGit: _sayfayaGit);
    }
  }

  void _sayfayaGit(String sayfa) {
    setState(() { _aktifSayfa = sayfa; });
    if (Navigator.canPop(context)) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      drawer: _cekmeMenu(),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        title: Image.asset('assets/logo.png', height: 32),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _sayfaGetir(),
    );
  }

  Widget _cekmeMenu() {
    final menuler = [
      ('ana', Icons.home_outlined, 'Ana Sayfa'),
      ('gecmis', Icons.history_outlined, 'Geçmiş Antrenmanlar'),
      ('diyet', Icons.restaurant_menu_outlined, 'Diyet Önerisi'),
      ('defter', Icons.book_outlined, 'Antrenman Defteri'),
      ('beslenme', Icons.food_bank_outlined, 'Beslenme Takibi'),
      ('adim', Icons.directions_walk_outlined, 'Adım Sayacı'),
      ('zamanlayici', Icons.timer_outlined, 'Kronometre & Zamanlayıcı'),
      ('rozetler', Icons.military_tech_outlined, 'Rozetlerim'),
      ('ayarlar', Icons.settings_outlined, 'Ayarlar'),
      ('profil', Icons.person_outline, 'Profilim'),
    ];

    return Drawer(
      backgroundColor: const Color(0xFF1A1A1A),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(color: Color(0xFF0F0F0F)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Image.asset('assets/logo.png', height: 40),
                const SizedBox(height: 8),
                const Text('en iyi haline ulaş', style: TextStyle(color: Color(0xFF888888), fontSize: 12)),
              ],
            ),
          ),
          ...menuler.map((m) => ListTile(
            leading: Icon(m.$2, color: _aktifSayfa == m.$1 ? const Color(0xFFE8313F) : const Color(0xFF888888), size: 20),
            title: Text(m.$3, style: TextStyle(color: _aktifSayfa == m.$1 ? const Color(0xFFE8313F) : Colors.white, fontSize: 14)),
            tileColor: _aktifSayfa == m.$1 ? const Color(0xFFE8313F).withOpacity(0.1) : null,
            onTap: () { setState(() { _aktifSayfa = m.$1; }); Navigator.pop(context); },
          )),
          const Divider(color: Color(0xFF333333)),
          ListTile(
            leading: const Icon(Icons.logout, color: Color(0xFF888888), size: 20),
            title: const Text('Çıkış Yap', style: TextStyle(color: Colors.white, fontSize: 14)),
            onTap: () async {
              await ApiServisi.tokenSil();
              if (!mounted) return;
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const GirisEkrani()));
            },
          ),
        ],
      ),
    );
  }
}