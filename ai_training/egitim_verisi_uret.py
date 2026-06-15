import json
import random

KATEGORILER = [
    "Genel Form",
    "Omurga Nötrlüğü",
    "Kalça Derinliği",
    "Diz Hizası",
    "Diz Çöküşü",
    "Ağırlık Merkezi",
]

IYI_YORUMLAR = {
    "Genel Form": [
        "genel formun gayet sağlam görünüyor",
        "squat tekniğin bu oturumda oldukça başarılıydı",
        "genel hareket kalıbın düzgündü",
        "hareketin bütünsel kalitesi yüksekti",
        "form açısından bu oturumda gözle görülür bir olgunluk vardı",
        "tüm hareket zinciri boyunca kontrolü elinde tuttun",
        "squat'ın temel unsurlarını başarıyla bir araya getirdin",
        "hareketinin akıcılığı ve kontrolü dikkat çekiciydi",
        "genel teknik seviyenin yükseldiği görülüyor",
        "bu oturumda formun genel olarak ileri seviyeye yakın bir görüntü çiziyordu",
    ],
    "Omurga Nötrlüğü": [
        "sırtını dik ve nötr tutmayı başardın",
        "omurga pozisyonun antrenman boyunca stabildi",
        "göğsünü dik tutarak sırtını koruyabildin",
        "bel bölgenin nötr duruşu antrenman boyunca korunmuş",
        "sırt açısı boyunca tutarlı ve güvenli kaldı",
        "omurganın doğal eğrisini koruyarak hareket ettin",
        "üst gövde pozisyonun hareket boyunca dengeliydi",
        "sırtının aşırı kamburlaşması veya çökmesi gözlenmedi",
        "gövde duruşun squat boyunca sabit ve güvenliydi",
        "bel ve sırt bölgen yük altında stabilitesini korudu",
    ],
    "Kalça Derinliği": [
        "squat derinliğin yeterliydi, kalçanı diz seviyesine indirebildin",
        "derinlik açısından gayet iyi bir performans gösterdin",
        "iniş derinliğin hedeflenen seviyedeydi",
        "kalça hareket aralığını tam kullanabildin",
        "iniş mesafen squat için ideal aralıktaydı",
        "kalçanı yeterli derinliğe indirerek hareketi tamamladın",
        "derinlik kontrolün antrenman boyunca tutarlıydı",
        "hareket aralığın kas gelişimi için yeterli seviyedeydi",
        "inişlerin paralel veya altı seviyesine ulaşabiliyor",
        "kalça mobiliten derinlik açısından yeterli görünüyor",
    ],
    "Diz Hizası": [
        "dizlerin ayak uçlarınla uyumlu hareket etti",
        "diz hizalaman boyunca düzgün kaldı",
        "dizlerinin pozisyonu antrenman boyunca tutarlıydı",
        "diz açısı ayak yönüyle uyumluydu",
        "dizlerin hareket boyunca dengeli bir çizgide kaldı",
        "diz-ayak hizası squat boyunca korunmuş",
        "dizlerin öne kaçma eğilimi gözlenmedi",
        "diz pozisyonun ayak izine paralel kaldı",
        "dizlerinin hizası teknik açıdan oldukça düzgündü",
        "diz açın hareket boyunca stabil bir çizgide ilerledi",
    ],
    "Diz Çöküşü": [
        "dizlerinde içe çöküş gözlenmedi, stabildi",
        "diz stabiliten oldukça iyiydi",
        "dizlerin antrenman boyunca dengeli kaldı",
        "diz ekleminin yanal stabilitesi güçlüydü",
        "dizlerin içe veya dışa kaçma eğilimi göstermedi",
        "diz valgus belirtisi görülmedi",
        "dizlerin yana doğru hareketi minimaldi",
        "diz stabilizasyonun yük altında korunmuş",
        "bacak hizan boyunca dizlerin pozisyonu sabit kaldı",
        "dizlerin yanal kontrolü antrenman boyunca güçlüydü",
    ],
    "Ağırlık Merkezi": [
        "ağırlık merkezini topuklarında dengeli tutabildin",
        "denge dağılımın oldukça iyiydi",
        "ağırlığını öne kaydırmadan hareketi tamamladın",
        "vücut ağırlığının dağılımı antrenman boyunca dengeliydi",
        "topuk-ayak tabanı dengesini koruyabildin",
        "ağırlık merkezinin konumu hareket boyunca stabildi",
        "denge noktanı kaybetmeden squat'ı tamamladın",
        "ayak tabanının tamamına eşit basınç uygulayabildin",
        "vücut dengesi inişte ve kalkışta korunmuştu",
        "ağırlık aktarımın hareket boyunca kontrollüydü",
    ],
}

GELISTIRME_YORUMLARI = {
    "Genel Form": [
        "genel formun üzerinde biraz daha çalışman gerekiyor",
        "squat tekniğinde küçük düzeltmeler işine yarayacak",
        "genel hareket akışını biraz daha yavaşlatarak tekrar etmeyi dene",
        "formun bütünsel kalitesini artırmak için tempo çalışmaları faydalı olabilir",
        "hareketin genel akıcılığı için daha kontrollü tekrarlar deneyebilirsin",
        "squat'ın temel unsurlarını birleştirmek için ayna karşısında tekrar yapabilirsin",
        "hareket boyunca kontrolü artırmak adına ağırlığı biraz azaltmayı düşünebilirsin",
        "genel tekniğini geliştirmek için bir antrenörle form çalışması yapman faydalı olur",
        "hareketin bazı fazlarında stabilite kaybı var, bunu azaltmaya odaklan",
        "formundaki küçük tutarsızlıklar üzerinde çalışarak genel kaliteyi artırabilirsin",
    ],
    "Omurga Nötrlüğü": [
        "öne doğru aşırı eğilme eğilimin var, göğsünü daha dik tut",
        "omurganı nötr konumda tutmaya odaklan",
        "sırtının yuvarlanmaması için karın kaslarını daha sıkı tut",
        "bel bölgenin aşırı kavislenmemesine dikkat et",
        "üst gövde açını daha dik tutarak omurga yükünü azaltabilirsin",
        "sırtının alt kısmında yuvarlanma eğilimi var, hareket aralığını kontrol et",
        "göğüs kafesini daha dik tutmak omurga güvenliğini artıracaktır",
        "omurga nötrlüğünü korumak için karın içi basıncı artırmayı dene",
        "sırtının üst kısmında öne çöküş gözleniyor, üst sırt kaslarını aktive et",
        "omurga pozisyonunu sabitlemek için hareket öncesi nefes alma tekniğini kullan",
    ],
    "Kalça Derinliği": [
        "squat derinliğin yetersiz kaldı, kalçanı daha aşağı indirmeyi dene",
        "iniş mesafeni artırarak diz seviyesinin altına inmeyi hedefle",
        "derinlik konusunda biraz daha çalışmaya ihtiyacın var",
        "hareket aralığını artırmak için esneklik çalışmaları faydalı olabilir",
        "kalça mobilitesini geliştirmek derinliğini artıracaktır",
        "ayak bileği ve kalça esnekliğini artırmak iniş derinliğine yardımcı olur",
        "derinliğe inerken denge kaybı oluşuyor, bunu aşamalı olarak artır",
        "tam derinliğe inebilmek için ısınma sürende mobilite hareketleri ekle",
        "iniş derinliğin hedefin altında kaldı, kademeli olarak artırmayı dene",
        "kalça ekleminin hareket aralığını genişletmek için germe egzersizleri ekleyebilirsin",
    ],
    "Diz Hizası": [
        "dizlerin ayak uçlarının önüne geçiyor, ağırlığı topuklarına ver",
        "diz hizalamana dikkat ederek hareketi tekrarla",
        "dizlerini ayak uçlarınla aynı hizada tutmaya çalış",
        "ayakkabı ve ayak pozisyonunu kontrol ederek diz açısını düzeltebilirsin",
        "dizlerin öne kaçmasını azaltmak için ağırlık merkezini geriye al",
        "diz açın ayak açınla uyumlu değil, ayak pozisyonunu gözden geçir",
        "dizlerin hareket boyunca öne doğru kaymasını azaltmak için kalçayı geriye it",
        "diz hizalaman için ayna karşısında yavaş tekrarlar yapman faydalı olur",
        "dizlerinin öne doğru aşırı hareketi var, bu da bilek üzerinde fazla yük oluşturuyor",
        "diz-ayak hizasını korumak için ayak parmaklarını hafifçe dışa açabilirsin",
    ],
    "Diz Çöküşü": [
        "dizlerinde içe çöküş (valgus) gözlemleniyor, dizlerini dışa doğru it",
        "diz stabilitenizi artırmak için kalça kaslarını daha aktif kullan",
        "dizlerinin içe doğru kapanmaması için bilinçli bir şekilde dışarı doğru bastır",
        "kalça abdüktör kaslarını güçlendirmek diz stabilitesine yardımcı olur",
        "diz açısının sabit kalması için ayak taban basıncını dengeli dağıt",
        "dizlerin içe kapanması ayak bileği veya kalça zayıflığından kaynaklanabilir",
        "diz valgusu azaltmak için lastik bant ile yan adım egzersizleri faydalı olabilir",
        "kalça dış rotator kaslarını güçlendirmek diz hizalamasını destekler",
        "dizlerin içe kaçmasını önlemek için hareket öncesi kalça aktivasyonu yap",
        "diz stabilitesi için tek bacak egzersizleriyle destekleyici çalışmalar ekleyebilirsin",
    ],
    "Ağırlık Merkezi": [
        "ağırlık merkezin öne kayıyor, topuklarını yere sağlam bas",
        "denge dağılımını topuklara kaydırmaya çalış",
        "ağırlığını öne vermeden hareketi tamamlamaya odaklan",
        "ayak tabanının tamamını yere basarak dengeyi artırabilirsin",
        "öne devrilme eğilimini azaltmak için karın ve sırt kaslarını birlikte çalıştır",
        "ağırlık merkezinin öne kayması ayak bileği esnekliğiyle ilişkili olabilir",
        "denge kaybını azaltmak için ayakların omuz genişliğinde olduğundan emin ol",
        "ağırlığını parmak uçlarına vermek yerine topuk ve orta ayağa dağıtmayı dene",
        "öne doğru kayma eğilimini azaltmak için hareket hızını kontrol et",
        "denge çalışmaları (örneğin tek ayak duruşu) ağırlık merkezi kontrolünü geliştirebilir",
    ],
}

ACILIS_CUMLELERI_ANTRENOR = [
    "Bu oturumdaki performansını değerlendirdim.",
    "Antrenman verilerine göre genel bir değerlendirme yapalım.",
    "Bu seanstaki form analizine bakarak şunları söyleyebilirim.",
    "Oturum sonunda elde edilen skorlara göre kısa bir geri bildirim hazırladım.",
    "Bugünkü squat performansını birlikte inceleyelim.",
    "Bu antrenmandaki kategori skorlarını değerlendirdim, sonuçları seninle paylaşıyorum.",
    "Son oturumundaki form verilerine göre bazı gözlemlerim var.",
    "Bugünkü çalışmanı analiz ettim, işte değerlendirmem.",
]

KAPANIS_CUMLELERI_IYI = [
    "Bu şekilde devam edersen kısa sürede daha da gelişeceksin.",
    "İstikrarlı bir şekilde tekrar edersen sonuçlar çok iyi olacak.",
    "Harika gidiyorsun, bu tempoyu sürdür.",
    "Bu performansı korursan ilerleyen haftalarda daha zorlu hedeflere geçebilirsin.",
    "Bu seviyeyi koruman, daha ağır yüklere geçişin için güçlü bir temel oluşturuyor.",
    "Bu tutarlılığı sürdürerek bir sonraki aşamaya güvenle geçebilirsin.",
    "Bu disiplinle ilerlersen hedeflerine planladığından daha hızlı ulaşabilirsin.",
    "Bu form kalitesiyle ağırlık artışına geçmek için hazır görünüyorsun.",
]

KAPANIS_CUMLELERI_KARISIK = [
    "Güçlü olduğun noktaları korurken, belirttiğim alanlara odaklanırsan kısa sürede ilerleme göreceksin.",
    "Genel olarak iyi bir temele sahipsin, sadece bazı küçük detayları düzeltmen gerekiyor.",
    "Belirtilen noktalara dikkat ederek bir sonraki antrenmanda daha iyi bir sonuç alabilirsin.",
    "Dengeli bir gelişim için güçlü yönlerini sürdürürken zayıf noktaları üzerinde çalışmaya devam et.",
    "Bu oturum, hangi alanlara odaklanman gerektiğini net bir şekilde gösteriyor.",
    "Güçlü yönlerin motivasyonunu artırırken, geliştirilecek alanlar net bir yol haritası sunuyor.",
    "Bir sonraki antrenmanda belirtilen noktalara öncelik vererek dengeyi artırabilirsin.",
    "Genel tablo olumlu, sadece birkaç noktaya odaklanarak formunu bir üst seviyeye taşıyabilirsin.",
]

KAPANIS_CUMLELERI_ZAYIF = [
    "Bu alanlara odaklanarak tekrar çalışman, formunu hızla iyileştirecektir.",
    "Şu an için yavaş ve kontrollü tekrarlar yapmak, belirtilen sorunları çözmene yardımcı olacaktır.",
    "Bu noktalara dikkat ederek pratik yapmaya devam et, gelişim zaman alacaktır ama kesin gelecektir.",
    "Önceliğin form düzeltmek olsun, ağırlık artışını bu konular düzelene kadar erteleyebilirsin.",
    "Bu aşamada ağırlıksız veya hafif yüklerle teknik çalışması yapman faydalı olacaktır.",
    "Belirtilen alanlarda küçük adımlarla ilerlemek, uzun vadede büyük fark yaratacaktır.",
    "Bu konularda bir antrenörden form kontrolü almak süreci hızlandırabilir.",
    "Sabırlı ol, bu noktalar üzerinde çalıştıkça form kaliten gözle görülür şekilde artacaktır.",
]


def antrenor_skor_uret():
    return {kategori: random.randint(30, 100) for kategori in KATEGORILER}


def antrenor_girdi_olustur(skorlar):
    parcalar = [f"{kategori}: {skor}" for kategori, skor in skorlar.items()]
    return ", ".join(parcalar)


def antrenor_cikti_olustur(skorlar):
    iyi_kategoriler = [k for k, v in skorlar.items() if v >= 75]
    gelistirilecek_kategoriler = [k for k, v in skorlar.items() if v < 75]

    cumleler = [random.choice(ACILIS_CUMLELERI_ANTRENOR)]

    if iyi_kategoriler:
        secilenler = random.sample(iyi_kategoriler, min(2, len(iyi_kategoriler)))
        for kategori in secilenler:
            cumleler.append(random.choice(IYI_YORUMLAR[kategori]).capitalize() + ".")

    if gelistirilecek_kategoriler:
        secilenler = random.sample(gelistirilecek_kategoriler, min(2, len(gelistirilecek_kategoriler)))
        for kategori in secilenler:
            cumleler.append(random.choice(GELISTIRME_YORUMLARI[kategori]).capitalize() + ".")

    if not gelistirilecek_kategoriler:
        cumleler.append(random.choice(KAPANIS_CUMLELERI_IYI))
    elif not iyi_kategoriler:
        cumleler.append(random.choice(KAPANIS_CUMLELERI_ZAYIF))
    else:
        cumleler.append(random.choice(KAPANIS_CUMLELERI_KARISIK))

    return " ".join(cumleler)


def antrenor_ornek_uret():
    skorlar = antrenor_skor_uret()
    return {
        "instruction": "Asagidaki squat antrenman oturumu kategori skorlarina gore kullaniciya kisa, motive edici ve Turkce bir antrenor geri bildirimi yaz.",
        "input": antrenor_girdi_olustur(skorlar),
        "output": antrenor_cikti_olustur(skorlar),
    }


BMI_KATEGORILER = ["Zayif", "Normal", "Kilolu", "Obez"]

BMI_ARALIKLARI = {
    "Zayif": (16.0, 18.4),
    "Normal": (18.5, 24.9),
    "Kilolu": (25.0, 29.9),
    "Obez": (30.0, 38.0),
}

HEDEFLER = ["kilo_verme", "kilo_koruma", "kilo_alma"]

HEDEF_ACILIS = {
    "kilo_verme": [
        "Hazırladığımız plan, kilo verme hedefine uygun bir kalori açığı oluşturacak şekilde ayarlandı.",
        "Bu plan, vücut ağırlığını kademeli ve sağlıklı bir şekilde azaltmana yardımcı olacak.",
        "Kalori dengen, kilo verme sürecini destekleyecek seviyede tutuldu.",
        "Plan, yağ kaybını desteklerken kas kütleni korumaya yönelik dengelendi.",
        "Günlük kalori alımın, hedeflediğin kilo kaybı için uygun bir açık oluşturuyor.",
        "Bu plan, sürdürülebilir bir tempoyla kilo vermeni sağlayacak şekilde tasarlandı.",
    ],
    "kilo_koruma": [
        "Bu plan, mevcut kilonu koruyacak bir enerji dengesi üzerine kuruldu.",
        "Kalori ve makro dağılımın, kilonu stabil tutmaya yönelik dengelendi.",
        "Hazırlanan plan, günlük harcamana yakın bir kalori alımı sağlıyor.",
        "Bu plan, enerji alımını harcamanla dengeleyerek kilonu sabit tutmayı hedefliyor.",
        "Mevcut formunu korurken performansını artırmana destek olacak bir plan oluşturduk.",
        "Bu denge, hem kilonu korumana hem de enerji seviyeni yüksek tutmana yardımcı olacak.",
    ],
    "kilo_alma": [
        "Bu plan, sağlıklı bir şekilde kilo almanı destekleyecek bir kalori fazlası içeriyor.",
        "Kas kütleni artırmana yardımcı olacak şekilde kalori ve protein miktarı yükseltildi.",
        "Hazırlanan plan, kilo alımını destekleyecek ekstra enerji sağlıyor.",
        "Bu plan, antrenmanlarının karşılığını alabilmen için yeterli enerji ve protein içeriyor.",
        "Kalori fazlan, kas gelişimini desteklerken yağ artışını sınırlı tutacak şekilde ayarlandı.",
        "Bu plan, kilo alım sürecinde gerekli olan ek enerjiyi dengeli bir şekilde sağlıyor.",
    ],
}

BMI_YORUMLARI = {
    "Zayif": [
        "vücut kitle endeksin zayıf aralıkta görünüyor, bu yüzden enerji alımına dikkat etmek önemli",
        "şu anki BMI değerin sağlıklı aralığın altında, beslenme düzenin bunu dikkate aldı",
        "BMI değerin düşük aralıkta, bu nedenle plan ek kalori ve besin yoğunluğuna öncelik verdi",
        "vücut kitle endeksinin düşük olması, plana enerji yoğun besinlerin eklenmesini gerektirdi",
    ],
    "Normal": [
        "vücut kitle endeksin sağlıklı aralıkta, bu dengeyi korumak öncelikli hedef",
        "BMI değerin normal aralıkta, plan bu dengeyi sürdürmeye odaklı",
        "vücut kitle endeksin ideal aralıkta, bu da plan için sağlam bir başlangıç noktası oluşturuyor",
        "BMI değerin sağlıklı sınırlar içinde, bu dengeyi koruyacak bir plan hazırlandı",
    ],
    "Kilolu": [
        "vücut kitle endeksin kilolu aralığında, plan bu durumu dengelemeye yardımcı olacak şekilde kuruldu",
        "BMI değerin normalin biraz üzerinde, beslenme düzeni bunu göz önünde bulundurdu",
        "vücut kitle endeksindeki hafif artış, planın kalori dengesinde dikkate alındı",
        "BMI değerin kilolu sınırında, bu da planın kademeli bir denge hedeflemesini gerektirdi",
    ],
    "Obez": [
        "vücut kitle endeksin obez aralığında, bu yüzden plan kademeli ve sürdürülebilir bir değişimi hedefliyor",
        "BMI değerin yüksek aralıkta, plan sağlıklı ve aşamalı bir iyileşmeyi destekliyor",
        "vücut kitle endeksindeki yüksek değer, planın daha temkinli bir kalori dengesi kurmasını gerektirdi",
        "BMI değerin yüksek aralıkta olduğundan, plan uzun vadeli ve sürdürülebilir bir yaklaşım benimsedi",
    ],
}

ISTEK_KARSILIK_LISTESI = [
    ("yumurtaya alerjim var", "yumurta içeren besinleri plandan çıkardık, protein ihtiyacını diğer kaynaklarla dengeledik"),
    ("kırmızı et seviyorum", "kırmızı et tüketimini plana dahil ederek protein kaynaklarını çeşitlendirdik"),
    ("vejetaryenim", "hayvansal et içermeyen, bitkisel protein kaynaklarına dayanan bir plan oluşturduk"),
    ("laktoz intoleransım var", "süt ürünleri içeren besinleri en aza indirip alternatif kaynaklar tercih ettik"),
    ("akşamları az yemek istiyorum", "akşam öğününü hafif tutarak gün içindeki diğer öğünlere ağırlık verdik"),
    ("sabahları enerjik olmam gerekiyor, kahvaltıya önem veriyorum", "kahvaltı öğününü güçlendirerek güne enerjik başlamanı hedefledik"),
    ("tatlı sevmem", "plana tatlı içeren öğünler eklemedik, karbonhidrat ihtiyacını diğer besinlerden sağladık"),
    ("balık yemeyi seviyorum", "balık ağırlıklı protein kaynaklarına plan içinde yer verdik"),
    ("glutensiz beslenmek istiyorum", "gluten içeren tahıl ürünlerini plandan çıkararak alternatiflerle değiştirdik"),
    ("fındık ve fıstığa alerjim var", "kuruyemiş içeren besinleri plandan çıkardık, yağ ihtiyacını başka kaynaklardan dengeledik"),
    ("deniz ürünleri sevmiyorum", "deniz ürünleri içermeyen protein kaynaklarına öncelik verdik"),
    ("öğlen dışarıda yediğim için hafif öğle yemeği istiyorum", "öğle öğününü pratik ve hafif tutarak dışarıda kolayca uygulayabileceğin bir hale getirdik"),
    ("spor öncesi karbonhidrat almak istiyorum", "antrenman öncesi öğünde karbonhidrat oranını artırarak enerji desteği sağladık"),
    ("akşam yemeğini geç saatte yiyorum", "akşam öğününü geç saate uygun, hafif ve sindirimi kolay besinlerle oluşturduk"),
    ("süt ürünlerini sindirmekte zorlanıyorum", "süt ürünleri miktarını azaltıp sindirimi daha kolay alternatifler ekledik"),
    ("tavuk severim", "tavuk göğsü gibi yağsız protein kaynaklarına plan içinde geniş yer ayırdık"),
    ("baklagil tüketmeyi seviyorum", "mercimek ve nohut gibi baklagilleri bitkisel protein kaynağı olarak plana ekledik"),
    ("şeker tüketimini azaltmak istiyorum", "eklenmiş şeker içeren besinleri plandan çıkarıp doğal karbonhidrat kaynaklarına yöneldik"),
    ("yoğun çalışıyorum, pratik öğünler istiyorum", "hazırlanması hızlı ve pratik öğün önerilerine plan içinde öncelik verdik"),
    ("akşamları atıştırma ihtiyacım oluyor", "akşam için sağlıklı ve doyurucu bir ara öğün seçeneği planına dahil ettik"),
    ("kahvaltıda tatlı bir şeyler istiyorum", "kahvaltı öğününe hafif ve doğal tatlandırılmış seçenekler ekledik"),
    ("akşam sporundan sonra acıkıyorum", "antrenman sonrası için doyurucu bir ara öğün önerisi ekledik"),
    ("kafein tüketimimi sınırlamak istiyorum", "kafeinli içecekler yerine alternatif içecek önerilerine yer verdik"),
    ("kırmızı et yemiyorum", "kırmızı et içermeyen, tavuk ve bitkisel protein ağırlıklı bir plan oluşturduk"),
    ("ev yemeği tercih ediyorum", "evde kolayca hazırlanabilecek pratik tarifler önerdik"),
    ("dışarıda yemek yemeyi seviyorum", "dışarıda da uygulanabilecek esnek öğün önerilerine yer verdik"),
    ("susuz kalmamaya çalışıyorum", "günlük su tüketimine dikkat etmen için planın yanında hatırlatma önerisi ekledik"),
    ("meyve sevmiyorum", "meyve yerine sebze ağırlıklı vitamin kaynaklarına yöneldik"),
    ("yeşil sebzeleri severim", "yeşil yapraklı sebzelere planda geniş yer ayırdık"),
    ("hızlı kilo vermek istiyorum", "sağlığını korumak için kalori açığını güvenli bir seviyede tuttuk, hızlı ama sürdürülebilir bir tempo hedefledik"),
    ("kas kütlemi artırmak istiyorum", "protein alımını artırarak kas gelişimini destekleyecek bir plan oluşturduk"),
    ("öğün sayım az olsun istiyorum", "günlük öğün sayısını azaltıp daha doyurucu porsiyonlar önerdik"),
    ("sık sık az az yemeyi seviyorum", "günü daha sık ve küçük porsiyonlu öğünlere böldük"),
    ("baharatlı yemekleri seviyorum", "tariflerde baharat kullanımını artırarak lezzet çeşitliliği sağladık"),
    ("yumurta severim", "yumurtayı protein kaynağı olarak plana geniş şekilde dahil ettik"),
    ("kahve içmeden güne başlayamıyorum", "sabah rutinine uyumlu, kahveyle birlikte tüketilebilecek bir kahvaltı önerdik"),
    ("ekmek tüketimimi azaltmak istiyorum", "ekmek yerine alternatif karbonhidrat kaynaklarına yöneldik"),
    ("pilav ve makarna severim", "tahıl bazlı karbonhidrat kaynaklarını plana dengeli şekilde dahil ettik"),
    ("ara öğünlerde atıştırmalık istiyorum", "ara öğünlere pratik ve sağlıklı atıştırmalık önerileri ekledik"),
    ("hafta sonları daha rahat yemek istiyorum", "hafta sonu için biraz daha esnek bir öğün önerisi sunduk"),
]

KAPANIS_CUMLELERI_DIYET = [
    "Belirtilen kalori ve makro hedeflerine uyduğun sürece bu plan hedefine ulaşmana yardımcı olacaktır.",
    "Planı uyguladıkça vücudunun tepkisine göre küçük ayarlamalar yapabiliriz.",
    "Düzenli takip ile bu plan üzerinden istikrarlı bir ilerleme sağlayabilirsin.",
    "Su tüketimini ve öğün saatlerini düzenli tutman, planın etkisini artıracaktır.",
    "Planı birkaç hafta uyguladıktan sonra sonuçlara göre yeniden değerlendirebiliriz.",
    "Uyku düzenin ve aktivite seviyeni de gözden geçirmek, planın etkinliğini artıracaktır.",
    "Bu planı bir başlangıç noktası olarak düşünüp, ihtiyaçlarına göre kişiselleştirmeye devam edebiliriz.",
    "İstikrarlı uygulama, bu planın sana sağlayacağı faydayı en üst seviyeye çıkaracaktır.",
]


def diyet_ornek_uret():
    bmi_kategori = random.choice(BMI_KATEGORILER)
    alt, ust = BMI_ARALIKLARI[bmi_kategori]
    bmi = round(random.uniform(alt, ust), 1)
    hedef = random.choice(HEDEFLER)
    hedef_kalori = random.randint(1400, 3200)
    protein_g = random.randint(80, 220)
    karbonhidrat_g = random.randint(120, 350)
    yag_g = random.randint(40, 110)

    istek, karsilik = random.choice(ISTEK_KARSILIK_LISTESI)

    girdi = (
        f"BMI: {bmi} ({bmi_kategori}), Hedef: {hedef}, Hedef Kalori: {hedef_kalori} kcal, "
        f"Protein: {protein_g} g, Karbonhidrat: {karbonhidrat_g} g, Yag: {yag_g} g, "
        f"Kullanici Istegi: {istek}"
    )

    cikti_parcalari = [
        random.choice(HEDEF_ACILIS[hedef]),
        random.choice(BMI_YORUMLARI[bmi_kategori]).capitalize() + ".",
        karsilik.capitalize() + ".",
        random.choice(KAPANIS_CUMLELERI_DIYET),
    ]

    return {
        "instruction": "Asagidaki diyet plani bilgilerine ve kullanicinin ozel istegine gore kisa, kisisellestirilmis ve Turkce bir AI onerisi yaz.",
        "input": girdi,
        "output": " ".join(cikti_parcalari),
    }


HAREKET_LISTESI = [
    "Bench Press",
    "Squat",
    "Deadlift",
    "Omuz Press",
    "Lat Pulldown",
    "Biceps Curl",
    "Triceps Pushdown",
    "Leg Press",
    "Bent Over Row",
    "Hip Thrust",
    "Romanian Deadlift",
    "Incline Bench Press",
    "Cable Row",
    "Leg Extension",
    "Calf Raise",
    "Arnold Press",
    "Hack Squat",
    "Chest Fly",
    "Face Pull",
    "Pull Up",
]

ARTAN_YORUMLAR = [
    "ağırlıklarında düzenli bir artış görülüyor, bu progressive overload prensibinin başarıyla uygulandığını gösteriyor",
    "son antrenmanlarda kaldırdığın ağırlık istikrarlı şekilde yükseliyor, gelişim çok net",
    "ağırlık artışın tutarlı, bu tempo kas gelişimi için oldukça olumlu bir sinyal",
    "her antrenmanda biraz daha fazla yük kaldırman, kuvvetinin arttığını gösteriyor",
    "yük artışındaki düzenlilik, antrenman programının işe yaradığını kanıtlıyor",
    "bu yükselme eğilimi, vücudunun yüke başarıyla adapte olduğunu gösteriyor",
    "kademeli ağırlık artışın, hem kas hem de sinir sistemi adaptasyonunun gerçekleştiğini gösteriyor",
    "bu hareketteki ilerlemen, genel antrenman programının etkili olduğunun güzel bir göstergesi",
]

ARTAN_KAPANIS = [
    "Bu şekilde kademeli artışlara devam ederek ilerlemeyi sürdürebilirsin.",
    "Form bozulmadığı sürece bu artış temposunu koruman önerilir.",
    "İlerlemeyi sürdürmek için tekrar sayısını da zaman zaman gözden geçirebilirsin.",
    "Bu artış hızını korurken dinlenme sürelerine de dikkat etmeyi unutma.",
    "İlerleme bu şekilde sürerse hedeflerine planladığından önce ulaşabilirsin.",
    "Bu tempo harika, sadece teknik kaliteyi de aynı seviyede tutmaya özen göster.",
    "Artışı sürdürürken beslenme ve dinlenmeni de bu ilerlemeye paralel artırmayı düşün.",
    "Bu ivmeyi korumak için bir sonraki ağırlık artışını küçük adımlarla planlamaya devam et.",
]

PLATO_YORUMLAR = [
    "son antrenmanlarda ağırlık aynı seviyede kalmış, bu bir plato döneminde olduğunu gösterebilir",
    "ağırlık değişmeden devam ediyor, vücudun bu yüke adapte olmuş olabilir",
    "birkaç antrenman boyunca ilerleme durmuş görünüyor, bu plato belirtisi olabilir",
    "aynı ağırlıkta sabit kalman, bir sonraki seviyeye geçiş için bir eşik noktasında olduğunu gösterebilir",
    "ilerleme hızın yavaşlamış görünüyor, bu doğal bir adaptasyon sürecinin parçası olabilir",
    "ağırlık sabit kalsa da bu dönem, tekniğini pekiştirmek için iyi bir fırsat olabilir",
    "bu durağanlık, programında küçük bir değişikliğe ihtiyaç olduğunun işareti olabilir",
    "vücudun bu ağırlığa alışmış olabilir, yeni bir uyarana ihtiyaç var gibi görünüyor",
]

PLATO_KAPANIS = [
    "Tekrar sayısını veya set düzenini değiştirmek platodan çıkmana yardımcı olabilir.",
    "Bir hafta hafif yük ile teknik odaklı çalışmak (deload) yeniden ilerlemeye geçişi kolaylaştırabilir.",
    "Hareket çeşitliliği ekleyerek kasları farklı açılardan çalıştırmak faydalı olabilir.",
    "Dinlenme sürelerini veya antrenman sıklığını gözden geçirmek faydalı olabilir.",
    "Tempo değişikliği (daha yavaş iniş gibi) yeni bir uyaran sağlayabilir.",
    "Beslenme ve uyku düzenini gözden geçirmek, platoyu kırmana yardımcı olabilir.",
    "Küçük ağırlık artışları yerine tekrar sayısını artırmayı deneyebilirsin.",
    "Bir sonraki döngüde farklı bir varyasyonla bu hareketi çalışmak ilerlemeyi tetikleyebilir.",
]

AZALAN_YORUMLAR = [
    "son antrenmanlarda ağırlıkta bir düşüş gözlemleniyor, bu yorgunluk veya yetersiz dinlenmeden kaynaklanabilir",
    "kaldırılan ağırlık azalma eğiliminde, bu durum toparlanma sürecinin gözden geçirilmesini gerektirebilir",
    "ağırlıklarda gerileme var, bu durumun stres veya uyku düzeniyle ilişkili olabileceğini düşünebilirsin",
    "performansındaki düşüş, vücudunun ek dinlenmeye ihtiyaç duyduğunu gösterebilir",
    "ağırlık azalışı, aşırı antrenman belirtisi olabilir",
    "son dönemdeki düşüş, beslenme eksikliği veya enerji açığıyla ilişkili olabilir",
    "bu gerileme, programdaki yoğunluğun geçici olarak azaltılması gerektiğine işaret edebilir",
    "performans düşüşü, hastalık veya stres gibi antrenman dışı faktörlerden de kaynaklanabilir",
]

AZALAN_KAPANIS = [
    "Bu dönemde ağırlığı biraz düşürüp forma odaklanmak toparlanmana yardımcı olabilir.",
    "Uyku ve beslenme düzenini gözden geçirmek performansının geri dönmesine destek olacaktır.",
    "Gerekirse bir hafta daha hafif antrenmanla vücuduna dinlenme fırsatı verebilirsin.",
    "Stres seviyeni ve günlük rutinini gözden geçirmek faydalı olabilir.",
    "Bu dönemde hacmi azaltıp yoğunluğu korumak iyi bir strateji olabilir.",
    "Vücudunun verdiği sinyalleri dinleyerek kısa bir dinlenme dönemi planlayabilirsin.",
    "Performans geri gelene kadar ağırlık yerine teknik kaliteye odaklanabilirsin.",
    "Bu gerilemenin geçici olduğunu unutma, toparlanma sonrası ilerleme genelde hızlanır.",
]

DALGALI_YORUMLAR = [
    "ağırlıklarında belirli bir düzen yerine inişli çıkışlı bir seyir var",
    "performansın antrenmandan antrenmana dalgalanma gösteriyor",
    "ağırlık değerlerinde tutarlı bir yön yerine değişkenlik göze çarpıyor",
    "bu dalgalanma, antrenman koşullarındaki farklılıklardan kaynaklanabilir",
    "performansındaki iniş çıkışlar, henüz oturmamış bir antrenman rutinine işaret edebilir",
    "ağırlıklar arasındaki fark, gün içi enerji seviyendeki değişimle ilişkili olabilir",
    "bu değişkenlik, antrenman öncesi beslenme veya ısınma farklılıklarından etkilenebilir",
    "tutarsız ağırlık değerleri, programda henüz bir düzene oturmadığını gösteriyor olabilir",
]

DALGALI_KAPANIS = [
    "Antrenman saatini ve dinlenme sürelerini sabitlemek daha tutarlı sonuçlar almana yardımcı olabilir.",
    "Set ve tekrar sayılarını sabit tutarak ilerlemeyi daha kolay takip edebilirsin.",
    "Düzenli bir antrenman günlüğü tutmak dalgalanmanın nedenini anlamana yardımcı olur.",
    "Antrenman öncesi beslenmeni standartlaştırmak performansını dengeleyebilir.",
    "Aynı saatte antrenman yapmaya çalışmak vücut saatini düzenleyebilir.",
    "Isınma rutinini sabitlemek, performans tutarlılığını artırabilir.",
    "Bu dalgalanmayı normal karşıla, birkaç hafta içinde bir örüntü oluşmaya başlayacaktır.",
    "Haftalık ortalamaya bakmak, antrenman bazlı dalgalanmadan daha sağlıklı bir görünüm sunar.",
]

DEFTER_ACILIS = [
    "Antrenman defterindeki son kayıtları inceledim.",
    "Geçmiş antrenman verilerine göre bir ilerleme analizi hazırladım.",
    "Bu harekete ait son kayıtlara bakarak bir değerlendirme yapalım.",
    "Antrenman geçmişini inceledim, işte gözlemlerim.",
    "Bu harekete ait verileri analiz ettim, birlikte değerlendirelim.",
    "Defterindeki son kayıtlara dayanarak kısa bir değerlendirme hazırladım.",
]


def agirlik_dizisi_uret(trend):
    baslangic = random.choice([20, 25, 30, 40, 50, 60, 70, 80])
    uzunluk = random.randint(4, 6)
    agirliklar = [baslangic]

    for _ in range(uzunluk - 1):
        son = agirliklar[-1]
        if trend == "artan":
            adim = random.choice([2.5, 5])
            agirliklar.append(son + adim)
        elif trend == "azalan":
            adim = random.choice([2.5, 5])
            agirliklar.append(max(son - adim, 5))
        elif trend == "plato":
            agirliklar.append(son)
        else:
            adim = random.choice([-5, -2.5, 0, 2.5, 5])
            agirliklar.append(max(son + adim, 5))

    return agirliklar


def defter_ornek_uret():
    trend = random.choice(["artan", "plato", "azalan", "dalgali"])
    hareket = random.choice(HAREKET_LISTESI)
    agirliklar = agirlik_dizisi_uret(trend)
    agirlik_metni = ", ".join(str(a) for a in agirliklar)

    girdi = f"Hareket: {hareket}, Son {len(agirliklar)} antrenmandaki agirliklar (kg): {agirlik_metni}"

    if trend == "artan":
        yorum = random.choice(ARTAN_YORUMLAR)
        kapanis = random.choice(ARTAN_KAPANIS)
    elif trend == "plato":
        yorum = random.choice(PLATO_YORUMLAR)
        kapanis = random.choice(PLATO_KAPANIS)
    elif trend == "azalan":
        yorum = random.choice(AZALAN_YORUMLAR)
        kapanis = random.choice(AZALAN_KAPANIS)
    else:
        yorum = random.choice(DALGALI_YORUMLAR)
        kapanis = random.choice(DALGALI_KAPANIS)

    cikti = f"{random.choice(DEFTER_ACILIS)} {hareket} hareketinde {yorum}. {kapanis}"

    return {
        "instruction": "Asagidaki hareketin agirlik gecmisine gore kisa, yapici ve Turkce bir ilerleme analizi yaz.",
        "input": girdi,
        "output": cikti,
    }


def main():
    ornekler = []

    for _ in range(500):
        ornekler.append(antrenor_ornek_uret())

    for _ in range(500):
        ornekler.append(diyet_ornek_uret())

    for _ in range(500):
        ornekler.append(defter_ornek_uret())

    random.shuffle(ornekler)

    with open("egitim_verisi.jsonl", "w", encoding="utf-8") as dosya:
        for ornek in ornekler:
            dosya.write(json.dumps(ornek, ensure_ascii=False) + "\n")

    print(f"{len(ornekler)} ornek uretildi: egitim_verisi.jsonl")
    print("Antrenor: 500, Diyet: 500, Antrenman Defteri: 500")


if __name__ == "__main__":
    main()