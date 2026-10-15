// Mốc xương Brakk đo trên tranh toàn thân art/brakk/01-character.png (toạ độ pixel của tranh, nhìn sang phải)
export const BONES = {
    hip: [800, 820], waist: [800, 820],
    thighN: [[765, 845], [760, 950]], shinN: [[760, 950], [745, 1165]],   // chân gần (bốt trái, phía trước)
    thighF: [[870, 848], [875, 950]], shinF: [[875, 950], [890, 1160]],   // chân xa (bốt phải, phía sau)
    neck: [845, 395], tail: [615, 790], eye: [912, 275],
    armN: [[650, 465], [565, 610]],    // bắp tay gần (vai -> khuỷu)
    foreN: [[565, 610], [612, 765]],   // cẳng tay gần (khuỷu -> cổ tay, có băng quấn)
    armF: [[880, 470], [920, 705]],    // bắp tay xa (bị thân che, lấy từ tấm bộ phận)
    foreF: [[920, 705], [955, 790]],   // cẳng tay xa (băng quấn)
};
const tilt = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
const B = BONES;
export const REST = {
    thighN: tilt(...B.thighN), shinN: tilt(...B.shinN) - tilt(...B.thighN),
    thighF: tilt(...B.thighF), shinF: tilt(...B.shinF) - tilt(...B.thighF),
    armN: tilt(...B.armN), foreN: tilt(...B.foreN) - tilt(...B.armN), handN: 0,
    armF: tilt(...B.armF), foreF: tilt(...B.foreF) - tilt(...B.armF), handF: 0,
};
