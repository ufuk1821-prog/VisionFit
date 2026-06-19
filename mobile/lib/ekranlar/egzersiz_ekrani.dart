import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../tema.dart';

const Map<String, String> kasGruplari = {
  'ust_gogus': 'Üst Göğüs', 'alt_gogus': 'Alt Göğüs', 'sirt_kanat': 'Sırt (Kanat)',
  'trapez': 'Trapez', 'alt_sirt': 'Alt Sırt', 'on_omuz': 'Ön Omuz', 'yan_omuz': 'Yan Omuz',
  'arka_omuz': 'Arka Omuz', 'biceps': 'Biceps', 'triceps': 'Triceps', 'on_kol': 'Ön Kol',
  'core': 'Karın (Core)', 'quadriceps': 'Ön Bacak', 'hamstring': 'Arka Bacak',
  'kalca': 'Kalça', 'baldir': 'Baldır',
};

const Map<String, List<Map<String, String>>> egzersizler = {
  'ust_gogus': [
    {'ad': 'Eğimli Barbell Bench Press', 'kisa': 'EMG çalışmalarında üst göğüs lifinde en yüksek aktivasyonu gösteren temel hareket.', 'detay': 'Bench açısı 30-45 derece arasında ayarlanır. Bar omuz genişliğinden biraz fazla tutuşla kavranır, göğsün üst kısmına kontrollü şekilde indirilir, sonra patlayıcı olmadan itilir.', 'ipucu': 'Açıyı 45 dereceden fazla yapma, omuz devreye girer ve göğüs aktivasyonu azalır.'},
    {'ad': 'Eğimli Dumbbell Press', 'kisa': 'Sabit bara göre hareket genişliği daha fazla, eklem stresi daha düşük.', 'detay': 'Dumbbellar göğüs hizasında tutulur, bench 30-45 derece eğimli. Yukarıda birbirine yakınlaşırlar ancak temas etmezler, alt noktada göğüste hafif gerilme hissedilir.', 'ipucu': 'Üst noktada dumbbelları birbirine vurma, gerilimi kaybedersin.'},
    {'ad': 'Eğimli Kablo Fly', 'kisa': 'İzolasyon hareketi, sabit kablo direnci ile üst göğüs liflerini hedefler.', 'detay': 'Kablo makaraları en alt seviyeye ayarlanır. Eller aşağıdan yukarı kavis çizerek göğüs hizasında birleştirilir, dirsekler hafif bükülü kalır.', 'ipucu': 'Hareketin sonunda 1 saniye sıkma yap, kasın gerilim süresini artırır.'},
    {'ad': 'Smith Machine Eğimli Press', 'kisa': 'Sabit bar yolu sayesinde form hatası riski az, izolasyon yüksek.', 'detay': 'Smith machinede bench 30-45 derece eğimli. Sabit yol dengeyi kaldırarak göğüse odaklanmayı sağlar, özellikle yeni başlayanlar için güvenli.', 'ipucu': 'Bilek pozisyonunu nötr tut, aşırı bükme bilek ağrısına yol açar.'},
    {'ad': 'Eğimli Push-up (Ayaklar Yüksekte)', 'kisa': 'Ekipmansız, vücut ağırlığıyla üst göğüs aktivasyonu sağlayan alternatif.', 'detay': 'Ayaklar yükseltilmiş bir zemine konur, eller omuz genişliğinde yere yerleştirilir. Göğüs yere yaklaşana kadar kontrollü inilir.', 'ipucu': 'Kalçanın çökmesine izin verme, vücut tek hat halinde kalmalı.'},
  ],
  'alt_gogus': [
    {'ad': 'Negatif Eğimli Bench Press', 'kisa': 'Alt göğüs liflerinde en yüksek aktivasyonu sağlayan temel hareket.', 'detay': 'Bench 15-30 derece negatif eğimli, ayaklar üstüne kilitlenir. Bar göğsün alt kısmına indirilir ve düz bir yörüngede itilir.', 'ipucu': 'Ayakları sabitle, omurga pozisyonunu koru, aşırı negatif açı omuz riski yaratır.'},
    {'ad': 'Dips (Göğüs Eğilimli)', 'kisa': 'Vücut ağırlığıyla alt göğüs ve ön omuz için yüksek etkili bileşik hareket.', 'detay': 'Paralel barlarda gövde öne eğik tutularak dirsekler bükülerek inilir, göğüste gerilme hissedilince yukarı itilir.', 'ipucu': 'Gövdeyi ne kadar öne yatırırsan göğüs o kadar devreye girer, dik durursan triceps ağırlıklı çalışır.'},
    {'ad': 'Yukarıdan Aşağı Kablo Fly', 'kisa': 'Sabit direnç eğrisiyle alt göğüs şekillendirme hareketi.', 'detay': 'Kablo makaraları en üst seviyeye ayarlanır. Eller karın hizasının önünde birleştirilir, hareket boyunca dirsek hafif bükülü kalır.', 'ipucu': 'Omuzları yukarı kaldırma, hareketi sadece göğüsten yönlendir.'},
    {'ad': 'Decline Dumbbell Press', 'kisa': 'Dumbbell ile alt göğüs izolasyonu, hareket genişliği fazla.', 'detay': 'Negatif eğimli bench üzerinde dumbbellar göğüs hizasından yukarı itilir, üstte hafif yakınlaşma yapılır.', 'ipucu': 'Bilekleri nötr tut, aşırı içe dönüş omuz eklemine yük bindirir.'},
    {'ad': 'Düz Push-up (Eller Geniş)', 'kisa': 'Ekipmansız alt-orta göğüs aktivasyonu için etkili varyasyon.', 'detay': 'Eller omuz genişliğinden biraz daha geniş yerleştirilir, gövde düz tutularak göğüs yere yaklaştırılır.', 'ipucu': 'Dirsekleri tamamen kilitleme, kasta sürekli gerilim kalsın.'},
  ],
  'sirt_kanat': [
    {'ad': 'Barfiks (Pull-Up)', 'kisa': 'Lat kaslarının gelişimi için literatürde en etkili kabul edilen temel hareket.', 'detay': 'Geniş tutuşla bar tutulur, göğüs bara doğru yükseltilir, kontrollü şekilde başlangıç pozisyonuna inilir.', 'ipucu': 'Çekişi dirseklerle yönlendir, sadece kol gücüyle çekme lat aktivasyonunu azaltır.'},
    {'ad': 'Lat Pulldown', 'kisa': 'Barfiks alternatifi, ağırlık kontrolü kolay olduğu için kademeli yüklenmeye uygun.', 'detay': 'Geniş tutuşla bar kavranır, gövde hafifçe geriye yaslanır, bar göğüs üst kısmına doğru çekilir.', 'ipucu': 'Vücudu fazla geriye yatırma, omuz ve trapez devreye girer.'},
    {'ad': 'Barbell Row (Eğilerek Çekiş)', 'kisa': 'Sırt kalınlığı için en yüksek yük taşıyan bileşik hareket.', 'detay': 'Gövde kalçadan öne eğilerek bel düz tutulur, bar karın altına doğru çekilir, kürek kemikleri sıkılır.', 'ipucu': 'Belin yuvarlanmasına izin verme, hareketi sırtla değil belle yapma.'},
    {'ad': 'Tek Kol Dumbbell Row', 'kisa': 'Tek taraflı çalışma sayesinde sırt asimetrilerini düzeltmeye yardımcı olur.', 'detay': 'Bir diz ve el bench üzerine yerleştirilir, diğer elde dumbbell kalça hizasına doğru çekilir.', 'ipucu': 'Gövdeyi rotasyona sokma, hareket sadece kol ve sırttan gelmeli.'},
    {'ad': 'Seated Cable Row', 'kisa': 'Sabit pozisyonda orta sırt kalınlığı için güvenli izolasyon hareketi.', 'detay': 'Oturarak kablo karın hizasına doğru çekilir, kürek kemikleri hareketin sonunda sıkıştırılır.', 'ipucu': 'Gövdeyi öne arkaya sallama, hareketi kollarla ve sırtla kontrol et.'},
  ],
  'trapez': [
    {'ad': 'Barbell Shrug', 'kisa': 'Trapez için en yüksek yük taşınabilen temel izolasyon hareketi.', 'detay': 'Bar bacakların önünde tutulur, omuzlar kulaklara doğru dikey olarak kaldırılır, üstte kısa süre tutulur.', 'ipucu': 'Üstte 1 saniye sık, omuzları döndürme sadece dikey hareket et.'},
    {'ad': 'Dumbbell Shrug', 'kisa': 'Simetrik trapez gelişimi sağlayan, bağımsız kol hareketine izin veren varyasyon.', 'detay': 'Dumbbellar vücudun yanında tutulur, omuzlar yukarı kaldırılır, kontrollü şekilde indirilir.', 'ipucu': 'Sadece dikey hareket yap, öne arkaya sallama momentum kullanmana sebep olur.'},
    {'ad': 'Face Pull', 'kisa': 'Üst trapez ve arka omuzu birlikte çalıştıran duruş düzeltici hareket.', 'detay': 'Kablo yüz hizasından ip aparatıyla çekilir, dirsekler dışa açılır, kürek kemikleri sıkılır.', 'ipucu': 'Kürek kemiklerini sık, hareketi sadece kollarla yapma.'},
    {'ad': 'Behind the Back Shrug', 'kisa': 'Bar arkada tutularak üst trapez liflerine farklı açıdan yüklenme sağlar.', 'detay': 'Bar kalça arkasında tutulur, omuzlar dikey olarak kaldırılır ve kontrollü indirilir.', 'ipucu': 'Bel bölgesini aşırı kavislendirme, duruşu dik tut.'},
    {'ad': 'Farmer\'s Walk', 'kisa': 'Fonksiyonel trapez ve kor stabilitesi geliştiren yürüyüş hareketi.', 'detay': 'Ağır dumbbell veya kettlebell her iki elde tutularak dik duruşla belirli mesafe yürünür.', 'ipucu': 'Omuzları çökertme, dik ve gergin tut, adımları kontrollü at.'},
  ],
  'alt_sirt': [
    {'ad': 'Deadlift', 'kisa': 'Tüm arka zinciri (alt sırt, kalça, hamstring) aktive eden temel hareket.', 'detay': 'Ayaklar kalça genişliğinde, sırt düz tutularak bar yerden kalçaya kadar kaldırılır, kalça ve dizler eş zamanlı açılır.', 'ipucu': 'Beli asla yuvarlama, bar vücuda yakın seyretsin.'},
    {'ad': 'Romanian Deadlift', 'kisa': 'Hamstring ve alt sırt için en yüksek EMG aktivasyonunu gösteren varyasyon.', 'detay': 'Dizler hafif bükülü tutulur, bar bacak boyunca kontrollü şekilde indirilir, kalça geriye itilir.', 'ipucu': 'Hareketi kalçadan başlat, dizleri öne sürme.'},
    {'ad': 'Good Morning', 'kisa': 'Hamstring ve alt sırt için esneklik ve kuvvet geliştiren hareket.', 'detay': 'Bar omuzlarda sabitlenir, kalçadan öne eğilerek gövde yere paralel hale getirilir, sonra kalkılır.', 'ipucu': 'Beli düz tut, dizleri sadece hafif bük.'},
    {'ad': 'Back Extension', 'kisa': 'İzole alt sırt çalışması, omurga eklemlerine düşük yük bindirir.', 'detay': 'Hyperextension bench üzerinde gövde öne eğilir, alt sırt kasları kullanılarak yukarı kaldırılır.', 'ipucu': 'Aşırı geriye kavislenme, hareket sonunda vücut düz hat olmalı.'},
    {'ad': 'Superman', 'kisa': 'Ekipmansız, düşük riskli alt sırt aktivasyon hareketi.', 'detay': 'Yüzüstü yatarak kollar ve bacaklar aynı anda yerden kaldırılır, kısa süre tutulur.', 'ipucu': 'Boynu zorlama, bakışını yere doğru sabit tut.'},
  ],
  'on_omuz': [
    {'ad': 'Barbell Overhead Press', 'kisa': 'Ön omuz için en yüksek yük taşınan temel bileşik hareket.', 'detay': 'Bar omuz genişliğinde tutulur, göğüs hizasından baş üstüne doğru dik bir hatta itilir.', 'ipucu': 'Beli aşırı kavislendirme, karın kaslarını sık.'},
    {'ad': 'Dumbbell Shoulder Press', 'kisa': 'Simetrik omuz gelişimi sağlayan, eklem dostu varyasyon.', 'detay': 'Dumbbellar kulak hizasında tutulur ve baş üstüne doğru itilir, üstte hafif yakınlaştırılır.', 'ipucu': 'Üst noktada kas sıkması yap, dirsekleri tam kilitleme.'},
    {'ad': 'Ön Kaldırma (Front Raise)', 'kisa': 'Ön omuz izolasyonu için en doğrudan hareket.', 'detay': 'Kollar düz tutularak ağırlık öne ve yukarı omuz hizasına kadar kaldırılır, kontrollü indirilir.', 'ipucu': 'Momentum kullanma, hareketi yavaş ve kontrollü yap.'},
    {'ad': 'Arnold Press', 'kisa': 'Ön ve yan omuzu birlikte çalıştıran rotasyonlu varyasyon.', 'detay': 'Dumbbellar avuç içi içe bakarak başlanır, yukarı itilirken dışa doğru döndürülür.', 'ipucu': 'Rotasyonu kontrollü yap, omuzda ani burkulmaya izin verme.'},
    {'ad': 'Landmine Press', 'kisa': 'Omuz eklemine düşük stres bindiren, açılı itme hareketi.', 'detay': 'Bar bir ucu sabitlenmiş şekilde diyagonal olarak omuz hizasından yukarı itilir.', 'ipucu': 'Gövdeyi sabit tut, sadece kol ve omuzdan it.'},
  ],
  'yan_omuz': [
    {'ad': 'Yan Kaldırma (Lateral Raise)', 'kisa': 'Omuz genişliği için literatürde en etkili izolasyon hareketi.', 'detay': 'Kollar hafif bükülü tutularak ağırlıklar yanlara, omuz hizasına kadar kaldırılır.', 'ipucu': 'Küçük parmağı hafif yukarı çevir, trapez yerine omuza odaklan.'},
    {'ad': 'Kablo Lateral Raise', 'kisa': 'Sabit direnç eğrisi sayesinde hareketin her noktasında gerilim sağlar.', 'detay': 'Tek kablo ile vücudun yanından çapraz çekilerek yana kaldırılır.', 'ipucu': 'Vücudu yana eğme, hareketi sadece omuzdan yap.'},
    {'ad': 'Cable Y-Raise', 'kisa': 'Yan ve ön omuz liflerini birlikte hedefleyen açılı hareket.', 'detay': 'Çift kablo ile kollar Y şeklinde diyagonal olarak yukarı kaldırılır.', 'ipucu': 'Omuzları kulaklara yaklaştırma, hareketi geniş bir yayda yap.'},
    {'ad': 'Leaning Lateral Raise', 'kisa': 'Vücut yana eğilerek omuz üzerindeki direnç açısı optimize edilir.', 'detay': 'Sabit bir noktaya tutunarak vücut yana eğilir, serbest elde tek kol lateral raise yapılır.', 'ipucu': 'Yavaş ve kontrollü kaldır, sallanma yapma.'},
    {'ad': 'Machine Lateral Raise', 'kisa': 'Sabit makine yolu ile form hatası riskini azaltan varyasyon.', 'detay': 'Makine kolları omuz hizasına ayarlanır, kollar yana doğru itilir.', 'ipucu': 'Sırtı koltuğa yasla, momentum kullanma.'},
  ],
  'arka_omuz': [
    {'ad': 'Bent-Over Lateral Raise', 'kisa': 'Arka omuz için en doğrudan ve etkili izolasyon hareketi.', 'detay': 'Gövde öne eğik tutulur, ağırlıklar yanlara ve hafif geriye doğru kaldırılır.', 'ipucu': 'Momentum kullanma, dirsekleri hafif bükülü tut.'},
    {'ad': 'Face Pull', 'kisa': 'Arka omuz ve dış rotasyon kaslarını birlikte çalıştıran fonksiyonel hareket.', 'detay': 'Kablo yüz hizasından çekilir, dirsekler dışa açılır, kürek kemikleri sıkılır.', 'ipucu': 'Dirsekleri omuz hizasının üzerinde tut.'},
    {'ad': 'Reverse Pec Deck', 'kisa': 'Sabit makine ile izole arka omuz çalışması.', 'detay': 'Makine kolları göğüs hizasında tutulur, kollar geriye doğru açılır, kürek kemikleri sıkılır.', 'ipucu': 'Hareketi geniş ve kontrollü yap, ani çekiş yapma.'},
    {'ad': 'Dumbbell Reverse Fly', 'kisa': 'Serbest ağırlıkla arka omuz ve üst sırt aktivasyonu.', 'detay': 'Gövde öne eğik, dumbbellar yere doğru sarkıtılır, kollar yana açılarak kaldırılır.', 'ipucu': 'Beli düz tut, hareketi sadece omuzdan yap.'},
    {'ad': 'Band Pull-Apart', 'kisa': 'Düşük yoğunluklu, ısınma ve duruş düzeltme için ideal hareket.', 'detay': 'Direnç bandı iki elle göğüs hizasında tutulur, kollar yanlara doğru açılarak band gerilir.', 'ipucu': 'Omuzları aşağıda tut, hareketi yavaş yap.'},
  ],
  'biceps': [
    {'ad': 'Barbell Curl', 'kisa': 'Biceps için en yüksek yük taşınabilen temel hareket.', 'detay': 'Bar omuz genişliğinde tutulur, dirsekler sabit kalarak bar yukarı kıvrılır, kontrollü indirilir.', 'ipucu': 'Dirsekleri sabit tut, gövdeyi sallayarak momentum yaratma.'},
    {'ad': 'Dumbbell Curl', 'kisa': 'Simetrik biceps gelişimi sağlayan, bilek rotasyonuna izin veren hareket.', 'detay': 'Tekli dumbbell ile kaldırırken bilek dışa döndürülür, üstte kas sıkılır.', 'ipucu': 'Üst noktada 1 saniye sık, ağırlığı düşürürken kontrolü kaybetme.'},
    {'ad': 'Hammer Curl', 'kisa': 'Biceps ile birlikte brachialis kasını da hedefleyen varyasyon.', 'detay': 'Avuç içi içe bakacak şekilde dumbbell kaldırılır, bilek rotasyonu yapılmaz.', 'ipucu': 'Yavaş ve kontrollü yap, dirsekleri vücuda yakın tut.'},
    {'ad': 'Incline Dumbbell Curl', 'kisa': 'Omuz gerisinde uzanan kol pozisyonuyla biceps uzun başını hedefler.', 'detay': 'Eğimli bench üzerinde sırtüstü yaslanılır, kollar tam aşağı sarkıtılarak curl yapılır.', 'ipucu': 'Omuzları öne itme, hareketi sadece dirsekten yap.'},
    {'ad': 'Preacher Curl', 'kisa': 'Sabit kol desteğiyle izole ve hile yapılamayan biceps hareketi.', 'detay': 'Preacher bench üzerinde kol sabitlenir, bar veya dumbbell kontrollü şekilde kıvrılır.', 'ipucu': 'Alt noktada dirseği tam kilitleme, gerilimi koru.'},
  ],
  'triceps': [
    {'ad': 'Close Grip Bench Press', 'kisa': 'Triceps için en yüksek yük taşınabilen bileşik hareket.', 'detay': 'Dar tutuşla (omuz genişliğinden dar) bench press yapılır, dirsekler vücuda yakın seyreder.', 'ipucu': 'Tutuş çok dar olmasın, bilek ağrısına yol açar.'},
    {'ad': 'Skull Crusher', 'kisa': 'Triceps uzun başı için yüksek aktivasyon sağlayan izolasyon hareketi.', 'detay': 'Sırtüstü yatarak bar veya dumbbell alın üzerine indirilir, dirsekler sabit kalır.', 'ipucu': 'Dirsekleri sabit tut, sadece ön kol hareket etmeli.'},
    {'ad': 'Triceps Pushdown', 'kisa': 'Kablo ile sabit dirençli, eklem dostu izolasyon hareketi.', 'detay': 'Yüksek makaradan bar veya ip aşağı itilir, dirsekler vücuda yakın sabit tutulur.', 'ipucu': 'Alt noktada tam sık, dirsekleri öne kaçırma.'},
    {'ad': 'Overhead Triceps Extension', 'kisa': 'Triceps uzun başını farklı açıdan hedefleyen germe pozisyonu.', 'detay': 'Dumbbell baş üzerinde iki elle tutulur, dirsekler bükülerek ağırlık başın arkasına indirilir.', 'ipucu': 'Dirsekleri dışa açma, sabit ve içeride tut.'},
    {'ad': 'Dips (Triceps Odaklı)', 'kisa': 'Vücut ağırlığıyla yüksek yoğunluklu triceps çalışması.', 'detay': 'Paralel barlarda gövde dik tutularak dirsekler bükülerek inilir ve itilerek çıkılır.', 'ipucu': 'Gövdeyi dik tut, öne eğilirsen göğüs devreye girer.'},
  ],
  'on_kol': [
    {'ad': 'Barbell Wrist Curl', 'kisa': 'Ön kol fleksör kasları için en doğrudan izolasyon hareketi.', 'detay': 'Oturarak bilekler dizlerin üzerine yerleştirilir, bar sadece bilekten kıvrılır.', 'ipucu': 'Hareketi küçük ve kontrollü yap, ön kolu sabit tut.'},
    {'ad': 'Reverse Curl', 'kisa': 'Brachioradialis ve ön kol üst kısmını hedefleyen varyasyon.', 'detay': 'Barbell üstten (pronated) tutuşla kıvrılır, dirsekler sabit kalır.', 'ipucu': 'Dirsekleri sabit tut, ağırlığı hafif tutarak teknik bozulmasın.'},
    {'ad': 'Farmer\'s Walk', 'kisa': 'İzometrik kavrama gücü ile ön kolu fonksiyonel olarak güçlendirir.', 'detay': 'Ağır dumbbell veya kettlebell elde sıkıca tutularak belirli mesafe yürünür.', 'ipucu': 'Kavrama gevşemeden önce bırakma, omuzları dik tut.'},
    {'ad': 'Reverse Wrist Curl', 'kisa': 'Ön kol ekstansör kaslarını hedefleyen tamamlayıcı hareket.', 'detay': 'Bilekler dizler üzerine yerleştirilir, bar alttan tutuşla yukarı kıvrılır.', 'ipucu': 'Hafif ağırlık kullan, bu kaslar küçük ve yorgunluğa hızlı girer.'},
    {'ad': 'Plate Pinch Hold', 'kisa': 'Statik kavrama kuvveti geliştiren izometrik egzersiz.', 'detay': 'İki ağırlık diski parmak uçlarıyla sıkıştırılarak belirli süre tutulur.', 'ipucu': 'Bilek nötr pozisyonda kalsın, sallamadan tut.'},
  ],
  'core': [
    {'ad': 'Plank', 'kisa': 'EMG çalışmalarında core stabilitesi için en güvenilir temel hareket.', 'detay': 'Dirsekler ve ayak parmakları üzerinde vücut baştan ayağa düz bir hatta tutulur, karın sıkı tutulur.', 'ipucu': 'Kalçayı ne yukarı ne aşağı bırak, düz hattı koru.'},
    {'ad': 'Crunch', 'kisa': 'Üst karın (rektus abdominis) kaslarını hedefleyen klasik hareket.', 'detay': 'Sırtüstü yatarak dizler bükülür, omuzlar yerden kaldırılarak karın sıkılır.', 'ipucu': 'Boynu zorlama, hareketi karından başlat.'},
    {'ad': 'Leg Raise', 'kisa': 'Alt karın kaslarını hedefleyen etkili izolasyon hareketi.', 'detay': 'Sırtüstü yatarak bacaklar düz tutulur ve yukarı kaldırılır, kontrollü indirilir.', 'ipucu': 'Beli yerden kaldırma, hareket boyunca bel zemine yapışık kalsın.'},
    {'ad': 'Russian Twist', 'kisa': 'Oblik (yan karın) kasları için rotasyonel hareket.', 'detay': 'Oturarak gövde hafif geriye yaslanır, ağırlıkla gövde iki yana kontrollü döndürülür.', 'ipucu': 'Omurgayı dik tut, sadece gövdeden dönme yap.'},
    {'ad': 'Hanging Leg Raise', 'kisa': 'Barda asılı pozisyonda tüm core bölgesini zorlayan ileri seviye hareket.', 'detay': 'Bara asılarak bacaklar düz veya bükülü şekilde kalça hizasına kadar kaldırılır.', 'ipucu': 'Sallanmayı önle, hareketi yavaş ve kontrollü yap.'},
  ],
  'quadriceps': [
    {'ad': 'Back Squat', 'kisa': 'Tüm alt vücut için altın standart kabul edilen temel bileşik hareket.', 'detay': 'Ayaklar omuz genişliğinde, bar üst sırtta tutularak kalça diz seviyesine kadar indirilir.', 'ipucu': 'Topuklar yerde kalmalı, dizler ayak ucu hizasını fazla geçmesin.'},
    {'ad': 'Leg Press', 'kisa': 'Quad odaklı, omurgaya yük bindirmeyen güvenli makine hareketi.', 'detay': 'Makine platformuna ayaklar omuz genişliğinde basılır, bacaklar bükülüp uzatılarak ağırlık itilir.', 'ipucu': 'Dizleri tam kilitleme, hareket sonunda hafif bükülü bırak.'},
    {'ad': 'Bulgarian Split Squat', 'kisa': 'Tek taraflı çalışma ile denge ve quad kuvvetini birlikte geliştirir.', 'detay': 'Arka ayak yükseltilmiş bir yüzeye konur, ön bacak öne eğilerek diz bükülür ve kalkılır.', 'ipucu': 'Ön diz ayak ucunu geçmesin, gövdeyi dik tut.'},
    {'ad': 'Front Squat', 'kisa': 'Bar ön omuzda taşınarak quad aktivasyonunu artıran varyasyon.', 'detay': 'Bar ön omuzlarda çapraz veya clean tutuşla tutulur, dik gövdeyle squat yapılır.', 'ipucu': 'Dirsekleri yukarıda tut, gövdenin öne düşmesine izin verme.'},
    {'ad': 'Leg Extension', 'kisa': 'Quad için izole, diğer kas gruplarını devre dışı bırakan hareket.', 'detay': 'Makine koltuğunda oturularak bacaklar dizden uzatılır, üstte kısa süre tutulur.', 'ipucu': 'Tam genişleme yap, hareketi hızlandırma.'},
  ],
  'hamstring': [
    {'ad': 'Romanian Deadlift', 'kisa': 'Hamstring için EMG çalışmalarında en etkili gösterilen hareket.', 'detay': 'Dizler hafif bükülü tutulur, kalça geriye itilerek gövde öne eğilir, bar bacak boyunca iner.', 'ipucu': 'Hareketi kalçadan başlat, beli yuvarlama.'},
    {'ad': 'Leg Curl', 'kisa': 'Hamstring için izole, makine destekli güvenli hareket.', 'detay': 'Yatarak veya oturarak bacaklar diz ekleminden bükülerek geriye doğru çekilir.', 'ipucu': 'Kalçayı kaldırma, hareketi sadece dizden yap.'},
    {'ad': 'Nordic Hamstring Curl', 'kisa': 'Eksantrik kuvvet ve sakatlık önlemede güçlü kanıta sahip hareket.', 'detay': 'Diz üstü pozisyonda ayaklar sabitlenir, gövde kontrollü şekilde öne doğru indirilir.', 'ipucu': 'İnişi olabildiğince yavaşlat, düşme anında ellerle dengeyi al.'},
    {'ad': 'Stiff-Leg Deadlift', 'kisa': 'Dizler düz tutularak hamstring esnekliği ve kuvvetini birlikte geliştirir.', 'detay': 'Dizler minimal bükülü tutulur, bar bacak önünden kontrollü şekilde indirilir.', 'ipucu': 'Sırtı düz tut, hareket sadece kalçadan gelsin.'},
    {'ad': 'Glute-Ham Raise', 'kisa': 'Hamstring ve kalçayı birlikte zorlayan ileri seviye hareket.', 'detay': 'GHR bench üzerinde ayaklar sabitlenir, gövde dizden öne ve geriye hareket ettirilir.', 'ipucu': 'Hareketi yavaş kontrol et, ani düşüşe izin verme.'},
  ],
  'kalca': [
    {'ad': 'Hip Thrust', 'kisa': 'Kalça (gluteus maximus) için EMG\'de en yüksek aktivasyonu gösteren hareket.', 'detay': 'Omuzlar bench üzerinde, bar kalça üzerinde tutularak kalça yukarı itilir.', 'ipucu': 'Üst noktada 1-2 saniye sık, beli aşırı kavislendirme.'},
    {'ad': 'Sumo Deadlift', 'kisa': 'Geniş duruş ile kalça ve iç bacak kaslarını öne çıkaran varyasyon.', 'detay': 'Geniş duruş, ayak parmakları dışa açık, bar bacaklar arasından kaldırılır.', 'ipucu': 'Kalçaları içe doğru it, dizleri ayak yönünde tut.'},
    {'ad': 'Glute Bridge', 'kisa': 'Ekipman gerektirmeyen, her seviyeye uygun kalça aktivasyon hareketi.', 'detay': 'Sırtüstü yatarak dizler bükülü, ayaklar yere basılı, kalça yukarı kaldırılır.', 'ipucu': 'Üst noktada kalçayı sık, beli zorlamadan hareket et.'},
    {'ad': 'Cable Kickback', 'kisa': 'İzole tek taraflı kalça çalışması için etkili hareket.', 'detay': 'Ayak bileğine bağlı kablo ile bacak geriye doğru itilir, kalça sıkılır.', 'ipucu': 'Belden destek alma, hareketi sadece kalçadan yap.'},
    {'ad': 'Bulgarian Split Squat', 'kisa': 'Tek taraflı çalışmayla kalça ve quad\'i birlikte güçlendirir.', 'detay': 'Arka ayak yükseltilmiş yüzeye konur, ön bacak öne eğilerek diz bükülür ve kalkılır.', 'ipucu': 'Ön dizi ayak ucunu geçirme, gövdeyi dik tut.'},
  ],
  'baldir': [
    {'ad': 'Standing Calf Raise', 'kisa': 'Gastrocnemius kası için temel ve en yaygın kullanılan hareket.', 'detay': 'Ayak parmakları yükseltide durarak ağırlıkla baldırlar yukarı kaldırılır, kontrollü indirilir.', 'ipucu': 'Topukları aşağı tam indir, hareketin tam genişliğini kullan.'},
    {'ad': 'Seated Calf Raise', 'kisa': 'Diz bükülü pozisyonda soleus kasına özel olarak odaklanır.', 'detay': 'Oturarak diz üzerinde ağırlıkla ayak parmakları yukarı kaldırılır.', 'ipucu': 'Diz açısını 90 derecede tut, hareketi yavaş yap.'},
    {'ad': 'Leg Press Calf Raise', 'kisa': 'Leg press makinesinde yüksek yükle baldır çalışması.', 'detay': 'Ayak parmakları platform kenarında, topuklar boşlukta tutularak bacaklar uzatılır ve baldır kaldırılır.', 'ipucu': 'Dizleri kilitleme, hareketi sadece ayak bileğinden yap.'},
    {'ad': 'Donkey Calf Raise', 'kisa': 'Gövde öne eğik pozisyonda gastrocnemius\'a farklı açıdan yüklenme sağlar.', 'detay': 'Gövde öne eğik tutulur, sırt üzerine ağırlık bindirilerek baldırlar kaldırılır.', 'ipucu': 'Dengeyi koru, hareketi kontrollü ve tam genişlikte yap.'},
    {'ad': 'Tek Bacak Calf Raise', 'kisa': 'Tek taraflı çalışma ile baldır asimetrilerini düzeltmeye yardımcı olur.', 'detay': 'Tek ayak üzerinde durularak basamak kenarında topuk aşağı indirilip yukarı kaldırılır.', 'ipucu': 'Dengeyi bir noktaya tutunarak sağla, hareketi yavaş yap.'},
  ],
};

const Map<String, String> _slugToKas = {
  'chest': 'ust_gogus', 'upper-back': 'sirt_kanat', 'trapezius': 'trapez',
  'lower-back': 'alt_sirt', 'front-deltoids': 'on_omuz', 'back-deltoids': 'arka_omuz',
  'biceps': 'biceps', 'triceps': 'triceps', 'forearm': 'on_kol', 'abs': 'core',
  'obliques': 'core', 'quadriceps': 'quadriceps', 'adductor': 'quadriceps',
  'hamstring': 'hamstring', 'gluteal': 'kalca', 'abductors': 'kalca',
  'abductor': 'kalca', 'calves': 'baldir', 'knees': 'baldir',
};

const Map<String, String> _kasToSlug = {
  'ust_gogus': 'chest', 'alt_gogus': 'chest', 'sirt_kanat': 'upper-back',
  'trapez': 'trapezius', 'alt_sirt': 'lower-back', 'on_omuz': 'front-deltoids',
  'yan_omuz': 'front-deltoids', 'arka_omuz': 'back-deltoids', 'biceps': 'biceps',
  'triceps': 'triceps', 'on_kol': 'forearm', 'core': 'abs', 'quadriceps': 'quadriceps',
  'hamstring': 'hamstring', 'kalca': 'gluteal', 'baldir': 'calves',
};

class EgzersizEkrani extends StatefulWidget {
  const EgzersizEkrani({super.key});
  @override
  State<EgzersizEkrani> createState() => _EgzersizEkraniState();
}

class _EgzersizEkraniState extends State<EgzersizEkrani> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _seciliGrup = 'ust_gogus';
  Map<String, String>? _seciliEgzersiz;
  bool _onGoster = true;
  WebViewController? _onWebController;
  WebViewController? _arkaWebController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _onWebController = _webControllerOlustur(true);
    _arkaWebController = _webControllerOlustur(false);
  }

  WebViewController _webControllerOlustur(bool on) {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel('Flutter', onMessageReceived: (msg) {
        final slug = msg.message;
        final kas = _slugToKas[slug];
        if (kas != null) setState(() { _seciliGrup = kas; });
      })
      ..loadHtmlString(_htmlOlustur(on));
    return controller;
  }

  String _htmlOlustur(bool on) {
    final onSvg = '''
<polygon points="51.8367347 41.6326531 51.0204082 55.1020408 57.9591837 57.9591837 67.755102 55.5102041 70.6122449 47.3469388 62.0408163 41.6326531" data-muscle="chest"/>
<polygon points="29.7959184 46.5306122 31.4285714 55.5102041 40.8163265 57.9591837 48.1632653 55.1020408 47.755102 42.0408163 37.5510204 42.0408163" data-muscle="chest"/>
<polygon points="68.5714286 63.2653061 67.3469388 57.1428571 58.7755102 59.5918367 60 64.0816327 60.4081633 83.2653061 65.7142857 78.7755102 66.5306122 69.7959184" data-muscle="obliques"/>
<polygon points="33.877551 78.3673469 33.0612245 71.8367347 31.0204082 63.2653061 32.244898 57.1428571 40.8163265 59.1836735 39.1836735 63.2653061 39.1836735 83.6734694" data-muscle="obliques"/>
<polygon points="56.3265306 59.1836735 57.9591837 64.0816327 58.3673469 77.9591837 58.3673469 92.6530612 56.3265306 98.3673469 55.1020408 104.081633 51.4285714 107.755102 51.0204082 84.4897959 50.6122449 67.3469388 51.0204082 57.1428571" data-muscle="abs"/>
<polygon points="43.6734694 58.7755102 48.5714286 57.1428571 48.9795918 67.3469388 48.5714286 84.4897959 48.1632653 107.346939 44.4897959 103.673469 40.8163265 91.4285714 40.8163265 78.3673469 41.2244898 64.4897959" data-muscle="abs"/>
<polygon points="16.7346939 68.1632653 17.9591837 71.4285714 22.8571429 66.122449 28.9795918 53.877551 27.755102 49.3877551 20.4081633 55.9183673" data-muscle="biceps"/>
<polygon points="71.4285714 49.3877551 70.2040816 54.6938776 76.3265306 66.122449 81.6326531 71.8367347 82.8571429 68.9795918 78.7755102 55.5102041" data-muscle="biceps"/>
<polygon points="69.3877551 55.5102041 69.3877551 61.6326531 75.9183673 72.6530612 77.5510204 70.2040816 75.5102041 67.3469388" data-muscle="triceps"/>
<polygon points="22.4489796 69.3877551 29.7959184 55.5102041 29.7959184 60.8163265 22.8571429 73.0612245" data-muscle="triceps"/>
<polygon points="55.5102041 23.6734694 50.6122449 33.4693878 50.6122449 39.1836735 61.6326531 40 70.6122449 44.8979592 69.3877551 36.7346939 63.2653061 35.1020408 58.3673469 30.6122449" data-muscle="neck"/>
<polygon points="28.9795918 44.8979592 30.2040816 37.1428571 36.3265306 35.1020408 41.2244898 30.2040816 44.4897959 24.4897959 48.9795918 33.877551 48.5714286 39.1836735 37.9591837 39.5918367" data-muscle="neck"/>
<polygon points="78.3673469 53.0612245 79.5918367 47.755102 79.1836735 41.2244898 75.9183673 37.9591837 71.0204082 36.3265306 72.244898 42.8571429 71.4285714 47.3469388" data-muscle="front-deltoids"/>
<polygon points="28.1632653 47.3469388 21.2244898 53.0612245 20 47.755102 20.4081633 40.8163265 24.4897959 37.1428571 28.5714286 37.1428571 26.9387755 43.2653061" data-muscle="front-deltoids"/>
<polygon points="42.4489796 2.85714286 40 11.8367347 42.0408163 19.5918367 46.122449 23.2653061 49.7959184 25.3061224 54.6938776 22.4489796 57.5510204 19.1836735 59.1836735 10.2040816 57.1428571 2.44897959 49.7959184 0" data-muscle="head"/>
<polygon points="52.6530612 110.204082 54.2857143 124.897959 60 110.204082 62.0408163 100 64.8979592 94.2857143 60 92.6530612 56.7346939 104.489796" data-muscle="abductors"/>
<polygon points="47.755102 110.612245 44.8979592 125.306122 42.0408163 115.918367 40.4081633 113.061224 39.5918367 107.346939 37.9591837 102.44898 34.6938776 93.877551 39.5918367 92.244898 41.6326531 99.1836735 43.6734694 105.306122" data-muscle="abductors"/>
<polygon points="34.6938776 98.7755102 37.1428571 108.163265 37.1428571 127.755102 34.2857143 137.142857 31.0204082 132.653061 29.3877551 120 28.1632653 111.428571 29.3877551 100.816327 32.244898 94.6938776" data-muscle="quadriceps"/>
<polygon points="63.2653061 105.714286 64.4897959 100 66.9387755 94.6938776 70.2040816 101.22449 71.0204082 111.836735 68.1632653 133.061224 65.3061224 137.55102 62.4489796 128.571429 62.0408163 111.428571" data-muscle="quadriceps"/>
<polygon points="38.7755102 129.387755 38.3673469 112.244898 41.2244898 118.367347 44.4897959 129.387755 42.8571429 135.102041 40 146.122449 36.3265306 146.530612 35.5102041 140" data-muscle="quadriceps"/>
<polygon points="59.5918367 145.714286 55.5102041 128.979592 60.8163265 113.877551 61.2244898 130.204082 64.0816327 139.591837 62.8571429 146.530612" data-muscle="quadriceps"/>
<polygon points="32.6530612 138.367347 26.5306122 145.714286 25.7142857 136.734694 25.7142857 127.346939 26.9387755 114.285714 29.3877551 133.469388" data-muscle="quadriceps"/>
<polygon points="71.8367347 113.061224 73.877551 124.081633 73.877551 140.408163 72.6530612 145.714286 66.5306122 138.367347 70.2040816 133.469388" data-muscle="quadriceps"/>
<polygon points="33.877551 140 34.6938776 143.265306 35.5102041 147.346939 36.3265306 151.020408 35.1020408 156.734694 29.7959184 156.734694 27.3469388 152.653061 27.3469388 147.346939 30.2040816 144.081633" data-muscle="knees"/>
<polygon points="65.7142857 140 72.244898 147.755102 72.244898 152.244898 69.7959184 157.142857 64.8979592 156.734694 62.8571429 151.020408" data-muscle="knees"/>
<polygon points="71.4285714 160.408163 73.4693878 153.469388 76.7346939 161.22449 79.5918367 167.755102 78.3673469 187.755102 79.5918367 195.510204 74.6938776 195.510204" data-muscle="calves"/>
<polygon points="24.8979592 194.693878 27.755102 164.897959 28.1632653 160.408163 26.122449 154.285714 24.8979592 157.55102 22.4489796 161.632653 20.8163265 167.755102 22.0408163 188.163265 20.8163265 195.510204" data-muscle="calves"/>
<polygon points="72.6530612 195.102041 69.7959184 159.183673 65.3061224 158.367347 64.0816327 162.44898 64.0816327 165.306122 65.7142857 177.142857" data-muscle="calves"/>
<polygon points="35.5102041 158.367347 35.9183673 162.44898 35.9183673 166.938776 35.1020408 172.244898 35.1020408 176.734694 32.244898 182.040816 30.6122449 187.346939 26.9387755 194.693878 27.3469388 187.755102 28.1632653 180.408163 28.5714286 175.510204 28.9795918 169.795918 29.7959184 164.081633 30.2040816 158.77551" data-muscle="calves"/>
<polygon points="6.12244898 88.5714286 10.2040816 75.1020408 14.6938776 70.2040816 16.3265306 74.2857143 19.1836735 73.4693878 4.48979592 97.5510204 0 100" data-muscle="forearm"/>
<polygon points="84.4897959 69.7959184 83.2653061 73.4693878 80 73.0612245 95.1020408 98.3673469 100 100.408163 93.4693878 89.3877551 89.7959184 76.3265306" data-muscle="forearm"/>
<polygon points="77.5510204 72.244898 77.5510204 77.5510204 80.4081633 84.0816327 85.3061224 89.7959184 92.244898 101.22449 94.6938776 99.5918367" data-muscle="forearm"/>
<polygon points="6.93877551 101.22449 13.4693878 90.6122449 18.7755102 84.0816327 21.6326531 77.1428571 21.2244898 71.8367347 4.89795918 98.7755102" data-muscle="forearm"/>
''';
    final arkaSvg = '''
<polygon points="50.6382979 0 45.9574468 0.85106383 40.8510638 5.53191489 40.4255319 12.7659574 45.106383 20 55.7446809 20 59.1489362 13.6170213 59.5744681 4.68085106 55.7446809 1.27659574" data-muscle="head"/>
<polygon points="44.6808511 21.7021277 47.6595745 21.7021277 47.2340426 38.2978723 47.6595745 64.6808511 38.2978723 53.1914894 35.3191489 40.8510638 31.0638298 36.5957447 39.1489362 33.1914894 43.8297872 27.2340426" data-muscle="trapezius"/>
<polygon points="52.3404255 21.7021277 55.7446809 21.7021277 56.5957447 27.2340426 60.8510638 32.7659574 68.9361702 36.5957447 64.6808511 40.4255319 61.7021277 53.1914894 52.3404255 64.6808511 53.1914894 38.2978723" data-muscle="trapezius"/>
<polygon points="29.3617021 37.0212766 22.9787234 39.1489362 17.4468085 44.2553191 18.2978723 53.6170213 24.2553191 49.3617021 27.2340426 46.3829787" data-muscle="back-deltoids"/>
<polygon points="71.0638298 37.0212766 78.2978723 39.5744681 82.5531915 44.6808511 81.7021277 53.6170213 74.893617 48.9361702 72.3404255 45.106383" data-muscle="back-deltoids"/>
<polygon points="31.0638298 38.7234043 28.0851064 48.9361702 28.5106383 55.3191489 34.0425532 75.3191489 47.2340426 71.0638298 47.2340426 66.3829787 36.5957447 54.0425532 33.6170213 41.2765957" data-muscle="upper-back"/>
<polygon points="68.9361702 38.7234043 71.9148936 49.3617021 71.4893617 56.1702128 65.9574468 75.3191489 52.7659574 71.0638298 52.7659574 66.3829787 63.4042553 54.4680851 66.3829787 41.7021277" data-muscle="upper-back"/>
<polygon points="26.8085106 49.787234 17.8723404 55.7446809 14.4680851 72.3404255 16.5957447 81.7021277 21.7021277 63.8297872 26.8085106 55.7446809" data-muscle="triceps"/>
<polygon points="73.6170213 50.212766 82.1276596 55.7446809 85.9574468 73.1914894 83.4042553 82.1276596 77.8723404 62.9787234 73.1914894 55.7446809" data-muscle="triceps"/>
<polygon points="26.8085106 58.2978723 26.8085106 68.5106383 22.9787234 75.3191489 19.1489362 77.4468085 22.5531915 65.5319149" data-muscle="triceps"/>
<polygon points="72.7659574 58.2978723 77.0212766 64.6808511 80.4255319 77.4468085 76.5957447 75.3191489 72.7659574 68.9361702" data-muscle="triceps"/>
<polygon points="47.6595745 72.7659574 34.4680851 77.0212766 35.3191489 83.4042553 49.3617021 102.12766 46.8085106 82.9787234" data-muscle="lower-back"/>
<polygon points="52.3404255 72.7659574 65.5319149 77.0212766 64.6808511 83.4042553 50.6382979 102.12766 53.1914894 83.8297872" data-muscle="lower-back"/>
<polygon points="86.3829787 75.7446809 91.0638298 83.4042553 93.1914894 94.0425532 100 106.382979 96.1702128 104.255319 88.0851064 89.3617021 84.2553191 83.8297872" data-muscle="forearm"/>
<polygon points="13.6170213 75.7446809 8.93617021 83.8297872 6.80851064 93.6170213 0 106.382979 3.82978723 104.255319 12.3404255 88.5106383 15.7446809 82.9787234" data-muscle="forearm"/>
<polygon points="81.2765957 79.5744681 77.4468085 77.8723404 79.1489362 84.6808511 91.0638298 103.829787 93.1914894 108.93617 94.4680851 104.680851" data-muscle="forearm"/>
<polygon points="18.7234043 79.5744681 22.1276596 77.8723404 20.8510638 84.2553191 9.36170213 102.978723 6.80851064 108.510638 5.10638298 104.680851" data-muscle="forearm"/>
<polygon points="44.6808511 99.5744681 30.212766 108.510638 29.787234 118.723404 31.4893617 125.957447 47.2340426 121.276596 49.3617021 114.893617" data-muscle="gluteal"/>
<polygon points="55.3191489 99.1489362 51.0638298 114.468085 52.3404255 120.851064 68.0851064 125.957447 69.787234 119.148936 69.3617021 108.510638" data-muscle="gluteal"/>
<polygon points="48.0851064 122.978723 44.6808511 122.978723 41.2765957 125.531915 45.106383 144.255319 48.5106383 135.744681 48.9361702 129.361702" data-muscle="abductor"/>
<polygon points="51.9148936 122.553191 55.7446809 123.404255 59.1489362 125.957447 54.893617 144.255319 51.9148936 136.170213 51.0638298 129.361702" data-muscle="abductor"/>
<polygon points="28.9361702 122.12766 31.0638298 129.361702 36.5957447 125.957447 35.3191489 135.319149 34.4680851 150.212766 29.3617021 158.297872 28.9361702 146.808511 27.6595745 141.276596 27.2340426 131.489362" data-muscle="hamstring"/>
<polygon points="71.4893617 121.702128 69.3617021 128.93617 63.8297872 125.957447 65.5319149 136.595745 66.3829787 150.212766 71.0638298 158.297872 71.4893617 147.659574 72.7659574 142.12766 73.6170213 131.914894" data-muscle="hamstring"/>
<polygon points="38.7234043 125.531915 44.2553191 145.957447 40.4255319 166.808511 36.1702128 152.765957 37.0212766 135.319149" data-muscle="hamstring"/>
<polygon points="61.7021277 125.531915 63.4042553 136.170213 64.2553191 153.191489 60 166.808511 56.1702128 146.382979" data-muscle="hamstring"/>
<polygon points="34.4680851 153.191489 31.0638298 159.148936 33.6170213 166.382979 37.4468085 162.553191" data-muscle="knees"/>
<polygon points="66.3829787 153.617021 62.9787234 162.978723 66.8085106 166.382979 69.3617021 159.148936" data-muscle="knees"/>
<polygon points="29.3617021 160.425532 28.5106383 167.234043 24.6808511 179.574468 23.8297872 192.765957 25.5319149 197.021277 28.5106383 193.191489 29.787234 180 31.9148936 171.06383 31.9148936 166.808511" data-muscle="calves"/>
<polygon points="37.4468085 165.106383 35.3191489 167.659574 33.1914894 171.914894 31.0638298 180.425532 30.212766 191.914894 34.0425532 200 38.7234043 190.638298 39.1489362 168.93617" data-muscle="calves"/>
<polygon points="62.9787234 165.106383 61.2765957 168.510638 61.7021277 190.638298 66.3829787 199.574468 70.6382979 191.914894 68.9361702 179.574468 66.8085106 170.212766" data-muscle="calves"/>
<polygon points="70.6382979 160.425532 72.3404255 168.510638 75.7446809 179.148936 76.5957447 192.765957 74.4680851 196.595745 72.3404255 193.617021 70.6382979 179.574468 68.0851064 168.085106" data-muscle="calves"/>
''';
    final svgIcerik = on ? onSvg : arkaSvg;
    return '''<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1c1b1b; display: flex; justify-content: center; align-items: center; height: 100vh; }
svg { width: 100%; max-width: 200px; height: auto; display: block; }
polygon { cursor: pointer; transition: fill 0.15s; }
polygon:hover { opacity: 0.8; }
</style></head>
<body>
<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg" id="model">$svgIcerik</svg>
<script>
function setSelected(slug) {
  var polys = document.querySelectorAll('polygon');
  polys.forEach(function(p) {
    var m = p.getAttribute('data-muscle');
    p.style.fill = (m === slug) ? '#e8313f' : '#c4956a';
  });
}
document.querySelectorAll('polygon').forEach(function(p) {
  p.addEventListener('click', function() {
    var muscle = p.getAttribute('data-muscle');
    Flutter.postMessage(muscle);
    setSelected(muscle);
  });
});
setSelected('');
</script></body></html>''';
  }

  @override
  void dispose() { _tabController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      Column(children: [
        Container(
          color: kSurfaceLow(context),
          child: TabBar(
            controller: _tabController, indicatorColor: kRed, indicatorWeight: 2, labelColor: kRed,
            unselectedLabelColor: kHint(context), labelStyle: kLabel(context, size: 11, color: kRed),
            unselectedLabelStyle: kLabel(context, size: 11),
            tabs: const [Tab(text: 'VÜCUT DİYAGRAMI'), Tab(text: 'KAS LİSTESİ')],
          ),
        ),
        Container(height: 1, color: kBorder(context)),
        Expanded(child: TabBarView(controller: _tabController, children: [_diyagramSekme(context), _listeSekme(context)])),
      ]),
      if (_seciliEgzersiz != null) _detayModal(context),
    ]);
  }

  Widget _diyagramSekme(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Egzersiz Kütüphanesi', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text('Kas grubuna tıklayarak en etkili 5 hareketi görün.', style: kBody(context, size: 13, color: kHint(context))),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: GestureDetector(
            onTap: () => setState(() { _onGoster = true; }),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(color: _onGoster ? kRed : kSurfaceLow(context), borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)), border: Border.all(color: kRed)),
              child: Text('ÖN', textAlign: TextAlign.center, style: kLabel(context, size: 11, color: _onGoster ? Colors.white : kRed)),
            ),
          )),
          Expanded(child: GestureDetector(
            onTap: () => setState(() { _onGoster = false; }),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(color: !_onGoster ? kRed : kSurfaceLow(context), borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)), border: Border.all(color: kRed)),
              child: Text('ARKA', textAlign: TextAlign.center, style: kLabel(context, size: 11, color: !_onGoster ? Colors.white : kRed)),
            ),
          )),
        ]),
        const SizedBox(height: 16),
        Container(
          height: 380,
          decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorderAlt(context))),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: _onGoster
                ? (_onWebController != null ? WebViewWidget(controller: _onWebController!) : const SizedBox())
                : (_arkaWebController != null ? WebViewWidget(controller: _arkaWebController!) : const SizedBox()),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(color: kRed.withOpacity(0.12), borderRadius: BorderRadius.circular(10), border: Border.all(color: kRed.withOpacity(0.4))),
          child: Row(children: [
            const Icon(Icons.touch_app_outlined, color: kRed, size: 18),
            const SizedBox(width: 8),
            Text('Seçili: ${kasGruplari[_seciliGrup] ?? _seciliGrup}', style: kBody(context, size: 14, weight: FontWeight.w600, color: kRed)),
          ]),
        ),
        if (_seciliGrup == 'ust_gogus' || _seciliGrup == 'alt_gogus') ...[
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: GestureDetector(
              onTap: () => setState(() { _seciliGrup = 'ust_gogus'; }),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 9),
                decoration: BoxDecoration(color: _seciliGrup == 'ust_gogus' ? kRed : kSurfaceLow(context), borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)), border: Border.all(color: kRed)),
                child: Text('ÜST GÖĞÜS', textAlign: TextAlign.center, style: kLabel(context, size: 10, color: _seciliGrup == 'ust_gogus' ? Colors.white : kRed)),
              ),
            )),
            Expanded(child: GestureDetector(
              onTap: () => setState(() { _seciliGrup = 'alt_gogus'; }),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 9),
                decoration: BoxDecoration(color: _seciliGrup == 'alt_gogus' ? kRed : kSurfaceLow(context), borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)), border: Border.all(color: kRed)),
                child: Text('ALT GÖĞÜS', textAlign: TextAlign.center, style: kLabel(context, size: 10, color: _seciliGrup == 'alt_gogus' ? Colors.white : kRed)),
              ),
            )),
          ]),
        ],
        const SizedBox(height: 16),
        Row(children: [
          Text('${kasGruplari[_seciliGrup]} HAREKETLERİ', style: kLabel(context)),
          const SizedBox(width: 8),
          Expanded(child: Container(height: 1, color: kBorder(context))),
        ]),
        const SizedBox(height: 12),
        ...(egzersizler[_seciliGrup] ?? []).asMap().entries.map((e) => _egzersizSatiri(context, e.key + 1, e.value)),
      ]),
    );
  }

  Widget _listeSekme(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Kas Grupları', style: kHeadline(context, size: 20, weight: FontWeight.w800)),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4, crossAxisSpacing: 8, mainAxisSpacing: 8, childAspectRatio: 1.2),
          itemCount: kasGruplari.length,
          itemBuilder: (_, i) {
            final anahtar = kasGruplari.keys.elementAt(i);
            final ad = kasGruplari.values.elementAt(i);
            final secili = _seciliGrup == anahtar;
            return GestureDetector(
              onTap: () => setState(() { _seciliGrup = anahtar; }),
              child: Container(
                decoration: BoxDecoration(
                  color: secili ? kRed.withOpacity(0.12) : kSurfaceLow(context),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: secili ? kRed : kBorder(context), width: secili ? 1.5 : 1),
                ),
                child: Center(child: Padding(padding: const EdgeInsets.all(4), child: Text(ad, style: kLabel(context, size: 10, color: secili ? kRed : kHint(context)), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis))),
              ),
            );
          },
        ),
        const SizedBox(height: 20),
        Row(children: [
          Text('${kasGruplari[_seciliGrup]} HAREKETLERİ', style: kLabel(context)),
          const SizedBox(width: 8),
          Expanded(child: Container(height: 1, color: kBorder(context))),
        ]),
        const SizedBox(height: 12),
        ...(egzersizler[_seciliGrup] ?? []).asMap().entries.map((e) => _egzersizSatiri(context, e.key + 1, e.value)),
      ]),
    );
  }

  Widget _egzersizSatiri(BuildContext context, int siralama, Map<String, String> egzersiz) {
    return GestureDetector(
      onTap: () => setState(() { _seciliEgzersiz = egzersiz; }),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder(context))),
        child: Row(children: [
          Container(width: 32, height: 32, decoration: BoxDecoration(color: kRed.withOpacity(0.12), borderRadius: BorderRadius.circular(8)), child: Center(child: Text('$siralama', style: kLabel(context, size: 12, color: kRed)))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(egzersiz['ad']!, style: kBody(context, size: 14, weight: FontWeight.w600, color: kText(context))),
            const SizedBox(height: 2),
            Text(egzersiz['kisa']!, style: kBody(context, size: 12, color: kHint(context)), maxLines: 2, overflow: TextOverflow.ellipsis),
          ])),
          Icon(Icons.chevron_right, color: kHint(context), size: 20),
        ]),
      ),
    );
  }

  Widget _detayModal(BuildContext context) {
    return Positioned.fill(
      child: GestureDetector(
        onTap: () => setState(() { _seciliEgzersiz = null; }),
        child: Container(
          color: Colors.black.withOpacity(0.7),
          child: Center(
            child: GestureDetector(
              onTap: () {},
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: kSurfaceLow(context), borderRadius: BorderRadius.circular(16), border: Border.all(color: kBorderAlt(context))),
                child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(child: Text(_seciliEgzersiz!['ad']!, style: kHeadline(context, size: 18, weight: FontWeight.w700))),
                    GestureDetector(onTap: () => setState(() { _seciliEgzersiz = null; }), child: Icon(Icons.close, color: kHint(context), size: 22)),
                  ]),
                  const SizedBox(height: 12),
                  Text(_seciliEgzersiz!['detay']!, style: kBody(context, size: 14, color: kText(context))),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: kRed.withOpacity(0.08), borderRadius: BorderRadius.circular(10), border: Border.all(color: kRed.withOpacity(0.3))),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Icon(Icons.auto_awesome, color: kRed, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_seciliEgzersiz!['ipucu']!, style: kBody(context, size: 13, color: kRed))),
                    ]),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}