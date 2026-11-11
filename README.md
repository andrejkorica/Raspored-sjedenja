# Raspored sjedenja

React aplikacija za slaganje rasporeda učenika u učionici. Svako mjesto u gridu predstavlja stolicu, a profesor je uvijek prikazan u sredini ispod učenika.

## Mogućnosti

- Kreiranje više učionica s prilagodljivim brojem redova i stupaca (od 2 × 2 do 20 × 20).
- Upisivanje, promjena i brisanje imena klikom na stolicu.
- Premještanje učenika povlačenjem stolica; zauzeta mjesta zamjenjuju učenike.
- Spremanje rasporeda i brisanje učionica.
- Lokalna pohrana učionica i rasporeda u SQLite bazi.

## Pokretanje

Potreban je **Node.js 24** i npm. U mapi projekta najprije instaliraj pakete:

```bash
npm install
```

Zatim otvori dva terminala u istoj mapi:

```bash
# Terminal 1: SQLite API
npm run server
```

```bash
# Terminal 2: React aplikacija
npm run dev
```

Otvori adresu koju ispiše Vite, obično [http://localhost:5173](http://localhost:5173). API radi na `http://localhost:3001`.

## Korištenje

1. Upiši naziv učionice i odaberi broj redova i stupaca pa klikni **Kreiraj učionicu**.
2. Klikni stolicu, upiši ime i klikni **Potvrdi**. **Odustani** zatvara unos bez promjene, a **Obriši** oslobađa mjesto.
3. Povuci popunjenu stolicu za premještanje učenika.
4. Klikni **Spremi raspored** kako bi promjene ostale zabilježene u bazi.

Tipka **Obriši učionicu** nalazi se ispod tlocrta i traži potvrdu prije brisanja.

## Struktura projekta

| Datoteka | Namjena |
| --- | --- |
| `src/main.jsx` | React sučelje i logika |
| `src/grid.css` | Grid i položaj stolica |
| `src/style.css` | Ostali stilovi |
| `server.js` | HTTP API i SQLite baza |
| `ucionice.sqlite` | Lokalni podaci; stvara se automatski i nije u Gitu |

Za produkcijski build pokreni `npm run build`.
