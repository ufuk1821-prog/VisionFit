import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'ekranlar/giris_ekrani.dart';
import 'ekranlar/ana_ekran.dart';

import 'package:webview_flutter_android/webview_flutter_android.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  WebViewPlatform.instance ??= AndroidWebViewPlatform();
  runApp(const VisionFitApp());
}

class VisionFitApp extends StatefulWidget {
  const VisionFitApp({super.key});

  static VisionFitAppState? of(BuildContext context) =>
      context.findAncestorStateOfType<VisionFitAppState>();

  @override
  State<VisionFitApp> createState() => VisionFitAppState();
}

class VisionFitAppState extends State<VisionFitApp> {
  ThemeMode themeMode = ThemeMode.dark;

  void temaDegistir(ThemeMode mode) {
    setState(() { themeMode = mode; });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VisionFit',
      debugShowCheckedModeBanner: false,
      themeMode: themeMode,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF0F0F0),
        colorScheme: const ColorScheme.light(primary: Color(0xFFE8313F), surface: Color(0xFFFFFFFF)),
        appBarTheme: const AppBarTheme(backgroundColor: Color(0xFFFFFFFF), foregroundColor: Colors.black),
        drawerTheme: const DrawerThemeData(backgroundColor: Color(0xFFFFFFFF)),
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F0F0F),
        colorScheme: const ColorScheme.dark(primary: Color(0xFFE8313F), surface: Color(0xFF1A1A1A)),
        appBarTheme: const AppBarTheme(backgroundColor: Color(0xFF1A1A1A), foregroundColor: Colors.white),
        drawerTheme: const DrawerThemeData(backgroundColor: Color(0xFF1A1A1A)),
      ),
      home: const BaslangicEkrani(),
    );
  }
}

class BaslangicEkrani extends StatefulWidget {
  const BaslangicEkrani({super.key});

  @override
  State<BaslangicEkrani> createState() => _BaslangicEkraniState();
}

class _BaslangicEkraniState extends State<BaslangicEkrani> {
  @override
  void initState() {
    super.initState();
    _tokenKontrol();
  }

  Future<void> _tokenKontrol() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (!mounted) return;
    if (token != null && token.isNotEmpty) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const AnaEkran()));
    } else {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const GirisEkrani()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator(color: Color(0xFFE8313F))),
    );
  }
}