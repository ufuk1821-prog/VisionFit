import 'package:flutter/material.dart';
import '../tema.dart';
import '../servisler/api_servisi.dart';
import 'giris_ekrani.dart';
import 'ana_sayfa_icerik.dart';
import 'kamera_ekrani.dart';
import 'fotograf_ekrani.dart';
import 'gecmis_ekrani.dart';
import 'egzersiz_ekrani.dart';
import 'defter_ekrani.dart';
import 'diyet_ekrani.dart';
import 'beslenme_ekrani.dart';
import 'adim_ekrani.dart';
import 'zamanlayici_ekrani.dart';
import 'rozetler_ekrani.dart';
import 'ayarlar_ekrani.dart';
import 'profil_ekrani.dart';

class AnaEkran extends StatefulWidget {
  const AnaEkran({super.key});
  @override
  State<AnaEkran> createState() => AnaEkranState();
}

class AnaEkranState extends State<AnaEkran> {
  String _aktifSayfa = 'ana';
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  void sayfayaGit(String sayfa) {
    setState(() { _aktifSayfa = sayfa; });
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      Navigator.pop(context);
    }
  }

  Widget _sayfaGetir() {
    switch (_aktifSayfa) {
      case 'ana': return AnaSayfaIcerik(sayfayaGit: sayfayaGit);
      case 'kamera': return KameraEkrani(geriDon: () => sayfayaGit('ana'));
      case 'fotograf': return const FotografEkrani();
      case 'gecmis': return const GecmisEkrani();
      case 'egzersiz': return const EgzersizEkrani();
      case 'defter': return const DefterEkrani();
      case 'diyet': return const DiyetEkrani();
      case 'beslenme': return const BeslenmeEkrani();
      case 'adim': return const AdimEkrani();
      case 'zamanlayici': return const ZamanlamayiciEkrani();
      case 'rozetler': return const RozetlerEkrani();
      case 'ayarlar': return const AyarlarEkrani();
      case 'profil': return const ProfilEkrani();
      default: return AnaSayfaIcerik(sayfayaGit: sayfayaGit);
    }
  }

  String _sayfaBaslik() {
    const basliklar = {
      'ana': 'VisionFit', 'kamera': 'Kamera Analizi', 'fotograf': 'Fotoğraflı Analiz',
      'gecmis': 'Geçmiş', 'egzersiz': 'Egzersiz Kütüphanesi', 'defter': 'Antrenman Defteri',
      'diyet': 'Diyet Önerisi', 'beslenme': 'Beslenme Takibi', 'adim': 'Adım Sayacı',
      'zamanlayici': 'Kronometre', 'rozetler': 'Rozetlerim', 'ayarlar': 'Ayarlar', 'profil': 'Profilim',
    };
    return basliklar[_aktifSayfa] ?? 'VisionFit';
  }

  @override
  Widget build(BuildContext context) {
    final bool kameraEkraniMi = _aktifSayfa == 'kamera';
    final bool anaEkranMi = _aktifSayfa == 'ana';

    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) {
        if (_aktifSayfa != 'ana') {
          setState(() { _aktifSayfa = 'ana'; });
        }
      },
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: kBg(context),
        appBar: kameraEkraniMi ? null : AppBar(
          backgroundColor: kSurface(context),
          elevation: 0,
          titleSpacing: 0,
          leading: IconButton(
            icon: const Icon(Icons.menu, color: kRed),
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          ),
          title: anaEkranMi
              ? Text('VisionFit', style: kHeadline(context, size: 20, weight: FontWeight.w900, color: kRed))
              : Text(_sayfaBaslik(), style: kHeadline(context, size: 18, weight: FontWeight.w700)),
          actions: [
            if (!anaEkranMi)
              IconButton(
                icon: const Icon(Icons.home_outlined, color: kRed),
                onPressed: () => setState(() { _aktifSayfa = 'ana'; }),
              ),
            if (anaEkranMi)
              IconButton(
                icon: const Icon(Icons.person_outline, color: kRed),
                onPressed: () => setState(() { _aktifSayfa = 'profil'; }),
              ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(height: 1, color: kBorder(context)),
          ),
        ),
        drawer: _drawerWidget(context),
        body: _sayfaGetir(),
      ),
    );
  }

  Widget _drawerWidget(BuildContext context) {
    final menuler = [
      ('ana', Icons.home_outlined, 'ANA SAYFA'),
      ('kamera', Icons.videocam_outlined, 'KAMERA ANALİZİ'),
      ('fotograf', Icons.image_outlined, 'FOTOĞRAFLI ANALİZ'),
      ('gecmis', Icons.history_outlined, 'GEÇMİŞ'),
      ('egzersiz', Icons.menu_book_outlined, 'EGZERSİZ KÜTÜPHANESİ'),
      ('defter', Icons.event_note_outlined, 'ANTRENMAN DEFTERİ'),
      ('diyet', Icons.restaurant_outlined, 'DİYET ÖNERİSİ'),
      ('beslenme', Icons.food_bank_outlined, 'BESLENME TAKİBİ'),
      ('adim', Icons.directions_walk_outlined, 'ADIM SAYACI'),
      ('zamanlayici', Icons.timer_outlined, 'KRONOMETRE'),
      ('rozetler', Icons.workspace_premium_outlined, 'ROZETLERİM'),
    ];
    final altMenuler = [
      ('ayarlar', Icons.settings_outlined, 'AYARLAR'),
      ('profil', Icons.person_outline, 'PROFİLİM'),
    ];

    return Drawer(
      width: 280,
      backgroundColor: kSurfaceLow(context),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 52, 16, 16),
            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: kBorder(context)))),
            child: Row(children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: kRed, borderRadius: BorderRadius.circular(8),
                  boxShadow: [BoxShadow(color: kRed.withOpacity(0.3), blurRadius: 10)],
                ),
                child: const Icon(Icons.visibility, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              Text('VisionFit', style: kHeadline(context, size: 20, weight: FontWeight.w900, color: kRed)),
            ]),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                ...menuler.map((m) => _menuItem(context, m.$1, m.$2, m.$3)),
                Container(height: 1, color: kBorder(context), margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 12)),
                ...altMenuler.map((m) => _menuItem(context, m.$1, m.$2, m.$3)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(border: Border(top: BorderSide(color: kBorder(context)))),
            child: Row(children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(color: kSurfaceHigh(context), shape: BoxShape.circle, border: Border.all(color: kBorder(context))),
                child: Icon(Icons.person_outline, color: kHint(context), size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Profil', style: kBody(context, size: 13, weight: FontWeight.w700)),
                  Text('Pro Üye', style: kLabel(context)),
                ],
              )),
              GestureDetector(
                onTap: () async {
                  await ApiServisi.tokenSil();
                  if (!mounted) return;
                  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const GirisEkrani()));
                },
                child: Icon(Icons.logout_outlined, color: kHint(context), size: 20),
              ),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _menuItem(BuildContext context, String id, IconData ikon, String label) {
    final aktif = _aktifSayfa == id;
    return GestureDetector(
      onTap: () => sayfayaGit(id),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: aktif ? kRed.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: aktif ? const Border(left: BorderSide(color: kRed, width: 3)) : null,
        ),
        child: Row(children: [
          Icon(ikon, color: aktif ? kRed : kHint(context), size: 20),
          const SizedBox(width: 12),
          Text(label, style: kLabel(context, size: 11, color: aktif ? kRed : kHint(context))),
        ]),
      ),
    );
  }
}