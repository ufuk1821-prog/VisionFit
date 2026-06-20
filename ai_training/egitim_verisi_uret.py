import json
import random

HAREKET_KATEGORILERI = {
    "squat": ["Omurga Nötrlüğü", "Kalça Derinliği", "Diz Hizası", "Diz Çöküşü", "Ağırlık Merkezi"],
    "deadlift": ["Omurga Nötrlüğü", "Kalça Menteşesi", "Barın Vücuda Uzaklığı", "Diz-Kalça Zamanlaması", "Kilitleme Pozisyonu"],
    "biceps_curl": ["Dirsek Sabitliği", "Gövde Salınımı", "Hareket Açıklığı", "Bilek Pozisyonu", "Kontrollü Negatif Tekrar"],
}

SEVIYE_ARALIKLARI = [
    (0, 30, "kritik"),
    (30, 50, "zayif"),
    (50, 70, "gelistirilmeli"),
    (70, 85, "iyi"),
    (85, 101, "cok_iyi"),
]


def seviye_belirle(skor):
    for alt, ust, etiket in SEVIYE_ARALIKLARI:
        if alt <= skor < ust:
            return etiket
    return "iyi"


IYI_YORUMLAR = {
    "squat": {
        "Omurga Nötrlüğü": [
            "sırtını dik ve nötr tutmayı başardın", "omurga pozisyonun antrenman boyunca stabildi",
            "göğsünü dik tutarak sırtını koruyabildin", "bel bölgenin nötr duruşu antrenman boyunca korunmuş",
            "sırt açısı boyunca tutarlı ve güvenli kaldı", "omurganın doğal eğrisini koruyarak hareket ettin",
            "üst gövde pozisyonun hareket boyunca dengeliydi", "sırtının aşırı kamburlaşması veya çökmesi gözlenmedi",
            "gövde duruşun squat boyunca sabit ve güvenliydi", "bel ve sırt bölgen yük altında stabilitesini korudu",
        ],
        "Kalça Derinliği": [
            "squat derinliğin yeterliydi, kalçanı diz seviyesine indirebildin", "derinlik açısından gayet iyi bir performans gösterdin",
            "iniş derinliğin hedeflenen seviyedeydi", "kalça hareket aralığını tam kullanabildin",
            "iniş mesafen squat için ideal aralıktaydı", "kalçanı yeterli derinliğe indirerek hareketi tamamladın",
            "derinlik kontrolün antrenman boyunca tutarlıydı", "hareket aralığın kas gelişimi için yeterli seviyedeydi",
            "inişlerin paralel veya altı seviyesine ulaşabiliyor", "kalça mobiliten derinlik açısından yeterli görünüyor",
        ],
        "Diz Hizası": [
            "dizlerin ayak uçlarınla uyumlu hareket etti", "diz hizalaman boyunca düzgün kaldı",
            "dizlerinin pozisyonu antrenman boyunca tutarlıydı", "diz açısı ayak yönüyle uyumluydu",
            "dizlerin hareket boyunca dengeli bir çizgide kaldı", "diz-ayak hizası squat boyunca korunmuş",
            "dizlerin öne kaçma eğilimi gözlenmedi", "diz pozisyonun ayak izine paralel kaldı",
            "dizlerinin hizası teknik açıdan oldukça düzgündü", "diz açın hareket boyunca stabil bir çizgide ilerledi",
        ],
        "Diz Çöküşü": [
            "dizlerinde içe çöküş gözlenmedi, stabildi", "diz stabiliten oldukça iyiydi",
            "dizlerin antrenman boyunca dengeli kaldı", "diz ekleminin yanal stabilitesi güçlüydü",
            "dizlerin içe veya dışa kaçma eğilimi göstermedi", "diz valgus belirtisi görülmedi",
            "dizlerin yana doğru hareketi minimaldi", "diz stabilizasyonun yük altında korunmuş",
            "bacak hizan boyunca dizlerin pozisyonu sabit kaldı", "dizlerin yanal kontrolü antrenman boyunca güçlüydü",
        ],
        "Ağırlık Merkezi": [
            "ağırlık merkezini topuklarında dengeli tutabildin", "denge dağılımın oldukça iyiydi",
            "ağırlığını öne kaydırmadan hareketi tamamladın", "vücut ağırlığının dağılımı antrenman boyunca dengeliydi",
            "topuk-ayak tabanı dengesini koruyabildin", "ağırlık merkezinin konumu hareket boyunca stabildi",
            "denge noktanı kaybetmeden squat'ı tamamladın", "ayak tabanının tamamına eşit basınç uygulayabildin",
            "vücut dengesi inişte ve kalkışta korunmuştu", "ağırlık aktarımın hareket boyunca kontrollüydü",
        ],
    },
    "deadlift": {
        "Omurga Nötrlüğü": [
            "kaldırış boyunca sırtın düz ve nötr kaldı", "omurga pozisyonun bar kalkarken stabildi",
            "bel bölgen yük altında nötr pozisyonunu korudu", "sırtının yuvarlanması gözlenmedi",
            "göğsünü dik tutarak omurgayı koruyabildin", "kaldırış boyunca sırt açın sabit kaldı",
            "omurganın doğal kavisini bozmadan barı kaldırdın", "sırt nötrlüğü kilitleme anına kadar korunmuş",
        ],
        "Kalça Menteşesi": [
            "kalça menteşesi hareketini doğru uyguladın", "kalçadan katlanma hareketi temizdi",
            "diz yerine kalçadan başlayan bir hareket sergiledin", "kalça geriye itiş hareketi etkiliydi",
            "menteşe hareketinde diz ve kalça koordinasyonu iyiydi", "kalça öne itişi kilitleme anında güçlüydü",
            "kalça menteşesi tüm hareket boyunca akıcıydı", "kalçadan hareketi başlatman doğru bir teknikti",
        ],
        "Barın Vücuda Uzaklığı": [
            "bar tüm hareket boyunca vücuduna yakın kaldı", "bar yörüngesi düz ve vücuda paralel ilerledi",
            "bar ile baldır arası mesafe minimaldi", "bar göğsüne yakın bir hat izledi",
            "bar vücudundan uzaklaşmadan kalktı", "bar yörüngesi tüm hareket boyunca tutarlıydı",
            "bar kontrolün omuz ve kalça hizasında iyiydi", "bar mesafesi teknik açıdan idealdi",
        ],
        "Diz-Kalça Zamanlaması": [
            "diz ve kalça açılması eş zamanlı gerçekleşti", "kalkış sırasında diz-kalça senkronizasyonu iyiydi",
            "diz ve kalça uzaması dengeli bir tempoda oldu", "hareketin zamanlaması teknik açıdan doğruydu",
            "diz kilitlenmesi kalça ile aynı anda tamamlandı", "kalkış fazında zamanlama sorunsuzdu",
            "diz-kalça koordinasyonu kaldırış boyunca uyumluydu", "hareketin fazları arasında akıcı bir geçiş vardı",
        ],
        "Kilitleme Pozisyonu": [
            "kilitleme pozisyonunda kalça ve omuz hizalandı", "üst pozisyonda tam kilitlenme sağlandı",
            "kilitleme anında aşırı geriye yaslanma olmadı", "son pozisyonda duruş dik ve kontrollüydü",
            "kilitleme fazında omurga nötrlüğü korunmuş", "tepe noktada kalça tam uzanmıştı",
            "kilitleme pozisyonu güvenli ve kontrollüydü", "üst pozisyonda gereksiz hiperextansiyon yoktu",
        ],
    },
    "biceps_curl": {
        "Dirsek Sabitliği": [
            "dirseklerin hareket boyunca sabit kaldı", "dirsek pozisyonu gövdeye yakın ve sabitti",
            "dirseklerin öne kaçması gözlenmedi", "dirsek sabitliği tüm tekrarlar boyunca korunmuş",
            "dirsekler omuz hizasında sabit tutuldu", "dirsek pozisyonun teknik açıdan doğruydu",
            "dirseklerin yana açılması minimaldi", "dirsek stabilitesi hareketin kalitesini artırdı",
        ],
        "Gövde Salınımı": [
            "gövdende sallanma veya momentum kullanımı gözlenmedi", "vücudun sabit kaldı, sadece kollar çalıştı",
            "gövde stabilitesi tüm set boyunca korunmuş", "momentum kullanmadan saf kas gücüyle kaldırdın",
            "gövde salınımı olmadan kontrollü tekrarlar yaptın", "vücudunu sabit tutarak izolasyonu koruyabildin",
            "öne arkaya sallanma gözlenmedi, form temizdi", "gövde sabitliğin bicepse odaklanmayı sağladı",
        ],
        "Hareket Açıklığı": [
            "hareketin tam açıklıkta gerçekleşti", "tam ekstansiyon ve fleksiyon sağlandı",
            "hareket aralığın kas gelişimi için yeterliydi", "alt ve üst pozisyonda tam hareket genişliği vardı",
            "kolun tam açılıp kapanması sağlandı", "hareket açıklığı tüm tekrarlarda tutarlıydı",
            "kısmi tekrar yapılmadı, tam aralık kullanıldı", "hareketin başından sonuna kadar genişlik korunmuş",
        ],
        "Bilek Pozisyonu": [
            "bilek pozisyonu nötr ve sabit kaldı", "bilek kırılması olmadan hareketi tamamladın",
            "bilek açısı tüm tekrarlar boyunca tutarlıydı", "bilek stabilitesi kavrama gücünü destekledi",
            "bileklerin aşırı bükülmesi gözlenmedi", "bilek nötrlüğü hareketin güvenliğini artırdı",
            "bilek pozisyonun teknik açıdan doğruydu", "bilek kontrolü ağırlık artsa bile bozulmadı",
        ],
        "Kontrollü Negatif Tekrar": [
            "iniş fazını kontrollü şekilde gerçekleştirdin", "negatif tekrar hızı uygun tempoda gerçekleşti",
            "ağırlığı düşürürken kontrolü kaybetmedin", "eksantrik faz kas gerilimini koruyacak hızdaydı",
            "iniş hareketi ani değil kontrollüydü", "negatif faz tüm tekrarlarda tutarlıydı",
            "ağırlığın düşüşü yerçekimiyle değil kasla kontrol edildi", "eksantrik kontrolün kas gelişimine katkı sağlıyor",
        ],
    },
}

GELISTIRME_YORUMLARI = {
    "squat": {
        "Omurga Nötrlüğü": [
            "öne doğru aşırı eğilme eğilimin var, göğsünü daha dik tut", "omurganı nötr konumda tutmaya odaklan",
            "sırtının yuvarlanmaması için karın kaslarını daha sıkı tut", "bel bölgenin aşırı kavislenmemesine dikkat et",
            "üst gövde açını daha dik tutarak omurga yükünü azaltabilirsin", "sırtının alt kısmında yuvarlanma eğilimi var, hareket aralığını kontrol et",
            "göğüs kafesini daha dik tutmak omurga güvenliğini artıracaktır", "omurga nötrlüğünü korumak için karın içi basıncı artırmayı dene",
            "sırtının üst kısmında öne çöküş gözleniyor, üst sırt kaslarını aktive et", "omurga pozisyonunu sabitlemek için hareket öncesi nefes alma tekniğini kullan",
        ],
        "Kalça Derinliği": [
            "squat derinliğin yetersiz kaldı, kalçanı daha aşağı indirmeyi dene", "iniş mesafeni artırarak diz seviyesinin altına inmeyi hedefle",
            "derinlik konusunda biraz daha çalışmaya ihtiyacın var", "hareket aralığını artırmak için esneklik çalışmaları faydalı olabilir",
            "kalça mobilitesini geliştirmek derinliğini artıracaktır", "ayak bileği ve kalça esnekliğini artırmak iniş derinliğine yardımcı olur",
            "derinliğe inerken denge kaybı oluşuyor, bunu aşamalı olarak artır", "tam derinliğe inebilmek için ısınma sürende mobilite hareketleri ekle",
            "iniş derinliğin hedefin altında kaldı, kademeli olarak artırmayı dene", "kalça ekleminin hareket aralığını genişletmek için germe egzersizleri ekleyebilirsin",
        ],
        "Diz Hizası": [
            "dizlerin ayak uçlarının önüne geçiyor, ağırlığı topuklarına ver", "diz hizalamana dikkat ederek hareketi tekrarla",
            "dizlerini ayak uçlarınla aynı hizada tutmaya çalış", "ayakkabı ve ayak pozisyonunu kontrol ederek diz açısını düzeltebilirsin",
            "dizlerin öne kaçmasını azaltmak için ağırlık merkezini geriye al", "diz açın ayak açınla uyumlu değil, ayak pozisyonunu gözden geçir",
            "dizlerin hareket boyunca öne doğru kaymasını azaltmak için kalçayı geriye it", "diz hizalaman için ayna karşısında yavaş tekrarlar yapman faydalı olur",
            "dizlerinin öne doğru aşırı hareketi var, bu da bilek üzerinde fazla yük oluşturuyor", "diz-ayak hizasını korumak için ayak parmaklarını hafifçe dışa açabilirsin",
        ],
        "Diz Çöküşü": [
            "dizlerinde içe çöküş (valgus) gözlemleniyor, dizlerini dışa doğru it", "diz stabilitenizi artırmak için kalça kaslarını daha aktif kullan",
            "dizlerinin içe doğru kapanmaması için bilinçli bir şekilde dışarı doğru bastır", "kalça abdüktör kaslarını güçlendirmek diz stabilitesine yardımcı olur",
            "diz açısının sabit kalması için ayak taban basıncını dengeli dağıt", "dizlerin içe kapanması ayak bileği veya kalça zayıflığından kaynaklanabilir",
            "diz valgusu azaltmak için lastik bant ile yan adım egzersizleri faydalı olabilir", "kalça dış rotator kaslarını güçlendirmek diz hizalamasını destekler",
            "dizlerin içe kaçmasını önlemek için hareket öncesi kalça aktivasyonu yap", "diz stabilitesi için tek bacak egzersizleriyle destekleyici çalışmalar ekleyebilirsin",
        ],
        "Ağırlık Merkezi": [
            "ağırlık merkezin öne kayıyor, topuklarını yere sağlam bas", "denge dağılımını topuklara kaydırmaya çalış",
            "ağırlığını öne vermeden hareketi tamamlamaya odaklan", "ayak tabanının tamamını yere basarak dengeyi artırabilirsin",
            "öne devrilme eğilimini azaltmak için karın ve sırt kaslarını birlikte çalıştır", "ağırlık merkezinin öne kayması ayak bileği esnekliğiyle ilişkili olabilir",
            "denge kaybını azaltmak için ayakların omuz genişliğinde olduğundan emin ol", "ağırlığını parmak uçlarına vermek yerine topuk ve orta ayağa dağıtmayı dene",
            "öne doğru kayma eğilimini azaltmak için hareket hızını kontrol et", "denge çalışmaları (örneğin tek ayak duruşu) ağırlık merkezi kontrolünü geliştirebilir",
        ],
    },
    "deadlift": {
        "Omurga Nötrlüğü": [
            "kaldırış başında sırtın yuvarlanıyor, bu omurga için riskli", "barı kaldırmadan önce sırtını düzleştirmeyi unutma",
            "bel bölgende aşırı kamburlaşma var, karın kaslarını daha sıkı tut", "omurganı nötr tutmak için göğsünü öne yukarı çıkar",
            "sırtının üst kısmında çökme var, kürek kemiklerini sıkmayı dene", "kaldırış sırasında sırt yuvarlanması ciddi bir form hatası, ağırlığı azalt",
            "omurga güvenliği için hareket öncesi sırt pozisyonunu kontrol et", "bel düzlüğünü korumak için ısınma setlerinde teknik çalışması yap",
        ],
        "Kalça Menteşesi": [
            "hareketi dizden başlatıyorsun, kalçadan başlamaya çalış", "kalça geriye itişi yetersiz, daha fazla kalça hareketi kullan",
            "menteşe hareketi yerine squat benzeri bir hareket yapıyorsun", "kalçanı geriye iterek hamstring gerilimini artırmayı dene",
            "diz baskın bir kaldırış yapıyorsun, kalça baskın olmalı", "kalça menteşe hareketini geliştirmek için RDL pratiği yapabilirsin",
            "kalçadan katlanma yetersiz, bu da sırtına fazla yük biniyor", "kalça menteşesi tekniğini ayna karşısında çalışmanı öneririm",
        ],
        "Barın Vücuda Uzaklığı": [
            "bar vücudundan uzaklaşıyor, bu sırtına ekstra yük bindiriyor", "bar yörüngesi vücuduna yakın tutulmalı",
            "bar baldırlardan uzaklaşıyor, kaldırış boyunca yakın tut", "bar mesafesi arttıkça omurga yükü de artıyor, dikkat et",
            "bar göğsünden uzaklaşma eğiliminde, kollarını gevşek tut ve barı çek", "bar yörüngesini düzeltmek için kaldırış öncesi bar pozisyonunu kontrol et",
            "bar vücuttan uzaklaştığında bel üzerindeki tork artıyor", "bar mesafesini azaltmak için lats aktivasyonu yapmayı dene",
        ],
        "Diz-Kalça Zamanlaması": [
            "diz ve kalça uzaması senkronize değil, biri diğerinden önce açılıyor", "kalkış sırasında zamanlama bozukluğu var",
            "kalçan dizden önce açılıyor, bu da sırtına erken yük biniyor", "diz-kalça koordinasyonunu geliştirmek için yavaş tempo çalışması yap",
            "kalkışın ilk fazında diz açısı çok hızlı değişiyor", "zamanlama sorunu form bozukluğuna yol açabilir, tempo çalış",
            "diz ve kalçanın eş zamanlı açılmasına odaklanarak tekrar et", "hareketin fazları arasında akıcılık eksik, video ile kontrol et",
        ],
        "Kilitleme Pozisyonu": [
            "kilitleme anında aşırı geriye yaslanıyorsun, bu omurga için riskli", "üst pozisyonda hiperextansiyon var, kalçayı sadece tam uzat",
            "kilitleme pozisyonunda kontrol kaybı gözleniyor", "tepe noktada aşırı geriye eğilme yerine sadece dik dur",
            "kilitlemeyi tamamlamadan bırakıyorsun, kalçayı tam uzat", "üst pozisyonda omuzlar geriye gidiyor, bunu kontrol et",
            "kilitleme anında bel aşırı kavisleniyor, karın kaslarını sık", "tam kilitlenme için kalça ve omuz hizasını netleştir",
        ],
    },
    "biceps_curl": {
        "Dirsek Sabitliği": [
            "dirseklerin öne doğru kayıyor, gövdeye yakın sabit tut", "dirsek sabitliğini korumak için omuz aktivasyonunu artır",
            "dirseklerin hareket boyunca öne kaçması momentumdan kaynaklanıyor olabilir", "dirsek pozisyonunu sabitlemek için ağırlığı azaltmayı dene",
            "dirseklerin yana açılması izolasyonu azaltıyor, gövdeye yakın tut", "dirsek stabilitesi için ayna karşısında kontrol ederek çalış",
            "dirseklerin öne kayması bicepsten triceps ve omuza yük kaydırıyor", "dirsek sabitliğini artırmak için duvara yaslanarak curl yapabilirsin",
        ],
        "Gövde Salınımı": [
            "gövdende momentum kullanımı var, sallanmadan kaldırmayı dene", "vücudunu sallıyorsun, bu izolasyonu azaltıyor",
            "gövde salınımı ağırlığın fazla olduğunu gösterebilir, hafiflet", "öne arkaya sallanma var, gövdeni sabit tutmaya odaklan",
            "momentum kullanımı kas gelişimini azaltıyor, kontrollü çalış", "gövde sabitliği için karın kaslarını aktive ederek başla",
            "sallanma hareketin etkisini azaltıyor, ağırlığı düşürüp tekniğe odaklan", "vücut stabilitesi için sırtını sabit bir yüzeye yaslayabilirsin",
        ],
        "Hareket Açıklığı": [
            "hareketin tam açıklıkta gerçekleşmiyor, kolunu tam aç", "kısmi tekrar yapıyorsun, tam ekstansiyona in",
            "üst pozisyonda tam fleksiyon sağlanmıyor, daha fazla büküm yap", "hareket aralığını artırmak kas gelişimini destekleyecektir",
            "alt pozisyonda kolun tam açılmıyor, bu hareket aralığını sınırlıyor", "tam aralık kullanmak için ağırlığı azaltmayı düşünebilirsin",
            "hareket açıklığın tutarsız, her tekrarda aynı aralığı hedefle", "kısmi hareket yerine tam açıklıkta çalışmak daha etkili olacaktır",
        ],
        "Bilek Pozisyonu": [
            "bileğin geriye doğru bükülüyor, nötr pozisyonda tut", "bilek pozisyonun tutarsız, sabit bir açıda tutmaya çalış",
            "bileklerin aşırı bükülmesi bilek eklemine gereksiz yük bindiriyor", "bilek nötrlüğünü korumak için kavrama şeklini gözden geçir",
            "bilek kırılması formun kalitesini düşürüyor", "bilek stabilitesi için daha hafif ağırlıkla başlamayı dene",
            "bilek pozisyonu hareketin sonunda bozuluyor, dikkat et", "bilek açını sabitlemek için bilek sargısı kullanmayı düşünebilirsin",
        ],
        "Kontrollü Negatif Tekrar": [
            "iniş fazını çok hızlı yapıyorsun, kontrolü artır", "negatif tekrar hızın fazla, daha yavaş indir",
            "ağırlığı düşürürken yerçekimine bırakıyorsun, kontrol et", "eksantrik faz çok kısa sürüyor, 2-3 saniyeye uzat",
            "iniş hızını yavaşlatmak kas gelişimini artıracaktır", "negatif tekrar kalitesi düşük, bilinçli olarak yavaşlat",
            "ağırlığın düşüşünü kontrol ederek kas gerilimini koru", "eksantrik fazı ihmal etmek kazanımlarını sınırlayabilir",
        ],
    },
}

ACILIS_CUMLELERI_ANTRENOR = [
    "Bu oturumdaki performansını değerlendirdim.", "Antrenman verilerine göre genel bir değerlendirme yapalım.",
    "Bu seanstaki form analizine bakarak şunları söyleyebilirim.", "Oturum sonunda elde edilen skorlara göre kısa bir geri bildirim hazırladım.",
    "Bugünkü {hareket} performansını birlikte inceleyelim.", "Bu antrenmandaki kategori skorlarını değerlendirdim, sonuçları seninle paylaşıyorum.",
    "Son oturumundaki form verilerine göre bazı gözlemlerim var.", "Bugünkü çalışmanı analiz ettim, işte değerlendirmem.",
    "Bu {hareket} oturumunu kategori bazında inceledim.", "{hareket} formunu detaylı olarak değerlendirdim, sonuçlar şöyle.",
]

KAPANIS_CUMLELERI_IYI = [
    "Bu şekilde devam edersen kısa sürede daha da gelişeceksin.", "İstikrarlı bir şekilde tekrar edersen sonuçlar çok iyi olacak.",
    "Harika gidiyorsun, bu tempoyu sürdür.", "Bu performansı korursan ilerleyen haftalarda daha zorlu hedeflere geçebilirsin.",
    "Bu seviyeyi koruman, daha ağır yüklere geçişin için güçlü bir temel oluşturuyor.", "Bu tutarlılığı sürdürerek bir sonraki aşamaya güvenle geçebilirsin.",
    "Bu disiplinle ilerlersen hedeflerine planladığından daha hızlı ulaşabilirsin.", "Bu form kalitesiyle ağırlık artışına geçmek için hazır görünüyorsun.",
]

KAPANIS_CUMLELERI_KARISIK = [
    "Güçlü olduğun noktaları korurken, belirttiğim alanlara odaklanırsan kısa sürede ilerleme göreceksin.", "Genel olarak iyi bir temele sahipsin, sadece bazı küçük detayları düzeltmen gerekiyor.",
    "Belirtilen noktalara dikkat ederek bir sonraki antrenmanda daha iyi bir sonuç alabilirsin.", "Dengeli bir gelişim için güçlü yönlerini sürdürürken zayıf noktaları üzerinde çalışmaya devam et.",
    "Bu oturum, hangi alanlara odaklanman gerektiğini net bir şekilde gösteriyor.", "Güçlü yönlerin motivasyonunu artırırken, geliştirilecek alanlar net bir yol haritası sunuyor.",
    "Bir sonraki antrenmanda belirtilen noktalara öncelik vererek dengeyi artırabilirsin.", "Genel tablo olumlu, sadece birkaç noktaya odaklanarak formunu bir üst seviyeye taşıyabilirsin.",
]

KAPANIS_CUMLELERI_ZAYIF = [
    "Bu alanlara odaklanarak tekrar çalışman, formunu hızla iyileştirecektir.", "Şu an için yavaş ve kontrollü tekrarlar yapmak, belirtilen sorunları çözmene yardımcı olacaktır.",
    "Bu noktalara dikkat ederek pratik yapmaya devam et, gelişim zaman alacaktır ama kesin gelecektir.", "Önceliğin form düzeltmek olsun, ağırlık artışını bu konular düzelene kadar erteleyebilirsin.",
    "Bu aşamada ağırlıksız veya hafif yüklerle teknik çalışması yapman faydalı olacaktır.", "Belirtilen alanlarda küçük adımlarla ilerlemek, uzun vadede büyük fark yaratacaktır.",
    "Bu konularda bir antrenörden form kontrolü almak süreci hızlandırabilir.", "Sabırlı ol, bu noktalar üzerinde çalıştıkça form kaliten gözle görülür şekilde artacaktır.",
]

KAPANIS_CUMLELERI_KRITIK = [
    "Bu hareket için ağırlığı önemli ölçüde azaltıp teknik üzerine yoğunlaşmanı öneririm.", "Kritik form hatalarını düzeltmeden ağırlık artırmak sakatlanma riski taşır, dikkatli ol.",
    "Bu seviyedeki form sorunları için bir antrenörden destek almanı şiddetle öneririm.", "Şu an için hareketi ağırlıksız tekrarla, formun düzelmeden ilerleme yapma.",
    "Bu form hatalarıyla devam etmek riskli olabilir, mutlaka teknik çalışmasına öncelik ver.",
]

HAREKET_ADI_TURKCE = {"squat": "squat", "deadlift": "deadlift", "biceps_curl": "biceps curl"}


def antrenor_skor_uret():
    hareket = random.choice(list(HAREKET_KATEGORILERI.keys()))
    kategoriler = HAREKET_KATEGORILERI[hareket]
    skorlar = {kategori: random.randint(15, 100) for kategori in kategoriler}
    return hareket, skorlar


def antrenor_girdi_olustur(hareket, skorlar):
    hareket_adi = HAREKET_ADI_TURKCE[hareket]
    parcalar = [f"{kategori}: {skor}" for kategori, skor in skorlar.items()]
    return f"Hareket: {hareket_adi.capitalize()}, " + ", ".join(parcalar)


def antrenor_cikti_olustur(hareket, skorlar):
    hareket_adi = HAREKET_ADI_TURKCE[hareket]
    seviyeli_skorlar = {k: (v, seviye_belirle(v)) for k, v in skorlar.items()}

    en_dusuk_kategori = min(skorlar, key=skorlar.get)
    en_yuksek_kategori = max(skorlar, key=skorlar.get)

    kritik_var = any(seviye == "kritik" for _, seviye in seviyeli_skorlar.values())
    zayif_var = any(seviye in ("kritik", "zayif") for _, seviye in seviyeli_skorlar.values())
    tum_iyi = all(seviye in ("iyi", "cok_iyi") for _, seviye in seviyeli_skorlar.values())

    cumleler = [random.choice(ACILIS_CUMLELERI_ANTRENOR).format(hareket=hareket_adi)]

    if skorlar[en_yuksek_kategori] >= 70:
        cumleler.append(random.choice(IYI_YORUMLAR[hareket][en_yuksek_kategori]).capitalize() + ".")

    if skorlar[en_dusuk_kategori] < 70:
        cumleler.append(random.choice(GELISTIRME_YORUMLARI[hareket][en_dusuk_kategori]).capitalize() + ".")

        ikinci_dusuk_adaylar = [k for k in skorlar if k != en_dusuk_kategori and skorlar[k] < 70]
        if ikinci_dusuk_adaylar:
            ikinci_dusuk = min(ikinci_dusuk_adaylar, key=lambda k: skorlar[k])
            cumleler.append(random.choice(GELISTIRME_YORUMLARI[hareket][ikinci_dusuk]).capitalize() + ".")

    if tum_iyi:
        cumleler.append(random.choice(KAPANIS_CUMLELERI_IYI))
    elif kritik_var:
        cumleler.append(random.choice(KAPANIS_CUMLELERI_KRITIK))
    elif zayif_var:
        cumleler.append(random.choice(KAPANIS_CUMLELERI_KARISIK))
    else:
        cumleler.append(random.choice(KAPANIS_CUMLELERI_KARISIK))

    return " ".join(cumleler)


def antrenor_ornek_uret():
    hareket, skorlar = antrenor_skor_uret()
    return {
        "instruction": "Asagidaki antrenman oturumu kategori skorlarina gore kullaniciya kisa, motive edici ve Turkce bir antrenor geri bildirimi yaz.",
        "input": antrenor_girdi_olustur(hareket, skorlar),
        "output": antrenor_cikti_olustur(hareket, skorlar),
    }


BMI_KATEGORILER = ["Zayif", "Normal", "Kilolu", "Obez"]

BMI_ARALIKLARI = {
    "Zayif": (16.0, 18.4),
    "Normal": (18.5, 24.9),
    "Kilolu": (25.0, 29.9),
    "Obez": (30.0, 38.0),
}

HEDEFLER = ["kilo_verme", "kilo_koruma", "kilo_alma"]

HEDEF_AÇIKLAMA = {"kilo_verme": "kilo vermek", "kilo_koruma": "kilosunu korumak", "kilo_alma": "kilo almak"}

OGUN_HAVUZU = {
    "vejetaryen_uyumlu": ["Mercimek çorbası ve tam tahıl ekmek", "Nohutlu sebze yemeği", "Yoğurtlu kinoa salatası", "Izgara sebze ve bulgur pilavı", "Mantarlı omlet"],
    "vejetaryen_uyumsuz": ["Izgara tavuk göğsü ve pilav", "Köfte ve patates", "Tavuklu Sezar salata", "Biftekli sandviç"],
    "yumurta_icerikli": ["Yumurtalı menemen", "Haşlanmış yumurta ve peynir", "Omlet ve tam tahıl ekmek", "Yumurtalı sandviç"],
    "yumurtasiz": ["Yulaf ezmesi ve meyve", "Peynirli tam tahıl tost", "Yoğurt ve granola", "Avokadolu tost"],
    "gluten_icerikli": ["Normal makarna ve köfte", "Ekmek arası tavuk", "Pizza dilimi", "Normal undan yapılmış börek"],
    "glutensiz_uyumlu": ["Pirinç ve sebze yemeği", "Glutensiz ekmek ile sandviç", "Kinoa salatası", "Patates ve ızgara et"],
    "deniz_urunu": ["Izgara somon ve sebze", "Karides salatası", "Levrek ve pilav", "Ton balıklı salata"],
    "deniz_urunsuz": ["Tavuk göğsü ve sebze", "Et sote ve pilav", "Mercimek köftesi", "Tavuklu wrap"],
    "kuruyemis_icerikli": ["Fındıklı granola", "Badem ezmeli tost", "Cevizli yoğurt", "Fıstıklı tatlı"],
    "kuruyemissiz": ["Meyveli yoğurt", "Tam tahıl gevreği ve süt", "Peynirli sandviç", "Sebzeli omlet"],
    "laktoz_icerikli": ["Sütlü tahıl gevreği", "Peynirli tost", "Yoğurtlu salata", "Sütlü kahve ve kek"],
    "laktozsuz": ["Badem sütlü smoothie", "Laktozsuz peynirli sandviç", "Meyve ve fındık karışımı", "Soya sütlü yulaf"],
    "kirmizi_et_icerikli": ["Izgara biftek ve patates", "Kuşbaşılı pilav", "Köfte ve salata", "Kırmızı etli güveç"],
    "kirmizi_etsiz": ["Tavuklu sebze yemeği", "Mercimek yemeği ve pilav", "Balıklı salata", "Sebzeli makarna"],
    "hafif_ogun": ["Sebze çorbası ve salata", "Izgara tavuk ve yeşillik salata", "Yoğurt ve meyve", "Hafif sebze yemeği"],
    "agir_ogun": ["Kızartma ve pilav, yanında ekstra ekmek", "Kremalı makarna ve büyük porsiyon et", "Çift porsiyon kebap ve pilav"],
}

ISTEK_ALERJI_MAP = {
    "vejetaryenim": {"yasak_kategori": "vejetaryen_uyumsuz", "tip": "vejetaryen"},
    "yumurtaya alerjim var": {"yasak_kategori": "yumurta_icerikli", "tip": "yumurta_alerjisi"},
    "glutensiz beslenmek istiyorum": {"yasak_kategori": "gluten_icerikli", "tip": "glutensiz"},
    "deniz ürünleri sevmiyorum": {"yasak_kategori": "deniz_urunu", "tip": "deniz_urunu_sevmiyor"},
    "fındık ve fıstığa alerjim var": {"yasak_kategori": "kuruyemis_icerikli", "tip": "kuruyemis_alerjisi"},
    "laktoz intoleransım var": {"yasak_kategori": "laktoz_icerikli", "tip": "laktoz_intolerans"},
    "kırmızı et yemiyorum": {"yasak_kategori": "kirmizi_et_icerikli", "tip": "kirmizi_et_yemiyor"},
    "öğlen dışarıda yediğim için hafif öğle yemeği istiyorum": {"yasak_kategori": "agir_ogun", "tip": "hafif_ogun_istegi"},
}

ISTEK_NORMAL_LISTESI = [
    "kırmızı et seviyorum", "akşamları az yemek istiyorum", "sabahları enerjik olmam gerekiyor, kahvaltıya önem veriyorum",
    "tatlı sevmem", "balık yemeyi seviyorum", "öğlen dışarıda yediğim için hafif öğle yemeği istiyorum",
    "spor öncesi karbonhidrat almak istiyorum", "akşam yemeğini geç saatte yiyorum", "tavuk severim",
    "baklagil tüketmeyi seviyorum", "şeker tüketimini azaltmak istiyorum", "yoğun çalışıyorum, pratik öğünler istiyorum",
    "akşamları atıştırma ihtiyacım oluyor", "kahvaltıda tatlı bir şeyler istiyorum", "akşam sporundan sonra acıkıyorum",
    "kafein tüketimimi sınırlamak istiyorum", "ev yemeği tercih ediyorum", "dışarıda yemek yemeyi seviyorum",
    "susuz kalmamaya çalışıyorum", "meyve sevmiyorum", "yeşil sebzeleri severim", "hızlı kilo vermek istiyorum",
    "kas kütlemi artırmak istiyorum", "öğün sayım az olsun istiyorum", "sık sık az az yemeyi seviyorum",
    "baharatlı yemekleri seviyorum", "yumurta severim", "kahve içmeden güne başlayamıyorum",
    "ekmek tüketimimi azaltmak istiyorum", "pilav ve makarna severim", "ara öğünlerde atıştırmalık istiyorum",
    "hafta sonları daha rahat yemek istiyorum",
]

DIYET_ACILIS_UYUMLU = [
    "Diyet planını inceledim, {hedef_aciklama} hedefinle uyumlu görünüyor.",
    "Hazırlanan planı kontrol ettim, isteklerine ve hedefine uygun şekilde oluşturulmuş.",
    "Plan üzerinde bir değerlendirme yaptım, genel olarak isteklerinle örtüşüyor.",
    "Diyet planını gözden geçirdim, beklentilerinle uyumlu bir yapı var.",
    "Planı analiz ettim, BMI ve hedef kalorinle tutarlı görünüyor.",
]

DIYET_UYUMLU_DEVAM = [
    "BMI değerin {bmi_kategori} aralığında, plan kalorisi ({plan_kalori} kcal) hedef kalorinle ({hedef_kalori} kcal) tutarlı.",
    "Hedef kalorin ile planda hesaplanan toplam kalori arasında önemli bir fark yok, bu olumlu.",
    "Makro dağılımın (protein, karbonhidrat, yağ) hedeflerinle uyumlu şekilde dengelenmiş.",
    "Belirttiğin tercihlere (özellikle '{istek}') uygun öğünler seçilmiş, bu planın kişiselleştirildiğini gösteriyor.",
]

DIYET_UYUMLU_KAPANIS = [
    "Bu planı uygulayarak hedefine güvenle ilerleyebilirsin.", "Düzenli takip ile bu plan üzerinden istikrarlı bir ilerleme sağlayabilirsin.",
    "Su tüketimini ve öğün saatlerini düzenli tutman, planın etkisini artıracaktır.", "İstikrarlı uygulama, bu planın sana sağlayacağı faydayı en üst seviyeye çıkaracaktır.",
]

DIYET_CELISKI_ACILIS = [
    "Diyet planını inceledim, ancak bazı uyumsuzluklar tespit ettim.",
    "Planı kontrol ettim, beklentilerinle çelişen bir nokta var.",
    "Plan üzerinde bir değerlendirme yaptım, dikkat etmen gereken bir sorun bulundu.",
    "Diyet planını analiz ettim, bir tutarsızlık dikkatimi çekti.",
]

CELISKI_ACIKLAMA = {
    "vejetaryen": "Vejetaryen olduğunu belirtmene rağmen planda '{sorunlu_ogun}' gibi et içeren bir öğün yer alıyor",
    "yumurta_alerjisi": "Yumurta alerjin olmasına rağmen planda '{sorunlu_ogun}' gibi yumurta içeren bir öğün bulunuyor",
    "glutensiz": "Glutensiz beslenmek istemene rağmen planda '{sorunlu_ogun}' gibi gluten içeren bir öğün var",
    "deniz_urunu_sevmiyor": "Deniz ürünlerini sevmediğini belirtmene rağmen planda '{sorunlu_ogun}' gibi bir öğün öneriliyor",
    "kuruyemis_alerjisi": "Kuruyemiş alerjin olmasına rağmen planda '{sorunlu_ogun}' gibi kuruyemiş içeren bir öğün yer alıyor",
    "laktoz_intolerans": "Laktoz intoleransın olmasına rağmen planda '{sorunlu_ogun}' gibi süt ürünü ağırlıklı bir öğün bulunuyor",
    "kirmizi_et_yemiyor": "Kırmızı et yemediğini belirtmene rağmen planda '{sorunlu_ogun}' gibi kırmızı etli bir öğün var",
    "hafif_ogun_istegi": "Hafif öğle yemeği istemene rağmen planda '{sorunlu_ogun}' gibi ağır bir öğün öneriliyor",
}

CELISKI_DUZELTME = {
    "vejetaryen": "Bu öğünü bitkisel protein kaynaklı bir alternatifle (mercimek, nohut gibi) değiştirmeni öneririm.",
    "yumurta_alerjisi": "Bu öğünü yumurta içermeyen bir kahvaltı seçeneğiyle değiştirmen sağlığın açısından önemli.",
    "glutensiz": "Bu öğünü pirinç veya glutensiz tahıl bazlı bir alternatifle değiştirmelisin.",
    "deniz_urunu_sevmiyor": "Bu öğün yerine tavuk veya kırmızı et bazlı bir protein kaynağı tercih edebilirsin.",
    "kuruyemis_alerjisi": "Bu öğünü kuruyemiş içermeyen bir alternatifle değiştirmen alerjik reaksiyon riski açısından önemli.",
    "laktoz_intolerans": "Bu öğünü laktozsuz süt ürünleri veya bitkisel alternatiflerle değiştirebilirsin.",
    "kirmizi_et_yemiyor": "Bu öğün yerine tavuk veya bitkisel protein kaynaklı bir alternatif tercih edilmeli.",
    "hafif_ogun_istegi": "Bu öğünü daha hafif, sebze ağırlıklı bir seçenekle değiştirmeni öneririm.",
}

DIYET_KALORI_UYUMSUZ_CUMLELER = [
    "Ayrıca hedef kalorin ({hedef_kalori} kcal) ile planın toplam kalorisi ({plan_kalori} kcal) arasında dikkat çekici bir fark var, bu da hedeflerine ulaşmanı yavaşlatabilir.",
    "Bunun yanında, planın kalori değeri hedeflediğin kaloriden belirgin şekilde sapıyor, bu durum gözden geçirilmeli.",
]


def gercek_ogun_listesi_olustur(istek_tipi, celiski_var):
    if celiski_var and istek_tipi in ISTEK_ALERJI_MAP:
        yasak_kategori = ISTEK_ALERJI_MAP[istek_tipi]["yasak_kategori"]
        sorunlu_ogun = random.choice(OGUN_HAVUZU[yasak_kategori])
        diger_kategoriler = [k for k in OGUN_HAVUZU if k != yasak_kategori]
        normal_ogunler = random.sample(diger_kategoriler, 2)
        ogun_listesi = [sorunlu_ogun] + [random.choice(OGUN_HAVUZU[k]) for k in normal_ogunler]
        random.shuffle(ogun_listesi)
        return ogun_listesi, sorunlu_ogun
    else:
        uygun_kategoriler = list(OGUN_HAVUZU.keys())
        if istek_tipi in ISTEK_ALERJI_MAP:
            yasak_kategori = ISTEK_ALERJI_MAP[istek_tipi]["yasak_kategori"]
            uygun_kategoriler = [k for k in uygun_kategoriler if k != yasak_kategori]
        secilen_kategoriler = random.sample(uygun_kategoriler, 3)
        ogun_listesi = [random.choice(OGUN_HAVUZU[k]) for k in secilen_kategoriler]
        return ogun_listesi, None


def diyet_ornek_uret():
    bmi_kategori = random.choice(BMI_KATEGORILER)
    alt, ust = BMI_ARALIKLARI[bmi_kategori]
    bmi = round(random.uniform(alt, ust), 1)
    hedef = random.choice(HEDEFLER)
    hedef_kalori = random.randint(1400, 3200)
    hedef_protein = random.randint(80, 220)
    hedef_karbonhidrat = random.randint(120, 350)
    hedef_yag = random.randint(40, 110)

    celiski_olustur = random.random() < 0.425

    if celiski_olustur:
        celiski_tipi = random.choice(list(ISTEK_ALERJI_MAP.keys()))
        istek = celiski_tipi
        celiski_bilgi = ISTEK_ALERJI_MAP[celiski_tipi]
        ogun_listesi, sorunlu_ogun = gercek_ogun_listesi_olustur(istek, celiski_var=True)

        kalori_uyumsuz = random.random() < 0.4
        if kalori_uyumsuz:
            plan_kalori = hedef_kalori + random.choice([-600, -500, 500, 600, 700])
        else:
            plan_kalori = hedef_kalori + random.randint(-50, 50)

        plan_protein = hedef_protein + random.randint(-15, 15)
        plan_karbonhidrat = hedef_karbonhidrat + random.randint(-20, 20)
        plan_yag = hedef_yag + random.randint(-10, 10)

    else:
        istek = random.choice(ISTEK_NORMAL_LISTESI)
        ogun_listesi, sorunlu_ogun = gercek_ogun_listesi_olustur(istek, celiski_var=False)
        plan_kalori = hedef_kalori + random.randint(-80, 80)
        plan_protein = hedef_protein + random.randint(-10, 10)
        plan_karbonhidrat = hedef_karbonhidrat + random.randint(-15, 15)
        plan_yag = hedef_yag + random.randint(-8, 8)
        kalori_uyumsuz = False

    girdi = (
        f"Hedef: {hedef}, BMI: {bmi} ({bmi_kategori}), "
        f"Hedef Kalori: {hedef_kalori} kcal, Hedef Protein: {hedef_protein} g, Hedef Karbonhidrat: {hedef_karbonhidrat} g, Hedef Yag: {hedef_yag} g, "
        f"Kullanici Istegi: {istek}, "
        f"Plan Ogunleri: {', '.join(ogun_listesi)}, "
        f"Plan Toplam Kalori: {plan_kalori} kcal, Plan Protein: {plan_protein} g, Plan Karbonhidrat: {plan_karbonhidrat} g, Plan Yag: {plan_yag} g"
    )

    hedef_aciklama = HEDEF_AÇIKLAMA[hedef]

    if celiski_olustur:
        tip = celiski_bilgi["tip"]
        cumleler = [random.choice(DIYET_CELISKI_ACILIS)]
        cumleler.append(CELISKI_ACIKLAMA[tip].format(sorunlu_ogun=sorunlu_ogun) + ".")
        if kalori_uyumsuz:
            cumleler.append(random.choice(DIYET_KALORI_UYUMSUZ_CUMLELER).format(hedef_kalori=hedef_kalori, plan_kalori=plan_kalori))
        cumleler.append(CELISKI_DUZELTME[tip])
        cikti = " ".join(cumleler)
    else:
        cumleler = [random.choice(DIYET_ACILIS_UYUMLU).format(hedef_aciklama=hedef_aciklama)]
        secilen_devam = random.choice(DIYET_UYUMLU_DEVAM)
        cumleler.append(secilen_devam.format(
            bmi_kategori=bmi_kategori.lower(), plan_kalori=plan_kalori, hedef_kalori=hedef_kalori, istek=istek,
        ))
        cumleler.append(random.choice(DIYET_UYUMLU_KAPANIS))
        cikti = " ".join(cumleler)

    return {
        "instruction": "Asagidaki diyet plani bilgilerine, kullanicinin tercihlerine ve gercek plan icerigine gore kisa, kisisellestirilmis ve Turkce bir AI analizi yaz. Plan ile kullanici bilgileri arasinda celiski varsa belirt ve duzeltme onerisi sun.",
        "input": girdi,
        "output": cikti,
    }



GECMIS_HAREKETLER = ["squat", "deadlift", "biceps_curl"]

TREND_SENARYOLARI = [
    "duzenli_yukselme", "duzenli_dusus", "ani_dusus_son", "agirlik_artarken_form_bozuluyor",
    "agirlik_sabit_form_gelisiyor", "agirlik_dustu_form_duzeldi", "bir_kategori_gelisirken_digeri_geriliyor",
    "uzun_sureli_plato", "ilk_tekrarlar_iyi_son_tekrarlar_kotu", "setler_ilerledikce_form_bozuluyor",
    "skor_artti_agirlik_dustu", "form_iyi_kontrollu_artis_onerisi",
]

GECMIS_ACILIS = [
    "Son {n} {hareket} antrenmanını inceledim, gelişim trendini birlikte değerlendirelim.",
    "{hareket_buyuk} hareketindeki geçmiş performansını analiz ettim.",
    "Antrenman geçmişini gözden geçirdim, {hareket} hareketindeki değişimi inceleyelim.",
    "Son {n} antrenmandaki {hareket} verilerini karşılaştırdım.",
]


def trend_skor_dizisi_uret(senaryo, n):
    if senaryo == "duzenli_yukselme":
        baslangic = random.randint(40, 55)
        artis = random.randint(2, 5)
        return [min(100, baslangic + i * artis + random.randint(-3, 3)) for i in range(n)]
    elif senaryo == "duzenli_dusus":
        baslangic = random.randint(70, 90)
        dusus = random.randint(2, 5)
        return [max(15, baslangic - i * dusus + random.randint(-3, 3)) for i in range(n)]
    elif senaryo == "ani_dusus_son":
        baslangic = random.randint(70, 85)
        skorlar = [baslangic + random.randint(-3, 3) for _ in range(n - 1)]
        skorlar.append(max(15, baslangic - random.randint(25, 40)))
        return skorlar
    elif senaryo == "uzun_sureli_plato":
        sabit = random.randint(55, 75)
        return [sabit + random.randint(-4, 4) for _ in range(n)]
    else:
        baslangic = random.randint(45, 75)
        return [max(15, min(100, baslangic + random.randint(-10, 10))) for _ in range(n)]


def trend_agirlik_dizisi_uret(senaryo, n):
    baslangic = random.choice([20, 30, 40, 50, 60, 80])
    if senaryo == "agirlik_artarken_form_bozuluyor":
        return [baslangic + i * random.choice([2.5, 5]) for i in range(n)]
    elif senaryo == "agirlik_sabit_form_gelisiyor":
        return [baslangic for _ in range(n)]
    elif senaryo == "agirlik_dustu_form_duzeldi":
        return [baslangic - i * random.choice([2.5, 5]) if i < n // 2 else baslangic - (n // 2) * random.choice([2.5, 5]) for i in range(n)]
    elif senaryo == "skor_artti_agirlik_dustu":
        return [max(5, baslangic - i * 2.5) for i in range(n)]
    else:
        return [baslangic + random.choice([-5, 0, 2.5, 5]) * i for i in range(n)]


GECMIS_YORUM_SABLONLARI = {
    "duzenli_yukselme": [
        "Son {n} {hareket} antrenmanında genel form skorun {ilk}'den {son}'e yükseldi, bu istikrarlı bir gelişim gösteriyor.",
        "{hareket_buyuk} performansında {ilk} puandan {son} puana net bir yükseliş var, antrenman programın işe yarıyor.",
    ],
    "duzenli_dusus": [
        "Son {n} {hareket} antrenmanında skorun {ilk}'den {son}'e gerilemiş, bu durumun nedenini araştırman faydalı olur.",
        "{hareket_buyuk} formunda {ilk} puandan {son} puana düzenli bir düşüş gözlemleniyor, dinlenme ve beslenmeni gözden geçir.",
    ],
    "ani_dusus_son": [
        "Önceki antrenmanların istikrarlıyken son {hareket} oturumunda skorun {ilk} civarından {son}'e ani düştü, bu yorgunluk veya dikkat dağınıklığından kaynaklanabilir.",
        "Son {hareket} antrenmanında beklenmedik bir düşüş var ({son} puan), önceki performansının ({ilk} civarı) altında kaldın.",
    ],
    "agirlik_artarken_form_bozuluyor": [
        "Ağırlığı {ilk_agirlik}kg'dan {son_agirlik}kg'a çıkarırken form skorun düştü, bu da teknik kalitenin yük artışına yetişemediğini gösteriyor.",
        "{hareket_buyuk} hareketinde ağırlık artışıyla birlikte formun bozulduğu görülüyor, mevcut yükte tekniği sağlamlaştırmadan ilerlememeni öneririm.",
    ],
    "agirlik_sabit_form_gelisiyor": [
        "Ağırlığı {ilk_agirlik}kg'da sabit tutarken form skorun belirgin şekilde gelişti, bu teknik açıdan olgunlaştığını gösteriyor.",
        "Aynı ağırlıkla çalışmaya devam ederken formunun iyileşmesi, artık ağırlık artışına hazır olabileceğini gösteriyor.",
    ],
    "agirlik_dustu_form_duzeldi": [
        "Ağırlığı {ilk_agirlik}kg'dan {son_agirlik}kg'a düşürdükten sonra formunun belirgin şekilde düzeldiği görülüyor, bu doğru bir karar olmuş.",
        "Yükü hafifletmen form kalitende olumlu bir etki yaratmış, tekniği pekiştirdikten sonra kademeli artışa geçebilirsin.",
    ],
    "bir_kategori_gelisirken_digeri_geriliyor": [
        "{iyi_kategori} kategorisinde düzenli gelişim görülürken {kotu_kategori} kategorisi son antrenmanlarda geriledi.",
        "{iyi_kategori} alanında ilerleme kaydederken {kotu_kategori} konusunda bir gerileme dikkat çekiyor, bu alana öncelik vermelisin.",
    ],
    "uzun_sureli_plato": [
        "Son {n} antrenmanda {hareket} skorun {sabit} civarında sabit kaldı, bu bir plato dönemine işaret ediyor.",
        "{hareket_buyuk} performansında uzun süredir belirgin bir ilerleme yok, programında bir değişikliğe ihtiyaç olabilir.",
    ],
    "ilk_tekrarlar_iyi_son_tekrarlar_kotu": [
        "Set içindeki ilk tekrarların form kalitesi yüksekken, son tekrarlarda yorgunluk nedeniyle form bozuluyor.",
        "{hareket_buyuk} setlerinde başlangıç formun iyi olsa da, ilerleyen tekrarlarda kas yorgunluğu form kalitesini düşürüyor.",
    ],
    "setler_ilerledikce_form_bozuluyor": [
        "İlk setlerde form kaliten yüksekken, sonraki setlerde belirgin bir düşüş gözlemleniyor, bu dayanıklılık eksikliğine işaret edebilir.",
        "Set sayısı arttıkça form skorun düşme eğiliminde, dinlenme sürelerini gözden geçirmen faydalı olabilir.",
    ],
    "skor_artti_agirlik_dustu": [
        "İlginç bir şekilde ağırlığı düşürmene rağmen form skorun yükseldi, bu tekniğe odaklanmanın meyvesini verdiğini gösteriyor.",
        "Daha hafif ağırlıkla çalışırken form kaliten arttı, bu stratejinin işe yaradığını gösteriyor.",
    ],
    "form_iyi_kontrollu_artis_onerisi": [
        "Form kaliten son antrenmanlarda tutarlı ve yüksek seviyede, kontrollü bir ağırlık artışı için uygun bir zaman olabilir.",
        "İstikrarlı ve iyi form gösteriyorsun, küçük adımlarla ağırlık artışına geçmeyi değerlendirebilirsin.",
    ],
}

GECMIS_KAPANIS_GENEL = [
    "Bu gözlemlere göre bir sonraki antrenmanında belirtilen noktalara dikkat etmen faydalı olacaktır.",
    "Bu trendi takip etmeye devam ederek programını buna göre ayarlayabilirsin.",
    "Bu analiz, bir sonraki antrenman planını şekillendirmen için iyi bir referans olabilir.",
    "Gelişimini bu şekilde takip etmeye devam etmen, uzun vadeli ilerlemeni netleştirecektir.",
]


def gecmis_analizi_ornek_uret():
    hareket = random.choice(GECMIS_HAREKETLER)
    hareket_adi = HAREKET_ADI_TURKCE[hareket]
    n = random.randint(5, 30)
    senaryo = random.choice(TREND_SENARYOLARI)

    skorlar = trend_skor_dizisi_uret(senaryo, n)
    agirliklar = trend_agirlik_dizisi_uret(senaryo, n)

    tekrar_sayisi = random.choice([6, 8, 10, 12])
    set_sayisi = random.choice([3, 4, 5])

    tarihler = [f"Antrenman {i+1}" for i in range(n)]

    girdi_satirlari = []
    for i in range(n):
        girdi_satirlari.append(
            f"{tarihler[i]}: Skor {skorlar[i]}, Agirlik {agirliklar[i]}kg, {set_sayisi}x{tekrar_sayisi}"
        )
    girdi = f"Hareket: {hareket_adi.capitalize()}, Son {n} antrenman: " + " | ".join(girdi_satirlari)

    acilis = random.choice(GECMIS_ACILIS).format(n=n, hareket=hareket_adi, hareket_buyuk=hareket_adi.capitalize())

    if senaryo == "bir_kategori_gelisirken_digeri_geriliyor":
        kategoriler = HAREKET_KATEGORILERI[hareket]
        iyi_kat, kotu_kat = random.sample(kategoriler, 2)
        yorum = random.choice(GECMIS_YORUM_SABLONLARI[senaryo]).format(iyi_kategori=iyi_kat, kotu_kategori=kotu_kat)
    elif senaryo in ("agirlik_artarken_form_bozuluyor", "agirlik_sabit_form_gelisiyor", "agirlik_dustu_form_duzeldi"):
        yorum = random.choice(GECMIS_YORUM_SABLONLARI[senaryo]).format(
            hareket_buyuk=hareket_adi.capitalize(),
            ilk_agirlik=agirliklar[0], son_agirlik=agirliklar[-1],
        )
    elif senaryo == "uzun_sureli_plato":
        yorum = random.choice(GECMIS_YORUM_SABLONLARI[senaryo]).format(
            n=n, hareket=hareket_adi, hareket_buyuk=hareket_adi.capitalize(), sabit=round(sum(skorlar) / len(skorlar)),
        )
    else:
        yorum = random.choice(GECMIS_YORUM_SABLONLARI[senaryo]).format(
            n=n, hareket=hareket_adi, hareket_buyuk=hareket_adi.capitalize(),
            ilk=skorlar[0], son=skorlar[-1],
        )

    kapanis = random.choice(GECMIS_KAPANIS_GENEL)
    cikti = f"{acilis} {yorum} {kapanis}"

    return {
        "instruction": "Asagidaki gecmis antrenman verilerini (skor, agirlik, tekrar/set degisimi) analiz ederek kullaniciya sayisal degisimi belirten, kisa ve yapici bir Turkce gelisim analizi yaz.",
        "input": girdi,
        "output": cikti,
    }


def main():
    ornekler = []
    senaryo_sayaci = {}

    ANTRENOR_SAYISI = 4000
    DIYET_SAYISI = 4000
    GECMIS_SAYISI = 4000

    for _ in range(ANTRENOR_SAYISI):
        ornek = antrenor_ornek_uret()
        ornekler.append(ornek)
        hareket = ornek["input"].split(",")[0].replace("Hareket: ", "").strip().lower()
        senaryo_sayaci[f"antrenor_{hareket}"] = senaryo_sayaci.get(f"antrenor_{hareket}", 0) + 1

    diyet_uyumlu_sayisi = 0
    diyet_celiski_sayisi = 0
    for _ in range(DIYET_SAYISI):
        ornek = diyet_ornek_uret()
        ornekler.append(ornek)
        if "uyumsuz" in ornek["output"].lower() or "çelişen" in ornek["output"].lower() or "rağmen" in ornek["output"].lower():
            diyet_celiski_sayisi += 1
        else:
            diyet_uyumlu_sayisi += 1

    for _ in range(GECMIS_SAYISI):
        ornek = gecmis_analizi_ornek_uret()
        ornekler.append(ornek)

    random.shuffle(ornekler)

    with open("egitim_verisi.jsonl", "w", encoding="utf-8") as dosya:
        for ornek in ornekler:
            dosya.write(json.dumps(ornek, ensure_ascii=False) + "\n")

    print(f"Toplam ornek sayisi: {len(ornekler)}")
    print(f"Antrenor geri bildirimi: {ANTRENOR_SAYISI}")
    for hareket_adi, sayi in senaryo_sayaci.items():
        print(f"  - {hareket_adi}: {sayi}")
    print(f"Diyet analizi: {DIYET_SAYISI} (yaklasik uyumlu: {diyet_uyumlu_sayisi}, celiskili: {diyet_celiski_sayisi})")
    print(f"Gecmis trend analizi: {GECMIS_SAYISI}")
    print("Dosya kaydedildi: egitim_verisi.jsonl")


if __name__ == "__main__":
    main()