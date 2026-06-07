# TREX Digital Manufacturing Hub - Proje Özeti

Bu belge, TREX Hackathon kapsamında geliştirilen "Digital Factory Hub" projesinin mimari, tasarımsal ve teknik tüm detaylarını içermektedir.

## 1. Proje Vizyonu ve Mimari Yaklaşım
Proje, sıradan bir web uygulamasından ziyade **"Endüstriyel B2B SaaS"** standartlarında kurgulanmıştır. Amacı, fabrika yöneticilerine, üretim planlamacılarına ve bakım mühendislerine tek bir ekrandan anlık veriyi okuma, geçmişi analiz etme ve geleceği simüle etme imkanı sunmaktır.

* **Teknoloji Yığını:** React, Vite, Tailwind CSS, Zustand, Recharts, Framer Motion.
* **Tasarım Felsefesi:** *Brutalist Corporate / Industrial UI*
  * Yuvarlak hatlar (`rounded-lg`) tamamen kaldırılarak, kontrol paneli hissiyatı veren keskin köşelere (`rounded-none`) geçilmiştir.
  * Renk paleti olarak standart griler yerine **Karbon Lacivert/Siyah (#0d1117)** altyapı, uyarılar için **Güvenlik Turuncusu (#FF5722)** ve **Neon Yeşil (#00FF00)** seçilmiştir.
  * Tipografide mekanik/teknolojik başlıklar için **Rajdhani**, anlık değişen sensör okumaları ve tablo verileri için **JetBrains Mono** fontları kullanılmıştır.

---

## 2. Temel Modüller ve Sayfalar

### 2.1. Digital Factory Hub (Ana Ekran / Matris)
Sistemin ana komuta merkezidir. Uygulama açıldığında kullanıcıyı karşılayan bu ekran, fabrika operasyonlarını zamansal ve işlevsel bir matris üzerinde birleştirir.
* **Yatay Eksen (Sütunlar):** Üretim Planı, Arıza Yönetimi, Verimlilik Takibi, Maliyet, Bakım.
* **Dikey Eksen (Satırlar):** 
  * *Geleceğe Yönelik:* Kestirimci (Predictive) ve simülasyon araçları.
  * *Anlık:* Gerçek zamanlı telemetri ve edge sensör takibi.
  * *Geçmişe Yönelik:* Geriye dönük iz sürme ve performans raporları.
* **Etkileşim:** Bu matris sadece görsel değildir; "What-If Simülatörü" ve "RCA" hücrelerine tıklandığında ilgili modüllere anında geçiş sağlanır.

### 2.2. Kök Neden Analizi (RCA - Root Cause Analysis)
Geçmişe yönelik arıza takip ve derinlemesine olay inceleme ekranıdır.
* **Alarm Listesi:** `Trex_mes_alert` veri tabanından çekiliyormuş gibi davranan, zamana ve kritiklik seviyesine (Critical, Error, Warning) göre renk kodlu bir log listesidir.
* **T=0 Olay Zaman Çizelgesi (Event Timeline):** Arıza anını merkeze alıp (T=0), arıza öncesi (-15 dk) ve sonrasındaki (+15 dk) olayları zincirleme bir algoritma ile görselleştirir.
* **Nightwatch Sensör Telemetrisi:** Basınç ve sıcaklık gibi değerlerin milisaniyelik kırılımlarla Recharts üzerinden çizildiği alandır. Alarmın koptuğu tam an, belirgin bir dikey çizgi (Reference Line) ile kanıt olarak sunulur.
* **AI Çıkarımı ve Raporlama:** Sensör verilerinden "Pnömatik valf contası sızıntısı" gibi yapay zeka tabanlı tespitler yapar.
* **Çift Yönlü İndirme Mekanizması:**
  1. *Yazdır Şablonu:* Doğrudan `window.print()` tetiklenerek arayüzü gizler ve ekrana resmi, siyah-beyaz, A4 formatında imza atılabilir bir teknik servis formu basar.
  2. *PDF Olarak İndir:* `jsPDF` modülü ile tablo ve verileri arka planda bir araya getirerek dijital PDF dokümanı oluşturur.

### 2.3. What-If Analizi (Parametre Simülatörü)
Kullanıcının üretim parametreleriyle oynayarak "Şöyle olsaydı, üretim nasıl etkilenirdi?" sorusuna yanıt bulduğu interaktif simülasyon alanıdır.
* **Kullanılabilirlik, Performans ve Kalite Slider'ları:** Kullanıcı bu değerlerle oynadıkça global `A * P * Q` formülü üzerinden **OEE (Overall Equipment Effectiveness)** değerini yeniden hesaplar.
* **Animasyonlu Şelale (Waterfall) Grafiği:** Temel OEE seviyesinden başlayarak, duruş, çevrim süresi ve hurda değişimlerinin toplam OEE'yi nasıl yukarı/aşağı çektiğini basamaklı ve renkli bir şekilde gösterir.
* **Gerçek Dünya Operasyonel Çıktı Projeksiyonu:** Yüzdelik artışları salt rakam olarak bırakmaz. Örneğin OEE'deki artışın gerçekte kaç **ekstra ürün/kutu** kazandırdığını ve bunun **lojiştik/ihracat** bazındaki karşılığını (Aylık fazladan 1 ihracat konteyneri) hesaplayarak üst yönetime hitap eden bir iş zekası çıktısı sunar.

---

## 3. Teknik Mimari ve Veri Akışı

* **Zustand Store (`useStore.js`):** Uygulamanın beyni. `alerts`, `sensorData` ve `mock` telemetri verilerini RAM üzerinde tutar ve React component'leri arasında "prop-drilling" yapmadan saniyede defalarca kez güncellenmesini sağlar.
* **Mock Veri Üreticisi (`mockData.js`):** Hackathon demosunun gerçekçi görünmesi için arıza loglarını ve frekansı yüksek (sensör tipi) dalgalı grafikleri matematiksel formüllerle üretir.

## 4. Sonuç
Bu sistem, basit bir veri paneli olmaktan çıkarak, görsel kalitesiyle yatırımcıları "wow" etkisine sokacak, endüstri mühendislerinin gerçek sorunlarına çözüm üreten profesyonel bir B2B ürünü standardına getirilmiştir.
