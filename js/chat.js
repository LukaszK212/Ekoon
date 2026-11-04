/* ekoON – asystent czatu działający lokalnie (bez zewnętrznych usług).
   Odpowiedzi pochodzą z bazy wiedzy poniżej (KB). Aby zmienić treść odpowiedzi,
   edytuj teksty w tablicy INTENTS. Ceny pobierane są z kalkulatora (window.ekoonPrices). */
(function () {
  'use strict';

  /* ---------------- Dane firmy ---------------- */
  var PHONE = '+48 500 600 700';
  var PHONE_HREF = 'tel:+48500600700';
  var EMAIL = 'kontakt@ekoon.pl';
  var FB = 'https://www.facebook.com/toomaszromanowski/';
  var OFERTEO = 'https://www.oferteo.pl/ekoon-tomasz-romanowski/firma/4309880';
  var HOURS = { 1: [510, 1020], 2: [420, 900], 3: [420, 900], 4: [420, 900], 5: [420, 900] };
  var TOWNS = {
    'lodz': 'Łódź', 'lodzi': 'Łódź', 'rzgow': 'Rzgów', 'guzew': 'Guzew', 'pabianic': 'Pabianice', 'tuszyn': 'Tuszyn',
    'koluszk': 'Koluszki', 'zgierz': 'Zgierz', 'ksawerow': 'Ksawerów', 'andrespol': 'Andrespol', 'brzezin': 'Brzeziny',
    'konstantynow': 'Konstantynów Łódzki', 'gadka': 'Gadka Stara', 'starowa gora': 'Starowa Góra', 'kurowice': 'Kurowice',
    'bedon': 'Bedoń', 'nowosolna': 'Nowosolna', 'aleksandrow': 'Aleksandrów Łódzki', 'stryk': 'Stryków'
  };

  /* ---------------- Ścieżki (działa na stronie głównej i podstronach) ---------------- */
  var script = document.currentScript || document.querySelector('script[src*="chat.js"]');
  var ROOT = script ? new URL('../', script.src).href : '';
  var onHome = !!document.getElementById('kalkulator');
  function link(hash) { return onHome ? '#' + hash : ROOT + 'index.html#' + hash; }
  function page(file) { return ROOT + file; }

  /* ---------------- Pomocnicze ---------------- */
  var fmt = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
  var fmt1 = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });
  function rnd(v) { var st = v >= 1000 ? 50 : 10; return fmt.format(Math.round(v / st) * st); }
  function zl(a, b) { return rnd(a) + (b ? '–' + rnd(b) : '') + ' zł'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) {
    return String(s).toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/m²/g, ' m2 ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function store(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k)); sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  function openStatus() {
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) { /* */ }
    var days = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
    var day = days[parts.weekday] !== undefined ? days[parts.weekday] : new Date().getDay();
    var mins = parts.hour ? (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10) : new Date().getHours() * 60 + new Date().getMinutes();
    var t = function (m) { return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
    var h = HOURS[day];
    if (h && mins >= h[0] && mins < h[1]) return { open: true, text: 'Teraz jesteśmy <b>otwarci</b> – do ' + t(h[1]) + '. Śmiało dzwoń!' };
    var next;
    if (h && mins < h[0]) next = 'dziś od ' + t(h[0]);
    else {
      var d = (day + 1) % 7, n = 0;
      while (!HOURS[d] && n < 7) { d = (d + 1) % 7; n++; }
      next = (d === (day + 1) % 7 ? 'jutro' : ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę'][d]) + ' od ' + t(HOURS[d][0]);
    }
    return { open: false, text: 'Teraz jest <b>poza godzinami pracy</b> – zapraszamy ' + next + '. Możesz też zostawić wiadomość w formularzu, odezwiemy się.' };
  }

  var P = function () { return window.ekoonPrices || null; };

  /* ---------------- Akcje (przyciski pod odpowiedzią) ---------------- */
  var A = {
    call: { label: 'Zadzwoń: ' + PHONE, href: PHONE_HREF, primary: true },
    form: { label: 'Formularz wyceny', href: link('formularz') },
    calc: { label: 'Otwórz kalkulator', href: link('kalkulator') },
    gallery: { label: 'Zobacz realizacje', href: link('realizacje') },
    reviews: { label: 'Przeczytaj opinie', href: link('opinie') },
    b2b: { label: 'Oferta dla firm', href: link('dla-firm') },
    mail: { label: 'Napisz e-mail', href: 'mailto:' + EMAIL },
    fb: { label: 'Facebook', href: FB, ext: true },
    oferteo: { label: 'Opinie na Oferteo', href: OFERTEO, ext: true },
    pMontaz: { label: 'Montaż klimatyzacji – więcej', href: page('montaz-klimatyzacji-lodz.html') },
    pSerwis: { label: 'Serwis – więcej', href: page('serwis-klimatyzacji-lodz.html') },
    pPompa: { label: 'Pompy ciepła – więcej', href: page('pompy-ciepla-lodz.html') },
    pChlod: { label: 'Chłodnictwo – więcej', href: page('chlodnictwo-lodz.html') },
    pElek: { label: 'Elektryka – więcej', href: page('instalacje-elektryczne-lodz.html') },
    privacy: { label: 'Polityka prywatności', href: page('polityka-prywatnosci.html') }
  };

  /* ---------------- Ceny liczone z danych kalkulatora ---------------- */
  function priceMontaz() {
    var p = P();
    if (!p) return 'Orientacyjną cenę montażu sprawdzisz w kalkulatorze na stronie głównej.';
    var m = p.montaz, i = m.install;
    var eco = [m.device.eco[2.5][0] + i[0], m.device.eco[2.5][1] + i[1]];
    var std = [m.device.std[3.5][0] + i[0], m.device.std[3.5][1] + i[1]];
    var pre = [m.device.pre[3.5][0] + i[0], m.device.pre[3.5][1] + i[1]];
    return 'Orientacyjnie, <b>klimatyzator z montażem</b> (do ' + m.includedPipe + ' m instalacji):<ul>' +
      '<li>klasa ekonomiczna 2,5 kW: <b>' + zl(eco[0], eco[1]) + '</b></li>' +
      '<li>standard 3,5 kW: <b>' + zl(std[0], std[1]) + '</b></li>' +
      '<li>premium 3,5 kW: <b>' + zl(pre[0], pre[1]) + '</b></li></ul>' +
      'Każdy dodatkowy metr instalacji to ok. ' + zl(m.pipePerM[0], m.pipePerM[1]) + '. Dokładną cenę podajemy po <b>bezpłatnych oględzinach</b> – zawsze przed rozpoczęciem prac.';
  }
  function priceSerwis() {
    var p = P();
    if (!p) return 'Cenę serwisu sprawdzisz w kalkulatorze (zakładka „Serwis i czyszczenie”).';
    var s = p.serwis.scope;
    return 'Orientacyjne ceny za <b>jedno urządzenie</b> (jednostka ścienna):<ul>' +
      '<li>przegląd okresowy: <b>' + zl(s.przeglad.price[0], s.przeglad.price[1]) + '</b></li>' +
      '<li>przegląd + czyszczenie i odgrzybianie: <b>' + zl(s.czyszczenie.price[0], s.czyszczenie.price[1]) + '</b></li>' +
      '<li>gruntowne czyszczenie: <b>' + zl(s.gruntowne.price[0], s.gruntowne.price[1]) + '</b></li>' +
      '<li>diagnostyka usterki: <b>' + zl(s.diagnoza.price[0], s.diagnoza.price[1]) + '</b> (+ ewentualna naprawa)</li></ul>' +
      'Przy kilku urządzeniach są rabaty: 2+ szt. −10%, 4+ −15%, 10+ −20%, a przy umowie serwisowej dodatkowo −10%.';
  }
  function pricePompa() {
    var p = P();
    if (!p) return 'Orientacyjny koszt pompy ciepła sprawdzisz w kalkulatorze (zakładka „Pompa ciepła”).';
    var u = p.pompa.unit;
    return 'Orientacyjnie <b>pompa ciepła powietrze-woda z montażem</b>:<ul>' +
      '<li>ok. 7 kW (mniejszy, dobrze ocieplony dom): <b>' + zl(u[7][0], u[7][1]) + '</b></li>' +
      '<li>ok. 10 kW (typowy dom ok. 150 m²): <b>' + zl(u[10][0], u[10][1]) + '</b></li>' +
      '<li>ok. 12 kW: <b>' + zl(u[12][0], u[12][1]) + '</b></li></ul>' +
      'Do tego zasobnik ciepłej wody ok. ' + zl(p.pompa.cwuTank[0], p.pompa.cwuTank[1]) + '. Moc dobieramy po oględzinach – możesz też policzyć ją w kalkulatorze. Pomożemy sprawdzić dostępne dofinansowania.';
  }

  /* ---------------- Dobór mocy z metrażu ---------------- */
  function areaFrom(t) {
    var m = t.match(/(\d{1,3}(?:[.,]\d)?)\s*(m2|m 2|mkw|m kw|metr|m\b|mk\b)/);
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  }
  function powerAC(area, t) {
    var f = 1, why = [];
    if (/podda|skos/.test(t)) { f *= 1.25; why.push('poddasze'); }
    if (/biur/.test(t)) { f *= 1.15; why.push('biuro'); }
    if (/slonecz|poludn|duze okn|przeszklen/.test(t)) { f *= 1.2; why.push('mocne nasłonecznienie'); }
    var need = area * 0.1 * f;
    var sizes = [2.5, 3.5, 5, 7];
    var size = sizes.filter(function (s) { return s >= need * 0.95; })[0];
    var txt = 'Dla pomieszczenia <b>' + fmt1.format(area) + ' m²</b>' + (why.length ? ' (' + why.join(', ') + ')' : '') +
      ' zapotrzebowanie to ok. <b>' + fmt1.format(need) + ' kW</b>, więc ';
    txt += size ? 'zwykle wystarczy klimatyzator <b>' + fmt1.format(size) + ' kW</b>.' : 'lepiej sprawdzą się <b>dwie jednostki lub system multi-split</b>.';
    return txt + ' Ostatecznie moc dobieramy na oględzinach – liczy się też wysokość, okna, liczba osób i sprzęt w pomieszczeniu.';
  }
  function powerPump(area, t) {
    var w = /now|energoosz|pasyw/.test(t) ? 40 : /star|nieocie|slabo/.test(t) ? 75 : 55;
    var need = area * w / 1000 + 1;
    var sizes = [5, 7, 10, 12, 16];
    var size = sizes.filter(function (s) { return s >= need * 0.95; })[0];
    return 'Dla domu <b>' + fmt.format(area) + ' m²</b> (' + (w === 40 ? 'nowy, energooszczędny' : w === 75 ? 'starszy, słabiej ocieplony' : 'ocieplony') +
      ') zapotrzebowanie razem z ciepłą wodą to ok. <b>' + fmt1.format(need) + ' kW</b> – ' +
      (size ? 'orientacyjnie pompa <b>' + size + ' kW</b>.' : 'tu dobierzemy rozwiązanie indywidualnie, np. kaskadę pomp.') +
      ' Dokładny dobór robimy po oględzinach.';
  }

  /* ---------------- Baza wiedzy ----------------
     k – słowa kluczowe (początki słów, bez polskich znaków); frazy ze spacją dopasowywane w całości.
     t – temat zapamiętywany w kontekście (dla pytań typu „a ile to kosztuje?”). */
  var INTENTS = [
    { id: 'hello', k: ['czesc', 'hej', 'witam', 'dzien dobry', 'dobry wieczor', 'siema', 'elo', 'halo'], a: 'Dzień dobry! 👋 Jestem asystentem firmy <b>ekoON</b>. Odpowiem na pytania o montaż i serwis klimatyzacji, pompy ciepła, chłodnictwo, elektrykę, ceny i terminy. W czym mogę pomóc?', chips: 'start' },
    { id: 'thanks', k: ['dzieki', 'dziekuje', 'dziena', 'thx', 'super', 'swietnie', 'ok dzieki', 'fajnie'], a: 'Nie ma za co! 😊 Gdyby pojawiły się kolejne pytania, jestem tutaj. Najszybciej ustalisz szczegóły telefonicznie.', act: ['call', 'form'] },
    { id: 'bye', k: ['do widzenia', 'pa ', 'nara', 'na razie', 'do uslyszenia', 'koniec'], a: 'Do usłyszenia! Miłego dnia i komfortowej temperatury w domu ❄️', act: ['call'] },
    { id: 'bot', k: ['bot', 'robot', 'ai', 'sztuczn', 'czlowiek', 'prawdziw', 'konsultant', 'rozmawiac z'], a: 'Jestem automatycznym asystentem i odpowiadam na podstawie informacji o firmie. W sprawach nietypowych najlepiej porozmawiać bezpośrednio z <b>Tomaszem Romanowskim</b> – właścicielem, który prowadzi każde zlecenie osobiście.', act: ['call', 'form'] },

    { id: 'services', k: ['oferta', 'oferu', 'uslug', 'czym sie zajmuj', 'co robi', 'zakres', 'czym zajmuj', 'co mozecie'], a: 'Zajmujemy się:<ul><li>❄️ <b>montażem klimatyzacji</b> w domach, mieszkaniach i biurach,</li><li>🔧 <b>serwisem, czyszczeniem i naprawą</b> klimatyzacji,</li><li>🌿 <b>pompami ciepła</b> – dobór, montaż, serwis,</li><li>🏭 <b>chłodnictwem</b> i obsługą zakładów produkcyjnych,</li><li>⚡ <b>instalacjami elektrycznymi</b>.</li></ul>O czym chcesz wiedzieć więcej?', chips: ['Montaż klimatyzacji', 'Serwis i czyszczenie', 'Pompy ciepła', 'Elektryka', 'Dla firm'] },

    /* --- Montaż --- */
    { id: 'montaz', t: 'montaz', k: ['montaz', 'zamontow', 'instalacj klim', 'zalozy', 'klimatyzacj do', 'nowa klim', 'kupic klim', 'klimatyzator do', 'potrzebuje klim', 'chce klim'], a: 'Montujemy klimatyzację w mieszkaniach, domach i biurach. Montaż obejmuje:<ul><li>bezpłatne oględziny i dobór mocy,</li><li>montaż jednostki wewnętrznej i zewnętrznej,</li><li>instalację chłodniczą i odprowadzenie skroplin,</li><li>próbę szczelności i próżniowanie,</li><li>uruchomienie i instruktaż obsługi,</li><li>sprzątanie po pracy.</li></ul>', act: ['calc', 'pMontaz'], chips: ['Ile kosztuje montaż?', 'Ile trwa montaż?', 'Jaka moc do pokoju 25 m²?'] },
    { id: 'czas', t: 'montaz', k: ['ile trwa', 'jak dlugo', 'ile czasu', 'w jeden dzien', 'czas montaz', 'szybko zamontuj', 'ile godzin'], a: 'Montaż jednego klimatyzatora typu split trwa zwykle <b>3–5 godzin</b>. Przy kilku jednostkach albo trudniejszej trasie instalacji – cały dzień. Przegląd z czyszczeniem jednego urządzenia to ok. godziny.' },
    { id: 'termin', k: ['termin', 'kiedy moze', 'kiedy przyjedzie', 'jak szybko', 'najblizszy wolny', 'dostepnosc', 'na kiedy', 'czekac', 'pilne', 'pilnie', 'na juz', 'dzisiaj', 'jutro'], a: 'Terminy ustalamy na bieżąco i staramy się działać szybko – klienci często chwalą sprawną realizację. Najszybciej poznasz wolny termin <b>dzwoniąc</b>. Awarie u stałych klientów obsługujemy priorytetowo.', act: ['call', 'form'] },
    { id: 'zima', t: 'montaz', k: ['zima', 'zimie', 'zimow', 'mroz', 'w grudni', 'w styczni', 'poza sezon'], a: 'Tak, <b>montujemy przez cały rok</b>, także zimą. To nawet dobry moment – terminy są krótsze, a urządzenie jest gotowe na pierwsze upały. Klimatyzację z funkcją grzania od razu wykorzystasz do dogrzewania.' },
    { id: 'wspolnota', t: 'montaz', k: ['wspolnot', 'spoldziel', 'blok', 'zgod', 'elewacj bloku', 'administrac', 'balkon'], a: 'W bloku agregat montujemy najczęściej na <b>balkonie</b> (na podkładkach antywibracyjnych, żeby było cicho) albo na elewacji. Na elewację często potrzebna jest <b>zgoda wspólnoty lub spółdzielni</b> – zależy od regulaminu. Podpowiemy, jak to sprawdzić i jakie informacje przygotować.' },
    { id: 'miejsce', t: 'montaz', k: ['gdzie zamontow', 'gdzie powiesic', 'w ktorym miejscu', 'nad lozkiem', 'umiejscow', 'gdzie najlepiej'], a: 'Jednostkę wewnętrzną montujemy najlepiej <b>wysoko na ścianie</b>, tak by nawiew nie wiał bezpośrednio na łóżko, kanapę czy biurko. Miejsce dobieramy na oględzinach – uwzględniając też trasę instalacji i odprowadzenie skroplin, żeby rury były jak najmniej widoczne.' },
    { id: 'moc', t: 'montaz', k: ['moc', 'kw', 'jaki klimatyzator', 'jaka klima', 'dobor', 'dobrac', 'jaki model', 'wystarczy'], a: 'Moc dobieramy do pomieszczenia: przyjmuje się ok. <b>100 W na 1 m²</b>, więcej przy dużym nasłonecznieniu, na poddaszu czy w biurze. Przykładowo pokój 25 m² to zwykle klimatyzator 2,5–3,5 kW. Napisz metraż (np. „pokój 30 m² na poddaszu”), a podam orientacyjną moc 🙂', act: ['calc'] },
    { id: 'multi', t: 'montaz', k: ['kilka pokoi', 'kilka pomieszcz', 'multi', 'caly dom', 'cale mieszkanie', 'dwa pokoje', 'trzy pokoje', 'jeden agregat'], a: 'Kilka pomieszczeń można obsłużyć osobnymi klimatyzatorami albo systemem <b>multi-split</b> – jeden agregat na zewnątrz i kilka jednostek w środku. To mniej urządzeń na elewacji. W kalkulatorze możesz wybrać liczbę klimatyzatorów i zobaczyć orientacyjny koszt.', act: ['calc'] },
    { id: 'marki', k: ['mark', 'producent', 'lg', 'sinclair', 'mitsubishi', 'vaillant', 'daikin', 'gree', 'samsung', 'fujitsu', 'haier', 'toshiba', 'jaki sprzet', 'urzadzen jakiej'], a: 'Montujemy i serwisujemy m.in. urządzenia <b>LG, Sinclair, Mitsubishi Electric</b>, a w pompach ciepła i kotłowniach – <b>Vaillant</b>. Doradzimy model dopasowany do budżetu: od solidnych urządzeń w dobrej cenie po ciche modele premium z Wi-Fi. Serwisujemy też urządzenia innych marek.' },
    { id: 'klasy', t: 'montaz', k: ['ekonomiczn', 'premium', 'standard', 'roznica miedzy', 'tanszy', 'drozszy', 'lepszy model'], a: 'W kalkulatorze są trzy klasy:<ul><li><b>Ekonomiczna</b> – solidna podstawa w dobrej cenie,</li><li><b>Standard</b> – cichsza praca, Wi-Fi, wysoka klasa energetyczna (najczęściej wybierana),</li><li><b>Premium</b> – design, najwyższa efektywność, oczyszczanie powietrza.</li></ul>', act: ['calc'] },
    { id: 'wifi', t: 'montaz', k: ['wifi', 'wi fi', 'aplikacj', 'telefonem', 'zdalnie', 'smartfon'], a: 'Większość urządzeń w klasie standard i premium ma <b>sterowanie Wi-Fi</b> z aplikacji w telefonie – możesz włączyć chłodzenie, zanim wrócisz do domu. W klasie ekonomicznej moduł Wi-Fi bywa opcją.' },
    { id: 'halas', t: 'montaz', k: ['glosn', 'halas', 'cich', 'szum', 'decybel', 'db '], a: 'Nowoczesne klimatyzatory pracują bardzo cicho – jednostka wewnętrzna w trybie nocnym jest ledwo słyszalna. Agregat montujemy na <b>podkładkach antywibracyjnych</b>, żeby nie przenosił drgań. Głośna praca starszego urządzenia to często znak, że potrzebny jest serwis.' },
    { id: 'prad', k: ['prad', 'zuzyc', 'rachunk', 'energi', 'oszczedn', 'ile pali', 'koszt eksploat', 'ile kosztuje praca', 'fotowolt'], a: 'Nowoczesny klimatyzator inwerterowy jest bardzo oszczędny – z 1 kWh prądu daje kilka kWh chłodu lub ciepła. Dobrze dobrany i regularnie serwisowany zużywa najmniej. Brudny wymiennik potrafi wyraźnie podnieść rachunki, dlatego warto robić przegląd raz w roku. Z fotowoltaiką koszt pracy jest symboliczny.' },
    { id: 'grzanie', k: ['grzac', 'grzeje', 'grzanie', 'ogrzew', 'dogrzew', 'cieplo z klim', 'pompa powietrze powietrze'], a: 'Tak – nowoczesny klimatyzator to <b>pompa ciepła powietrze-powietrze</b>. W trybie grzania efektywnie dogrzewa jesienią i wiosną, a wybrane modele pracują także przy dużych mrozach. Jeśli myślisz o ogrzewaniu całego domu z wodą użytkową – zobacz pompy ciepła powietrze-woda.', chips: ['Pompy ciepła'] },
    { id: 'docieplenie', k: ['docieplen', 'ocieplen elewac', 'termomoderniz', 'styropian', 'demontaz agregat', 'elewacj'], a: 'Planujesz docieplenie elewacji? Przygotujemy instalację klimatyzacji tak, żeby ekipa od elewacji <b>nie musiała demontować agregatów</b>. Oszczędzasz czas, pieniądze i nerwy. Najlepiej skontaktować się przed rozpoczęciem ocieplania.', act: ['call'] },

    /* --- Serwis --- */
    { id: 'serwis', t: 'serwis', k: ['serwis', 'przeglad', 'czyszcz', 'odgrzyb', 'wyczysc', 'konserwac', 'dezynfek', 'umyc klim', 'filtr'], a: 'Robimy przeglądy, czyszczenie i odgrzybianie klimatyzacji. Przegląd z czyszczeniem obejmuje:<ul><li>czyszczenie lub wymianę filtrów,</li><li>mycie i dezynfekcję wymiennika,</li><li>czyszczenie tacy i odpływu skroplin,</li><li>czyszczenie jednostki zewnętrznej,</li><li>kontrolę parametrów pracy i szczelności.</li></ul>', act: ['pSerwis'], chips: ['Ile kosztuje serwis?', 'Jak często serwisować?', 'Klima brzydko pachnie'] },
    { id: 'czesto', t: 'serwis', k: ['jak czesto', 'co ile', 'raz w roku', 'kiedy serwis', 'kiedy przeglad', 'czestotliw'], a: 'W domu zalecamy przegląd z czyszczeniem <b>co najmniej raz w roku</b>, najlepiej przed sezonem. W biurach, sklepach i zakładach, gdzie urządzenia pracują intensywnie – <b>co 6 miesięcy</b>. Regularny serwis jest zwykle warunkiem gwarancji producenta.' },
    { id: 'zapach', t: 'serwis', k: ['smierdz', 'pachnie', 'zapach', 'wonia', 'grzyb', 'bakteri', 'stechl', 'alergi'], a: 'Nieprzyjemny zapach to najczęściej <b>bakterie i grzyby</b> na wymienniku i w tacy skroplin. Pomaga czyszczenie z dezynfekcją i odgrzybianiem – a regularny serwis zapobiega powrotowi problemu. To ważne zwłaszcza dla alergików.', act: ['call'], chips: ['Ile kosztuje serwis?'] },
    { id: 'awaria', t: 'serwis', k: ['awari', 'nie dziala', 'nie chlodzi', 'nie grzeje', 'cieknie', 'kapie', 'leje sie', 'blad', 'kod bledu', 'zepsul', 'psuje', 'naprawa', 'naprawi', 'nie wlacza', 'migaj', 'wybija', 'oblodz', 'szroni', 'usterk'], a: 'Przykro mi, że coś nie działa. Zajmiemy się <b>diagnostyką i naprawą</b> – ustalimy przyczynę i podamy koszt naprawy <b>przed jej wykonaniem</b>. Częste przyczyny: zabrudzony wymiennik lub odpływ skroplin, ubytek czynnika, usterka czujnika lub elektroniki. Zadzwoń i opisz objawy (np. kod błędu z wyświetlacza).', act: ['call', 'form'] },
    { id: 'inne_firmy', t: 'serwis', k: ['innej firm', 'inna firma', 'nie wasz', 'nie od was', 'kupiony gdzie', 'stary klimatyzator', 'starej klim', 'zaniedban'], a: 'Tak, <b>serwisujemy i naprawiamy urządzenia różnych marek</b>, niezależnie od tego, kto je zamontował. Przywracamy też do działania mocno zaniedbane klimatyzatory – wiele z nich po gruntownym czyszczeniu znów działa jak trzeba.' },
    { id: 'samemu', t: 'serwis', k: ['samemu', 'sam wyczysc', 'samodziel', 'sama wyczysc', 'na wlasna reke', 'w domu wyczysc'], a: 'Filtry warto samodzielnie przepłukiwać co kilka tygodni w sezonie – to proste i pomaga. Natomiast <b>wymiennik, tacę, turbinę i agregat</b> powinien czyścić serwisant, z odpowiednimi środkami i kontrolą parametrów pracy.' },
    { id: 'rabat', t: 'serwis', k: ['rabat', 'znizk', 'promocj', 'taniej', 'upust', 'kilka urzadzen', 'pakiet'], a: 'Przy serwisie kilku urządzeń obowiązują rabaty: <b>2+ szt. −10%, 4+ szt. −15%, 10+ szt. −20%</b>, a przy stałej umowie serwisowej dodatkowo −10%. Wszystko przeliczysz w kalkulatorze.', act: ['calc'] },
    { id: 'b2b', t: 'serwis', k: ['firm', 'zaklad', 'biur', 'klimatyzatorow', 'kilka klim', 'wielu urzadzen', 'hala', 'sklep', 'umow', 'b2b', 'przedsiebior', 'produkcj', 'serwerown', 'faktur dla firm'], a: 'Obsługujemy firmy: biura, sklepy, hale i zakłady produkcyjne. Pod naszą stałą opieką jest <b>ponad 300 klimatyzatorów i 3 zakłady produkcyjne</b> w woj. łódzkim. W ramach <b>umowy serwisowej</b> ustalamy harmonogram przeglądów, prowadzimy dokumentację prac, a awarie obsługujemy priorytetowo.', act: ['b2b', 'call'] },

    /* --- Pompy ciepła --- */
    { id: 'pompa', t: 'pompa', k: ['pomp', 'powietrze woda', 'ogrzewanie domu', 'zamiast pieca', 'wymiana pieca', 'piec gazow', 'kociol', 'kotl', 'kotlown'], a: 'Dobieramy, montujemy i serwisujemy <b>pompy ciepła powietrze-woda</b> (m.in. Vaillant). Pompa pobiera energię z powietrza i ogrzewa dom oraz wodę – z 1 kWh prądu daje kilka kWh ciepła, więc ogrzewanie jest tanie w eksploatacji. Moc dobieramy do budynku po oględzinach.', act: ['pPompa', 'calc'], chips: ['Ile kosztuje pompa ciepła?', 'Czy działa w mróz?', 'Czy pasuje do grzejników?', 'Dofinansowanie'] },
    { id: 'pompa_mroz', t: 'pompa', k: ['mrozy', 'mrozie', 'minus', 'zimno na dworze', 'niskich temperatur', 'dziala zima', 'w mroz'], a: 'Tak – nowoczesne pompy powietrze-woda pracują nawet przy <b>kilkunastu stopniach mrozu</b>. Przy prawidłowym doborze mocy dom jest ogrzany przez cały sezon.' },
    { id: 'grzejniki', t: 'pompa', k: ['grzejnik', 'kaloryfer', 'podlogow', 'podlogowk'], a: 'Pompa ciepła najefektywniej pracuje z <b>ogrzewaniem podłogowym</b>. Z grzejnikami też często się sprawdza – trzeba sprawdzić, czy ogrzeją dom przy niższej temperaturze zasilania. Czasem wystarczy bufor lub wymiana kilku grzejników. Ocenimy to na oględzinach.' },
    { id: 'dotacje', t: 'pompa', k: ['dofinans', 'dotacj', 'czyste powietrze', 'moje cieplo', 'ulga', 'termomodernizac', 'program'], a: 'Podpowiemy, jakie <b>programy dofinansowania</b> są aktualnie dostępne i jakie dokumenty dotyczące instalacji trzeba przygotować. Zasady programów się zmieniają, dlatego najlepiej omówić to przy wycenie.', act: ['call'] },
    { id: 'cwu', t: 'pompa', k: ['ciepla woda', 'cieplej wody', 'cwu', 'zasobnik', 'bojler', 'woda uzytkow', 'prysznic'], a: 'Pompa ciepła może też podgrzewać <b>wodę użytkową</b> – wtedy montujemy zasobnik CWU dobrany do liczby domowników. W kalkulatorze zaznacz opcję „Podgrzewanie wody” i ustaw liczbę osób.', act: ['calc'] },

    /* --- Chłodnictwo, elektryka --- */
    { id: 'chlodnictwo', t: 'chlod', k: ['chlodnic', 'chlodni', 'lada chlodn', 'mroz komor', 'komora chlod', 'agregat chlod', 'chlodzenie przemys', 'chlodzen produkc'], a: 'Zajmujemy się <b>montażem i serwisem urządzeń chłodniczych</b> oraz obsługą instalacji w zakładach produkcyjnych. Stawiamy na regularne przeglądy i szybką diagnostykę, żeby ograniczyć ryzyko przestojów. Zakres prac ustalamy indywidualnie.', act: ['pChlod', 'call'] },
    { id: 'elektryka', t: 'elek', k: ['elektry', 'prad w domu', 'instalacj elektr', 'gniazd', 'rozdziel', 'bezpieczni', 'okablow', 'przewod', 'oswietl', 'kontakt w scian', 'obwod', 'wymiana instalac', 'aluminiow', 'zasilani'], a: 'Wykonujemy <b>instalacje elektryczne w domach</b>: nowe instalacje, wymianę starych (np. aluminiowych), rozdzielnice i zabezpieczenia, gniazda i oświetlenie, a także <b>zasilanie pod klimatyzację i pompę ciepła</b>. Klienci chwalą nas w opiniach właśnie za elektrykę w całym domu.', act: ['pElek', 'call'] },
    { id: 'auto', k: ['samochod', 'auto ', 'aut ', 'pojazd', 'klimatyzacj samoch', 'odgrzybianie auta', 'w aucie', 'ciezarow', 'tir'], a: 'Nie zajmujemy się klimatyzacją samochodową – specjalizujemy się w klimatyzacji budynków (domy, mieszkania, biura, zakłady), pompach ciepła, chłodnictwie i elektryce. Z autem najlepiej zgłosić się do warsztatu samochodowego.', chips: ['Montaż klimatyzacji', 'Serwis i czyszczenie'] },
    { id: 'smart', k: ['smart', 'inteligentn dom', 'automatyk', 'brama', 'bramy', 'napedu', 'alarm', 'monitoring', 'kamery'], a: 'O smart home i automatykę bram najlepiej zapytać bezpośrednio – zakres takich prac potwierdzimy telefonicznie.', act: ['call'] },

    /* --- Ceny ogólne, wycena --- */
    { id: 'wycena', k: ['wycen', 'ogledzin', 'bezplatn', 'za darmo', 'darmow', 'przyjechac zobaczyc', 'dojazd', 'ile za dojazd'], a: 'Wycena jest <b>bezpłatna</b>: przyjeżdżamy na oględziny w Łodzi i okolicach, dobieramy urządzenie i podajemy <b>konkretną cenę przed rozpoczęciem prac</b> – bez „niespodzianek” na końcu. Orientacyjny koszt możesz też sprawdzić od razu w kalkulatorze.', act: ['form', 'calc', 'call'] },
    { id: 'kalkulator', k: ['kalkulator', 'policzyc', 'przeliczyc', 'jak dziala kalk', 'wyliczyc'], a: 'Kalkulator ma 3 zakładki: <b>montaż klimatyzacji, serwis i pompa ciepła</b>. Wybierasz parametry, a cena przelicza się na bieżąco. Przyciskiem „Dołącz wycenę do zapytania” wyślesz wynik razem z formularzem.', act: ['calc'] },
    { id: 'gwarancja', k: ['gwaranc', 'rekojm', 'reklamac'], a: 'Urządzenia objęte są <b>gwarancją producenta</b>, a jej warunkiem zwykle jest regularny przegląd – który wykonujemy. Szczegółowe warunki gwarancji na montaż omówimy przy wycenie.', act: ['call'] },
    { id: 'platnosc', k: ['platnos', 'zaplac', 'gotowk', 'przelew', 'karta', 'raty', 'faktur', 'paragon', 'vat', 'zaliczk'], a: 'Formę płatności i dokument sprzedaży (np. fakturę) ustalimy przy wycenie – śmiało zapytaj o to podczas rozmowy.', act: ['call'] },
    { id: 'uprawnienia', k: ['uprawnien', 'certyfik', 'f gaz', 'fgaz', 'sep', 'udt', 'cro', 'kwalifikac', 'licencj'], a: 'Chętnie przedstawimy szczegóły uprawnień i kwalifikacji – zapytaj podczas rozmowy telefonicznej lub w formularzu.', act: ['call', 'form'] },

    /* --- Firma, kontakt --- */
    { id: 'obszar', k: ['obszar', 'dojezdz', 'dojedzie', 'okolic', 'gdzie dzialac', 'jaki teren', 'miejscowos', 'zasieg', 'skad jest', 'przyjezdz', 'obslugujecie'], a: 'Działamy w <b>Łodzi i okolicach</b>: Rzgów, Pabianice, Tuszyn, Koluszki, Ksawerów, Andrespol, Zgierz, Konstantynów Łódzki, Brzeziny i pobliskie miejscowości woj. łódzkiego. Siedziba jest w Guzewie koło Rzgowa. Jeśli Twojej miejscowości nie ma na liście – zadzwoń, sprawdzimy.', act: ['call'] },
    { id: 'godziny', k: ['godzin', 'otwar', 'czynne', 'pracujecie', 'kiedy dzwonic', 'sobot', 'niedziel', 'weekend', 'zamkniet'], a: function () { return 'Godziny pracy:<ul><li>poniedziałek: <b>8:30–17:00</b></li><li>wtorek–piątek: <b>7:00–15:00</b></li><li>sobota–niedziela: nieczynne</li></ul>' + openStatus().text; }, act: ['call', 'form'] },
    { id: 'kontakt', k: ['kontakt', 'telefon', 'numer', 'zadzwon', 'dzwonic', 'mail', 'email', 'napisac', 'facebook', 'fb', 'messenger', 'jak sie skontakt'], a: 'Najszybciej:<ul><li>📞 telefon: <b>' + PHONE + '</b></li><li>✉️ e-mail: <b>' + EMAIL + '</b></li><li>💬 Facebook: strona „Ekoon”</li></ul>Możesz też wysłać formularz – oddzwonimy.', act: ['call', 'mail', 'form', 'fb'] },
    { id: 'adres', k: ['adres', 'siedzib', 'gdzie jestescie', 'biuro firmy', 'lokalizac', 'mapa', 'nip', 'regon', 'dane firmy'], a: 'Siedziba firmy: <b>Guzew 16, 95-030 Rzgów</b> (woj. łódzkie). Dane rejestrowe: EKOON TOMASZ ROMANOWSKI, NIP 727-265-83-90, REGON 101637222. Pracujemy u klienta – przed wizytą najlepiej zadzwonić.' },
    { id: 'kto', k: ['kto ', 'wlasciciel', 'tomasz', 'romanowski', 'o firmie', 'o was', 'doswiadcz', 'ile lat', 'od kiedy', 'zespol', 'ekipa', 'pracownik'], a: 'Firmę <b>ekoON</b> prowadzi <b>Tomasz Romanowski</b>, który osobiście prowadzi każde zlecenie – od oględzin po uruchomienie. Mamy <b>ponad 8 lat doświadczenia</b>, pod stałą opieką ponad 300 klimatyzatorów i 3 zakłady produkcyjne.', act: ['reviews'] },
    { id: 'opinie', k: ['opini', 'recenz', 'polec', 'ocen', 'gwiazdk', 'oferteo', 'zadowolen', 'referenc', 'solidn', 'mozna wam ufac'], a: 'Mamy <b>10 opinii na Oferteo – każda na 5 gwiazdek</b> (średnia 5,0). Klienci najczęściej chwalą czystość i dokładność, uczciwą wycenę, szybkie terminy i kulturę osobistą. Wielu wraca przy kolejnych zleceniach.', act: ['reviews', 'oferteo'] },
    { id: 'realizacje', k: ['realizac', 'zdjeci', 'portfolio', 'przyklad', 'prace', 'galeri', 'pokaz'], a: 'Wybrane realizacje – domy, firmy, serwisy i pompy ciepła – znajdziesz w galerii na stronie głównej (z filtrami).', act: ['gallery'] },
    { id: 'czystosc', k: ['czysto', 'porzad', 'brud', 'kurz', 'balagan', 'sprzat', 'meble', 'podlog'], a: 'Zabezpieczamy podłogi i meble, a po pracy <b>sprzątamy</b>. To cecha, którą klienci wymieniają w opiniach najczęściej („fachowo i bardzo czysto”).' },
    { id: 'rodo', k: ['rodo', 'dane osobow', 'prywatnos', 'cookies', 'ciastecz'], a: 'Dane z formularza służą wyłącznie do odpowiedzi na zapytanie. Strona nie używa narzędzi śledzących. Szczegóły w polityce prywatności.', act: ['privacy'] }
  ];

  var CHIPS_START = ['Ile kosztuje montaż?', 'Serwis i czyszczenie', 'Pompy ciepła', 'Obszar działania', 'Godziny pracy', 'Kontakt'];
  var PRICE_RE = /\b(ile kosz|ile to kosz|koszt|cen[aey]?\b|cenn|cenach|drogo|drogi|tanio|taniej|zl\b|zlot|za ile|ile bierz|ile wezm|ile zaplac|stawk)/;
  var TOPIC_RE = { pompa: /pomp|powietrze woda/, serwis: /serwis|przeglad|czyszcz|odgrzyb|napraw|diagnost/, elek: /elektr|gniazd|rozdziel|instalacj elektr/, chlod: /chlodnic|chlodni/, montaz: /montaz|klim|zamontow|split|klimatyzator/ };

  /* ---------------- Silnik odpowiedzi ---------------- */
  var ctx = store('ekoonChatCtx') || { topic: null };

  function topicOf(t) {
    for (var k in TOPIC_RE) if (TOPIC_RE[k].test(t)) return k;
    return null;
  }

  function score(intent, t, words) {
    var s = 0;
    intent.k.forEach(function (kw) {
      if (kw.indexOf(' ') > -1) { if ((' ' + t + ' ').indexOf(' ' + kw) > -1) s += 2; }
      else if (words.some(function (w) { return w.indexOf(kw) === 0 && (kw.length > 2 || w === kw); })) s += 1;
    });
    return s;
  }

  function reply(raw) {
    var t = norm(raw);
    var words = t.split(' ');
    var topic = topicOf(t);
    if (topic) ctx.topic = topic;

    // numer telefonu w wiadomości – przekazanie do formularza
    var phone = raw.replace(/[\s-]/g, '').match(/(\+?48)?\d{9}/);
    if (phone) {
      var num = phone[0];
      var f = document.getElementById('f-phone');
      if (f) {
        f.value = num;
        var msg = document.getElementById('f-msg');
        if (msg && !msg.value) msg.value = 'Proszę o kontakt (wiadomość z czatu).';
      }
      return { html: 'Dziękuję! ' + (f ? 'Wpisałem numer <b>' + esc(num) + '</b> do formularza – uzupełnij imię, zaznacz zgodę i kliknij „Wyślij zapytanie”, a oddzwonimy.' : 'Najszybciej będzie, jeśli wyślesz formularz z tym numerem albo zadzwonisz do nas.'), act: ['form'] };
    }

    // dobór mocy z metrażu
    var area = areaFrom(t);
    if (area && area >= 5 && area <= 1000) {
      if (/pomp|dom|ogrzew|budyn/.test(t) && !/pokoj|pomieszcz|salon|sypial|biur/.test(t)) { ctx.topic = 'pompa'; return { html: powerPump(area, t), act: ['calc', 'call'] }; }
      ctx.topic = 'montaz';
      return { html: powerAC(area, t), act: ['calc'], chips: ['Ile kosztuje montaż?'] };
    }

    // ceny
    if (PRICE_RE.test(t) && !/bezplat|darmo|eksploat|prad|rachun|zuzyc/.test(t)) {
      var tp = topic || ctx.topic;
      if (tp === 'serwis') return { html: priceSerwis(), act: ['calc', 'call'] };
      if (tp === 'pompa') return { html: pricePompa(), act: ['calc', 'call'] };
      if (tp === 'elek') return { html: 'Instalacje elektryczne wyceniamy <b>indywidualnie</b> – koszt zależy od wielkości domu, liczby obwodów i punktów oraz zakresu prac. Wycena po oględzinach jest bezpłatna.', act: ['call', 'form'] };
      if (tp === 'chlod') return { html: 'Prace chłodnicze i umowy serwisowe dla firm wyceniamy <b>indywidualnie</b>, po zapoznaniu się z instalacją.', act: ['call', 'form'] };
      if (tp === 'montaz') return { html: priceMontaz(), act: ['calc', 'form'], chips: ['Jaka moc do pokoju 25 m²?', 'Ile trwa montaż?'] };
      return { html: 'Chętnie podam orientacyjną cenę – czego dotyczy pytanie?', chips: ['Cena montażu klimatyzacji', 'Cena serwisu', 'Cena pompy ciepła', 'Cena elektryki'] };
    }

    // konkretna miejscowość
    var aboutArea = /dojezdz|dojedzie|dojazd|przyjedz|przyjezdz|dzialac|dzialaj|obslug|okolic|obszar|daleko|czy jestescie|robicie w|pracujecie w/.test(t) || words.length <= 3;
    for (var key in TOWNS) {
      if (!aboutArea) break;
      if ((' ' + t).indexOf(' ' + key) > -1) {
        return { html: 'Tak, <b>' + TOWNS[key] + '</b> jest w naszym obszarze działania 👍 Dojeżdżamy na bezpłatne oględziny i wycenę.', act: ['call', 'form'] };
      }
    }

    // intencje z bazy wiedzy
    var best = null, bestScore = 0;
    INTENTS.forEach(function (it) {
      var s = score(it, t, words);
      if (s > bestScore) { best = it; bestScore = s; }
    });
    if (best) {
      if (best.t) ctx.topic = best.t;
      return { html: typeof best.a === 'function' ? best.a() : best.a, act: best.act, chips: best.chips === 'start' ? CHIPS_START : best.chips };
    }

    // brak dopasowania, ale padł temat – ogólna odpowiedź o nim
    var byTopic = { montaz: 'montaz', serwis: 'serwis', pompa: 'pompa', elek: 'elektryka', chlod: 'chlodnictwo' }[topicOf(t)];
    if (byTopic) {
      var it2 = INTENTS.filter(function (x) { return x.id === byTopic; })[0];
      return { html: it2.a, act: it2.act, chips: it2.chips };
    }

    // pytanie doprecyzowujące w kontekście tematu
    if (/^(a |i )?(jak dlugo|ile trwa)/.test(t)) return reply('ile trwa montaż');

    return {
      html: 'Hmm, nie jestem pewien, czy dobrze rozumiem 🤔 Mogę pomóc w tych tematach – albo zadzwoń, a odpowiemy na każde pytanie.',
      act: ['call'], chips: CHIPS_START
    };
  }

  /* ---------------- Interfejs ---------------- */
  var LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#2BA8E0"/><rect width="40" height="40" rx="11" fill="url(#g-brand)"/><path d="M13.6 14.6a9 9 0 1 0 12.8 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M20 7.5c3.2 3 3.4 7.2 0 11.5-3.4-4.3-3.2-8.5 0-11.5z" fill="#fff"/></svg>';
  var I = function (id) { return '<svg class="ico" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };

  var root = document.createElement('div');
  root.className = 'chat';
  root.innerHTML =
    '<div class="chat__teaser" data-chat-teaser hidden>' +
      '<button type="button" class="chat__teaser-x" data-chat-teaser-x aria-label="Zamknij powiadomienie">' + I('x') + '</button>' +
      '<button type="button" class="chat__teaser-body" data-chat-open><span class="chat__teaser-av">' + LOGO + '</span><span><b>Cześć! 👋</b> Masz pytanie o klimatyzację, serwis albo ceny? Chętnie pomogę.</span></button>' +
    '</div>' +
    '<section class="chat__panel" data-chat-panel role="dialog" aria-label="Asystent ekoON" aria-modal="false" hidden>' +
      '<header class="chat__head">' +
        '<span class="chat__av">' + LOGO + '</span>' +
        '<span class="chat__title"><b>Asystent ekoON</b><small><i></i>Odpowiada od razu</small></span>' +
        '<button type="button" class="chat__icon-btn" data-chat-reset aria-label="Zacznij rozmowę od nowa" title="Zacznij od nowa">' + I('refresh') + '</button>' +
        '<button type="button" class="chat__icon-btn" data-chat-close aria-label="Zamknij czat">' + I('x') + '</button>' +
      '</header>' +
      '<div class="chat__log" data-chat-log aria-live="polite"></div>' +
      '<form class="chat__form" data-chat-form autocomplete="off">' +
        '<input type="text" data-chat-input placeholder="Napisz pytanie…" aria-label="Twoje pytanie" maxlength="300">' +
        '<button type="submit" aria-label="Wyślij">' + I('arrow') + '</button>' +
      '</form>' +
      '<p class="chat__foot">Automatyczny asystent · tel. <a href="' + PHONE_HREF + '">' + PHONE + '</a></p>' +
    '</section>' +
    '<button type="button" class="chat__launcher" data-chat-toggle aria-label="Otwórz czat z asystentem" aria-expanded="false">' +
      '<span class="chat__launcher-ico chat__launcher-ico--chat">' + I('chat') + '</span>' +
      '<span class="chat__launcher-ico chat__launcher-ico--x">' + I('x') + '</span>' +
      '<span class="chat__dot" data-chat-dot hidden>1</span>' +
    '</button>';
  document.body.appendChild(root);

  var $ = function (s) { return root.querySelector(s); };
  var panel = $('[data-chat-panel]'), log = $('[data-chat-log]'), input = $('[data-chat-input]'), toggle = $('[data-chat-toggle]');
  var teaser = $('[data-chat-teaser]'), dot = $('[data-chat-dot]');
  var history = store('ekoonChatLog') || [];
  var busy = false;

  function actionsHtml(act) {
    if (!act || !act.length) return '';
    return '<div class="chat__acts">' + act.map(function (k) {
      var a = A[k]; if (!a) return '';
      return '<a class="chat__act' + (a.primary ? ' chat__act--primary' : '') + '" href="' + a.href + '"' + (a.ext ? ' target="_blank" rel="noopener"' : '') + '>' + (a.primary ? I('phone') : '') + a.label + '</a>';
    }).join('') + '</div>';
  }
  function chipsHtml(chips) {
    if (!chips || !chips.length) return '';
    return '<div class="chat__chips">' + chips.map(function (c) { return '<button type="button" class="chat__chip" data-chip="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
  }
  function render(m, animate) {
    var el = document.createElement('div');
    el.className = 'chat__msg chat__msg--' + m.from + (animate ? ' is-new' : '');
    el.innerHTML = m.from === 'bot'
      ? '<span class="chat__msg-av">' + LOGO + '</span><div class="chat__bubble">' + m.html + actionsHtml(m.act) + '</div>'
      : '<div class="chat__bubble">' + esc(m.text) + '</div>';
    log.appendChild(el);
    $$chips();
    if (m.chips) { var c = document.createElement('div'); c.innerHTML = chipsHtml(m.chips); log.appendChild(c.firstChild); }
    log.scrollTop = log.scrollHeight;
  }
  function $$chips() { // tylko najnowsze podpowiedzi są aktywne
    Array.prototype.forEach.call(log.querySelectorAll('.chat__chips'), function (c) { c.parentNode.removeChild(c); });
  }
  function push(m) {
    history.push(m);
    if (history.length > 40) history = history.slice(-40);
    store('ekoonChatLog', history);
    store('ekoonChatCtx', ctx);
    render(m, true);
  }
  function botSay(r, delay) {
    busy = true;
    var typing = document.createElement('div');
    typing.className = 'chat__msg chat__msg--bot';
    typing.innerHTML = '<span class="chat__msg-av">' + LOGO + '</span><div class="chat__bubble chat__typing"><i></i><i></i><i></i></div>';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;
    setTimeout(function () {
      typing.parentNode.removeChild(typing);
      push({ from: 'bot', html: r.html, act: r.act, chips: r.chips });
      busy = false;
    }, delay || Math.min(1400, 450 + r.html.length * 2));
  }
  function ask(text) {
    text = String(text).trim();
    if (!text || busy) return;
    push({ from: 'user', text: text });
    botSay(reply(text));
  }
  function greet() {
    var s = openStatus();
    botSay({ html: 'Dzień dobry! 👋 Jestem asystentem <b>ekoON</b>. Pomogę z pytaniami o montaż i serwis klimatyzacji, pompy ciepła, ceny i terminy.' + (s.open ? '' : ' <span class="chat__muted">(Teraz jesteśmy poza godzinami pracy, ale ja odpowiadam zawsze.)</span>') + '<br>O co chcesz zapytać?', chips: CHIPS_START }, 500);
  }

  function open() {
    panel.hidden = false;
    root.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Zamknij czat');
    teaser.hidden = true; dot.hidden = true;
    store('ekoonChatSeen', 1);
    if (!log.children.length) { if (history.length) history.forEach(function (m) { render(m, false); }); else greet(); }
    setTimeout(function () { if (window.matchMedia('(min-width: 721px)').matches) input.focus(); log.scrollTop = log.scrollHeight; }, 60);
  }
  function close() {
    panel.hidden = true;
    root.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Otwórz czat z asystentem');
  }

  toggle.addEventListener('click', function () { panel.hidden ? open() : close(); });
  $('[data-chat-close]').addEventListener('click', close);
  root.querySelector('[data-chat-open]').addEventListener('click', open);
  $('[data-chat-teaser-x]').addEventListener('click', function () { teaser.hidden = true; store('ekoonChatSeen', 1); });
  $('[data-chat-reset]').addEventListener('click', function () {
    history = []; ctx = { topic: null }; store('ekoonChatLog', []); store('ekoonChatCtx', ctx);
    log.innerHTML = ''; greet();
  });
  $('[data-chat-form]').addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; ask(v); });
  log.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-chip]');
    if (chip) { ask(chip.getAttribute('data-chip')); return; }
    var a = e.target.closest('.chat__act');
    if (a && a.getAttribute('href').charAt(0) === '#' && window.matchMedia('(max-width: 720px)').matches) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
  root.addEventListener('click', function (e) { if (e.target === root) close(); });

  // Po kilku sekundach asystent sam pyta, czy w czymś pomóc (raz na wizytę)
  if (!store('ekoonChatSeen')) {
    setTimeout(function () {
      if (!panel.hidden) return;
      teaser.hidden = false; dot.hidden = false;
    }, 5000);
  }
})();
