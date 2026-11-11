# Bộ hình động đầy đủ cho quái — tiến độ

Mục tiêu: 22 loại quái có hình động như nhân vật (đứng · thủ thế · đánh · chạy · trúng đòn · choáng · gục · thắng; trùm thêm 1 tấm / kỹ năng).
Quái thường chỉ đánh thường; trùm giữ kỹ năng đang có (người dùng chốt 10/11/2026).

## Đã xong (đóng gói, game tự dùng)
| Quái | Tấm |
|---|---|
| goblin (Goblin Cướp) | idle · attack · move · hurt-stun · dead-victory |
| trapper (Goblin Ném Bom) | idle · attack · move · hurt-stun · dead-victory |
| soldier (Lính Valoria) | idle · attack (ra đòn khung 6) · move · hurt-stun · dead-victory |
| spy (Mật Thám) | idle · attack · move · hurt-stun · dead-victory |
| fire (Chiến Binh Lửa) | idle · attack · move · hurt-stun · dead-victory (xong 11/11) |
| skarn (trùm Skarn) | 5 tấm cơ bản (xong 11/11; khung attack5 thiếu rìu; CHƯA có tấm kỹ năng) |

## Đang dở
- skarn: còn các tấm kỹ năng.

## Chưa làm
wolf · wolfboss (dùng mẫu sói "mẫu 1" trong dự án Flow của Rok) · morwen · valdric (+ dạng 2) · warden ·
c2scout · c2treant · c2wisp · c2spiritwolf · c2shroom · c2guard · c2cultist · hollow · vexa · thalor · malkor.
Trùm cần thêm tấm kỹ năng (danh sách ở `prompts.py` SKILLS).

## Cách làm (đã thử, chạy được)
1. Flow (Chrome của người dùng) — dự án "Quai - hinh dong day du": flow.google.com/project/6466cf9e-2e8e-4576-a06c-9d682b4b60d8
   (hình mẫu đã tải lên: `quai-<art>.png`, `mau-phong-cach-idle.png`, `mau-dong-tac-attack|run|hurt-stun|dead-victory.png`, `mau-ban-cung-attack.png`, `mau-phep-attack.png`).
2. Mỗi tấm: đính kèm 2 ảnh = `quai-<art>` (thiết kế) + tấm động tác MẪU (`python art/enemies/prompts.py <art> <tấm>` in tên mẫu + câu lệnh).
   KHÔNG sửa từ tấm idle ("Bạn muốn thay đổi điều gì?") — Flow chép gần y nguyên.
3. Tải: trong trang Flow chạy `window.__dl('<art>-sprite-<tấm>.jpg')` (ảnh 1200x896, giống nút tải 1K).
4. `bash tools/enemy_ingest.sh <art> --debug ảnh_soi.png` -> chuyển file từ Downloads, xoá dấu Flow (tools/flow_mark_sheet.py),
   spec (tools/enemy_spec.py: quái da / đồ xanh lá dùng tách nền 'jade', còn lại 'matte'), đóng gói (tools/sprite_pack.py).
5. Xem: `tools/enemy-viewer.html?art=<art>` (chạy kèm Vite).

## Lưu ý Flow
- Tạo liên tục ~25 tấm thì Flow báo "hoạt động bất thường" và từ chối (cả nút thử lại). Dừng hẳn, để vài giờ rồi làm tiếp; đừng bấm dồn.

- 11/11: Flow đổi bố cục theo chiều cao cửa sổ (nút lệch ~46px) -> chụp màn hình trước mỗi lượt, đừng bấm mù. Lưới ảnh: tấm mới nhất ở đầu -> `__dl(tên)`.
