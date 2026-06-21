# ==========================================
# VISIONFIT PERFORMANS TESTİ
# ==========================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$BaseUrl = "https://visionfit-backend.onrender.com"
$Email   = "ufuk20022002@outlook.com"
$Sifre   = "Ufuk19052002."

$TumSonuclar = @()

function Test-Endpoint {
    param(
        [string]$Ad,
        [int]$Adet,
        [scriptblock]$IstegiCalistir
    )

    $Sureler = @()
    $Basarili = 0
    $Basarisiz = 0

    Write-Host "`n$Ad testi başlıyor..." -ForegroundColor Cyan

    for ($i = 1; $i -le $Adet; $i++) {
        $kronometre = [System.Diagnostics.Stopwatch]::StartNew()

        try {
            & $IstegiCalistir | Out-Null
            $kronometre.Stop()

            $sure = [math]::Round($kronometre.Elapsed.TotalSeconds, 3)
            $Sureler += $sure
            $Basarili++

            Write-Host "[$i/$Adet] Başarılı - $sure sn" -ForegroundColor Green
            if ($Ad -eq "Kullanıcı Girişi" -and $i -lt $Adet) {
               Start-Sleep -Seconds 7
            }
        }
        catch {
            $kronometre.Stop()

            $sure = [math]::Round($kronometre.Elapsed.TotalSeconds, 3)
            $Sureler += $sure
            $Basarisiz++

            Write-Host "[$i/$Adet] Hatalı - $sure sn" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor DarkRed
            if ($Ad -eq "Kullanıcı Girişi" -and $i -lt $Adet) {
                Start-Sleep -Seconds 7
            }
        }
    }

    $ortalama = [math]::Round(
        ($Sureler | Measure-Object -Average).Average,
        3
    )

    $minimum = [math]::Round(
        ($Sureler | Measure-Object -Minimum).Minimum,
        3
    )

    $maksimum = [math]::Round(
        ($Sureler | Measure-Object -Maximum).Maximum,
        3
    )

    $basariOrani = [math]::Round(
        ($Basarili / $Adet) * 100,
        1
    )

    $sonuc = [PSCustomObject]@{
        Islem          = $Ad
        Istek_Sayisi   = $Adet
        Ortalama_Sn    = $ortalama
        En_Dusuk_Sn    = $minimum
        En_Yuksek_Sn   = $maksimum
        Basarili       = $Basarili
        Basarisiz      = $Basarisiz
        Basari_Orani   = "$basariOrani%"
    }

    $script:TumSonuclar += $sonuc
}

# ==========================================
# LOGIN GÖVDESİ
# ==========================================

$LoginBody = @{
    email = $Email
    sifre = $Sifre
} | ConvertTo-Json

# ==========================================
# 1. LOGIN - 20 İSTEK
# ==========================================

Test-Endpoint `
    -Ad "Kullanıcı Girişi" `
    -Adet 20 `
    -IstegiCalistir {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/auth/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body $LoginBody
    }

# Bir kez giriş yap ve token al
$LoginResponse = Invoke-RestMethod `
    -Uri "$BaseUrl/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $LoginBody

$Token = $LoginResponse.token

if (-not $Token) {
    throw "Token alınamadı. E-posta veya şifreyi kontrol et."
}

$Headers = @{
    Authorization = "Bearer $Token"
}

# ==========================================
# 2. PROFİL - 20 İSTEK
# ==========================================

Test-Endpoint `
    -Ad "Profil Getirme" `
    -Adet 20 `
    -IstegiCalistir {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/users/me" `
            -Method Get `
            -Headers $Headers
    }

# ==========================================
# 3. SU KAYDI - 20 İSTEK
# ==========================================

$SuBody = @{
    miktar_ml = 250
} | ConvertTo-Json

Test-Endpoint `
    -Ad "Su Kaydı Ekleme" `
    -Adet 20 `
    -IstegiCalistir {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/nutrition/water" `
            -Method Post `
            -Headers $Headers `
            -ContentType "application/json" `
            -Body $SuBody
    }

# ==========================================
# 4. GEÇERLİ SENTETİK SQUAT VERİSİ
# ==========================================

function Yeni-LandmarkKaresi {
    $frame = New-Object double[] 132

    # Bütün visibility değerlerini 1 yap
    for ($i = 0; $i -lt 33; $i++) {
        $frame[($i * 4) + 3] = 1.0
    }

    function Landmark-Ayarla {
        param(
            [int]$Index,
            [double]$X,
            [double]$Y,
            [double]$Z = 0.0
        )

        $frame[$Index * 4]       = $X
        $frame[($Index * 4) + 1] = $Y
        $frame[($Index * 4) + 2] = $Z
        $frame[($Index * 4) + 3] = 1.0
    }

    # Omuzlar
    Landmark-Ayarla 11 0.48 0.30
    Landmark-Ayarla 12 0.52 0.30

    # Kalçalar
    Landmark-Ayarla 23 0.48 0.50
    Landmark-Ayarla 24 0.52 0.50

    # Dizler
    Landmark-Ayarla 25 0.48 0.70
    Landmark-Ayarla 26 0.52 0.70

    # Ayak bilekleri
    Landmark-Ayarla 27 0.41 0.73
    Landmark-Ayarla 28 0.59 0.73

    return ,$frame
}

$SquatFrames = @()

for ($i = 0; $i -lt 20; $i++) {
    $SquatFrames += ,(Yeni-LandmarkKaresi)
}

$SquatBody = @{
    frames = $SquatFrames
} | ConvertTo-Json -Depth 10

# ==========================================
# 4. SQUAT ANALİZİ - 10 İSTEK
# ==========================================

Test-Endpoint `
    -Ad "Squat Analizi" `
    -Adet 10 `
    -IstegiCalistir {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/analyze/session" `
            -Method Post `
            -Headers $Headers `
            -ContentType "application/json" `
            -Body $SquatBody
    }

# ==========================================
# 5. LLM İSTEK GÖVDESİ
# ==========================================

$LlmBody = @{
    profil = @{
        yas               = 24
        cinsiyet          = "Erkek"
        boy_cm            = 193
        kilo_kg           = 130
        aktivite_duzeyi   = "orta_hareketli"
        hedef             = "kilo_verme"
        hedef_kalori      = 2450
    }

    plan = @{
        plan_adi = "Dengeli Plan"

        kahvalti = @(
            "Yulaf"
            "Yoğurt"
            "Muz"
        )

        ogle = @(
            "Tavuk göğsü"
            "Bulgur"
            "Salata"
        )

        aksam = @(
            "Sebze yemeği"
            "Yoğurt"
        )

        ara_ogun = @(
            "Elma"
        )

        gunluk_kalori = 2450

        porsiyon_bilgisi = @{
            protein_g      = 180
            karbonhidrat_g = 260
            yag_g          = 75
        }
    }

    kullanici_notu = "Kilo vermek istiyorum."
} | ConvertTo-Json -Depth 10

# ==========================================
# COLD START / İLK LLM İSTEĞİ
# ==========================================

Write-Host "`nİlk LLM isteği ölçülüyor..." -ForegroundColor Yellow

$coldKronometre = [System.Diagnostics.Stopwatch]::StartNew()

try {
    Invoke-RestMethod `
        -Uri "$BaseUrl/api/yerel-ai/diyet-onerisi" `
        -Method Post `
        -Headers $Headers `
        -ContentType "application/json" `
        -Body $LlmBody | Out-Null

    $coldKronometre.Stop()

    Write-Host "İlk LLM isteği: $([math]::Round($coldKronometre.Elapsed.TotalSeconds, 3)) sn" `
        -ForegroundColor Green
}
catch {
    $coldKronometre.Stop()
    Write-Host "İlk LLM isteği başarısız oldu." -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# ==========================================
# 6. LLM WARM - 10 İSTEK
# ==========================================

Test-Endpoint `
    -Ad "LLM Sıcak İstek" `
    -Adet 10 `
    -IstegiCalistir {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/yerel-ai/diyet-onerisi" `
            -Method Post `
            -Headers $Headers `
            -ContentType "application/json" `
            -Body $LlmBody
    }

# ==========================================
# SONUÇLAR
# ==========================================

Write-Host "`n==========================================" -ForegroundColor Magenta
Write-Host "VISIONFIT PERFORMANS SONUÇLARI" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta

$TumSonuclar | Format-Table -AutoSize

$TumSonuclar | Export-Csv `
    -Path ".\visionfit_performans_sonuclari.csv" `
    -NoTypeInformation `
    -Encoding UTF8

Write-Host "`nCSV oluşturuldu:" -ForegroundColor Green
Write-Host ".\visionfit_performans_sonuclari.csv"