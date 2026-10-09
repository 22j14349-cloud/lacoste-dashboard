/*
 * Lacoste dashboard — single source of truth.
 * Every figure carries a status ("reported" = stated by the company or a named
 * executive / filing; "estimate" = derived by this dashboard from reported
 * figures, method in `note`) and source ids that resolve to `sources` below.
 * Research cut-off: 9 October 2026.
 */
window.LACOSTE_DATA = {
  asOf: "9 Oct 2026",

  sources: {
    s1:  { pub: "Wikipedia", title: "Lacoste", date: "accessed Oct 2026", url: "https://en.wikipedia.org/wiki/Lacoste" },
    s2:  { pub: "Lacoste (corporate)", title: "Our history", date: "accessed Oct 2026", url: "https://corporate.lacoste.com/our-history/" },
    s3:  { pub: "Lacoste (corporate)", title: "Lacoste news", date: "Oct 2025 – Oct 2026", url: "https://corporate.lacoste.com/lacoste-news/" },
    s4:  { pub: "Lacoste (corporate)", title: "Planet — Durable Elegance", date: "accessed Oct 2026", url: "https://corporate.lacoste.com/planet-durable-elegance/" },
    s5:  { pub: "Lacoste", title: "Climate Report FY2025 (PDF)", date: "Jun 2026", url: "https://corporate.lacoste.com/app/uploads/2026/06/Lacoste_Climate_Report_FY2025.pdf" },
    s6:  { pub: "Lacoste Careers", title: "Our company — key figures", date: "accessed Oct 2026", url: "https://careers.lacoste.com/" },
    s7:  { pub: "Jing Daily", title: "Lacoste eyes US expansion with Fifth Avenue flagship plans", date: "Feb 2025", url: "https://jingdaily.com/intels/2025-02/03/lacoste-eyes-us-expansion-with-fifth-avenue-flagship-plans" },
    s8:  { pub: "FashionUnited", title: "Lacoste eyes US market push in effort to reach four billion euros in sales", date: "Jan 2025", url: "https://fashionunited.ca/news/business/lacoste-eyes-us-market-push-in-effort-to-reach-four-billion-euros-in-sales/2025012838402" },
    s9:  { pub: "Modaes", title: "Lacoste crece un 26% en 2022 y pone rumbo a los 3.000 millones de euros en 2024", date: "2023", url: "https://www.modaes.com/empresa/lacoste-crece-un-26-en-2022-y-pone-rumbo-a-los-3000-millones-de-euros-en-2024" },
    s10: { pub: "FashionNetwork", title: "Lacoste president Thierry Guibert on the brand's growth and strategy for 2023", date: "2023", url: "https://ae.fashionnetwork.com/news/Lacoste-president-thierry-guibert-on-the-brand-s-growth-and-strategy-for-2023,1475656.html" },
    s11: { pub: "FashionNetwork", title: "Maus Frères International devient MF Brands Group", date: "Mar 2020", url: "https://fr.fashionnetwork.com/news/Maus-freres-international-devient-mf-brands-group,1194206.html" },
    s12: { pub: "FashionUnited", title: "Maus Frères acquires 100 percent of Lacoste", date: "Nov 2012", url: "https://fashionunited.com/executive/report/maus-freres-acquires-100-percent-of-lacoste/2012111619711" },
    s13: { pub: "RetailNews Asia", title: "Lacoste ousts CEO Eric Vallat as Thierry Guibert takes helm", date: "Oct 2026", url: "https://retailnews.asia/lacoste-ousts-ceo-eric-vallat-as-thierry-guibert-takes-helm" },
    s14: { pub: "FashionUnited", title: "Lacoste taps Rémy Cointreau Group head as CEO", date: "Jun 2025", url: "https://fashionunited.com/news/people/lacoste-taps-remy-cointreau-group-head-as-ceo/2025062766856" },
    s15: { pub: "FashionNetwork", title: "Lacoste unveils new visual identity", date: "Apr 2026", url: "https://be.fashionnetwork.com/en-be/news/Lacoste-unveils-new-visual-identity,1825554.html" },
    s16: { pub: "Interparfums (AMF filing)", title: "First-half 2025 sales", date: "Jul 2025", url: "https://echanges.dila.gouv.fr/OPENDATA/AMF/ECO/2025/07/FCECO079189_20250724.pdf" },
    s17: { pub: "Cosmetics Business", title: "Interparfums full-year sales up despite lagging US performance", date: "Jan 2026", url: "https://www.cosmeticsbusiness.com/interparfums-full-year-sales-up-despite-us-performance" },
    s18: { pub: "Xerfi", title: "Lacoste France — company profile", date: "2025", url: "https://www.xerfi.com/etudes-par-entreprise/lacoste-france_307258301" },
    s19: { pub: "LSA (citing Le Figaro)", title: "Lacoste annonce la meilleure performance de son histoire", date: "2012", url: "https://www.lsa-conso.fr/lacoste-annonce-la-meilleure-performance-de-son-histoire,128428" },
    s20: { pub: "Social Blade", title: "@lacoste Instagram statistics", date: "2026", url: "https://socialblade.com/instagram/user/lacoste" },
    s21: { pub: "Ralph Lauren Corp.", title: "Fiscal 2026 results (SEC 8-K)", date: "May 2026", url: "https://www.sec.gov/Archives/edgar/data/0001037038/000162828026037053/rl-20260328xex991xpressrel.htm" },
    s22: { pub: "PVH Corp.", title: "2025 fourth-quarter results and 2026 outlook", date: "Mar 2026", url: "https://www.businesswire.com/news/home/20260331741194/en/PVH-Corp.-Reports-2025-Fourth-Quarter-Revenue-and-Earnings-Above-Guidance-Provides-2026-Outlook/" },
    s23: { pub: "Hugo Boss", title: "Annual Report 2025 — sales performance", date: "Mar 2026", url: "https://annualreport.hugoboss.com/2025/management-report/report-on-economic-position/earnings-development/sales-performance.html" },
    s24: { pub: "The Commons", title: "Lacoste brand rating", date: "undated", url: "https://brands.thecommons.earth/brand-rating/658/lacoste" },
    s25: { pub: "Lacoste (corporate)", title: "Corporate home — values", date: "accessed Oct 2026", url: "https://corporate.lacoste.com/" },
    s26: { pub: "Journal du Luxe", title: "Lacoste inaugure une nouvelle boutique sur la 5e Avenue", date: "2025", url: "https://www.journalduluxe.fr/fr/mode/lacoste-developpement-etats-unis-inauguration-boutique-5e-avenue" },
    s27: { pub: "Into the Minds", title: "Visit and analysis of the Lacoste flagship store on the Champs-Élysées", date: "undated", url: "https://www.intotheminds.com/blog/en/flasghip-store-lacoste-paris/" },
    s28: { pub: "Modaes", title: "Lacoste opens in Medellín its first concept store in Latin America", date: "2025", url: "https://www.modaes.com/global/companies/lacoste-makes-the-americas-opens-in-medellin-its-first-concept-store-in-latin-america" },
    s29: { pub: "Jones Day", title: "Lacoste sold to Maus Frères for €1 billion (US$1.3 billion)", date: "Nov 2012", url: "https://www.jonesday.com/en/practices/experience/2012/11/lacoste-sold-to-maus-frres-for-1-billion-us13-billion" }
  },

  /* ---------- Headline KPIs (overview) ---------- */
  kpis: [
    { id: "sales", label: "Brand sales, 2024", value: 3.0, prefix: "≈ €", suffix: "bn", decimals: 1, delta: "+8% vs 2023", status: "reported", src: ["s7", "s8"] },
    { id: "boutiques", label: "Boutiques worldwide", value: 1100, prefix: "≈ ", suffix: "", decimals: 0, delta: null, status: "reported", src: ["s6", "s1"] },
    { id: "countries", label: "Countries", value: 100, prefix: "≈ ", suffix: "", decimals: 0, delta: "98 per careers site", status: "reported", src: ["s6"] },
    { id: "employees", label: "Employees", value: 8500, prefix: "≈ ", suffix: "", decimals: 0, delta: null, status: "reported", src: ["s6"] },
    { id: "instagram", label: "Instagram followers", value: 8.8, prefix: "", suffix: "M", decimals: 1, delta: "@lacoste", status: "reported", src: ["s20"] },
    { id: "target", label: "Sales target, 2028–30", value: 4.0, prefix: "€", suffix: "bn", decimals: 1, delta: "5–10% a year", status: "reported", src: ["s8", "s13"] }
  ],

  /* ---------- Financials ---------- */
  revenue: [
    // € billions, brand sales. null = not disclosed.
    { year: 2019, value: 2.0,  status: "estimate", note: "The CEO said 2021 was 'back to 2019 levels'; 2021 ≈ €2.0bn implied by 2022's +26% to €2.5bn.", src: ["s10", "s9"] },
    { year: 2020, value: null, status: "n/d",      note: "Not disclosed. Pandemic year.", src: [] },
    { year: 2021, value: 2.0,  status: "estimate", note: "Implied: €2.5bn in 2022 ÷ 1.26.", src: ["s9", "s10"] },
    { year: 2022, value: 2.5,  status: "reported", note: "'More than €2.5bn', +26%.", src: ["s9", "s10"] },
    { year: 2023, value: 2.75, status: "estimate", note: "Implied: ≈ €3.0bn in 2024 ÷ 1.08. Wikipedia lists €2.9bn for 2023; sources disagree.", src: ["s7", "s1"] },
    { year: 2024, value: 3.0,  status: "reported", note: "'Close to €3bn', +8%.", src: ["s7", "s8"] }
  ],
  growth: [
    { year: 2018, value: 28,   status: "reported", src: ["s11"] },
    { year: 2019, value: 11,   status: "reported", src: ["s11"] },
    { year: 2020, value: null, status: "n/d",      src: [] },
    { year: 2021, value: null, status: "n/d",      src: [] },
    { year: 2022, value: 26,   status: "reported", src: ["s9"] },
    { year: 2023, value: 10,   status: "estimate", src: ["s7"] },
    { year: 2024, value: 8,    status: "reported", src: ["s7", "s8"] }
  ],
  target: { value: 4.0, from: 2028, to: 2030, base: 3.0, baseYear: 2024, guidance: "5–10% annual growth", src: ["s8", "s13"] },
  distribution: { retail: 70, wholesale: 30, note: "Under Thierry Guibert the mix flipped from ~30/70 to ~70/30 own retail vs wholesale.", src: ["s1"] },
  usBusiness: { value: 400, goal: 800, unit: "€m", note: "US business valued at ≈ €400m; goal to double it.", src: ["s8", "s7"] },
  fragrance: {
    h1_2025: 52, h1Growth: 42, fy2025Growth: 28, target2025: 100, licensee: "Interparfums",
    src: ["s16", "s17"]
  },
  group2019: { exLicences: 2.64, inclLicences: 3.21, note: "MF Brands Group (Lacoste's parent, includes other brands).", src: ["s11"] },

  /* ---------- Global presence ---------- */
  regionGrowth2022: [
    { region: "South America", value: 60 },
    { region: "Europe", value: 30 },
    { region: "United States", value: 24 },
    { region: "Asia excl. China", value: 20 },
    { region: "China", value: 15 }
  ],
  regionGrowthSrc: ["s9"],
  marketShare2011: [
    // share of worldwide turnover, 2011 (Le Figaro via LSA). `map` = name in the ECharts world map.
    { country: "United States", map: "United States", value: 15 },
    { country: "France", map: "France", value: 9 },
    { country: "Italy", map: "Italy", value: 6 },
    { country: "China", map: "China", value: 6 },
    { country: "United Kingdom", map: "United Kingdom", value: 5 },
    { country: "Japan", map: "Japan", value: 5 },
    { country: "South Korea", map: "Korea", value: 5 },
    { country: "Spain", map: "Spain", value: 4 },
    { country: "Germany", map: "Germany", value: 4 },
    { country: "Brazil", map: "Brazil", value: 4 }
  ],
  marketShareSrc: ["s19"],
  countrySpotlight: [
    { country: "United States", figure: "≈ €400m", year: "2024", detail: "Largest single market; goal to double it. Fifth Avenue flagship.", status: "reported", src: ["s8", "s26"] },
    { country: "France", figure: "€327m", year: "2024", detail: "Revenue of the Lacoste France legal entity (home market).", status: "reported", src: ["s18"] },
    { country: "Spain", figure: "€81.7m", year: "2022", detail: "Up from €63m before the pandemic.", status: "reported", src: ["s9"] }
  ],
  landmarks: [
    { name: "Champs-Élysées flagship", city: "Paris", type: "store", lng: 2.3075, lat: 48.8698, year: null, src: ["s27"] },
    { name: "Fifth Avenue store", city: "New York", type: "store", lng: -73.9776, lat: 40.7590, year: null, src: ["s26", "s7"] },
    { name: "Pedder Building flagship", city: "Hong Kong", type: "store", lng: 114.1580, lat: 22.2810, year: 2026, src: ["s3"] },
    { name: "First Latin America concept store", city: "Medellín", type: "store", lng: -75.5812, lat: 6.2442, year: null, src: ["s28"] },
    { name: "Roland-Garros (sponsor since 1971)", city: "Paris", type: "tournament", lng: 2.2530, lat: 48.8459, year: 1971, src: ["s2"] },
    { name: "Miami Open (since 2015)", city: "Miami", type: "tournament", lng: -80.2389, lat: 25.9580, year: 2015, src: ["s1"] },
    { name: "Paris Masters (since 2024)", city: "Paris", type: "tournament", lng: 2.2290, lat: 48.8960, year: 2024, src: ["s1", "s3"] },
    { name: "First Lacoste Café (city-level location)", city: "Paris", type: "experience", lng: 2.3522, lat: 48.8566, year: 2026, src: ["s3"] },
    { name: "Club Lacoste Bali (padel)", city: "Bali", type: "experience", lng: 115.1300, lat: -8.6500, year: 2026, src: ["s3"] }
  ],
  landmarkTypes: { store: "Stores & flagships", tournament: "Tournaments", experience: "Experiences" },

  /* ---------- Brand story ---------- */
  timeline: [
    { year: 1923, cat: "sport",   title: "“The Crocodile” is born", text: "A bet over a crocodile-skin suitcase earns 19-year-old René Lacoste his nickname.", src: ["s2"] },
    { year: 1927, cat: "brand",   title: "The emblem", text: "Robert George draws a crocodile; René wears it embroidered on his blazer. He is world No. 1 in 1926–27.", src: ["s2", "s25"] },
    { year: 1933, cat: "brand",   title: "La Chemise Lacoste", text: "René Lacoste and André Gillier launch the light cotton polo — billed as the first logo worn on clothing.", src: ["s2", "s1"] },
    { year: 1950, cat: "company", title: "Going global", text: "Exports start worldwide and a children's line launches; Izod sells Lacoste in the US under licence.", src: ["s2", "s1"] },
    { year: 1963, cat: "sport",   title: "The steel racket", text: "René's steel racket goes on to win 46 Grand Slam titles between 1966 and 1978.", src: ["s2"] },
    { year: 1968, cat: "brand",   title: "First fragrance", text: "The first Eau de Toilette, created with Jean Patou.", src: ["s2"] },
    { year: 1971, cat: "sport",   title: "Roland-Garros", text: "Lacoste becomes official partner of the French Open — still going today.", src: ["s2", "s1"] },
    { year: 1978, cat: "brand",   title: "Eyewear", text: "First eyewear line, with Cahours de Virgile.", src: ["s2"] },
    { year: 1981, cat: "brand",   title: "Leather goods", text: "First belts and luggage collections.", src: ["s2"] },
    { year: 1991, cat: "brand",   title: "Footwear", text: "First casual shoes, made with Pentland.", src: ["s2", "s1"] },
    { year: 1993, cat: "company", title: "US rights regained", text: "The Izod licence ends; Lacoste takes back its US rights.", src: ["s1"] },
    { year: 1994, cat: "brand",   title: "Watches", text: "First watch line, unveiled at the Basel fair.", src: ["s2"] },
    { year: 2006, cat: "company", title: "Lacoste Foundation", text: "Helps underprivileged young people and people with disabilities into social and professional life.", src: ["s2"] },
    { year: 2012, cat: "company", title: "Maus Frères buys 100%", text: "Swiss family group takes full control, valuing Lacoste at ≈ €1bn (19× EBITDA).", src: ["s12", "s29"] },
    { year: 2015, cat: "sport",   title: "Miami Open", text: "Partnership with the Miami Open begins.", src: ["s1"] },
    { year: 2017, cat: "sport",   title: "Djokovic signs", text: "Novak Djokovic becomes “the new crocodile”. Supreme collaborations run 2017–19.", src: ["s2", "s1"] },
    { year: 2019, cat: "sport",   title: "Medvedev joins", text: "Daniil Medvedev becomes an ambassador.", src: ["s2"] },
    { year: 2023, cat: "company", title: "90th anniversary", text: "Pelagia Kolotouros becomes creative design director.", src: ["s2", "s1"] },
    { year: 2024, cat: "sport",   title: "Paris Masters & new faces", text: "Paris Masters partnership; Arthur Fils, Pierre Niney and Wang Yibo join. Lacoste Original fragrance launches.", src: ["s1", "s2"] },
    { year: 2025, cat: "company", title: "New CEO", text: "Éric Vallat succeeds Thierry Guibert (Sept 2025).", src: ["s14"] },
    { year: 2026, cat: "brand",   title: "New identity, new ventures", text: "Serif-led visual identity (Apr), Hong Kong flagship (May), first café, padel line and Club Lacoste Bali.", src: ["s15", "s3"] },
    { year: 2026, cat: "company", title: "Guibert returns", text: "Vallat is dismissed days before Paris Fashion Week; Thierry Guibert is reinstated as CEO (Oct).", src: ["s13"] }
  ],
  timelineCats: { brand: "Brand & product", sport: "Sport", company: "Company" },

  ambassadors: [
    { name: "Novak Djokovic", field: "Tennis", since: 2017, note: "“The new crocodile”; 2026 special-edition logo.", src: ["s2", "s3"] },
    { name: "Daniil Medvedev", field: "Tennis", since: 2019, note: "Former world No. 1.", src: ["s2"] },
    { name: "Arthur Fils", field: "Tennis", since: 2024, note: "Rising French player.", src: ["s1"] },
    { name: "Pierre Niney", field: "Film", since: 2024, note: "Face of the fragrance line.", src: ["s2", "s1"] },
    { name: "Wang Yibo", field: "Music & film", since: 2024, note: "Actor and singer.", src: ["s1"] },
    { name: "Adrien Brody", field: "Film", since: 2026, note: "Global eyewear ambassador.", src: ["s3"] },
    { name: "KAI (EXO)", field: "Music & film", since: 2026, note: "K-pop artist.", src: ["s3"] },
    { name: "Pierre Gasly", field: "Motorsport", since: 2026, note: "Formula 1 driver.", src: ["s3"] }
  ],
  sponsorships: [
    { name: "Roland-Garros", since: 1971, src: ["s2"] },
    { name: "Miami Open", since: 2015, src: ["s1"] },
    { name: "Paris Masters", since: 2024, src: ["s1"] }
  ],
  tenures: [
    // role, person, start, end (null = present)
    { role: "Creative direction", person: "Christophe Lemaire", start: 2001, end: 2010, src: ["s1"] },
    { role: "Creative direction", person: "Felipe Oliveira Baptista", start: 2010, end: 2018, src: ["s1"] },
    { role: "Creative direction", person: "Louise Trotter", start: 2018, end: 2023, src: ["s1", "s2"] },
    { role: "Creative direction", person: "Pelagia Kolotouros", start: 2023, end: null, src: ["s1"] },
    { role: "Chief executive", person: "Thierry Guibert", start: 2015, end: 2025.67, src: ["s13"] },
    { role: "Chief executive", person: "Éric Vallat", start: 2025.67, end: 2026.77, src: ["s14", "s13"] },
    { role: "Chief executive", person: "Thierry Guibert (again)", start: 2026.77, end: null, src: ["s13"] }
  ],
  collabs: [
    { name: "Supreme", years: "2017–2019", src: ["s1"] },
    { name: "Alpine", years: "2026", src: ["s3"] },
    { name: "Mackintosh", years: "2026", src: ["s3"] },
    { name: "Djokovic special-edition logo", years: "2026", src: ["s3"] }
  ],

  /* ---------- Products ---------- */
  categories: [
    { id: "apparel",   name: "Apparel", icon: "shirt", first: 1933, model: "In-house", partner: "Devanlay (Maus Frères unit) held the historic worldwide clothing licence", detail: "The original petit piqué polo is still the brand's signature product.", src: ["s2", "s1"] },
    { id: "kids",      name: "Kids", icon: "baby", first: 1950, model: "Licensed", partner: "Haddad Brands (worldwide licence, 2024)", detail: "A children's line has existed since the 1950s.", src: ["s2", "s1"] },
    { id: "fragrance", name: "Fragrance", icon: "spray-can", first: 1968, model: "Licensed", partner: "Interparfums (15-year licence signed late 2022)", detail: "First Eau de Toilette with Jean Patou. Lacoste Original launched June 2024.", src: ["s2", "s1"] },
    { id: "eyewear",   name: "Eyewear", icon: "glasses", first: 1978, model: "Licensed", partner: "Marchon Eyewear (since 2010)", detail: "Adrien Brody became global eyewear ambassador in 2026.", src: ["s2", "s1", "s3"] },
    { id: "leather",   name: "Leather goods", icon: "briefcase", first: 1981, model: "In-house", partner: "Licence bought back under Thierry Guibert", detail: "Belts, bags and luggage.", src: ["s2", "s1"] },
    { id: "footwear",  name: "Footwear", icon: "footprints", first: 1991, model: "In-house", partner: "Pentland (licensee from 1991, JV 2018), later bought back", detail: "Footwear growth peaked at +30% in 2022.", src: ["s2", "s1", "s9"] },
    { id: "watches",   name: "Watches & jewellery", icon: "watch", first: 1994, model: "Licensed", partner: "Movado (watches); GL Bijoux (jewellery from 2010)", detail: "First watches shown at the Basel fair.", src: ["s2", "s1"] },
    { id: "padel",     name: "Padel", icon: "circle-dot", first: 2026, model: "In-house", partner: "—", detail: "Debut padel collection and Club Lacoste Bali, September 2026.", src: ["s3"] }
  ],
  innovations: [
    { year: 1933, text: "Lightweight, breathable cotton polo replaces long-sleeved tennis whites.", src: ["s2"] },
    { year: 1960, text: "René Lacoste patents a shock absorber for racket strings.", src: ["s2"] },
    { year: 1963, text: "Steel racket — 46 Grand Slam titles between 1966 and 1978.", src: ["s2"] }
  ],

  /* ---------- Sustainability ---------- */
  climateTargets: [
    { id: "s12", label: "Scope 1 & 2 emissions", value: 47, unit: "% cut", by: 2030, basis: "absolute, vs 2019 · SBTi-validated", src: ["s4", "s5"] },
    { id: "s3",  label: "Scope 3 emissions per product", value: 37, unit: "% cut", by: 2030, basis: "intensity, vs 2019 · SBTi-validated", src: ["s4", "s5"] },
    { id: "re",  label: "Renewable energy, own sites", value: 100, unit: "%", by: 2030, basis: "Lacoste-operated sites", src: ["s4"] },
    { id: "pes", label: "Recycled polyester", value: 90, unit: "%", by: 2026, basis: "share of polyester used", src: ["s4"] }
  ],
  footprint: { scope12: 2, scope3: 98, src: ["s4", "s5"] },
  climateMilestones: [
    { year: 2025, text: "Key tier 1–4 factories (80% of volumes) aligned with the climate pathway", src: ["s4"] },
    { year: 2025, text: "Coal phased out at tier 1–2 textile & leather factories", src: ["s4"] },
    { year: 2026, text: "90% of polyester recycled", src: ["s4"] },
    { year: 2028, text: "Coal phased out at tier 1–2 footwear factories", src: ["s4"] },
    { year: 2030, text: "Scope 1&2 −47%, Scope 3 −37% per product, 100% renewable on own sites", src: ["s4", "s5"] }
  ],
  critiques: [
    { year: 2011, text: "Greenpeace's “Dirty Laundry” report linked supplier factories in China to river pollution.", src: ["s1"] },
    { year: 2020, text: "Named among 82 brands linked to Xinjiang forced-labour supply chains; Lacoste agreed to stop working with suppliers there.", src: ["s1"] },
    { year: 2022, text: "Criticised for continuing to operate in Russia after the invasion of Ukraine.", src: ["s1"] },
    { year: null, text: "The Commons notes no net-zero commitment and limited recent progress reporting (its page may predate the FY2025 report).", src: ["s24", "s5"] }
  ],

  /* ---------- Rivals ---------- */
  fx: { usdPerEur: 1.15, note: "Approximate 2025–26 average (EUR/USD ranged ≈ 1.13–1.21 in 2026)." },
  rivals: [
    { name: "Lacoste", revenue: 3.0, currency: "EUR", period: "2024", growth: 8, growthNote: "reported", owner: "Private — MF Brands (Maus Frères)", founded: 1933, hq: "Paris", emblem: "Crocodile", highlight: true, src: ["s7", "s8"] },
    { name: "Hugo Boss", revenue: 4.27, currency: "EUR", period: "2025", growth: -1, growthNote: "+2% currency-adjusted", owner: "Listed (Frankfurt)", founded: 1924, hq: "Metzingen", emblem: "Wordmark", src: ["s23"] },
    { name: "Ralph Lauren", revenue: 8.1, currency: "USD", period: "FY2026", growth: 15, growthNote: "+12% constant currency", owner: "Listed (NYSE)", founded: 1967, hq: "New York", emblem: "Polo player", src: ["s21"] },
    { name: "PVH (Tommy Hilfiger & Calvin Klein)", short: "PVH group", revenue: 8.95, currency: "USD", period: "2025", growth: 3, growthNote: "Tommy Hilfiger +4%", owner: "Listed (NYSE)", founded: 1881, hq: "New York", emblem: "Flag (Tommy)", src: ["s22"] }
  ]
};
