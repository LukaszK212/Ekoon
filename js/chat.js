/* ekoON – asystent czatu działający lokalnie (bez zewnętrznych usług).
   Prowadzi klienta do wyceny i zostawienia kontaktu; zgłoszenia trafiają do Netlify Forms (formularz „wycena”, pole zrodlo=czat).
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
    { id: 'kontakt', k: ['kontakt', 'telefon', 'numer', 'zadzwon', 'dzwonic', 'mail', 'email', 'napisac', 'facebook', 'fb', 'messenger', 'jak sie skontakt'], a: 'Najszybciej:<ul><li>📞 telefon: <b>' + PHONE + '</b></li><li>✉️ e-mail: <b>' + EMAIL + '</b></li><li>💬 Facebook: strona „Ekoon”</li></ul>Możesz też zostawić numer tutaj – oddzwonimy.', act: ['call', 'mail', 'fb'], chips: ['📞 Zamów oddzwonienie'] },
    { id: 'adres', k: ['adres', 'siedzib', 'gdzie jestescie', 'biuro firmy', 'lokalizac', 'mapa', 'nip', 'regon', 'dane firmy'], a: 'Siedziba firmy: <b>Guzew 16, 95-030 Rzgów</b> (woj. łódzkie). Dane rejestrowe: EKOON TOMASZ ROMANOWSKI, NIP 727-265-83-90, REGON 101637222. Pracujemy u klienta – przed wizytą najlepiej zadzwonić.' },
    { id: 'kto', k: ['kto ', 'wlasciciel', 'tomasz', 'romanowski', 'o firmie', 'o was', 'doswiadcz', 'ile lat', 'od kiedy', 'zespol', 'ekipa', 'pracownik'], a: 'Firmę <b>ekoON</b> prowadzi <b>Tomasz Romanowski</b>, który osobiście prowadzi każde zlecenie – od oględzin po uruchomienie. Mamy <b>ponad 8 lat doświadczenia</b>, pod stałą opieką ponad 300 klimatyzatorów i 3 zakłady produkcyjne.', act: ['reviews'] },
    { id: 'opinie', k: ['opini', 'recenz', 'polec', 'ocen', 'gwiazdk', 'oferteo', 'zadowolen', 'referenc', 'solidn', 'mozna wam ufac'], a: 'Mamy <b>10 opinii na Oferteo – każda na 5 gwiazdek</b> (średnia 5,0). Klienci najczęściej chwalą czystość i dokładność, uczciwą wycenę, szybkie terminy i kulturę osobistą. Wielu wraca przy kolejnych zleceniach.', act: ['reviews', 'oferteo'] },
    { id: 'realizacje', k: ['realizac', 'zdjeci', 'portfolio', 'przyklad', 'prace', 'galeri', 'pokaz'], a: 'Wybrane realizacje – domy, firmy, serwisy i pompy ciepła – znajdziesz w galerii na stronie głównej (z filtrami).', act: ['gallery'] },
    { id: 'czystosc', k: ['czysto', 'porzad', 'brud', 'kurz', 'balagan', 'sprzat', 'meble', 'podlog'], a: 'Zabezpieczamy podłogi i meble, a po pracy <b>sprzątamy</b>. To cecha, którą klienci wymieniają w opiniach najczęściej („fachowo i bardzo czysto”).' },
    { id: 'rodo', k: ['rodo', 'dane osobow', 'prywatnos', 'cookies', 'ciastecz'], a: 'Dane z formularza służą wyłącznie do odpowiedzi na zapytanie. Strona nie używa narzędzi śledzących. Szczegóły w polityce prywatności.', act: ['privacy'] }
  ];

  var CHIPS_INFO = ['Ile kosztuje montaż?', 'Ile trwa montaż?', 'Jak często serwisować?', 'Obszar działania', 'Godziny pracy'];
  var CHIPS_START = ['💰 Wycena klimatyzacji', '🔧 Serwis / czyszczenie', '🚨 Awaria – pilne', '🌿 Pompa ciepła', '🏢 Oferta dla firmy', '⚡ Instalacja elektryczna', '❓ Mam pytanie'];
  var PRICE_RE = /\b(ile kosz|ile to kosz|koszt|cen[aey]?\b|cenn|cenach|drogo|drogi|tanio|taniej|zl\b|zlot|za ile|ile bierz|ile wezm|ile zaplac|stawk)/;
  var BUY_RE = /\b(chce|chcial|potrzebuj|planuj|szukam|interesuj|zamow|umowi|umowic|wycen|ofert|zalozy|kupi|zamontowa|montowac|prosze o)/;
  var FAULT_RE = /\b(awari|nie dziala|nie chlodzi|nie grzeje|cieknie|kapie|leje sie|zepsul|psuje|kod bledu|usterk|nie wlacza)/;
  var TOPIC_RE = { pompa: /pomp|powietrze woda/, serwis: /serwis|przeglad|czyszcz|odgrzyb|napraw|diagnost/, elek: /elektr|gniazd|rozdziel|instalacj elektr/, chlod: /chlodnic|chlodni/, montaz: /montaz|klim|zamontow|split|klimatyzator/ };
  var TOPIC_FLOW = { montaz: 'montaz', serwis: 'serwis', pompa: 'pompa', elek: 'elektryka', chlod: 'firma' };
  var PATH = location.pathname;
  var PAGE_FLOW = /serwis/.test(PATH) ? 'serwis' : /pompy/.test(PATH) ? 'pompa' : /chlodnictwo/.test(PATH) ? 'firma' : /elektryczne/.test(PATH) ? 'elektryka' : 'montaz';

  /* ---------------- Silnik odpowiedzi (baza wiedzy) ---------------- */
  var ctx = store('ekoonChatCtx') || { topic: null, n: 0 };

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

  // Odpowiedź z bazy wiedzy; strict = zwróć null, gdy nic nie pasuje
  function answer(raw, strict) {
    var t = norm(raw);
    var words = t.split(' ');
    var topic = topicOf(t);
    if (topic) ctx.topic = topic;

    var area = areaFrom(t);
    if (area && area >= 5 && area <= 1000) {
      if (/pomp|dom|ogrzew|budyn/.test(t) && !/pokoj|pomieszcz|salon|sypial|biur/.test(t)) { ctx.topic = 'pompa'; return { html: powerPump(area, t), price: true }; }
      ctx.topic = 'montaz';
      return { html: powerAC(area, t), price: true };
    }

    if (PRICE_RE.test(t) && !/bezplat|darmo|eksploat|prad|rachun|zuzyc/.test(t)) {
      var tp = topic || ctx.topic;
      if (tp === 'serwis') return { html: priceSerwis(), price: true };
      if (tp === 'pompa') return { html: pricePompa(), price: true };
      if (tp === 'elek') return { html: 'Instalacje elektryczne wyceniamy <b>indywidualnie</b> – koszt zależy od wielkości domu, liczby obwodów i punktów oraz zakresu prac. Wycena po oględzinach jest bezpłatna.', price: true };
      if (tp === 'chlod') return { html: 'Prace chłodnicze i umowy serwisowe dla firm wyceniamy <b>indywidualnie</b>, po zapoznaniu się z instalacją.', price: true };
      if (tp === 'montaz') return { html: priceMontaz(), price: true };
      return { html: 'Chętnie podam cenę – czego dotyczy pytanie?', chips: ['Cena montażu klimatyzacji', 'Cena serwisu', 'Cena pompy ciepła', 'Cena elektryki'] };
    }

    var aboutArea = /dojezdz|dojedzie|dojazd|przyjedz|przyjezdz|dzialac|dzialaj|obslug|okolic|obszar|daleko|czy jestescie|robicie w|pracujecie w/.test(t) || words.length <= 3;
    for (var key in TOWNS) {
      if (!aboutArea) break;
      if ((' ' + t).indexOf(' ' + key) > -1) {
        return { html: 'Tak, <b>' + TOWNS[key] + '</b> jest w naszym obszarze działania 👍 Dojeżdżamy na <b>bezpłatne oględziny i wycenę</b>.', act: ['call'] };
      }
    }

    var best = null, bestScore = 0;
    INTENTS.forEach(function (it) {
      var s = score(it, t, words);
      if (s > bestScore) { best = it; bestScore = s; }
    });
    if (best) {
      if (best.t) ctx.topic = best.t;
      return { html: typeof best.a === 'function' ? best.a() : best.a, act: best.act, chips: best.chips === 'start' ? CHIPS_START : best.chips, id: best.id };
    }

    var byTopic = { montaz: 'montaz', serwis: 'serwis', pompa: 'pompa', elek: 'elektryka', chlod: 'chlodnictwo' }[topicOf(t)];
    if (byTopic) {
      var it2 = INTENTS.filter(function (x) { return x.id === byTopic; })[0];
      return { html: it2.a, act: it2.act, chips: it2.chips };
    }
    if (/^(a |i )?(jak dlugo|ile trwa)/.test(t)) return answer('ile trwa montaż');
    if (strict) return null;
    return {
      html: 'Hmm, nie jestem pewien, czy dobrze rozumiem 🤔 Najszybciej pomoże Ci <b>Tomasz</b> – zadzwoń albo zostaw numer, oddzwonimy. Mogę też od razu policzyć orientacyjną wycenę:',
      act: ['call'], chips: CHIPS_START
    };
  }

  /* ==================================================================
     ŚCIEŻKI SPRZEDAŻOWE – prowadzona wycena i zbieranie kontaktu
     ================================================================== */
  function num(t) { var m = String(t).match(/\d+/); return m ? parseInt(m[0], 10) : null; }
  function pick(chips, t) { // dopasowanie odpowiedzi do podpowiedzi
    var n = norm(t);
    for (var i = 0; i < chips.length; i++) {
      var c = norm(chips[i]);
      if (n === c || (n.length >= 3 && (c.indexOf(n) === 0 || n.indexOf(c) === 0))) return i;
    }
    return -1;
  }
  function est(label, min, max, note) {
    return '<div class="chat__est"><small>' + label + '</small><b>' + zl(min, max) + '</b>' + (note ? '<span>' + note + '</span>' : '') + '</div>';
  }
  function choice(chips, values) {
    return function (raw, t) { var i = pick(chips, t); return i < 0 ? null : (values ? values[i] : chips[i]); };
  }
  function bucket(chips, values, lo, hi) {
    return function (raw, t) {
      var i = pick(chips, t); if (i >= 0) return values[i];
      var v = num(t); return v && v >= lo && v <= hi ? v : null;
    };
  }

  var C = {
    place: ['Mieszkanie', 'Dom', 'Biuro / firma'],
    units: ['1', '2', '3', '4 lub więcej'],
    area: ['do 20 m²', '20–30 m²', '30–45 m²', 'ponad 45 m²'],
    when: ['Jak najszybciej', 'W ciągu miesiąca', 'Za kilka miesięcy', 'Na razie zbieram informacje'],
    skind: ['Przegląd i czyszczenie', 'Gruntowne czyszczenie', 'Coś nie działa'],
    sunits: ['1', '2–3', '4–9', '10 lub więcej'],
    splace: ['Dom / mieszkanie', 'Firma'],
    symptom: ['Nie chłodzi / nie grzeje', 'Cieknie woda', 'Wyświetla błąd', 'Głośno pracuje', 'Coś innego'],
    parea: ['do 120 m²', '120–180 m²', '180–250 m²', 'ponad 250 m²'],
    build: ['Nowy / energooszczędny', 'Ocieplony', 'Starszy, słabo ocieplony'],
    heat: ['Podłogówka', 'Grzejniki', 'Mieszane'],
    fneed: ['Umowa serwisowa', 'Klimatyzacja w biurze', 'Chłodnictwo w zakładzie'],
    funits: ['1–5', '6–20', '21–50', 'ponad 50'],
    escope: ['Nowa instalacja', 'Wymiana starej instalacji', 'Rozdzielnica / zabezpieczenia', 'Zasilanie pod klimę lub pompę'],
    eplace: ['Mieszkanie', 'Dom do 150 m²', 'Dom ponad 150 m²', 'Lokal / firma']
  };

  var FLOWS = {
    montaz: {
      intro: 'Świetnie, policzmy orientacyjny koszt – to tylko 4 krótkie pytania 🙂<br>',
      steps: [
        { k: 'place', q: 'Gdzie ma być klimatyzacja?', chips: C.place, parse: choice(C.place) },
        { k: 'units', q: 'Ile pomieszczeń chcesz klimatyzować?', chips: C.units, parse: bucket(C.units, [1, 2, 3, 4], 1, 12) },
        { k: 'area', q: function (d) { return 'Jaka jest powierzchnia ' + (d.units > 1 ? 'największego ' : '') + 'pomieszczenia? (możesz też wpisać liczbę)'; }, chips: C.area, parse: bucket(C.area, [18, 25, 38, 50], 5, 200) },
        { k: 'when', q: 'Na kiedy planujesz montaż?', chips: C.when, parse: choice(C.when) }
      ],
      result: function (d) {
        var p = P(); if (!p) return { html: '', summary: 'Montaż klimatyzacji', service: 'Montaż klimatyzacji' };
        var m = p.montaz, n = Math.min(d.units, 6);
        var need = d.area * 0.1 * (/biuro/i.test(d.place) ? 1.15 : 1);
        var size = m.sizes.filter(function (s) { return s >= need * 0.95; })[0] || 7;
        var dev = m.device.std[size], inst = 1 + (n - 1) * (1 - m.nextUnitDiscount);
        var min = dev[0] * n + m.install[0] * inst, max = dev[1] * n + m.install[1] * inst;
        var label = n + '× klimatyzator ok. ' + fmt1.format(size) + ' kW (klasa standard) z montażem';
        var html = 'Dziękuję! Oto orientacyjna wycena:' + est('Szacunkowy koszt', min, max, label) +
          'Cena zależy od trasy instalacji i wybranego modelu – <b>dokładną podamy po bezpłatnych oględzinach</b>, bez zobowiązań.' +
          (/najszybciej/i.test(d.when) ? ' Przy szybkim terminie warto działać od razu – w sezonie kalendarz szybko się zapełnia ☀️' : '');
        return { html: html, service: /biuro/i.test(d.place) ? 'Montaż klimatyzacji (firma)' : 'Montaż klimatyzacji',
          summary: 'Czat – montaż klimatyzacji: ' + d.place.toLowerCase() + ', ' + d.units + ' pom., największe ok. ' + d.area + ' m², termin: ' + d.when.toLowerCase() + '. Szacunek: ' + zl(min, max) + ' (' + label + ').' };
      }
    },
    serwis: {
      intro: 'Jasne, przygotujmy wycenę serwisu 🔧<br>',
      steps: [
        { k: 'kind', q: 'Czego potrzebujesz?', chips: C.skind, parse: function (raw, t) { var i = pick(C.skind, t); if (i === 2 || FAULT_RE.test(t)) return { switchTo: 'awaria' }; return i < 0 ? null : C.skind[i]; } },
        { k: 'units', q: 'Ile urządzeń trzeba obsłużyć?', chips: C.sunits, parse: bucket(C.sunits, [1, 2, 5, 10], 1, 500) },
        { k: 'place', q: 'To dom czy firma?', chips: C.splace, parse: choice(C.splace) }
      ],
      result: function (d) {
        var p = P(); var s = p ? p.serwis : null;
        var sc = /gruntown/i.test(d.kind) ? 'gruntowne' : 'czyszczenie';
        var html = '', summary = 'Czat – serwis: ' + d.kind.toLowerCase() + ', ' + d.units + ' urz., ' + d.place.toLowerCase() + '.';
        if (s) {
          var disc = 0; s.qtyDiscount.forEach(function (q) { if (!disc && d.units >= q[0]) disc = q[1]; });
          var min = s.scope[sc].price[0] * d.units * (1 - disc), max = s.scope[sc].price[1] * d.units * (1 - disc);
          html = 'Oto orientacyjna cena:' + est('Szacunkowy koszt', min, max, d.units + '× ' + s.scope[sc].label.toLowerCase() + (disc ? ' (z rabatem −' + disc * 100 + '%)' : ''));
          summary += ' Szacunek: ' + zl(min, max) + '.';
        }
        if (d.units >= 4 || /firma/i.test(d.place)) html += 'Przy kilku urządzeniach najkorzystniejsza jest <b>umowa serwisowa</b> – dodatkowy rabat i stały harmonogram przeglądów.';
        else html += 'Przegląd z czyszczeniem trwa ok. godziny na urządzenie, a termin dobierzemy pod Ciebie.';
        return { html: html, summary: summary, service: d.units >= 4 || /firma/i.test(d.place) ? 'Umowa serwisowa dla firmy' : 'Serwis / czyszczenie klimatyzacji' };
      }
    },
    awaria: {
      intro: '',
      steps: [{ k: 'symptom', q: 'Co się dzieje z urządzeniem?', chips: C.symptom, parse: function (raw, t) { var i = pick(C.symptom, t); return i >= 0 ? C.symptom[i] : (t.length > 3 ? raw.slice(0, 80) : null); } }],
      result: function (d) {
        var s = openStatus();
        return { html: 'Rozumiem – to trzeba sprawdzić 🔧 Ustalimy przyczynę i podamy koszt naprawy <b>przed jej wykonaniem</b>.<br>' + (s.open ? '<b>Najszybciej będzie zadzwonić teraz</b> – jesteśmy w pracy.' : s.text),
          act: ['call'], summary: 'Czat – AWARIA: ' + d.symptom + '.', service: 'Naprawa klimatyzacji', urgent: true };
      }
    },
    pompa: {
      intro: 'Super, dobierzmy pompę ciepła – 3 szybkie pytania 🌿<br>',
      steps: [
        { k: 'area', q: 'Jaka jest powierzchnia ogrzewana domu?', chips: C.parea, parse: bucket(C.parea, [100, 150, 210, 280], 40, 800) },
        { k: 'build', q: 'Jaki jest standard budynku?', chips: C.build, parse: choice(C.build) },
        { k: 'heat', q: 'Jakie masz ogrzewanie w domu?', chips: C.heat, parse: choice(C.heat) }
      ],
      result: function (d) {
        var p = P(); var w = /nowy/i.test(d.build) ? 40 : /starszy/i.test(d.build) ? 75 : 55;
        var need = d.area * w / 1000 + 1;
        var summary = 'Czat – pompa ciepła: ' + d.area + ' m², ' + d.build.toLowerCase() + ', ' + d.heat.toLowerCase() + ', zapotrzebowanie ok. ' + fmt1.format(need) + ' kW.';
        if (!p) return { html: '', summary: summary, service: 'Pompa ciepła' };
        var size = p.pompa.sizes.filter(function (s) { return s >= need * 0.95; })[0] || 16;
        var u = p.pompa.unit[size], min = u[0] + p.pompa.cwuTank[0], max = u[1] + p.pompa.cwuTank[1];
        if (!/podlog/i.test(d.heat)) { min += p.pompa.radiators[0]; max += p.pompa.radiators[1]; }
        return { html: 'Dziękuję! Wstępny dobór:' + est('Szacunkowy koszt z montażem', min, max, 'pompa ok. ' + size + ' kW + zasobnik ciepłej wody') +
          'Dokładną moc dobierzemy po oględzinach. Pomożemy też sprawdzić <b>dostępne dofinansowania</b> – to może sporo obniżyć koszt.',
          summary: summary + ' Szacunek: ' + zl(min, max) + '.', service: 'Pompa ciepła' };
      }
    },
    firma: {
      intro: 'Chętnie przygotujemy ofertę dla Twojej firmy 🏢<br>',
      steps: [
        { k: 'need', q: 'Czego dotyczy zapytanie?', chips: C.fneed, parse: choice(C.fneed) },
        { k: 'units', q: 'Ile urządzeń mniej więcej?', chips: C.funits, parse: choice(C.funits) }
      ],
      result: function (d) {
        return { html: 'Dziękuję! Dla firm przygotowujemy <b>ofertę indywidualną</b> – pod naszą stałą opieką jest już ponad 300 klimatyzatorów i 3 zakłady produkcyjne. W umowie serwisowej masz stały harmonogram przeglądów i priorytet przy awariach.',
          summary: 'Czat – firma: ' + d.need.toLowerCase() + ', urządzeń: ' + d.units + '.', service: /chlodnictwo/i.test(d.need) ? 'Chłodnictwo' : 'Umowa serwisowa dla firmy' };
      }
    },
    elektryka: {
      intro: 'Jasne, przygotujmy wycenę instalacji elektrycznej ⚡<br>',
      steps: [
        { k: 'scope', q: 'Czego dotyczy praca?', chips: C.escope, parse: choice(C.escope) },
        { k: 'place', q: 'Jaki to obiekt?', chips: C.eplace, parse: choice(C.eplace) }
      ],
      result: function (d) {
        return { html: 'Dziękuję! Instalacje elektryczne wyceniamy <b>indywidualnie, po bezpłatnych oględzinach</b> – koszt zależy od liczby obwodów i punktów. Klienci chwalą nas w opiniach właśnie za elektrykę w całym domu 👍',
          summary: 'Czat – elektryka: ' + d.scope.toLowerCase() + ', ' + d.place.toLowerCase() + '.', service: 'Instalacje elektryczne' };
      }
    },
    callback: {
      intro: '',
      steps: [],
      result: function () { return { html: '', summary: 'Czat – prośba o oddzwonienie.', service: '' }; }
    }
  };

  var CITY = ['Łódź', 'Rzgów', 'Pabianice', 'Tuszyn', 'Koluszki', 'Zgierz'];
  var LEAD = [
    { k: 'name', err: 'Podaj samo imię, np. Anna 🙂', q: function (d) { if (flow && flow.id === 'callback') return 'Oddzwonimy najszybciej, jak to możliwe. Jak masz na imię?'; return (d._urgent ? 'Jeśli wolisz, zostaw kontakt – oddzwonimy i umówimy diagnostykę.<br>' : 'Tomasz może oddzwonić z <b>dokładną wyceną</b> – bezpłatnie i bez zobowiązań.<br>') + 'Jak masz na imię?'; },
      chips: ['📞 Wolę zadzwonić sam'],
      parse: function (raw, t, d) {
        var ph = phoneOf(raw); if (ph) { d.phone = ph; return ''; }
        if (/\d/.test(raw)) return null;
        var w = raw.trim().replace(/[^A-Za-zÀ-ž\s-]/g, '').trim().split(/\s+/);
        if (!w[0] || w[0].length < 2 || w.length > 4) return null;
        return w[0].charAt(0).toUpperCase() + w[0].slice(1).toLowerCase();
      }, skip: function (d) { return d.name !== undefined; } },
    { k: 'phone', q: function (d) { return (d.name ? 'Dzięki, ' + esc(d.name) + '! ' : '') + 'Pod jaki numer telefonu oddzwonić?'; },
      err: 'Hmm, to nie wygląda na numer telefonu 🙂 Wpisz 9 cyfr, np. 600 100 200.',
      parse: function (raw) { return phoneOf(raw); }, skip: function (d) { return !!d.phone; } },
    { k: 'city', q: 'Z jakiej miejscowości jesteś? Wybierz albo wpisz.', chips: CITY,
      parse: function (raw) { var v = raw.trim(); return v.length >= 2 && v.length <= 40 ? v : null; }, skip: function (d) { return !!d.city; } },
    { k: 'confirm', q: function (d) {
        return 'Sprawdź, czy wszystko się zgadza:<div class="chat__summary">' +
          (d.name ? '<span>Imię</span><b>' + esc(d.name) + '</b>' : '') +
          '<span>Telefon</span><b>' + esc(d.phone) + '</b>' +
          (d.city ? '<span>Miejscowość</span><b>' + esc(d.city) + '</b>' : '') +
          (d._service ? '<span>Sprawa</span><b>' + esc(d._service) + '</b>' : '') +
          '</div><small class="chat__muted">Wysyłając, zgadzasz się na kontakt w sprawie zapytania (<a href="' + page('polityka-prywatnosci.html') + '" target="_blank" rel="noopener">polityka prywatności</a>).</small>';
      }, chips: ['✅ Wyślij zgłoszenie', '✏️ Zmień numer', '✖️ Anuluj'] }
  ];

  function phoneOf(raw) {
    var d = String(raw).replace(/[^\d+]/g, '');
    var m = d.match(/^(?:\+?48)?(\d{9})$/) || d.match(/(?:\+?48)?(\d{9})(?!\d)/);
    return m ? m[1].replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : null;
  }

  var flow = store('ekoonChatFlow') || null;
  var lead = store('ekoonLead') || null;
  function steps() { return FLOWS[flow.id].steps.concat(LEAD); }
  function stepIdx(k) { var s = steps(); for (var i = 0; i < s.length; i++) if (s[i].k === k) return i; return -1; }

  function prompt(prefix, act) {
    var st = steps()[flow.i];
    var q = typeof st.q === 'function' ? st.q(flow.data) : st.q;
    return { html: (prefix || '') + q, chips: st.chips, act: act };
  }
  function startFlow(id, pre, lead0) {
    flow = { id: id, i: 0, data: pre || {} };
    if (lead) { flow.data.name = flow.data.name !== undefined ? flow.data.name : lead.name; flow.data.phone = flow.data.phone || lead.phone; flow.data.city = flow.data.city || lead.city; }
    ctx.topic = { montaz: 'montaz', serwis: 'serwis', pompa: 'pompa', elektryka: 'elek', firma: 'chlod' }[id] || ctx.topic;
    return advance((lead0 || '') + FLOWS[id].intro);
  }
  function advance(prefix) {
    var d = flow.data, fs = FLOWS[flow.id].steps, act;
    prefix = prefix || '';
    if (flow.i >= fs.length && !d._done) {
      var res = FLOWS[flow.id].result(d);
      d._done = 1; d._summary = res.summary; d._service = res.service; d._urgent = !!res.urgent;
      if (res.html) prefix += res.html + '<br><br>';
      act = res.act;
    }
    var all = steps();
    while (all[flow.i] && all[flow.i].skip && all[flow.i].skip(d)) flow.i++;
    return prompt(prefix, act);
  }
  function cancelFlow(msg) {
    flow = null;
    return { html: msg || 'Nie ma sprawy – przerwałem 🙂 W każdej chwili możesz wrócić do wyceny albo zadać pytanie.', chips: ['📋 Bezpłatna wycena', '❓ Mam pytanie'] };
  }

  function flowInput(raw, t) {
    var st = steps()[flow.i];
    if (/^(anuluj|stop|koniec|rezygnuj|nie chce|nie dziekuje|przerwij)/.test(t)) return cancelFlow();
    if (st.k === 'confirm') {
      if (/wyslij|^tak|^ok|potwierdz|zgadza/.test(t)) return { send: true };
      if (/zmien|popraw|zly numer|bledny/.test(t)) { flow.data.phone = null; flow.i = stepIdx('phone'); return prompt(); }
      return prompt('Kliknij „Wyślij zgłoszenie”, żeby przekazać dane Tomaszowi 🙂<br>');
    }
    var v = st.parse(raw, t, flow.data);
    if (v && v.switchTo) return startFlow(v.switchTo, null, 'Przykro mi, że coś nie działa. ');
    if (v === null || v === undefined) {
      var a = answer(raw, true);
      if (a) {
        var p = prompt();
        return { html: a.html + '<br><br><b>Wracając do wyceny:</b> ' + p.html, chips: p.chips, act: a.act };
      }
      return prompt(st.err ? st.err + '<br>' : 'Wybierz jedną z odpowiedzi poniżej albo napisz własnymi słowami 🙂<br>');
    }
    flow.data[st.k] = v;
    flow.i++;
    return advance();
  }

  function callAnswer() {
    var s = openStatus();
    flow = null;
    return { html: 'Jasne! Zadzwoń: <b>' + PHONE + '</b>.<br>' + s.text, act: ['call'], chips: s.open ? ['❓ Mam pytanie'] : ['📞 Zamów oddzwonienie', '❓ Mam pytanie'] };
  }
  function chooseFlow() {
    return { html: 'Z przyjemnością przygotuję wycenę – <b>bezpłatnie i bez zobowiązań</b>. Czego dotyczy?', chips: CHIPS_START.slice(0, 6) };
  }

  function command(t) {
    var map = {
      'wycena klimatyzacji': function () { return startFlow('montaz'); },
      'policz koszt': function () { return startFlow(PAGE_FLOW); },
      'serwis czyszczenie': function () { return startFlow('serwis'); },
      'awaria pilne': function () { return startFlow('awaria', null, 'Pomogę szybko! '); },
      'pompa ciepla': function () { return startFlow('pompa'); },
      'oferta dla firmy': function () { return startFlow('firma'); },
      'instalacja elektryczna': function () { return startFlow('elektryka'); },
      'mam pytanie': function () { flow = null; return { html: 'Jasne, pytaj śmiało – o ceny, terminy, montaż, serwis czy obszar działania 🙂', chips: CHIPS_INFO }; },
      'bezplatna wycena': function () { return ctx.topic && TOPIC_FLOW[ctx.topic] ? startFlow(TOPIC_FLOW[ctx.topic]) : chooseFlow(); },
      'tak policz dla mnie': function () { return ctx.topic && TOPIC_FLOW[ctx.topic] ? startFlow(TOPIC_FLOW[ctx.topic]) : chooseFlow(); },
      'wole zadzwonic': callAnswer,
      'wole zadzwonic sam': callAnswer,
      'zamow oddzwonienie': function () { return startFlow('callback'); },
      'oddzwoncie': function () { return startFlow('callback'); }
    };
    return map[t] ? map[t]() : null;
  }

  // Dopisuje do odpowiedzi zachętę do wyceny / kontaktu
  function nudge(r, isPrice) {
    if (r.chips === CHIPS_START) return r;
    ctx.n = (ctx.n || 0) + 1;
    var chips = (r.chips || []).slice(0, 3);
    if (lead) {
      r.chips = chips.length ? chips : ['❓ Mam pytanie'];
      return r;
    }
    if (isPrice || r.price) {
      r.html += '<div class="chat__nudge">To ceny orientacyjne. <b>Chcesz konkretną wycenę dla siebie?</b> Odpowiedz na 3–4 pytania, a Tomasz oddzwoni z dokładną ceną.</div>';
      r.chips = ['✅ Tak, policz dla mnie', '📞 Wolę zadzwonić'];
      return r;
    }
    if (ctx.n % 2 === 1) {
      r.html += '<div class="chat__nudge">💡 Mogę od razu przygotować <b>bezpłatną wycenę</b> dla Ciebie – zajmie to 30 sekund.</div>';
    }
    r.chips = ['📋 Bezpłatna wycena'].concat(chips.filter(function (c) { return c !== '📋 Bezpłatna wycena'; }));
    return r;
  }

  function reply(raw) {
    var t = norm(raw);
    var cmd = command(t);
    if (cmd) return cmd;
    if (flow) return flowInput(raw, t);

    var ph = phoneOf(raw);
    if (ph) return startFlow('callback', { phone: ph }, 'Dziękuję! 🙂 ');

    var tp = topicOf(t);
    if (FAULT_RE.test(t)) return startFlow('awaria', null, 'Przykro mi, że coś nie działa. ');
    if (BUY_RE.test(t) && !PRICE_RE.test(t)) {
      if (tp) return startFlow(TOPIC_FLOW[tp]);
      if (/wycen|ofert|umowi/.test(t)) return chooseFlow();
    }
    var r = answer(raw);
    return nudge(r, PRICE_RE.test(t));
  }

  /* ---------------- Wysyłka zgłoszenia (Netlify Forms) ---------------- */
  function fillMainForm(d) {
    var set = function (id, v) { var el = document.getElementById(id); if (el && v) el.value = v; };
    set('f-name', d.name); set('f-phone', d.phone); set('f-city', d.city); set('f-service', d._service);
    var cf = document.querySelector('[data-calc-field]'); if (cf) cf.value = d._summary || '';
    var msg = document.getElementById('f-msg'); if (msg && !msg.value) msg.value = 'Proszę o kontakt (zgłoszenie z czatu).';
    return !!document.getElementById('f-phone');
  }
  function submitLead(d, cb) {
    var body = {
      'form-name': 'wycena', 'bot-field': '', imie: d.name || '', telefon: d.phone, email: '', miejscowosc: d.city || '',
      usluga: d._service || '', wiadomosc: 'Zgłoszenie z czatu na stronie (' + PATH + ').',
      'wycena-z-kalkulatora': d._summary || '', 'zgoda-rodo': 'tak', zrodlo: 'czat'
    };
    var enc = Object.keys(body).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(body[k]); }).join('&');
    if (location.protocol === 'file:' || !window.fetch) { cb(false); return; }
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: enc })
      .then(function (r) { cb(r.ok); }).catch(function () { cb(false); });
  }
  function sendResult(ok, d) {
    flow = null;
    if (ok) {
      lead = { name: d.name, phone: d.phone, city: d.city };
      store('ekoonLead', lead);
      var s = openStatus();
      return { html: 'Dziękuję' + (d.name ? ', ' + esc(d.name) : '') + '! ✅ <b>Zgłoszenie dotarło.</b> Tomasz oddzwoni na numer <b>' + esc(d.phone) + '</b> ' +
        (s.open ? 'najszybciej, jak to możliwe.' : 'w najbliższych godzinach pracy.') + '<br>Gdyby sprawa była pilna – dzwoń śmiało.', act: ['call'], chips: ['❓ Mam pytanie'] };
    }
    var filled = fillMainForm(d);
    return { html: 'Ups, nie udało się wysłać zgłoszenia automatycznie 😕 ' + (filled ? 'Wpisałem Twoje dane do formularza – wystarczy zaznaczyć zgodę i kliknąć „Wyślij zapytanie”. ' : '') + 'Możesz też po prostu zadzwonić.', act: filled ? ['call', 'form'] : ['call', 'form'] };
  }

  /* ---------------- Interfejs ---------------- */
  var LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#2BA8E0"/><rect width="40" height="40" rx="11" fill="url(#g-brand)"/><path d="M13.6 14.6a9 9 0 1 0 12.8 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M20 7.5c3.2 3 3.4 7.2 0 11.5-3.4-4.3-3.2-8.5 0-11.5z" fill="#fff"/></svg>';
  var I = function (id) { return '<svg class="ico" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  var TEASER = {
    montaz: /montaz/.test(PATH) ? 'Ile kosztuje klimatyzacja u Ciebie? <b>Policzę w 30 sekund</b> – bez zobowiązań.' : '<b>Cześć! 👋</b> Planujesz klimatyzację? <b>Policzę orientacyjny koszt w 30 sekund</b> – bez zobowiązań.',
    serwis: 'Czas na przegląd klimatyzacji? 🔧 <b>Sprawdź cenę i umów termin</b> w 30 sekund.',
    pompa: 'Myślisz o pompie ciepła? 🌿 <b>Dobiorę moc i policzę koszt</b> w 30 sekund.',
    firma: 'Szukasz serwisu dla firmy? 🏢 <b>Przygotujemy indywidualną ofertę.</b>',
    elektryka: 'Planujesz elektrykę? ⚡ <b>Umów bezpłatną wycenę</b> w 30 sekund.'
  };

  var root = document.createElement('div');
  root.className = 'chat';
  root.innerHTML =
    '<div class="chat__teaser" data-chat-teaser hidden>' +
      '<button type="button" class="chat__teaser-x" data-chat-teaser-x aria-label="Zamknij powiadomienie">' + I('x') + '</button>' +
      '<div class="chat__teaser-body"><span class="chat__teaser-av">' + LOGO + '</span><div><span data-chat-teaser-text>' + TEASER[PAGE_FLOW] + '</span>' +
        '<div class="chat__teaser-acts"><button type="button" class="chat__teaser-btn chat__teaser-btn--main" data-chat-start>' + (PAGE_FLOW === 'firma' ? 'Zapytaj o ofertę' : 'Policz koszt') + '</button><button type="button" class="chat__teaser-btn" data-chat-open>Mam pytanie</button></div></div></div>' +
    '</div>' +
    '<section class="chat__panel" data-chat-panel role="dialog" aria-label="Asystent ekoON" aria-modal="false" hidden>' +
      '<header class="chat__head">' +
        '<span class="chat__av">' + LOGO + '</span>' +
        '<span class="chat__title"><b>Asystent ekoON</b><small><i></i>Online · bezpłatna wycena</small></span>' +
        '<button type="button" class="chat__icon-btn" data-chat-reset aria-label="Zacznij rozmowę od nowa" title="Zacznij od nowa">' + I('refresh') + '</button>' +
        '<button type="button" class="chat__icon-btn" data-chat-close aria-label="Zamknij czat">' + I('x') + '</button>' +
      '</header>' +
      '<div class="chat__log" data-chat-log aria-live="polite"></div>' +
      '<form class="chat__form" data-chat-form autocomplete="off">' +
        '<input type="text" data-chat-input placeholder="Napisz wiadomość…" aria-label="Twoja wiadomość" maxlength="300">' +
        '<button type="submit" aria-label="Wyślij">' + I('arrow') + '</button>' +
      '</form>' +
      '<p class="chat__foot">Wolisz porozmawiać? <a href="' + PHONE_HREF + '">' + I('phone') + PHONE + '</a></p>' +
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
    return '<div class="chat__chips">' + chips.map(function (c) { return '<button type="button" class="chat__chip' + (/^(✅|💰|📋)/.test(c) ? ' chat__chip--main' : '') + '" data-chip="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
  }
  function render(m, animate) {
    var el = document.createElement('div');
    el.className = 'chat__msg chat__msg--' + m.from + (animate ? ' is-new' : '');
    el.innerHTML = m.from === 'bot'
      ? '<span class="chat__msg-av">' + LOGO + '</span><div class="chat__bubble">' + m.html + actionsHtml(m.act) + '</div>'
      : '<div class="chat__bubble">' + esc(m.text) + '</div>';
    log.appendChild(el);
    clearChips();
    if (m.chips) { var c = document.createElement('div'); c.innerHTML = chipsHtml(m.chips); log.appendChild(c.firstChild); }
    log.scrollTop = log.scrollHeight;
  }
  function clearChips() { // tylko najnowsze podpowiedzi są aktywne
    Array.prototype.forEach.call(log.querySelectorAll('.chat__chips'), function (c) { c.parentNode.removeChild(c); });
  }
  function save() {
    if (history.length > 40) history = history.slice(-40);
    store('ekoonChatLog', history); store('ekoonChatCtx', ctx); store('ekoonChatFlow', flow);
  }
  function push(m) { history.push(m); save(); render(m, true); }
  function typing() {
    var el = document.createElement('div');
    el.className = 'chat__msg chat__msg--bot';
    el.innerHTML = '<span class="chat__msg-av">' + LOGO + '</span><div class="chat__bubble chat__typing"><i></i><i></i><i></i></div>';
    log.appendChild(el); clearChips(); log.scrollTop = log.scrollHeight;
    return el;
  }
  function botSay(r, delay) {
    busy = true;
    var el = typing();
    setTimeout(function () {
      el.parentNode.removeChild(el);
      push({ from: 'bot', html: r.html, act: r.act, chips: r.chips });
      busy = false;
    }, delay || Math.min(1300, 450 + r.html.length * 1.5));
  }
  function ask(text) {
    text = String(text).trim();
    if (!text || busy) return;
    push({ from: 'user', text: text });
    var r = reply(text);
    if (r.send) {
      var d = flow.data;
      busy = true;
      var el = typing();
      submitLead(d, function (ok) {
        setTimeout(function () {
          el.parentNode.removeChild(el);
          push(Object.assign({ from: 'bot' }, sendResult(ok, d)));
          busy = false;
        }, 600);
      });
      return;
    }
    botSay(r);
  }
  function greet() {
    var s = openStatus();
    botSay({ html: 'Dzień dobry! 👋 Jestem asystentem <b>ekoON</b>. Policzę orientacyjny koszt i dobiorę rozwiązanie, a Tomasz oddzwoni z dokładną wyceną – <b>bezpłatnie i bez zobowiązań</b>.' +
      (s.open ? '' : '<br><span class="chat__muted">Teraz jesteśmy poza godzinami pracy – zostaw numer, oddzwonimy w najbliższym dniu roboczym.</span>') + '<br>W czym mogę pomóc?', chips: CHIPS_START }, 500);
  }

  function open(startId) {
    panel.hidden = false;
    root.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Zamknij czat');
    teaser.hidden = true; dot.hidden = true;
    store('ekoonChatSeen', 1);
    if (!log.children.length && history.length) history.forEach(function (m) { render(m, false); });
    if (startId) botSay(startFlow(startId), 500);
    else if (!log.children.length) greet();
    setTimeout(function () { if (window.matchMedia('(min-width: 721px)').matches) input.focus(); log.scrollTop = log.scrollHeight; }, 60);
  }
  function close() {
    panel.hidden = true;
    root.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Otwórz czat z asystentem');
  }
  function showTeaser(html) {
    if (!panel.hidden) return;
    if (html) $('[data-chat-teaser-text]').innerHTML = html;
    teaser.hidden = false; dot.hidden = false;
  }

  toggle.addEventListener('click', function () { panel.hidden ? open() : close(); });
  $('[data-chat-close]').addEventListener('click', close);
  $('[data-chat-open]').addEventListener('click', function () { open(); });
  $('[data-chat-start]').addEventListener('click', function () { open(flow ? null : PAGE_FLOW); });
  $('[data-chat-teaser-x]').addEventListener('click', function () { teaser.hidden = true; dot.hidden = true; store('ekoonChatSeen', 1); });
  $('[data-chat-reset]').addEventListener('click', function () {
    history = []; ctx = { topic: null, n: 0 }; flow = null; save();
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

  // Po kilku sekundach asystent sam proponuje wycenę (raz na wizytę)
  if (!store('ekoonChatSeen') && !lead) setTimeout(function () { showTeaser(); }, 6000);

  // Na komputerze: gdy kursor wyjeżdża poza stronę (zamiar wyjścia) – jedna, ostatnia propozycja
  if (window.matchMedia('(hover: hover) and (min-width: 721px)').matches) {
    document.addEventListener('mouseout', function (e) {
      if (e.relatedTarget || e.clientY > 10 || lead || store('ekoonChatExit') || !panel.hidden) return;
      store('ekoonChatExit', 1);
      showTeaser('Zanim wyjdziesz 👋 <b>Policzę orientacyjny koszt w 30 sekund</b> – bezpłatnie i bez zobowiązań.');
    });
  }
})();
