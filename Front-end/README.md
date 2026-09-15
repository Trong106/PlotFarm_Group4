# PlotFarm Frontend

Frontend dùng Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS 3 và Zustand 4. Các phiên bản cài đặt được lưu trong `package-lock.json`.

## Chạy trên Windows PowerShell

Cài Node.js và npm, sau đó chạy từ thư mục dự án:

```powershell
cd D:\Project_OJT\PlotFarm_Team-4_Dev\Front-end
npm.cmd ci
npm.cmd run dev
```

Mở http://localhost:3000. Dùng `npm.cmd` để tránh lỗi PowerShell chặn `npm.ps1`. Nhấn Ctrl+C để dừng server.

Chạy `npm.cmd ci` sau khi clone hoặc khi `package-lock.json` thay đổi để đồng bộ `node_modules`. Lệnh này cài lại thư viện theo lockfile.

## Kiểm tra dự án

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

`npm.cmd start` chạy bản production sau khi build thành công.

## Cấu hình

- `next.config.mjs`: cấu hình Next.js.
- `postcss.config.js`: Tailwind CSS 3 và Autoprefixer.
- `tailwind.config.ts`: theme, animation và đường dẫn quét utility classes.
- `.eslintrc.json`: quy tắc ESLint của Next.js.
- `tsconfig.json`: TypeScript strict và alias `@/*` trỏ tới `src/*`.
- `src/app/globals.css`: các chỉ thị `@tailwind` và CSS dùng chung.

Không dùng đồng thời các file cấu hình Next.js/PostCSS của bộ phiên bản khác. `next dev` và `next build` tự tạo dữ liệu trong `.next/`; đây là thư mục build/cache, không phải mã nguồn.

## Kết nối backend

Mặc định frontend gọi API tại `http://localhost:5000/api`. Chức năng đăng nhập cần backend và cơ sở dữ liệu hoạt động. Có thể thay URL bằng biến `NEXT_PUBLIC_API_BASE_URL` trong `.env.local`, rồi khởi động lại frontend.

Khi deploy, đặt `NEXT_PUBLIC_API_BASE_URL=https://<ten-mien-backend>/api` trong môi trường build của dịch vụ hosting **trước khi chạy build**, rồi build/deploy lại. Trang hồ sơ và Header dùng chung cấu hình này. Backend cần cho phép CORS từ tên miền frontend; nếu frontend dùng HTTPS thì URL backend cũng cần HTTPS. Không đặt `localhost` cho bản deploy vì trình duyệt sẽ gọi vào máy của người truy cập.

Chạy `npm.cmd run test:auth` để kiểm tra hồi quy việc tải hồ sơ, khởi tạo lại Header, hết hạn phiên và lỗi kết nối.
