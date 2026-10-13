// Cấu hình Vite cho client Legend of Capsules
// - `npm run dev`  : Vite chạy ở http://localhost:5173, chuyển tiếp Socket.io sang server Node (cổng 3000)
// - `npm run build`: đóng gói client vào dist/ để server.js phục vụ
import { defineConfig } from 'vite';

export default defineConfig({
    // Thư mục public/ cũ (bản trước khi tách module) không còn dùng
    publicDir: false,
    server: {
        port: 5173,
        proxy: {
            '/socket.io': { target: 'http://localhost:3000', ws: true },
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        // Atlas nhân vật lớn: không nhúng base64 vào JS
        assetsInlineLimit: 0,
        chunkSizeWarningLimit: 1000,
    },
});
