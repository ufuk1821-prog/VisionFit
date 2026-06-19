import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const _darkBg = Color(0xFF131313);
const _darkSurface = Color(0xFF1A1A1A);
const _darkSurfaceLow = Color(0xFF1C1B1B);
const _darkSurfaceContainer = Color(0xFF201F1F);
const _darkSurfaceHigh = Color(0xFF2A2A2A);
const _darkSurfaceLowest = Color(0xFF0E0E0E);
const _darkBorder = Color(0xFF333333);
const _darkBorderAlt = Color(0xFF5C403E);
const _darkText = Color(0xFFE5E2E1);
const _darkHint = Color(0xFF888888);

const _lightBg = Color(0xFFF5F3F2);
const _lightSurface = Color(0xFFFFFFFF);
const _lightSurfaceLow = Color(0xFFFFFFFF);
const _lightSurfaceContainer = Color(0xFFF0EDEC);
const _lightSurfaceHigh = Color(0xFFE8E5E4);
const _lightSurfaceLowest = Color(0xFFEDEAE9);
const _lightBorder = Color(0xFFDDD8D6);
const _lightBorderAlt = Color(0xFFE0B8B0);
const _lightText = Color(0xFF1A1A1A);
const _lightHint = Color(0xFF6B6B6B);

const kRed = Color(0xFFE8313F);
const kGreen = Color(0xFF4CAF50);
const kBlue = Color(0xFF3B82F6);
const kAmber = Color(0xFFF59E0B);
const kPurple = Color(0xFF8B5CF6);

bool _karanlikMi(BuildContext context) => Theme.of(context).brightness == Brightness.dark;

Color kBg(BuildContext context) => _karanlikMi(context) ? _darkBg : _lightBg;
Color kSurface(BuildContext context) => _karanlikMi(context) ? _darkSurface : _lightSurface;
Color kSurfaceLow(BuildContext context) => _karanlikMi(context) ? _darkSurfaceLow : _lightSurfaceLow;
Color kSurfaceContainer(BuildContext context) => _karanlikMi(context) ? _darkSurfaceContainer : _lightSurfaceContainer;
Color kSurfaceHigh(BuildContext context) => _karanlikMi(context) ? _darkSurfaceHigh : _lightSurfaceHigh;
Color kSurfaceLowest(BuildContext context) => _karanlikMi(context) ? _darkSurfaceLowest : _lightSurfaceLowest;
Color kBorder(BuildContext context) => _karanlikMi(context) ? _darkBorder : _lightBorder;
Color kBorderAlt(BuildContext context) => _karanlikMi(context) ? _darkBorderAlt : _lightBorderAlt;
Color kText(BuildContext context) => _karanlikMi(context) ? _darkText : _lightText;
Color kHint(BuildContext context) => _karanlikMi(context) ? _darkHint : _lightHint;

TextStyle kHeadline(BuildContext context, {double size = 22, FontWeight weight = FontWeight.w700, Color? color}) =>
    GoogleFonts.hankenGrotesk(fontSize: size, fontWeight: weight, color: color ?? kText(context), letterSpacing: -0.02 * size);

TextStyle kBody(BuildContext context, {double size = 14, FontWeight weight = FontWeight.w400, Color? color}) =>
    GoogleFonts.inter(fontSize: size, fontWeight: weight, color: color ?? kText(context));

TextStyle kLabel(BuildContext context, {double size = 11, FontWeight weight = FontWeight.w500, Color? color}) =>
    GoogleFonts.jetBrainsMono(fontSize: size, fontWeight: weight, color: color ?? kHint(context), letterSpacing: 0.05 * size);

InputDecoration kInputDeko(BuildContext context, String hint, IconData icon) => InputDecoration(
      hintText: hint,
      hintStyle: kBody(context, color: kHint(context)),
      prefixIcon: Icon(icon, color: kHint(context), size: 20),
      filled: true,
      fillColor: kSurfaceContainer(context),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: kBorder(context)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: kRed, width: 1.5),
      ),
    );