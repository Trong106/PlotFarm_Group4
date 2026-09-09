# PlotFarm Frontend

Next.js App Router, TypeScript, Tailwind CSS và Lucide React.

Phiên bản được cố định trong `package.json` và `package-lock.json`. TypeScript 6 và ESLint 9 được dùng để tương thích với các plugin trong `eslint-config-next` hiện tại. npm có cảnh báo ESLint 9 đã hết hỗ trợ; chỉ nâng lên ESLint 10 khi các plugin React/import/accessibility hỗ trợ phiên bản đó.

## Chạy dự án

Yêu cầu Node.js >= 20.9.0 và npm.

```bash
cd Front-end
npm ci
npm run dev
```

Mở http://localhost:3000. Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay cho `npm`.

## Các lệnh

- `npm run dev`: chạy môi trường phát triển.
- `npm run build`: tạo bản production.
- `npm start`: chạy bản production sau khi build.
- `npm run lint`: kiểm tra ESLint.
- `npm run typecheck`: tạo route types và kiểm tra TypeScript.

## Cấu trúc

- `src/app/layout.tsx`: root layout, metadata và CSS toàn cục.
- `src/app/page.tsx`: trang chủ, có ví dụ Tailwind và Lucide.
- `src/app/globals.css`: import Tailwind và khai báo theme.
- `postcss.config.mjs`: cấu hình `@tailwindcss/postcss`.
- `next.config.ts`: cấu hình Next.js.
- `tsconfig.json`: TypeScript strict và alias `@/*` trỏ tới `src/*`.

Tailwind CSS v4 dùng `@import "tailwindcss"` và cấu hình theme trong CSS; cấu hình hiện tại không cần `tailwind.config.js`. Thêm utility classes trực tiếp vào `className`.

Import từng icon từ `lucide-react`:

```tsx
import { Sprout } from "lucide-react";

export function FarmLabel() {
  return (
    <span className="inline-flex items-center gap-2 text-emerald-700">
      <Sprout className="size-5" aria-hidden="true" />
      Nông trại
    </span>
  );
}
```

Tài liệu: [Next.js](https://nextjs.org/docs/app), [Tailwind CSS](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [Lucide React](https://lucide.dev/guide/react).
