/** Produkt w postaci, w jakiej trafia do sklepu (z nazwą kategorii). */
export type Product = {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  categorySlug: string;
  stones: string[];
  material: string;
  size: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  badge: string | null;
  description: string;
  stock: number;
  position: number;
};

export type Category = { id: number; slug: string; name: string; description: string; position: number };

export const ALL_CATEGORIES = "Wszystko";
export const ALL_STONES = "Wszystkie kamienie";
export const FREE_SHIPPING_FROM = 29900;
export const COURIER_PRICE = 1490;
export const MAX_PER_PRODUCT = 10;
export const MAX_STONES = 10;

/** „Agat mszysty, Perła naturalna” — do wyświetlania listy kamieni. */
export const stoneList = (stones: string[]) => stones.join(", ");

export const money = (amount: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", minimumFractionDigits: 2 }).format(amount / 100);

export function shippingCost(subtotal: number, delivery: string) {
  return delivery === "pickup" || subtotal >= FREE_SHIPPING_FROM ? 0 : COURIER_PRICE;
}

/** „Słoneczny splot z jaspisem” → „sloneczny-splot-z-jaspisem” */
export function slugify(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replaceAll("ł", "l").replaceAll("Ł", "L")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/** Dane demonstracyjne — ładowane przez `npm run db:seed` (tylko gdy baza jest pusta). */
export const seedCategories = [
  { slug: "naszyjniki", name: "Naszyjniki", position: 1 },
  { slug: "kolczyki", name: "Kolczyki", position: 2 },
  { slug: "bransoletki", name: "Bransoletki", position: 3 },
  { slug: "pierscionki", name: "Pierścionki", position: 4 },
  { slug: "komplety", name: "Komplety", position: 5 },
];

export const seedProducts = [
  { id: "naszyjnik-jaspis", name: "Słoneczny splot", subtitle: "Naszyjnik z jaspisem cesarskim", category: "naszyjniki", stones: ["Jaspis cesarski"], size: "42 cm + 5 cm regulacji", price: 18900, image: "/images/necklace-jasper.svg", badge: "BESTSELLER", description: "Ciepłe odcienie jaspisu cesarskiego spotykają się z delikatnym blaskiem złota. Ręcznie komponowany naszyjnik, który opowiada o pięknie natury — i Twojej niepowtarzalności. Każdy kamień ma własny rysunek, dlatego nie ma dwóch identycznych egzemplarzy.", stock: 12, position: 1 },
  { id: "kolczyki-perly", name: "Perłowa opowieść", subtitle: "Kolczyki z naturalnymi perłami", category: "kolczyki", stones: ["Perła naturalna"], size: "Koła 12 mm, długość ok. 3 cm", price: 12900, image: "/images/earrings-pearl.svg", badge: "NOWOŚĆ", description: "Organiczne, nieidealnie idealne perły słodkowodne na subtelnych złoconych kołach. Lekkie kolczyki, które pięknie łapią światło i dodają odrobiny magii codzienności. Naturalny kształt pereł sprawia, że każda para jest jedyna w swoim rodzaju.", stock: 15, position: 2 },
  { id: "bransoletka-agat", name: "Leśna harmonia", subtitle: "Bransoletka z agatem mszystym", category: "bransoletki", stones: ["Agat mszysty"], size: "16 cm + 4 cm regulacji", price: 11900, image: "/images/bracelet-agate.svg", badge: null, description: "Mały fragment lasu, który możesz mieć zawsze przy sobie. Fasetowane agaty w odcieniach szałwii i głębokiej zieleni przeplatają się z drobnymi złoconymi elementami. Regulowany obwód pozwala idealnie dopasować bransoletkę do nadgarstka.", stock: 10, position: 3 },
  { id: "pierscionek-perla", name: "Czuły blask", subtitle: "Pierścionek z perłą naturalną", category: "pierscionki", stones: ["Perła naturalna"], size: "Regulowany", price: 9900, image: "/images/ring-pearl.svg", badge: "RĘCZNIE TWORZONY", description: "Dwie naturalne perły otulone ciepłem młotkowanego złota. Delikatny, otwarty pierścionek o regulowanym rozmiarze. Dyskretny detal, który przypomina, że prawdziwe piękno tkwi w drobnych niedoskonałościach.", stock: 8, position: 4 },
  { id: "komplet-jaspis", name: "W objęciach słońca", subtitle: "Komplet z jaspisem cesarskim", category: "komplety", stones: ["Jaspis cesarski"], size: "Naszyjnik + kolczyki", price: 29900, image: "/images/set-jasper.svg", badge: "POMYSŁ NA PREZENT", description: "Harmonijny duet: naszyjnik i kolczyki z naturalnym jaspisem cesarskim. Stworzony ręcznie z uważnością na każdy szczegół i zapakowany w ozdobne pudełeczko. Wyjątkowy prezent — również dla siebie.", stock: 6, position: 5 },
  { id: "naszyjnik-perla", name: "Kropla światła", subtitle: "Naszyjnik z perłą naturalną", category: "naszyjniki", stones: ["Perła naturalna"], size: "42 cm + 5 cm regulacji", price: 15900, image: "/images/pearl-necklace.svg", badge: "LIMITOWANA SERIA", description: "Pojedyncza naturalna perła na subtelnym złoconym łańcuszku. Ponadczasowa prostota, która pasuje do białej koszuli, ulubionego swetra i wszystkich Twoich wyjątkowych chwil.", stock: 9, position: 6 },
  { id: "kolczyki-jaspis", name: "Piaskowe szepty", subtitle: "Kolczyki z jaspisem cesarskim", category: "kolczyki", stones: ["Jaspis cesarski"], size: "Długość ok. 3 cm", price: 10900, image: "/images/earrings-jasper.svg", badge: null, description: "Subtelne kolczyki inspirowane ciepłem piasku i spokojem natury. Ręcznie dobrane kamienie jaspisu cesarskiego na złoconych elementach ze stali szlachetnej. Idealne jako dopełnienie naszyjnika Słoneczny splot.", stock: 11, position: 7 },
  { id: "bransoletka-perla", name: "Odrobina czułości", subtitle: "Bransoletka z perłą naturalną", category: "bransoletki", stones: ["Perła naturalna"], size: "16 cm + 4 cm regulacji", price: 11900, image: "/images/bracelet-pearl.svg", badge: null, description: "Delikatna, kobieca i pełna naturalnego blasku. Bransoletka z perłowym akcentem i regulowanym zapięciem. Wykonana ręcznie ze złoconej stali szlachetnej oraz prawdziwych pereł słodkowodnych.", stock: 10, position: 8 },
];
