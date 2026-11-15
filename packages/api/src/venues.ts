// Vaqtinchalik ma'lumotlar — backend ulanganda API'dan keladi
export type VenueType = "restoran" | "toyxona";

export type Venue = {
  id: string;
  type: VenueType;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  open: boolean;
  deposit: boolean;
  address: string;
};

export type GridVenue = {
  id: string;
  type: VenueType;
  name: string;
  image: string;
  rating: number;
  distanceKm: number;
  open: boolean;
  address: string;
};

export const promos = [
  { id: "p1", image: "/home/banner-1.webp", alt: "Milliy taomlar to‘plami" },
  { id: "p2", image: "/home/banner-2.webp", alt: "Fast food aksiyasi" },
  { id: "p3", image: "/home/banner-3.webp", alt: "Dasturxon" },
  { id: "p4", image: "/home/banner-4.webp", alt: "Palov" },
];

const ADDR = "O‘zbekiston ko‘chasi 27 - uy";

export const topRestaurants: Venue[] = [
  { id: "rest-one", type: "restoran", name: "Rest One", image: "/home/rest-1.webp", rating: 4.8, reviews: 356, distanceKm: 1, open: true, deposit: true, address: ADDR },
  { id: "tinchlik-plaza", type: "restoran", name: "Tinchlik Plaza", image: "/home/rest-2.webp", rating: 4.6, reviews: 106, distanceKm: 1, open: true, deposit: true, address: ADDR },
  { id: "rest-one-2", type: "restoran", name: "Rest One", image: "/home/rest-3.webp", rating: 4.8, reviews: 356, distanceKm: 1, open: true, deposit: true, address: ADDR },
  { id: "tinchlik-plaza-2", type: "restoran", name: "Tinchlik Plaza", image: "/home/rest-2.webp", rating: 4.6, reviews: 106, distanceKm: 1, open: true, deposit: true, address: ADDR },
];

export const topHalls: Venue[] = [
  { id: "muhtasham", type: "toyxona", name: "Muhtasham", image: "/home/hall-1.webp", rating: 4.8, reviews: 356, distanceKm: 1, open: true, deposit: true, address: ADDR },
  { id: "diyora", type: "toyxona", name: "Diyora", image: "/home/hall-2.webp", rating: 4.6, reviews: 106, distanceKm: 1, open: true, deposit: true, address: ADDR },
  { id: "tarona", type: "toyxona", name: "Tarona", image: "/home/hall-3.webp", rating: 4.8, reviews: 356, distanceKm: 1, open: true, deposit: true, address: ADDR },
  { id: "xursand", type: "toyxona", name: "Xursand", image: "/home/hall-4.webp", rating: 4.7, reviews: 214, distanceKm: 1, open: true, deposit: true, address: ADDR },
];

const G = {
  sayqal: { name: "Sayqal", image: "/home/grid-1.webp" },
  tinchlik: { name: "Tinchlik", image: "/home/grid-2.webp" },
  panorama: { name: "Panorama", image: "/home/grid-3.webp" },
  sharqona: { name: "Sharqona", image: "/home/grid-4.webp" },
};
const order: (keyof typeof G)[] = [
  "sayqal", "tinchlik", "panorama", "sayqal", "tinchlik",
  "sharqona", "sayqal", "sharqona", "tinchlik", "tinchlik",
  "sayqal", "sharqona", "sayqal", "sharqona", "tinchlik",
];

export const allVenues: GridVenue[] = order.map((k, i) => ({
  id: `${k}-${i + 1}`,
  type: "restoran",
  ...G[k],
  rating: 4.8,
  distanceKm: 2,
  open: true,
  address: "Umid qo‘rg‘oni 765 - uy",
}));

// To'yxonalar bo'limidagi umumiy ro'yxat (Figma: To'yxonalar tabi)
const H = {
  sayqal: { name: "Sayqal", image: "/home/hall-grid-1.webp" },
  tinchlik: { name: "Tinchlik", image: "/home/hall-grid-2.webp" },
  panorama: { name: "Panorama", image: "/home/hall-grid-3.webp" },
  sayqalOq: { name: "Sayqal", image: "/home/hall-grid-4.webp" },
};
const hallOrder: (keyof typeof H)[] = [
  "sayqal", "sayqal", "sayqal", "sayqal", "tinchlik",
  "tinchlik", "tinchlik", "tinchlik", "panorama", "panorama",
  "panorama", "panorama", "sayqalOq", "sayqalOq", "sayqalOq",
];
export const allHalls: GridVenue[] = hallOrder.map((k, i) => ({
  id: `${H[k].name.toLowerCase()}-zal-${i + 1}`,
  type: "toyxona",
  ...H[k],
  rating: 4.8,
  distanceKm: 2,
  open: true,
  address: "Umid qo‘rg‘oni 765 - uy",
}));

export type Amenity = { id: "parking" | "acoustic" | "stage" | "ac" | "kitchen" | "wifi"; label: string };
export const HALL_AMENITIES: Amenity[] = [
  { id: "parking", label: "Keng avtoturargoh" },
  { id: "acoustic", label: "Akustik tizim" },
  { id: "stage", label: "Katta sahna" },
  { id: "ac", label: "Konditsioner" },
  { id: "kitchen", label: "Professional oshxona" },
  { id: "wifi", label: "Yuqori tezlikdagi Wi-Fi" },
];

export function venueHref(v: { type: VenueType; id: string }) {
  return v.type === "toyxona" ? `/toyxonalar/${v.id}` : `/restoranlar/${v.id}`;
}

// ---------- Joy sahifasi (restoran / to'yxona) ----------
export type MenuItem = { id: string; name: string; price: number; image: string; category: string };

export type VenueDetails = {
  id: string;
  type: VenueType;
  name: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  open: boolean;
  deposit: boolean;
  discount?: number;
  city: string;
  address: string;
  hero: string;
  /** Telefon uchun (rasmga yopishgan Figma elementlari tozalangan) nusxa */
  heroMobile?: string;
  gallery: string[];
  phone: string;
  hours: string;
  capacity: string;
  about: string;
  menu: MenuItem[];
  /** To'yxona: zal narxi (so'm), sig'im oralig'i, tavsif, qulayliklar */
  price?: number;
  guests?: { min: number; max: number };
  description?: string;
  amenities?: Amenity[];
};

const MENU: MenuItem[] = [
  { id: "jizz", name: "Jizz", price: 85000, image: "/venue/menu-1.webp", category: "Go‘shtli taomlar" },
  { id: "qozon-kabob", name: "Qozon kabob", price: 95000, image: "/venue/menu-2.webp", category: "Go‘shtli taomlar" },
  { id: "manti", name: "Manti", price: 45000, image: "/venue/menu-3.webp", category: "Milliy taomlar" },
  { id: "steyk", name: "Stake", price: 180000, image: "/venue/menu-4.webp", category: "Steyklar" },
  { id: "osh", name: "Osh", price: 55000, image: "/home/banner-4.webp", category: "Milliy taomlar" },
  { id: "milliy-set", name: "Milliy set", price: 240000, image: "/home/banner-1.webp", category: "Setlar" },
  { id: "dasturxon", name: "Dasturxon", price: 320000, image: "/home/banner-3.webp", category: "Setlar" },
  { id: "burger", name: "Burger", price: 48000, image: "/home/banner-2.webp", category: "Fast food" },
];

const GALLERY = [1, 2, 3, 4, 5, 6].map((i) => `/venue/rest-one-g${i}.webp`);

function details(v: { id: string; type: VenueType; name: string; image: string; rating: number; distanceKm: number; open: boolean; address?: string }, extra?: Partial<VenueDetails>): VenueDetails {
  return {
    id: v.id,
    type: v.type,
    name: v.name,
    rating: v.rating,
    reviews: 356,
    distanceKm: v.distanceKm,
    open: v.open,
    deposit: true,
    discount: 10,
    city: "Navoiy",
    address: "O‘zbekiston ko‘chasi 27 - uy",
    hero: v.image,
    gallery: [v.image, ...GALLERY],
    phone: "+998 99 123 45 67",
    hours: "Har kuni 10:00 – 23:00",
    capacity: v.type === "toyxona" ? "500 kishigacha" : "120 kishigacha",
    about:
      v.type === "toyxona"
        ? "Katta bazmlar, to‘ylar va tadbirlar uchun zamonaviy zal. Sahna, yorug‘lik va ovoz tizimi mavjud."
        : "Shinam muhit, milliy va Yevropa taomlari. Oilaviy kechalar va do‘stlar bilan uchrashuvlar uchun.",
    menu: MENU,
    ...extra,
  };
}

export function getVenue(type: VenueType, id: string): VenueDetails | null {
  const pool = [...topRestaurants, ...topHalls, ...allVenues, ...allHalls];
  const v = pool.find((x) => x.id === id && x.type === type);
  if (!v) return null;
  // Figma'dagi namunaviy sahifa — Rest One
  if (v.id === "rest-one" || v.id === "rest-one-2") {
    return details(v, { hero: "/venue/rest-one-hero.webp", heroMobile: "/venue/rest-one-hero-clean.webp", gallery: ["/venue/rest-one-hero.webp", ...GALLERY], reviews: 356 });
  }
  if (v.type === "toyxona") {
    // Figma'dagi namunaviy to'yxona sahifasi ("The Royal Grand") — rasm va matnlar shu yerdan
    return details(v, {
      reviews: "reviews" in v ? (v as Venue).reviews : 356,
      hero: "/venue/rest-one-hero.webp", heroMobile: "/venue/rest-one-hero-clean.webp",
      gallery: ["/venue/rest-one-hero.webp", ...GALLERY],
      price: 25_000_000,
      guests: { min: 500, max: 1200 },
      description:
        "Hasidona Koshona - bu sizning unutilmas tadbirlaringiz uchun mo'ljallangan hashamatli majmua. Modern klassika uslubidagi dizayn, keng va yorug' zal hamda professional xizmat ko'rsatish jamoasi sizning to'y, korporativ tadbir yoki yubileyingizni yuqori saviyada o'tkazishni ta'minlaydi.",
      amenities: HALL_AMENITIES,
    });
  }
  return details(v, { reviews: "reviews" in v ? (v as Venue).reviews : 120 });
}

export const formatSum = (n: number) => `${n.toLocaleString("ru-RU").replace(/ /g, " ")} so‘m`;

/** Figma: "25,000,000" — minglar vergul bilan */
export const formatNum = (n: number) => n.toLocaleString("en-US");
