// Texty pro čtení s porozuměním – úrovně 1 a 2.
// Každá otázka = jedna úloha. `a` = správná odpověď, `d` = distraktory.

export type QuestionKind = 'detail' | 'proc' | 'hlavni' | 'poradi' | 'nazor';

export interface ReadingQuestion {
  kind: QuestionKind;
  q: string;
  a: string;
  d: string[];
  /** Konkrétní nápověda: kde v textu hledat (neprozrazuje odpověď). */
  hint: string;
  /** Vysvětlení: kde v textu odpověď je. */
  why: string;
}

export interface ReadingText {
  id: string;
  title: string;
  text: string;
  questions: ReadingQuestion[];
}

export const TEXTS_L1: ReadingText[] = [
  {
    id: 'jiskra-kaluz',
    title: 'Jiskra a kaluže',
    text: 'Malá dračice Jiskra ráda skáče do kaluží. Pokaždé postříká vodou i Ingrid. Obě se pak smějí a suší se u ohně.',
    questions: [
      {
        kind: 'detail',
        q: 'Kam ráda skáče Jiskra?',
        a: 'do kaluží',
        d: ['do sněhu', 'do moře', 'do listí'],
        hint: 'Odpověď je hned v první větě.',
        why: 'V textu stojí: „Malá dračice Jiskra ráda skáče do kaluží.“',
      },
      {
        kind: 'detail',
        q: 'Kde se Jiskra a Ingrid suší?',
        a: 'u ohně',
        d: ['na slunci', 've stáji', 'pod stromem'],
        hint: 'Podívej se na poslední větu.',
        why: 'Poslední věta říká, že se obě suší u ohně.',
      },
      {
        kind: 'detail',
        q: 'Kdo je Jiskra?',
        a: 'malá dračice',
        d: ['malá holčička', 'velká kočka', 'stará loď'],
        hint: 'Přečti si pozorně první větu.',
        why: 'V první větě se píše: „Malá dračice Jiskra…“',
      },
    ],
  },
  {
    id: 'jezek',
    title: 'Ježek',
    text: 'Ježek má na zádech ostré bodliny. Ve dne spí a v noci hledá potravu. Když se lekne, stočí se do klubíčka.',
    questions: [
      {
        kind: 'detail',
        q: 'Co má ježek na zádech?',
        a: 'bodliny',
        d: ['peří', 'šupiny', 'krunýř'],
        hint: 'Odpověď najdeš v první větě.',
        why: 'V textu stojí: „Ježek má na zádech ostré bodliny.“',
      },
      {
        kind: 'detail',
        q: 'Kdy ježek hledá potravu?',
        a: 'v noci',
        d: ['ráno', 've dne', 'v poledne'],
        hint: 'Hledej větu, ve které ježek spí.',
        why: 'Ve druhé větě se píše: „Ve dne spí a v noci hledá potravu.“',
      },
      {
        kind: 'detail',
        q: 'Co ježek udělá, když se lekne?',
        a: 'stočí se do klubíčka',
        d: ['vyleze na strom', 'skočí do vody', 'začne zpívat'],
        hint: 'Podívej se na poslední větu.',
        why: 'Poslední věta říká, že se ježek stočí do klubíčka.',
      },
    ],
  },
  {
    id: 'knut-chleb',
    title: 'Knut peče chléb',
    text: 'Knut peče chléb. Drak Kouřík mu pomáhá a opatrně fouká do pece. Za chvíli voní celá vesnice.',
    questions: [
      {
        kind: 'detail',
        q: 'Co peče Knut?',
        a: 'chléb',
        d: ['koláč', 'rohlíky', 'dort'],
        hint: 'Odpověď je v první větě.',
        why: 'Text začíná větou: „Knut peče chléb.“',
      },
      {
        kind: 'detail',
        q: 'Jak Knutovi pomáhá drak Kouřík?',
        a: 'fouká do pece',
        d: ['nosí vodu', 'myje nádobí', 'krájí chléb'],
        hint: 'Najdi větu, ve které je jméno Kouřík.',
        why: 'Ve druhé větě stojí, že Kouřík opatrně fouká do pece.',
      },
      {
        kind: 'detail',
        q: 'Co se stane za chvíli?',
        a: 'Celá vesnice voní.',
        d: ['Chléb se spálí.', 'Kouřík usne.', 'Začne pršet.'],
        hint: 'Podívej se na poslední větu.',
        why: 'Poslední věta říká: „Za chvíli voní celá vesnice.“',
      },
    ],
  },
  {
    id: 'vcely',
    title: 'Včely',
    text: 'Včely létají z květu na květ. Sbírají sladký nektar. Z nektaru potom v úlu vyrábějí med.',
    questions: [
      {
        kind: 'detail',
        q: 'Co včely vyrábějí z nektaru?',
        a: 'med',
        d: ['mléko', 'cukr', 'džem'],
        hint: 'Podívej se na poslední větu.',
        why: 'V textu stojí: „Z nektaru potom v úlu vyrábějí med.“',
      },
      {
        kind: 'detail',
        q: 'Kde včely vyrábějí med?',
        a: 'v úlu',
        d: ['v noře', 'na louce', 'v rybníce'],
        hint: 'Najdi větu, ve které je slovo med.',
        why: 'Poslední věta říká, že včely vyrábějí med v úlu.',
      },
      {
        kind: 'detail',
        q: 'Jaký je nektar?',
        a: 'sladký',
        d: ['slaný', 'kyselý', 'hořký'],
        hint: 'Hledej ve druhé větě.',
        why: 'Ve druhé větě se píše: „Sbírají sladký nektar.“',
      },
    ],
  },
  {
    id: 'liv-lodicka',
    title: 'Lodička',
    text: 'Liv vyřezala ze dřeva malou lodičku. Pustila ji po potoce. Dráček Mráček ji hlídal, aby neuplavala daleko.',
    questions: [
      {
        kind: 'detail',
        q: 'Z čeho byla lodička?',
        a: 'ze dřeva',
        d: ['z papíru', 'z kamene', 'z látky'],
        hint: 'Odpověď najdeš v první větě.',
        why: 'V textu stojí: „Liv vyřezala ze dřeva malou lodičku.“',
      },
      {
        kind: 'detail',
        q: 'Kde lodička plula?',
        a: 'po potoce',
        d: ['po moři', 'po jezeře', 've vaně'],
        hint: 'Podívej se na druhou větu.',
        why: 'Ve druhé větě se píše: „Pustila ji po potoce.“',
      },
      {
        kind: 'detail',
        q: 'Kdo lodičku hlídal?',
        a: 'Mráček',
        d: ['Liv', 'Knut', 'Frída'],
        hint: 'Najdi větu se slovem hlídal.',
        why: 'Poslední věta říká, že lodičku hlídal dráček Mráček.',
      },
    ],
  },
  {
    id: 'mesic',
    title: 'Měsíc',
    text: 'Večer na obloze svítí Měsíc. Někdy je kulatý jako talíř. Jindy je tenký jako rohlík.',
    questions: [
      {
        kind: 'detail',
        q: 'Jaký bývá Měsíc někdy?',
        a: 'kulatý jako talíř',
        d: ['hranatý jako kostka', 'zelený jako tráva', 'malý jako mravenec'],
        hint: 'Podívej se na druhou větu.',
        why: 'Ve druhé větě stojí: „Někdy je kulatý jako talíř.“',
      },
      {
        kind: 'detail',
        q: 'Čemu se podobá tenký Měsíc?',
        a: 'rohlíku',
        d: ['tužce', 'hvězdě', 'klobouku'],
        hint: 'Odpověď je v poslední větě.',
        why: 'Poslední věta říká: „Jindy je tenký jako rohlík.“',
      },
      {
        kind: 'detail',
        q: 'Kdy podle textu svítí Měsíc?',
        a: 'večer',
        d: ['ráno', 'v poledne', 'odpoledne'],
        hint: 'Podívej se na úplně první slovo textu.',
        why: 'Text začíná: „Večer na obloze svítí Měsíc.“',
      },
    ],
  },
  {
    id: 'sven-cepice',
    title: 'Kde je čepice?',
    text: 'Sven hledá svou čepici. Není pod postelí ani na stole. Nakonec ji najde na hlavě draka Hromíka.',
    questions: [
      {
        kind: 'detail',
        q: 'Co hledá Sven?',
        a: 'čepici',
        d: ['rukavici', 'botu', 'šálu'],
        hint: 'Odpověď je v první větě.',
        why: 'V textu stojí: „Sven hledá svou čepici.“',
      },
      {
        kind: 'detail',
        q: 'Kde Sven čepici nakonec najde?',
        a: 'na hlavě draka',
        d: ['pod postelí', 'na stole', 'v truhle'],
        hint: 'Hledej slovo nakonec.',
        why: 'Poslední věta říká, že čepici najde na hlavě draka Hromíka. Pod postelí ani na stole nebyla.',
      },
    ],
  },
  {
    id: 'cap',
    title: 'Čáp',
    text: 'Čáp má dlouhé červené nohy a červený zobák. Hnízdo si staví vysoko, třeba na komíně. Na zimu odlétá do teplých krajin.',
    questions: [
      {
        kind: 'detail',
        q: 'Jakou barvu má čapí zobák?',
        a: 'červenou',
        d: ['žlutou', 'modrou', 'zelenou'],
        hint: 'Odpověď najdeš v první větě.',
        why: 'V textu stojí: „Čáp má dlouhé červené nohy a červený zobák.“',
      },
      {
        kind: 'detail',
        q: 'Kde si čáp může postavit hnízdo?',
        a: 'na komíně',
        d: ['v trávě', 'pod vodou', 'v noře'],
        hint: 'Podívej se na druhou větu.',
        why: 'Ve druhé větě se píše, že si čáp staví hnízdo vysoko, třeba na komíně.',
      },
      {
        kind: 'detail',
        q: 'Kam čáp odlétá na zimu?',
        a: 'do teplých krajin',
        d: ['na severní pól', 'do sklepa', 'na vysoké hory'],
        hint: 'Odpověď je v poslední větě.',
        why: 'Poslední věta říká: „Na zimu odlétá do teplých krajin.“',
      },
    ],
  },
];

export const TEXTS_L2: ReadingText[] = [
  {
    id: 'frida-ovecka',
    title: 'Ztracená ovečka',
    text: 'Frídě se ráno ztratila ovečka Vločka. Frída si všimla, že v blátě jsou malé stopy. Stopy vedly až k lesu. Tam Vločka spokojeně spásala sladký jetel. Frída ji odvedla domů a dráček Plamínek letěl nad nimi.',
    questions: [
      {
        kind: 'detail',
        q: 'Jak se jmenovala ovečka?',
        a: 'Vločka',
        d: ['Mráček', 'Bublinka', 'Jiskra'],
        hint: 'Jméno ovečky je hned v první větě.',
        why: 'V první větě stojí: „Frídě se ráno ztratila ovečka Vločka.“',
      },
      {
        kind: 'detail',
        q: 'Podle čeho Frída ovečku našla?',
        a: 'podle stop v blátě',
        d: ['podle bečení', 'podle zvonečku', 'podle mapy'],
        hint: 'Čeho si Frída všimla v blátě?',
        why: 'Frída si všimla malých stop v blátě a ty vedly až k lesu.',
      },
      {
        kind: 'detail',
        q: 'Co dělala ovečka v lese?',
        a: 'spásala jetel',
        d: ['spala pod stromem', 'koupala se v potoce', 'hrála si s liškou'],
        hint: 'Najdi větu, která začíná slovem Tam.',
        why: 'V textu stojí: „Tam Vločka spokojeně spásala sladký jetel.“',
      },
    ],
  },
  {
    id: 'mravenci',
    title: 'Mravenci',
    text: 'Mravenci žijí v mraveništi. V jednom mraveništi jich může žít i mnoho tisíc. Každý mravenec má svou práci. Někteří nosí potravu, jiní se starají o vajíčka. Mravenec unese věc, která je mnohem těžší než on sám.',
    questions: [
      {
        kind: 'detail',
        q: 'Kde žijí mravenci?',
        a: 'v mraveništi',
        d: ['v úlu', 'v rybníce', 'v ptačí budce'],
        hint: 'Odpověď je v první větě.',
        why: 'Text začíná větou: „Mravenci žijí v mraveništi.“',
      },
      {
        kind: 'detail',
        q: 'Co dělají někteří mravenci?',
        a: 'nosí potravu',
        d: ['pletou sítě', 'staví hráze', 'zpívají písně'],
        hint: 'Hledej větu se slovem někteří.',
        why: 'V textu stojí: „Někteří nosí potravu, jiní se starají o vajíčka.“',
      },
      {
        kind: 'detail',
        q: 'Co je na mravencích podle textu zvláštní?',
        a: 'Unesou věc těžší, než jsou sami.',
        d: ['Umějí létat bez křídel.', 'Svítí ve tmě.', 'Žijí úplně sami.'],
        hint: 'Podívej se na poslední větu.',
        why: 'Poslední věta říká, že mravenec unese věc, která je mnohem těžší než on sám.',
      },
    ],
  },
  {
    id: 'olaf-syr',
    title: 'Utíkající sýr',
    text: 'Olaf nesl na trh velký kulatý sýr. Na kopci mu sýr vyklouzl z rukou a kutálel se dolů. Olaf běžel za ním, ale sýr byl rychlejší. Dole ho chytil drak Hromík do tlapek. Od té doby dostává Hromík na trhu vždycky kousek sýra zadarmo.',
    questions: [
      {
        kind: 'detail',
        q: 'Co nesl Olaf na trh?',
        a: 'sýr',
        d: ['chléb', 'ryby', 'vejce'],
        hint: 'Odpověď je v první větě.',
        why: 'V textu stojí: „Olaf nesl na trh velký kulatý sýr.“',
      },
      {
        kind: 'detail',
        q: 'Kdo sýr chytil?',
        a: 'drak Hromík',
        d: ['Olaf', 'prodavačka', 'pes'],
        hint: 'Najdi větu, která začíná slovem Dole.',
        why: 'V textu stojí: „Dole ho chytil drak Hromík do tlapek.“',
      },
      {
        kind: 'proc',
        q: 'Proč dostává Hromík na trhu sýr zadarmo?',
        a: 'Protože chytil Olafův sýr.',
        d: ['Protože umí zpívat.', 'Protože má narozeniny.', 'Protože je nejmenší drak.'],
        hint: 'Co Hromík udělal, když se sýr kutálel z kopce?',
        why: 'Hromík chytil sýr, který se kutálel z kopce. Od té doby dostává kousek sýra zadarmo.',
      },
    ],
  },
  {
    id: 'voda',
    title: 'Cesta vody',
    text: 'Když svítí slunce, voda z moří a rybníků se pomalu mění v páru. Pára stoupá vzhůru a vznikají z ní mraky. Když je v mracích hodně vody, začne pršet. Déšť zalije pole a naplní potoky a řeky. Řeky pak tečou zase do moře.',
    questions: [
      {
        kind: 'detail',
        q: 'Co vzniká z páry?',
        a: 'mraky',
        d: ['písek', 'kameny', 'hvězdy'],
        hint: 'Podívej se na druhou větu.',
        why: 'Ve druhé větě stojí: „Pára stoupá vzhůru a vznikají z ní mraky.“',
      },
      {
        kind: 'detail',
        q: 'Kdy začne pršet?',
        a: 'když je v mracích hodně vody',
        d: ['když fouká vítr', 'když svítí slunce', 'když je noc'],
        hint: 'Hledej větu se slovem pršet.',
        why: 'Ve třetí větě se píše: „Když je v mracích hodně vody, začne pršet.“',
      },
      {
        kind: 'detail',
        q: 'Kam tečou řeky?',
        a: 'do moře',
        d: ['do mraků', 'na kopec', 'do sklepa'],
        hint: 'Odpověď je v poslední větě.',
        why: 'Poslední věta říká: „Řeky pak tečou zase do moře.“',
      },
    ],
  },
  {
    id: 'sigrun-harfa',
    title: 'Ukolébavka pro Šupinku',
    text: 'Dračice Šupinka nemohla usnout. Sigrun jí zkusila zazpívat písničku. Šupinka ale jen zívla a otevřela jedno oko. Pak Sigrun začala tiše brnkat na malou harfu. Šupinka se stočila do klubíčka a za chvíli sladce spinkala.',
    questions: [
      {
        kind: 'proc',
        q: 'Proč Sigrun Šupince zpívala?',
        a: 'Šupinka nemohla usnout.',
        d: ['Šupinka měla narozeniny.', 'Sigrun se nudila.', 'Venku pršelo.'],
        hint: 'Podívej se na první větu.',
        why: 'Hned první věta říká, že Šupinka nemohla usnout. Proto jí Sigrun zpívala.',
      },
      {
        kind: 'detail',
        q: 'Co Šupince pomohlo usnout?',
        a: 'brnkání na harfu',
        d: ['písnička', 'teplé mléko', 'pohádka'],
        hint: 'Po písničce Šupinka ještě nespala. Co přišlo potom?',
        why: 'Po písničce Šupinka jen zívla. Usnula, až když Sigrun začala tiše brnkat na harfu.',
      },
      {
        kind: 'poradi',
        q: 'Co udělala Šupinka po písničce?',
        a: 'zívla a otevřela jedno oko',
        d: ['hned usnula', 'začala tancovat', 'odletěla pryč'],
        hint: 'Najdi větu, která začíná slovy Šupinka ale.',
        why: 'V textu stojí: „Šupinka ale jen zívla a otevřela jedno oko.“',
      },
    ],
  },
  {
    id: 'srdce',
    title: 'Srdce',
    text: 'Srdce je sval, který je velký asi jako tvoje pěst. Bije ve dne i v noci, i když spíš. Pumpuje krev do celého těla. Když běháš, srdce bije rychleji. Po odpočinku se zase zpomalí.',
    questions: [
      {
        kind: 'detail',
        q: 'Jak velké je srdce?',
        a: 'asi jako tvoje pěst',
        d: ['asi jako hrášek', 'asi jako meloun', 'asi jako bota'],
        hint: 'Odpověď je v první větě.',
        why: 'V textu stojí, že srdce je velké asi jako tvoje pěst.',
      },
      {
        kind: 'detail',
        q: 'Kdy srdce bije rychleji?',
        a: 'když běháš',
        d: ['když spíš', 'když odpočíváš', 'když ležíš'],
        hint: 'Hledej větu se slovem rychleji.',
        why: 'Ve čtvrté větě se píše: „Když běháš, srdce bije rychleji.“',
      },
      {
        kind: 'detail',
        q: 'Bije srdce i ve spánku?',
        a: 'Ano, bije i ve spánku.',
        d: ['Ne, v noci odpočívá.', 'Jen když se ti něco zdá.'],
        hint: 'Podívej se na druhou větu.',
        why: 'Druhá věta říká: „Bije ve dne i v noci, i když spíš.“',
      },
    ],
  },
  {
    id: 'bjorn-snehulak',
    title: 'Kýchající dráček',
    text: 'Bjorn stavěl před domem sněhuláka. Dráček Plamínek chtěl pomáhat, ale pořád kýchal jiskry. Sněhulákovi pokaždé roztála ruka. Nakonec Bjorn dal Plamínkovi šálu, aby mu nebyla zima. Plamínek přestal kýchat a sněhulák měl konečně obě ruce.',
    questions: [
      {
        kind: 'detail',
        q: 'Co stavěl Bjorn?',
        a: 'sněhuláka',
        d: ['hrad z písku', 'loď', 'boudu pro psa'],
        hint: 'Odpověď je v první větě.',
        why: 'V textu stojí: „Bjorn stavěl před domem sněhuláka.“',
      },
      {
        kind: 'proc',
        q: 'Proč sněhulákovi roztála ruka?',
        a: 'Plamínek kýchal jiskry.',
        d: ['Svítilo slunce.', 'Bjorn ji ulomil.', 'Začalo pršet.'],
        hint: 'Co pořád dělal Plamínek?',
        why: 'Plamínek pořád kýchal jiskry, a proto sněhulákovi pokaždé roztála ruka.',
      },
      {
        kind: 'detail',
        q: 'Čím Bjorn Plamínkovi pomohl?',
        a: 'dal mu šálu',
        d: ['dal mu čaj', 'poslal ho spát', 'dal mu rukavice'],
        hint: 'Najdi větu se slovem nakonec.',
        why: 'V textu stojí: „Nakonec Bjorn dal Plamínkovi šálu, aby mu nebyla zima.“',
      },
    ],
  },
  {
    id: 'snezka',
    title: 'Sněžka',
    text: 'Sněžka je nejvyšší hora v Česku. Leží v Krkonoších. Na vrchol vede turistická cesta a jezdí tam i lanovka. Nahoře často fouká silný vítr. Bývá tam chladno i v létě.',
    questions: [
      {
        kind: 'detail',
        q: 'Jak se jmenuje nejvyšší hora v Česku?',
        a: 'Sněžka',
        d: ['Říp', 'Praděd', 'Ještěd'],
        hint: 'Odpověď je hned na začátku textu.',
        why: 'Text začíná větou: „Sněžka je nejvyšší hora v Česku.“',
      },
      {
        kind: 'detail',
        q: 'V jakých horách leží Sněžka?',
        a: 'v Krkonoších',
        d: ['v Beskydech', 'na Šumavě', 'v Jeseníkách'],
        hint: 'Podívej se na druhou větu.',
        why: 'Ve druhé větě stojí: „Leží v Krkonoších.“',
      },
      {
        kind: 'detail',
        q: 'Jaké počasí bývá na vrcholu Sněžky?',
        a: 'často tam fouká silný vítr',
        d: ['je tam pořád vedro', 'nikdy tam nefouká', 'každý den tam je duha'],
        hint: 'Hledej větu se slovem nahoře.',
        why: 'V textu stojí: „Nahoře často fouká silný vítr.“ A bývá tam chladno i v létě.',
      },
    ],
  },
];
