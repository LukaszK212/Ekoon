# Zdjęcia – gdzie co wrzucić

Strona **sama wczytuje zdjęcia** – nie trzeba edytować HTML. Wystarczy zapisać plik
pod nazwą z tabeli (rozszerzenie `.webp` – zalecane – albo `.jpg`).
Dopóki pliku nie ma, w danym miejscu widać szary placeholder z opisem.

Zalecenia: WebP, jakość ~80, dłuższy bok 1600 px (hero 2000 px), poziome 4:3 lub 3:2,
zdjęcie właściciela pionowe 4:5.

| Plik (bez rozszerzenia) | Co powinno przedstawiać | Źródło z briefu (Oferteo) |
|---|---|---|
| `img/hero` | Zdjęcie główne – klimatyzator w ładnym wnętrzu | crop-imag3906 |
| `img/og.jpg` | Grafika do udostępnień FB – **już gotowa** (wygenerowana) | – |
| `img/uslugi/montaz-klimatyzacji` | Nowy klimatyzator na ścianie | 214422505-crop-imag3818 |
| `img/uslugi/firmy-agregaty-dach` | Agregaty na dachu firmy | 214415020-crop-imag3825 |
| `img/uslugi/pompa-ciepla-montaz` | Montaż pompy ciepła | – |
| `img/uslugi/elektryka-rozdzielnica` | Rozdzielnica elektryczna | 525lochp6lo-imag1641 |
| `img/uslugi/elektryka-dom` | Instalacja elektryczna w domu | – |
| `img/uslugi/elektryka-osprzet` | Osprzęt / oświetlenie | – |
| `img/realizacje/dom-kominek` | Wnętrze z marmurowym kominkiem | crop-imag3906 |
| `img/realizacje/dom-nad-drzwiami` | Szary klimatyzator nad drzwiami | crop-imag3918 |
| `img/realizacje/dom-korytarz` | Klimatyzator w korytarzu | crop-imag3912 |
| `img/realizacje/dom-czarny` | Czarny klimatyzator, szary pokój | 214412366-crop-imag3762 |
| `img/realizacje/dom-lg-dual-inverter` | LG Dual Inverter | 214422505-crop-imag3818 |
| `img/realizacje/dom-balkon-sinclair` | Agregat Sinclair na balkonie | 214424820-crop-imag3648 |
| `img/realizacje/firma-lg-dach` | Jednostki LG na dachu | 214415020-crop-imag3825 |
| `img/realizacje/firma-sinclair-dach` | Agregaty Sinclair na dachu | 214059905-crop-imag3760 |
| `img/realizacje/firma-biurowiec` | Klimatyzatory na elewacji biurowca | 214045042-crop-imag3518 |
| `img/realizacje/serwis-mitsubishi-zima` | Mitsubishi Electric na śniegu | 214024885-crop-imag2376 |
| `img/realizacje/serwis-czyszczenie` | Rozłożony klimatyzator | crop-imag3672 |
| `img/realizacje/serwis-przed` | Zaniedbany klimatyzator | xh0bi4weay-imag1993 |
| `img/realizacje/modernizacja-docieplenie` | Instalacja pod docieplenie | pis6ao0rce-imag2023 |
| `img/realizacje/pompa-vaillant` | Pompa ciepła Vaillant | 214035043-crop-imag2220 |
| `img/realizacje/pompa-kotlownia` | Kotły Vaillant w kotłowni | 214028848-crop-imag2218 |
| `img/realizacje/chlodnictwo-rury` | Izolowane rury chłodnicze | 214039218-crop-imag2221 |

Konwersja do WebP (np.): `cwebp -q 80 -resize 1600 0 zdjecie.jpg -o img/realizacje/dom-kominek.webp`

Logo: `img/logo.svg` (pełne) i `img/logo-znak.svg` (sam znak) – tymczasowy logotyp „ekoON”.
