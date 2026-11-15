# Bazmly

Bitta repozitoriy — ikki ilova va umumiy paketlar (npm workspaces).

```
apps/web       → mijoz sayti (Next.js)          http://localhost:3000
apps/partner   → hamkor paneli (Next.js)        http://localhost:3001
packages/ui    → ikonlar, logotiplar, Toast, dizayn tokenlari (theme.css)
packages/api   → ma'lumot qatlami va backend klienti (client.ts)
```

## Ishga tushirish

```bash
npm install            # loyiha ildizida bir marta
npm run dev            # mijoz sayti
npm run dev:partner    # hamkor paneli
npm run build          # ikkalasini ham build qilish
```

## Backend ulanishi

Hozir bronlar, kartalar, profil va voucherlar brauzer xotirasida saqlanadi.
Har bir mavzu `packages/api/src` dagi bitta faylda: `booking`, `payment`, `user`, `vouchers`, `venues`, `regions`.
Backend tayyor bo'lganda:

1. `.env.local` ga `NEXT_PUBLIC_API_URL=https://api.bazmly.uz` yoziladi.
2. Shu fayllardagi funksiyalarning ichi `api()` (`packages/api/src/client.ts`) chaqiruvlariga almashtiriladi.
3. Sahifalar va komponentlar o'zgarmaydi — ular faqat `@bazmly/api/...` dan import qiladi.

Import namunalari:

```ts
import { getVenue } from "@bazmly/api/venues";
import { SearchIcon } from "@bazmly/ui/icons";
```
