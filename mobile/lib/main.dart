import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'ekranlar/giris_ekrani.dart';
import 'ekranlar/ana_ekran.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const VisionFitApp());
}

class VisionFitApp extends StatelessWidget {
  const VisionFitApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VisionFit',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFF0F0F0F),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFFE8313F),
          surface: const Color(0xFF1A1A1A),
        ),
        fontFamily: 'Outfit',
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