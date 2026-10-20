// Mốc xương Ignar đo trên tranh toàn thân art/ignar/01-character.png (toạ độ pixel của tranh)
// Dùng chung cho ignarRig (đặt khớp) và ignarClips (tư thế đứng = đúng y tranh)
export const BONES = {
    hip: [700, 770],
    thighN: [[640, 780], [628, 893]], shinN: [[628, 893], [632, 1040]],     // chân gần = chân trái trong tranh
    thighF: [[750, 780], [752, 893]], shinF: [[752, 893], [760, 1040]],
    waist: [700, 760], neck: [712, 392], cape: [600, 450],
    armN: [[600, 480], [580, 612]], foreN: [[580, 612], [556, 690]],     // tay gần thả lỏng
    // tay xa: bắp tay ẩn dưới vạt vai (không hình) -> khuỷu = gốc ống tay loe -> cổ tay. Khuỷu đặt đúng điểm xoay cũ (812, 545)
    //   nên động tác cũ (xoay cả ống tay) giữ nguyên hình; động tác mới gập được khuỷu + cổ tay
    armF: [[790, 470], [812, 545]], foreF: [[812, 545], [905, 575]],
    eye: [770, 326],
    palm: [985, 515],                                                      // lòng bàn tay (quả cầu lửa lơ lửng phía trên)
};
const tilt = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
const B = BONES;
/** Góc các khớp dựng lại đúng tư thế trong tranh */
export const REST = {
    thighN: tilt(...B.thighN), shinN: tilt(...B.shinN) - tilt(...B.thighN),
    thighF: tilt(...B.thighF), shinF: tilt(...B.shinF) - tilt(...B.thighF),
    armN: tilt(...B.armN), foreN: tilt(...B.foreN) - tilt(...B.armN), handN: 0,
    armF: tilt(...B.armF), foreF: tilt(...B.foreF) - tilt(...B.armF), handF: 0,
};
