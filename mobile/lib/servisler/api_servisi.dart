import 'dart:convert';
import 'package:flutter/material.dart';
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

  static Future<Map<String, dynamic>> girisYap(String email, String sifre) async {
    final yanit = await http.post(
      Uri.parse('$apiUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'sifre': sifre}),
    );
    return jsonDecode(yanit.body);
  }

  static Future<Map<String, dynamic>> kayitOl(String ad, String soyad, String email, String sifre) async {
    final yanit = await http.post(
      Uri.parse('$apiUrl/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'ad': ad, 'soyad': soyad, 'email': email, 'sifre': sifre}),
    );
    return jsonDecode(yanit.body);
  }

  static Future<Map<String, dynamic>> anaSayfaVerisiAl() async {
    final token = await tokenAl();
    final yanit = await http.get(
      Uri.parse('$apiUrl/api/home'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(utf8.decode(yanit.bodyBytes));
  }
}