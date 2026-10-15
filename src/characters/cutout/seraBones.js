// Mốc xương Seraphine đo trên tranh toàn thân art/seraphine/01-character.png (toạ độ pixel của tranh)
// Dùng chung cho seraRig (đặt khớp) và seraClips (tư thế đứng = đúng y tranh)
export const BONES = {
    hip: [745, 700],
    thighN: [[722, 705], [692, 830]], shinN: [[692, 830], [668, 1000]],
    thighF: [[772, 705], [773, 842]], shinF: [[773, 842], [770, 1000]],
    waist: [740, 690], neck: [740, 410], tie: [545, 320], cape: [660, 440],
    armN: [[628, 528], [602, 615]], foreN: [[602, 615], [588, 705]],
    armF: [[815, 548], [940, 600]],          // tay cầm gậy: cả ống tay áo là 1 mảnh (vai -> cổ tay)
    grip: [965, 600], eye: [785, 336],
};

/** Góc khớp (rad) để xương a->b nằm đúng như trong tranh (dương = đưa ra trước) */
const tilt = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
const B = BONES;
/** Góc các khớp dựng lại đúng tư thế trong tranh — seraClips dùng làm tư thế đứng chờ */
export const REST = {
    thighN: tilt(...B.thighN), shinN: tilt(...B.shinN) - tilt(...B.thighN),
    thighF: tilt(...B.thighF), shinF: tilt(...B.shinF) - tilt(...B.thighF),
    armN: tilt(...B.armN), foreN: tilt(...B.foreN) - tilt(...B.armN), handN: 0,
    armF: tilt(...B.armF), foreF: 0,
};
