# ============================================================
# VISIONFIT CANLI API PERFORMANS TESTLERİ
# ============================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

# SADECE BURAYI DÜZENLE
$BaseUrl = "https://visionfit-backend-docker.onrender.com"
$Email   = "ufuk20022002@outlook.com"
$Sifre   = "Ufuk19072002."

$BaseUrl = $BaseUrl.TrimEnd("/")

# ============================================================
# ORTAK ÖLÇÜM FONKSİYONU
# ============================================================

function Olcum-Yap {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TestAdi,

        [Parameter(Mandatory = $true)]
        [int]$IstekSayisi,

        [Parameter(Mandatory = $true)]
        [scriptblock]$Istek
    )

    $sureler = New-Object System.Collections.Generic.List[double]
    $basarili = 0
    $basarisiz = 0

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "$TestAdi - $IstekSayisi istek" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan

    for ($i = 1; $i -le $IstekSayisi; $i++) {
        $kronometre = [System.Diagnostics.Stopwatch]::StartNew()

        try {
            $sonuc = & $Istek

            $kronometre.Stop()
            $sure = [Math]::Round($kronometre.Elapsed.TotalSeconds, 3)
            $sureler.Add($sure)
            $basarili++

            Write-Host "[$i/$IstekSayisi] BAŞARILI - $sure sn" -ForegroundColor Green
        }
        catch {
            $kronometre.Stop()
            $sure = [Math]::Round($kronometre.Elapsed.TotalSeconds, 3)
            $sureler.Add($sure)
            $basarisiz++

            $hataMesaji = $_.Exception.Message

            if ($_.ErrorDetails.Message) {
                $hataMesaji = $_.ErrorDetails.Message
            }

            Write-Host "[$i/$IstekSayisi] HATALI - $sure sn" -ForegroundColor Red
            Write-Host $hataMesaji -ForegroundColor DarkRed
        }

        Start-Sleep -Milliseconds 300
    }

    $istatistik = $sureler | Measure-Object -Average -Minimum -Maximum

    $ortalama = [Math]::Round($istatistik.Average, 3)
    $minimum = [Math]::Round($istatistik.Minimum, 3)
    $maksimum = [Math]::Round($istatistik.Maximum, 3)
    $basariOrani = [Math]::Round(($basarili / $IstekSayisi) * 100, 2)

    Write-Host ""
    Write-Host "$TestAdi SONUCU" -ForegroundColor Yellow
    Write-Host "İstek sayısı  : $IstekSayisi"
    Write-Host "Başarılı      : $basarili"
    Write-Host "Başarısız     : $basarisiz"
    Write-Host "Ortalama      : $ortalama sn"
    Write-Host "En düşük      : $minimum sn"
    Write-Host "En yüksek     : $maksimum sn"
    Write-Host "Başarı oranı  : %$basariOrani"

    return [PSCustomObject]@{
        Islem        = $TestAdi
        IstekSayisi  = $IstekSayisi
        OrtalamaSn   = $ortalama
        EnDusukSn    = $minimum
        EnYuksekSn   = $maksimum
        Basarili     = $basarili
        Basarisiz    = $basarisiz
        BasariOrani  = $basariOrani
    }
}

# ============================================================
# LOGIN BODY
# ============================================================

$LoginBody = @{
    email = $Email
    sifre = $Sifre
} | ConvertTo-Json

# ============================================================
# 1. KULLANICI GİRİŞİ - 20 İSTEK
# ============================================================

$LoginSonucu = Olcum-Yap `
    -TestAdi "Kullanıcı Girişi (/api/auth/login)" `
    -IstekSayisi 20 `
    -Istek {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/auth/login" `
            -Method Post `
            -ContentType "application/json; charset=utf-8" `
            -Body $LoginBody
    }

# ============================================================
# TOKEN AL
# ============================================================

Write-Host ""
Write-Host "Diğer testler için token alınıyor..." -ForegroundColor Cyan

$LoginResponse = Invoke-RestMethod `
    -Uri "$BaseUrl/api/auth/login" `
    -Method Post `
    -ContentType "application/json; charset=utf-8" `
    -Body $LoginBody

$Token = $LoginResponse.token

if ([string]::IsNullOrWhiteSpace($Token)) {
    throw "Login başarılı görünüyor fakat yanıtta token bulunamadı."
}

$Headers = @{
    Authorization = "Bearer $Token"
}

Write-Host "Token başarıyla alındı." -ForegroundColor Green

# ============================================================
# 2. PROFİL GETİRME - 20 İSTEK
# ============================================================

$ProfilSonucu = Olcum-Yap `
    -TestAdi "Profil Getirme (/api/users/me)" `
    -IstekSayisi 20 `
    -Istek {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/users/me" `
            -Method Get `
            -Headers $Headers
    }

# ============================================================
# 3. SU KAYDI EKLEME - 20 İSTEK
# ============================================================

$SuBody = @{
    miktar_ml = 250
} | ConvertTo-Json

$SuSonucu = Olcum-Yap `
    -TestAdi "Su Kaydı Ekleme (/api/nutrition/water)" `
    -IstekSayisi 20 `
    -Istek {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/nutrition/water" `
            -Method Post `
            -Headers $Headers `
            -ContentType "application/json; charset=utf-8" `
            -Body $SuBody
    }

# ============================================================
# SQUAT LANDMARK KARESİ OLUŞTUR
# Her kare: 33 landmark x 4 değer = 132 sayı
# ============================================================

function Yeni-SquatKaresi {
    $frame = New-Object double[] 132

    # Tüm landmark visibility değerlerini 0.9 yap
    for ($i = 0; $i -lt 33; $i++) {
        $base = $i * 4
        $frame[$base + 3] = 0.9
    }

    function Landmark-Ayarla {
        param(
            [int]$Index,
            [double]$X,
            [double]$Y,
            [double]$Z = 0.0,
            [double]$Visibility = 0.9
        )

        $base = $Index * 4

        $frame[$base] = $X
        $frame[$base + 1] = $Y
        $frame[$base + 2] = $Z
        $frame[$base + 3] = $Visibility
    }

    # Omuzlar
    Landmark-Ayarla -Index 11 -X 0.45 -Y 0.20
    Landmark-Ayarla -Index 12 -X 0.55 -Y 0.20

    # Kalçalar
    Landmark-Ayarla -Index 23 -X 0.45 -Y 0.50
    Landmark-Ayarla -Index 24 -X 0.55 -Y 0.50

    # Dizler
    Landmark-Ayarla -Index 25 -X 0.35 -Y 0.70
    Landmark-Ayarla -Index 26 -X 0.65 -Y 0.70

    # Ayak bilekleri
    Landmark-Ayarla -Index 27 -X 0.45 -Y 0.90
    Landmark-Ayarla -Index 28 -X 0.55 -Y 0.90

    return ,$frame
}

$SquatKareleri = @()

for ($i = 0; $i -lt 5; $i++) {
    $SquatKareleri += ,(Yeni-SquatKaresi)
}

$SquatBody = @{
    frames = $SquatKareleri
} | ConvertTo-Json -Depth 20 -Compress

# ============================================================
# 4. SQUAT ANALİZİ - 10 İSTEK
# ============================================================

$SquatSonucu = Olcum-Yap `
    -TestAdi "Squat Analizi (/api/analyze/session)" `
    -IstekSayisi 10 `
    -Istek {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/analyze/session" `
            -Method Post `
            -Headers $Headers `
            -ContentType "application/json; charset=utf-8" `
            -Body $SquatBody
    }

# ============================================================
# LLM DİYET BODY
# Web uygulamasındaki gerçek body yapısı
# ============================================================

$LlmBody = @{
    profil = @{
        yas               = 24
        cinsiyet          = "Erkek"
        boy_cm            = 193
        kilo_kg           = 130
        aktivite_duzeyi   = "orta_hareketli"
        hedef             = "kilo_verme"
        hedef_kalori      = 2500
    }

    plan = @{
        plan_adi = "Dengeli Beslenme Planı"

        kahvalti = @(
            "Kahvaltı: 80 gram yulaf"
            "Kahvaltı: 200 gram yoğurt"
            "Kahvaltı: 1 adet muz"
        )

        ogle = @(
            "Öğle: 180 gram tavuk göğsü"
            "Öğle: 150 gram bulgur"
            "Öğle: mevsim salatası"
        )

        aksam = @(
            "Akşam: sebze yemeği"
            "Akşam: 150 gram yoğurt"
        )

        ara_ogun = @(
            "Ara öğün: 1 adet elma"
            "Ara öğün: 10 adet badem"
        )

        gunluk_kalori = 2500

        porsiyon_bilgisi = @{
            protein_g      = 180
            karbonhidrat_g = 260
            yag_g          = 75
        }
    }

    kullanici_notu = "Kilo vermek istiyorum ve dengeli beslenmek istiyorum."
} | ConvertTo-Json -Depth 20 -Compress

# ============================================================
# LLM SERVİSİNİ ISIT
# Bu istek ölçüme dahil edilmez
# ============================================================

Write-Host ""
Write-Host "LLM servisi ısıtılıyor. Bu istek ölçüme dahil edilmeyecek..." `
    -ForegroundColor Cyan

try {
    Invoke-RestMethod `
        -Uri "$BaseUrl/api/yerel-ai/diyet-onerisi" `
        -Method Post `
        -Headers $Headers `
        -ContentType "application/json; charset=utf-8" `
        -Body $LlmBody | Out-Null

    Write-Host "LLM ısıtma isteği başarılı." -ForegroundColor Green
}
catch {
    Write-Host "LLM ısıtma isteği başarısız oldu:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    throw
}

Start-Sleep -Seconds 2

# ============================================================
# 5. LLM SICAK İSTEK - 10 İSTEK
# ============================================================

$LlmSonucu = Olcum-Yap `
    -TestAdi "LLM Sıcak İstek (/api/yerel-ai/diyet-onerisi)" `
    -IstekSayisi 10 `
    -Istek {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/yerel-ai/diyet-onerisi" `
            -Method Post `
            -Headers $Headers `
            -ContentType "application/json; charset=utf-8" `
            -Body $LlmBody
    }

# ============================================================
# TÜM SONUÇLARI TABLO OLARAK GÖSTER
# ============================================================

$TumSonuclar = @(
    $LoginSonucu
    $ProfilSonucu
    $SuSonucu
    $SquatSonucu
    $LlmSonucu
)

Write-Host ""
Write-Host "============================================================" `
    -ForegroundColor Magenta
Write-Host "TÜM PERFORMANS SONUÇLARI" `
    -ForegroundColor Magenta
Write-Host "============================================================" `
    -ForegroundColor Magenta

$TumSonuclar |
    Format-Table `
        Islem,
        IstekSayisi,
        OrtalamaSn,
        EnDusukSn,
        EnYuksekSn,
        Basarili,
        Basarisiz,
        BasariOrani `
        -AutoSize

# CSV çıktısı oluştur
$CsvYolu = Join-Path $PSScriptRoot "visionfit_performans_sonuclari.csv"

$TumSonuclar |
    Export-Csv `
        -Path $CsvYolu `
        -NoTypeInformation `
        -Encoding UTF8

Write-Host ""
Write-Host "CSV dosyası oluşturuldu:" -ForegroundColor Green
Write-Host $CsvYolu -ForegroundColor Green