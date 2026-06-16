import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../sabitler.dart';

class ApiServisi {
  static Future<String?> tokenAl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<void> tokenKaydet(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> tokenSil() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  static Future<Map<String, String>> _basliklar() async {
    final token = await tokenAl();
    return {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};
  }

  static Future<dynamic> getJson(String path) async {
    final baslik = await _basliklar();
    final yanit = await http.get(Uri.parse('$apiUrl$path'), headers: baslik);
    return jsonDecode(utf8.decode(yanit.bodyBytes));
  }

  static Future<dynamic> postJson(String path, Map<String, dynamic> body) async {
    final baslik = await _basliklar();
    final yanit = await http.post(Uri.parse('$apiUrl$path'), headers: baslik, body: jsonEncode(body));
    return jsonDecode(utf8.decode(yanit.bodyBytes));
  }

  static Future<dynamic> putJson(String path, Map<String, dynamic> body) async {
    final baslik = await _basliklar();
    final yanit = await http.put(Uri.parse('$apiUrl$path'), headers: baslik, body: jsonEncode(body));
    return jsonDecode(utf8.decode(yanit.bodyBytes));
  }

  static Future<void> deleteJson(String path) async {
    final baslik = await _basliklar();
    await http.delete(Uri.parse('$apiUrl$path'), headers: baslik);
  }

  static Future<Map<String, dynamic>> girisYap(String email, String sifre) async {
    final yanit = await http.post(
      Uri.parse('$apiUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'sifre': sifre}),
    );
    final veri = jsonDecode(utf8.decode(yanit.bodyBytes));
    if (yanit.statusCode == 403) veri['status_code'] = 403;
    return Map<String, dynamic>.from(veri);
  }

  static Future<Map<String, dynamic>> kayitOl(String ad, String soyad, String email, String sifre) async {
    final yanit = await http.post(
      Uri.parse('$apiUrl/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'ad': ad, 'soyad': soyad, 'email': email, 'sifre': sifre}),
    );
    return Map<String, dynamic>.from(jsonDecode(utf8.decode(yanit.bodyBytes)));
  }

  static Future<Map<String, dynamic>> dogrulamaYenidenGonder(String email) async {
    final yanit = await http.post(
      Uri.parse('$apiUrl/api/auth/resend-verification'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    return Map<String, dynamic>.from(jsonDecode(utf8.decode(yanit.bodyBytes)));
  }
}