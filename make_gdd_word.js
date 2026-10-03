const fs = require('fs');
const path = require('path');
const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, BorderStyle,
    AlignmentType, Header, Footer, PageNumber, ShadingType
} = require('docx');

// Colors
const PRIMARY_COLOR = '1E3A8A';   // Dark Blue
const ACCENT_COLOR = '0284C7';    // Cyan/Sky Blue
const TEXT_COLOR = '1E293B';      // Slate 800
const MUTED_COLOR = '64748B';     // Slate 500
const BG_HEADER = 'F1F5F9';       // Slate 100
const BG_ALT = 'F8FAFC';          // Slate 50
const BORDER_COLOR = 'CBD5E1';    // Slate 300

function createHeading1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 140 },
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 28,
                color: PRIMARY_COLOR,
                font: 'Segoe UI'
            })
        ]
    });
}

function createHeading2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 24,
                color: ACCENT_COLOR,
                font: 'Segoe UI'
            })
        ]
    });
}

function createHeading3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 180, after: 80 },
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 20,
                color: TEXT_COLOR,
                font: 'Segoe UI'
            })
        ]
    });
}

function createParagraph(text, options = {}) {
    return new Paragraph({
        spacing: { before: 60, after: 100, line: 300 },
        children: [
            new TextRun({
                text: text,
                size: 21,
                color: options.color || TEXT_COLOR,
                bold: !!options.bold,
                italics: !!options.italics,
                font: 'Segoe UI'
            })
        ]
    });
}

function createBullet(text, boldPrefix = '') {
    const children = [];
    if (boldPrefix) {
        children.push(new TextRun({
            text: boldPrefix + ' ',
            bold: true,
            size: 21,
            color: PRIMARY_COLOR,
            font: 'Segoe UI'
        }));
    }
    children.push(new TextRun({
        text: text,
        size: 21,
        color: TEXT_COLOR,
        font: 'Segoe UI'
    }));

    return new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 40, after: 60, line: 280 },
        children: children
    });
}

function createTableCell(text, options = {}) {
    const isHeader = !!options.isHeader;
    return new TableCell({
        width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
        shading: {
            fill: isHeader ? PRIMARY_COLOR : (options.alt ? BG_ALT : 'FFFFFF'),
            type: ShadingType.CLEAR
        },
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
            left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
            right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }
        },
        children: [
            new Paragraph({
                alignment: options.alignment || AlignmentType.LEFT,
                children: [
                    new TextRun({
                        text: text,
                        bold: isHeader || !!options.bold,
                        size: isHeader ? 20 : 19,
                        color: isHeader ? 'FFFFFF' : (options.color || TEXT_COLOR),
                        font: 'Segoe UI'
                    })
                ]
            })
        ]
    });
}

// Generate the docx
async function generate() {
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: 'Segoe UI', size: 21, color: TEXT_COLOR }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
                    }
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({
                                        text: 'LEGEND OF CAPSULES — GAME DESIGN DOCUMENT (GDD)',
                                        size: 16,
                                        color: MUTED_COLOR,
                                        font: 'Segoe UI'
                                    })
                                ]
                            })
                        ]
                    })
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: 'Trang ',
                                        size: 16,
                                        color: MUTED_COLOR
                                    }),
                                    new TextRun({
                                        children: [PageNumber.CURRENT],
                                        size: 16,
                                        color: MUTED_COLOR
                                    }),
                                    new TextRun({
                                        text: ' / ',
                                        size: 16,
                                        color: MUTED_COLOR
                                    }),
                                    new TextRun({
                                        children: [PageNumber.TOTAL_PAGES],
                                        size: 16,
                                        color: MUTED_COLOR
                                    })
                                ]
                            })
                        ]
                    })
                },
                children: [
                    // TITLE & COVER BLOCK
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 300, after: 100 },
                        children: [
                            new TextRun({
                                text: 'TÀI LIỆU THIẾT KẾ TRÒ CHƠI TOÀN DIỆN',
                                size: 24,
                                bold: true,
                                color: ACCENT_COLOR,
                                font: 'Segoe UI'
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 60, after: 160 },
                        children: [
                            new TextRun({
                                text: 'LEGEND OF CAPSULES',
                                size: 40,
                                bold: true,
                                color: PRIMARY_COLOR,
                                font: 'Segoe UI'
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 300 },
                        children: [
                            new TextRun({
                                text: 'Game Design Document (GDD) & Technical Specifications | Version 2.0',
                                size: 20,
                                italics: true,
                                color: MUTED_COLOR,
                                font: 'Segoe UI'
                            })
                        ]
                    }),

                    // SECTION 1
                    createHeading1('1. BẢNG THÔNG TIN DỰ ÁN (PROJECT ONE-PAGER)'),
                    createParagraph('Bảng tổng hợp các định hướng nền tảng của dự án Legend of Capsules phục vụ mục tiêu sản xuất và giới thiệu tới đối tác, đội ngũ phát triển:'),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    createTableCell('Hạng mục', { isHeader: true, width: 30 }),
                                    createTableCell('Chi tiết đặc tả dự án', { isHeader: true, width: 70 })
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Tên dự án', { bold: true }),
                                    createTableCell('Legend of Capsules')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Thể loại (Genre)', { bold: true }),
                                    createTableCell('2.5D Real-Time Action RPG / Creature Battler (Nhập vai hành động thời gian thực & Thu thập sinh vật)')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Góc nhìn máy quay', { bold: true }),
                                    createTableCell('2.5D Isometric / Fixed Orbit Camera (Nhân vật Sprite 2D hoạt họa trong không gian 3D)')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Nền tảng phát hành', { bold: true }),
                                    createTableCell('Web-first (WebGL/HTML5), chơi mượt mà trực tiếp trên mọi trình duyệt hiện đại (Chrome, Edge, Safari, Firefox). Khả năng mở rộng sang Mobile/Desktop qua WebView/Electron.')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Mô hình kinh doanh', { bold: true }),
                                    createTableCell('Free-to-Play (F2P) kết hợp vật phẩm ngoại trang (Cosmetics), Gói triệu hồi sinh vật (Capsule Summon) và Thẻ thám hiểm (Battle Pass).')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Công nghệ cốt lõi', { bold: true }),
                                    createTableCell('Frontend: Three.js + Custom GLSL Shader (Chroma Key & Hit Flash). Backend: Node.js + Socket.io Server-Authoritative Combat Loop.')
                                ]
                            })
                        ]
                    }),

                    // SECTION 2
                    createHeading1('2. TỔNG QUAN & TRỤ CỘT THIẾT KẾ (CORE PILLARS)'),
                    createParagraph('Legend of Capsules được định hướng trở thành một trải nghiệm game hành động trực tuyến tốc độ cao, tiếp cận dễ dàng ngay trên nền tảng Web nhưng mang chiều sâu chiến thuật và cảm giác điều khiển có lực:'),

                    createBullet('Sự kết hợp hài hòa giữa các nhân vật Sprite 2D hoạt họa vẽ tay (Billboard quay mặt về camera) và môi trường không gian 3D có chiều sâu phối cảnh, tạo phong cách nghệ thuật hoài niệm cổ điển nhưng hiện đại và cuốn hút.', 'Trụ cột 1: Thị giác 2.5D Isometric Phong Cách (Stylized 2.5D Visuals).'),
                    createBullet('Loại bỏ hoàn toàn lối đánh theo lượt chờ đợi đơn điệu. Trận đấu diễn ra liên tục theo thời gian thực với hệ thống tích lũy năng lượng dạng viên ngọc (Orb System), đồng bộ sát thương chính xác theo từng frame vung đòn (Hit-Frame Sync) kết hợp hiệu ứng rung màn hình (Camera Shake) và nháy trắng phản hồi va chạm (Hit-Flash).', 'Trụ cột 2: Chiến Đấu Thời Gian Thực Có Lực (Dynamic Real-Time Action).'),
                    createBullet('Người chơi khám phá các bản đồ thế giới bán mở, tìm kiếm và bắt các sinh vật Capsule hoang dã khi chúng suy yếu, xây dựng đội hình 4 thành viên với hệ thống thuộc tính ngũ hành tương sinh tương khắc.', 'Trụ cột 3: Thu Thập Sinh Vật & Thám Hiểm Bán Mở (Creature Collection & Exploration).'),

                    // SECTION 3
                    createHeading1('3. VÒNG LẶP TRÒ CHƠI CỐT LÕI (CORE GAMEPLAY LOOP)'),
                    createParagraph('Vòng lặp trải nghiệm người chơi được thiết kế mạch lạc qua 4 giai đoạn nối tiếp:'),
                    createBullet('Di chuyển tự do trong thế giới bán mở (Làng mạc, Đồng cỏ, Rừng rậm, Hầm ngục) để nhận nhiệm vụ và tìm kiếm các sinh vật quý hiếm.', '1. Khám Phá Thế Giới (Exploration):'),
                    createBullet('Chạm trán quái vật hoang dã hoặc đối thủ, chuyển cảnh mượt mà vào đấu trường thời gian thực, điều khiển chuỗi kỹ năng và canh thời điểm dùng Orb chuẩn xác.', '2. Chiến Đấu Đỉnh Cao (Real-Time Combat):'),
                    createBullet('Hạ gục kẻ địch để thu thập trang bị, nguyên liệu nâng cấp, hoặc ném thiết bị chứa Capsule để bắt sinh vật khi lượng máu của chúng xuống dưới 30%.', '3. Thu Phục & Phần Thưởng (Catch & Reward):'),
                    createBullet('Nâng cấp 14 chỉ số chiến đấu, ghép trang bị (Vũ khí, Giáp, Trang sức, Quả cầu Orb) và xây dựng đội hình chiến thuật hoàn hảo.', '4. Phát Triển & Xây Đội Hình (Progression & Synergy):'),

                    // SECTION 4
                    createHeading1('4. HỆ THỐNG CHIẾN ĐẤU & CƠ CHẾ SÁT THƯƠNG (COMBAT & STAT ENGINE)'),
                    createParagraph('Hệ thống chiến đấu được vận hành hoàn toàn tại Máy chủ (Server-Authoritative) qua đường ống xử lý 7 lớp nghiêm ngặt, đảm bảo tính công bằng và cân bằng tuyệt đối:'),

                    createHeading2('4.1 Quy trình Xử lý Sát thương 7 Lớp (7-Layer Pipeline)'),
                    createBullet('Hệ thống phân định sát thương Vật lý (P.ATK) gặp Giáp vật lý (P.DEF), hoặc sát thương Phép thuật (M.ATK) gặp Kháng phép (M.DEF).', 'Lớp 1 - Phân loại Sát thương:'),
                    createBullet('So sánh giữa Né tránh (Dodge) của mục tiêu và Chính xác (Accuracy) của người tấn công: Tỷ lệ né = max(0, Dodge - Acc) / 1000. Nếu né thành công, trả về MISS (0 sát thương).', 'Lớp 2 - Kiểm tra Né Tránh (Dodge Check):'),
                    createBullet('Nhân công cơ bản với hệ số kỹ năng: Damage = Base ATK x Skill Multiplier.', 'Lớp 3 - Tính Sát thương Cơ bản:'),
                    createBullet('Kiểm tra tỷ lệ Crit: Nếu bạo kích thành công, Sát thương nhân với (2.0 + Crit Damage / 1000).', 'Lớp 4 - Kiểm tra Bạo Kích (Critical Strike):'),
                    createBullet('Nếu không Crit, kiểm tra tỷ lệ Đỡ đòn (Block). Đỡ đòn thành công sẽ giảm ngay 50% lượng sát thương nhận vào.', 'Lớp 5 - Kiểm tra Đỡ Đòn (Block Mitigation):'),
                    createBullet('Áp dụng công thức giảm trừ sát thương theo giáp thực tế: Mitigation = Effective DEF / (Effective DEF + 300), trong đó Effective DEF = DEF x (1 - Penetration Rate).', 'Lớp 6 - Giảm trừ Giáp & Kháng (Armor Mitigation):'),
                    createBullet('Cộng trừ các hiệu ứng trạng thái (Ấn Seal: -10% Giáp; Tàng hình: +10% Công; Bùa suy yếu) và trả về lượng sát thương cuối cùng.', 'Lớp 7 - Áp dụng Hiệu ứng & Kết xuất Sát thương:'),

                    createHeading2('4.2 Hệ thống 14 Chỉ số Chiến đấu Chuẩn hóa (1000-Point Rating)'),
                    createParagraph('Mọi chỉ số phụ trong game đều quy về thang chuẩn 1000 điểm tương ứng 100%:'),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    createTableCell('Nhóm chỉ số', { isHeader: true, width: 25 }),
                                    createTableCell('Tên chỉ số', { isHeader: true, width: 25 }),
                                    createTableCell('Ý nghĩa trong trận chiến', { isHeader: true, width: 50 })
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Sinh tồn', { bold: true }),
                                    createTableCell('HP, P.DEF, M.DEF'),
                                    createTableCell('Lượng máu tối đa, khả năng giảm trừ sát thương vật lý và phép thuật theo công thức giáp.')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Tấn công', { bold: true }),
                                    createTableCell('P.ATK, M.ATK, Speed'),
                                    createTableCell('Sát thương đầu ra của đòn đánh thường và chiêu thức; thời gian giữa hai nhịp đánh (ms).')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Chiến thuật', { bold: true }),
                                    createTableCell('Crit, Crit DMG, Pen'),
                                    createTableCell('Tỷ lệ nảy số vàng x2.5 sát thương; tỷ lệ bỏ qua phần trăm giáp bảo vệ của đối thủ.')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Phòng ngự', { bold: true }),
                                    createTableCell('Dodge, Acc, Block'),
                                    createTableCell('Khả năng né đòn hoàn toàn (0 dmg); tỷ lệ chặn đòn giảm 50% dmg; chỉ số đối kháng độ né.')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Năng lượng', { bold: true }),
                                    createTableCell('MP/Atk, MP/Sec, Orb'),
                                    createTableCell('Hồi phục năng lượng theo đòn đánh và mỗi giây; 1000 MP quy đổi thành 1 viên Ngọc Năng Lượng (Orb).')
                                ]
                            })
                        ]
                    }),

                    // SECTION 5
                    createHeading1('5. THIẾT KẾ NHÂN VẬT & ĐỐI THỦ (CLASSES & CREATURES)'),
                    createHeading2('5.1 Nhân vật Tiêu biểu: Sát Thủ (Assassin 🥷)'),
                    createParagraph('Nhân vật tiêu biểu mở màn cho trò chơi sở hữu bộ cử động hoạt họa chất lượng cao và cơ chế phối hợp kỹ năng độc đáo:'),
                    createBullet('HP: 1200 | P.ATK: 250 | P.DEF: 50 | Crit: 35% | Crit DMG: +50% | Tốc đánh: 800ms | Tầm đánh: 1.8 ô.', 'Chỉ số căn bản:'),
                    createBullet('Phóng phi tiêu tầm xa tiêu hao 1 Orb, gây 150% sát thương và gắn Ấn Chiếu (Seal) giảm 10% Giáp đối thủ trong 6s. Khi đang Tàng Hình, chiêu thức phóng liên tiếp 2 phi tiêu.', 'Skill 1 - Phi Tiêu (Shuriken Throw):'),
                    createBullet('Lướt xuyên mục tiêu tiêu hao 2 Orbs, gây 250% sát thương. Nếu trên sàn đấu có bất kỳ kẻ địch nào đang dính Ấn Chiếu, Sát Thủ sẽ tự động kích hoạt Chain Dash lướt liên hoàn qua tất cả kẻ địch đó.', 'Skill 2 - Đột Kích (Shadow Dash):'),
                    createBullet('Tiêu hao 3 Orbs, bước vào trạng thái vô hình trong 6s: Miễn nhiễm hoàn toàn việc bị chọn làm mục tiêu tấn công, đồng thời tăng +10% Sát thương và +10% Tốc độ đánh.', 'Skill 3 - Tàng Hình (Stealth Veil):'),
                    createBullet('Đòn tấn công từ phía sau lưng đối thủ được nhận thêm +50% Tỷ lệ bạo kích.', 'Nội tại - Đánh Lén (Backstab Mastery):'),

                    createHeading2('5.2 Dàn Đối thủ Đấu trường (Monster Archetypes)'),
                    createBullet('Sinh lực 5000, Giáp 300, Đỡ đòn 40%. Luôn dâng cao che chắn cho hàng sau.', 'Thiết Vệ (Guardian Tanker 🛡️):'),
                    createBullet('Tầm bắn 10 ô, P.ATK 250, Xuyên giáp 30%. Chuyên gia gây sát thương vật lý tầm xa liên tục.', 'Xạ Thủ (Marksman Archer 🏹):'),
                    createBullet('Công phép M.ATK 120, hồi MP cực nhanh, chuyên phụ trách hỗ trợ và hồi sức cho đồng đội.', 'Phù Thủy Hỗ Trợ (Mystic Supporter 🪄):'),
                    createBullet('Sinh lực 9.999.999, Giáp 500. Bia tập bắn bất tử dùng để thử nghiệm chuỗi kỹ năng và đo đạc DPS.', 'Bù Nhìn Luyện Tập (Practice Dummy 🪵):'),

                    // SECTION 6
                    createHeading1('6. KIẾN TRÚC KỸ THUẬT & ĐỒ HỌA (TECHNICAL DESIGN)'),
                    createParagraph('Hệ thống được phát triển trên kiến trúc hiện đại, phân tách rành mạch giữa hiển thị đồ họa máy trạm và logic máy chủ:'),

                    createHeading2('6.1 Đồ họa WebGL & Custom Shader trên Client'),
                    createBullet('Loại bỏ phông nền màu Magenta (#FF00FF) tự động trên chip đồ họa GPU, giúp tải Spritesheet dung lượng nhẹ và đạt hiệu năng tối ưu.', 'GPU Chroma Keying Shader:'),
                    createBullet('Kích hoạt biến đổi nháy trắng toàn thân nhân vật trong 50ms khi trúng đòn kết hợp Camera Shake, tạo cảm giác lực chân thực.', 'Hit-Flash & Camera Shake:'),
                    createBullet('Thu nhỏ nhẹ tọa độ UV (0.001 inset) giúp khử hoàn toàn hiện tượng lem màu viền pixel khi camera phóng to thu nhỏ.', 'UV Inset Stabilization:'),
                    createBullet('Điều chỉnh tâm chân nhân vật riêng theo từng trạng thái (Đứng, Chạy, Vung kiếm, Dùng chiêu), triệt tiêu hiện tượng trượt chân.', 'Dynamic Pivot Offsets:'),

                    createHeading2('6.2 Hệ thống Máy chủ Quản lý Trận đấu (Server-Authoritative)'),
                    createBullet('Vòng lặp tính toán vật lý cố định 50ms (20 ticks/sec), xử lý va chạm, hồi phục năng lượng và đếm ngược trạng thái.', 'Fixed Tick-Rate Battle Loop:'),
                    createBullet('Máy chủ sở hữu toàn quyền quyết định sát thương, máu và vị trí nhân vật, chống hoàn toàn nguy cơ gian lận trên trình duyệt.', 'Server Validation:'),
                    createBullet('Hỗ trợ tự động đếm ngược 3... 2... 1... CHIẾN! và khởi động lại vòng lặp mượt mà sau mỗi trận đấu mà không bị đứng hình.', 'Auto-Restart Lifecycle:'),

                    // SECTION 7
                    createHeading1('7. HỆ THỐNG GIAO DIỆN & TƯƠNG TÁC (UI/UX)'),
                    createParagraph('Giao diện được thiết kế theo phong cách Glassmorphism hiện đại, tối ưu cho thao tác nhanh:'),
                    createBullet('Hiển thị 5 viên Ngọc Năng Lượng ở trung tâm, tự động phát sáng khi đủ điều kiện tung chiêu thức tương ứng.', 'Thanh Khối Năng Lượng (Orb Gauge):'),
                    createBullet('Cho phép người chơi click chọn trước kỹ năng trong lúc nhân vật đang thực hiện cử động khác, chiêu thức sẽ tự động xuất kích ngay khi có thể.', 'Hàng Đợi Kỹ Năng (Skill Queue):'),
                    createBullet('Hộp thoại thông báo Chiến Thắng / Thất Bại trang bị sẵn nút "Thử Lại Trận Này" cùng phím tắt bàn phím Space / Enter / R tiện lợi.', 'Màn Hình Kết Thúc Trận Đấu:'),
                    createBullet('Hỗ trợ bấm số 1, 2, 3 để dùng kỹ năng; phím P hoặc Esc để tạm dừng trận đấu; chuột kéo thả di chuyển các bảng công cụ test.', 'Hệ Thống Phím Tắt & Thao Tác:'),

                    // SECTION 8
                    createHeading1('8. LỘ TRÌNH SẢN XUẤT (ROADMAP & PRODUCTION MILESTONES)'),
                    createParagraph('Lộ trình phát triển được phân chia thành 4 cột mốc chiến lược:'),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    createTableCell('Cột mốc (Milestone)', { isHeader: true, width: 25 }),
                                    createTableCell('Trạng thái', { isHeader: true, width: 20 }),
                                    createTableCell('Mục tiêu trọng tâm cần bàn giao', { isHeader: true, width: 55 })
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Milestone 1: Đấu trường Cốt lõi', { bold: true }),
                                    createTableCell('ĐÃ HOÀN THÀNH', { bold: true, color: '16A34A' }),
                                    createTableCell('WebGL Engine 2.5D, Custom Chroma Key Shader, Sát Thủ hoạt họa mượt mà, đường ống tính sát thương 7 lớp và cơ chế chơi lại mượt mà.')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Milestone 2: Trang bị & Bản đồ', { bold: true }),
                                    createTableCell('ƯU TIÊN HIỆN TẠI', { bold: true, color: 'EA580C' }),
                                    createTableCell('Hệ thống 4 slot trang bị (Vũ khí, Giáp, Trang sức, Quả cầu Orb), bản đồ thám hiểm 2.5D bán mở, chuyển cảnh chiến đấu và chuẩn hóa Spritesheet cho dàn quái vật.')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Milestone 3: Đội hình & Bắt thú', { bold: true }),
                                    createTableCell('GIAI ĐOẠN TIẾP', { bold: true, color: '2563EB' }),
                                    createTableCell('Cơ chế ném bóng thu phục Capsule khi máu dưới 30%, điều khiển đội hình 4 nhân vật, tương sinh tương khắc ngũ hành.')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    createTableCell('Milestone 4: Máy chủ MMO', { bold: true }),
                                    createTableCell('KẾ HOẠCH BẮT ĐẦU', { bold: true, color: '9333EA' }),
                                    createTableCell('Lưu trữ dữ liệu đám mây (Database), hệ thống phòng chơi nhiều bản đồ đồng thời, chợ giao dịch và bang hội.')
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ spacing: { before: 200 } }),
                    createParagraph('Tài liệu được bảo lưu và phát hành chính thức cho dự án Legend of Capsules.', { italics: true, color: MUTED_COLOR })
                ]
            }
        ]
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, 'Legend_of_Capsules_Game_Design_Document.docx');
    fs.writeFileSync(outputPath, buffer);
    console.log('Successfully created Word document at:', outputPath);
}

generate().catch(console.error);
