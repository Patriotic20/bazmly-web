// O'zbekiston viloyatlari va tumanlari (namunaviy ro'yxat — keyinchalik backend'dan keladi)
export type Region = { id: string; name: string; short: string; districts: string[] };

export const REGIONS: Region[] = [
  { id: "toshkent-sh", name: "Toshkent shahri", short: "Toshkent", districts: ["Yashnobod tumani", "Olmazor tumani", "Mirzo Ulug‘bek tumani", "Yunusobod tumani", "Chilonzor tumani", "Shayxontohur tumani", "Mirobod tumani", "Yakkasaroy tumani", "Sergeli tumani", "Uchtepa tumani", "Bektemir tumani", "Yangihayot tumani"] },
  { id: "toshkent-v", name: "Toshkent viloyati", short: "Toshkent viloyati", districts: ["Nurafshon shahri", "Chirchiq shahri", "Olmaliq shahri", "Angren shahri", "Bekobod shahri", "Zangiota tumani", "Qibray tumani", "Yangiyo‘l tumani", "Parkent tumani", "Bo‘stonliq tumani"] },
  { id: "andijon", name: "Andijon viloyati", short: "Andijon", districts: ["Andijon shahri", "Asaka tumani", "Xonobod shahri", "Shahrixon tumani", "Marhamat tumani", "Baliqchi tumani"] },
  { id: "buxoro", name: "Buxoro viloyati", short: "Buxoro", districts: ["Buxoro shahri", "Kogon shahri", "G‘ijduvon tumani", "Vobkent tumani", "Qorako‘l tumani", "Romitan tumani"] },
  { id: "fargona", name: "Farg‘ona viloyati", short: "Farg‘ona", districts: ["Farg‘ona shahri", "Marg‘ilon shahri", "Qo‘qon shahri", "Quvasoy shahri", "Rishton tumani", "Oltiariq tumani"] },
  { id: "jizzax", name: "Jizzax viloyati", short: "Jizzax", districts: ["Jizzax shahri", "G‘allaorol tumani", "Zomin tumani", "Do‘stlik tumani", "Paxtakor tumani"] },
  { id: "xorazm", name: "Xorazm viloyati", short: "Xorazm", districts: ["Urganch shahri", "Xiva shahri", "Gurlan tumani", "Xonqa tumani", "Shovot tumani"] },
  { id: "namangan", name: "Namangan viloyati", short: "Namangan", districts: ["Namangan shahri", "Chust tumani", "Pop tumani", "Kosonsoy tumani", "Uchqo‘rg‘on tumani"] },
  { id: "navoiy", name: "Navoiy viloyati", short: "Navoiy", districts: ["Navoiy shahri", "Zarafshon shahri", "Karmana tumani", "Qiziltepa tumani", "Nurota tumani", "Uchquduq tumani"] },
  { id: "qashqadaryo", name: "Qashqadaryo viloyati", short: "Qashqadaryo", districts: ["Qarshi shahri", "Shahrisabz shahri", "Kitob tumani", "G‘uzor tumani", "Koson tumani"] },
  { id: "samarqand", name: "Samarqand viloyati", short: "Samarqand", districts: ["Samarqand shahri", "Kattaqo‘rg‘on shahri", "Urgut tumani", "Pastdarg‘om tumani", "Jomboy tumani"] },
  { id: "sirdaryo", name: "Sirdaryo viloyati", short: "Sirdaryo", districts: ["Guliston shahri", "Yangiyer shahri", "Shirin shahri", "Boyovut tumani", "Sirdaryo tumani"] },
  { id: "surxondaryo", name: "Surxondaryo viloyati", short: "Surxondaryo", districts: ["Termiz shahri", "Denov tumani", "Sherobod tumani", "Sho‘rchi tumani", "Boysun tumani"] },
  { id: "qoraqalpogiston", name: "Qoraqalpog‘iston Respublikasi", short: "Nukus", districts: ["Nukus shahri", "Xo‘jayli tumani", "Beruniy tumani", "To‘rtko‘l tumani", "Chimboy tumani"] },
];

export type UserLocation = { region: string; district?: string };
export const LOCATION_KEY = "bazmly:location";
export const DEFAULT_LOCATION: UserLocation = { region: "toshkent-sh" };

export function readLocation(): UserLocation {
  try {
    const l = JSON.parse(localStorage.getItem(LOCATION_KEY) ?? "null");
    if (l && REGIONS.some((r) => r.id === l.region)) return l;
  } catch {}
  return DEFAULT_LOCATION;
}
export function saveLocation(l: UserLocation) {
  try { localStorage.setItem(LOCATION_KEY, JSON.stringify(l)); } catch {}
}
export const regionById = (id: string) => REGIONS.find((r) => r.id === id) ?? REGIONS[0];
