// Mốc xương Zerith đo trên tranh toàn thân art/zerith/01-character.png (toạ độ pixel của tranh)
export const BONES = {
    hip: [830, 845],
    thighN: [[805, 852], [812, 1005]], shinN: [[812, 1005], [800, 1182]],   // chân gần (bốt trái)
    thighF: [[880, 852], [886, 1005]], shinF: [[886, 1005], [905, 1140]],   // chân xa (bốt phải, phía sau)
    waist: [830, 845], neck: [870, 432], cape: [700, 480], tail: [565, 765],
    armN: [[745, 560], [665, 700]],          // tay cầm liềm (cả ống tay = 1 mảnh)
    armF: [[955, 560], [962, 738]],          // tay thả lỏng
    grip: [653, 760],                         // chỗ nắm cán liềm
    eye: [903, 350],
};
const tilt = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
const B = BONES;
export const REST = {
    thighN: tilt(...B.thighN), shinN: tilt(...B.shinN) - tilt(...B.thighN),
    thighF: tilt(...B.thighF), shinF: tilt(...B.shinF) - tilt(...B.thighF),
    armN: tilt(...B.armN), foreN: 0, handN: 0,
    armF: tilt(...B.armF), foreF: 0, handF: 0,
};
