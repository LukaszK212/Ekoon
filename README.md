# ekoON – strona internetowa

Statyczna strona (HTML + CSS + JS, bez budowania) dla firmy **ekoON Tomasz Romanowski** –
klimatyzacja, chłodnictwo, pompy ciepła i instalacje elektryczne, Łódź i okolice.

## Podgląd lokalny

Otwórz `index.html` w przeglądarce albo uruchom serwer (lepiej – działają wtedy zdjęcia i formularz):

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## Struktura

| Plik | Zawartość |
|---|---|
| `index.html` | Strona główna (one-page): hero, usługi, **kalkulator wyceny**, dla firm, o nas, realizacje (galeria z filtrami i lightboxem), proces, opinie, marki, FAQ, kontakt |
| `montaz-klimatyzacji-lodz.html`, `serwis-klimatyzacji-lodz.html`, `pompy-ciepla-lodz.html`, `chlodnictwo-lodz.html`, `instalacje-elektryczne-lodz.html` | Podstrony usług pod lokalne SEO |
| `polityka-prywatnosci.html`, `polityka-cookies.html` | Dokumenty prawne (wersje robocze) |
| `dziekujemy.html`, `404.html` | Strona po wysłaniu formularza, strona błędu |
| `css/style.css` | Style (paleta i typografia w zmiennych na górze pliku) |
| `js/main.js` | Menu, animacje, galeria, karuzela, godziny otwarcia, **kalkulator** |
| `img/` | Zdjęcia – patrz `img/README.md` |
| `netlify.toml`, `robots.txt`, `sitemap.xml` | Hosting i SEO |

## Zdjęcia

Miejsca na zdjęcia są puste (placeholdery). Wrzuć plik o nazwie z `img/README.md`
(np. `img/hero.webp`) – strona wczyta go automatycznie.

## Kalkulator wyceny

Ceny są **orientacyjne i przykładowe** – do potwierdzenia z klientem. Wszystkie stawki są
w jednym miejscu: obiekt `PRICES` w `js/main.js`. Wycenę z kalkulatora można jednym kliknięciem
dołączyć do formularza (ukryte pole `wycena-z-kalkulatora`).

## Dane tymczasowe – do podmiany przed publikacją

Szukaj i zamieniaj we wszystkich plikach `.html` (oraz w `polityka-*.html`):

| Tymczasowo | Gdzie |
|---|---|
| `500 600 700`, `+48 500 600 700`, `+48500600700` | telefon (linki `tel:`, treść, JSON-LD) |
| `kontakt@ekoon.pl` | e-mail |
| `https://ekoon.pl/` | domena (canonical, og, sitemap, robots, JSON-LD) |
| „ponad 8 lat” / `8+` | doświadczenie – brief podaje 8 lub 16 lat |
| ceny w `PRICES` (`js/main.js`) | kalkulator |

Do potwierdzenia u klienta (z briefu): adres, lista miejscowości, godziny, marki/autoryzacje,
uprawnienia F-gaz i SEP (warto dodać na stronę), gwarancja, czy smart home i automatyka bram są w ofercie,
zgoda na publikację opinii z Oferteo i zdjęć.

## Wdrożenie na Netlify

1. Netlify → *Add new site* → *Import from Git* → to repozytorium.
2. Build command: puste, publish directory: `.` (ustawione w `netlify.toml`).
3. Formularz `wycena` wykryje Netlify Forms automatycznie (atrybut `data-netlify`).
   W *Forms → Notifications* ustaw powiadomienie e-mail do klienta.
4. Podepnij domenę i włącz HTTPS.
