# Dračí ostrovy

Vzdělávací hra pro děti na 1. stupni ZŠ ve světě Vikingů a draků. Hráčka si vylíhne vlastního draka, který se učí spolu s ní, a létá po ostrovech, z nichž každý rozvíjí jinou oblast (čísla, slova, lidské tělo, později svět, logika, finance a digitální svět).

Aplikace je samostatná vedle původní hry v kořeni repozitáře a nasazuje se na `/emma-minecraft-math/draci-ostrovy/`.

## Spuštění

```bash
npm ci
npm run dev      # vývojový server na http://localhost:3100/emma-minecraft-math/draci-ostrovy/
npm test         # testy generátorů úloh a adaptivního modelu
npm run build    # sestavení do ../dist/draci-ostrovy
```

## Jak to funguje

- **Úlohy** generují dovednosti (`SkillDef`) v `src/content/<ostrov>/`. Každá úloha nese úroveň L1–L6 (L1–L5 = očekávání RVP ZV 2021 pro 1.–5. ročník, L6 = nad rámec 1. stupně), kódy RVP, typ myšlení a případně příznak, že se formát podobá subtestu inteligence (`testLike`).
- **Adaptivní model** (`src/core/model.ts`) je Elo s mírou nejistoty pro každou dovednost. Plánovač (`src/core/planner.ts`) vybírá úlohy s cílovou úspěšností kolem 70–85 % a skládá „Dnešní let“ ze tří misí.
- **Odměny** nejsou měna za správné odpovědi: drak se učí nové kousky při zvládnutí vyššího stupně, přibývají dračí druhy a zápisy v deníku. Bez žebříčků, časovačů a sérií s trestem.
- **Rodičovský radar** (`src/core/radar.ts`, `src/ui/parent/`) za PINem ukazuje orientační signály podle Renzulliho tří kruhů a sebedůvěry – bez IQ a bez srovnání s jinými dětmi – a přehled trénovaných testových formátů.
- **Data** zůstávají jen v zařízení (localStorage + IndexedDB). Nic se neodesílá a hra nenačítá nic z cizích serverů – i písma (Nunito a Baloo 2, licence SIL OFL 1.1, balíčky `@fontsource`) jsou přibalená v `src/styles/fonts.css`.

## Pravidla pro obsah

- Bezchybná čeština, přiměřená věku, vlídný tón bez strašidelných témat.
- Žádná jména ani pojmy z filmů a knih o dracích a žádné osobní údaje dítěte (repozitář je veřejný). Jméno draka si hráčka zadá sama a uloží se jen v zařízení.
- Každá úloha má právě jednu správnou odpověď, postupné nápovědy, které neprozrazují výsledek, a vysvětlení. Kontroluje to `tests/validate.ts`.
