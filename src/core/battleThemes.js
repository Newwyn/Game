// Pure payload mapping. Stage IDs take precedence over display numbers (chapter 2
// uses global display numbers 21..40). Unknown/malformed payloads stay playable.
export const CHAPTER_ONE = Object.freeze([
    'meadow', 'village', 'field', 'forest', 'mine', 'forest', 'outpost',
    'swamp', 'camp', 'square', 'mine', 'bridge', 'outpost', 'market',
    'market', 'gate', 'library', 'castle', 'hall', 'battlement', 'tower',
]);
export const BRANCHES = Object.freeze({
    'c1-n1': 'well', 'c1-n2': 'deepMine', 'c1-n3': 'field',
    'c1-n4': 'library', 'c1-n5': 'crypt',
    'c2-n1': 'elf', 'c2-n2': 'elf', 'c2-n3': 'moon', 'c2-n4': 'elf',
});
export const WILD_THEMES = Object.freeze({ outskirts: 'field', forest: 'forest', road: 'road' });

// kind drives the procedural prop recipe; surface drives the tiny tiled texture.
const theme = (kind, surface, ground, sky, sun = 0xffefd2, intensity = 1.6, near = 32, far = 85) =>
    Object.freeze({ kind, surface, ground, sky, sun, intensity, near, far });
export const BATTLE_THEMES = Object.freeze({
    meadow: theme('meadow', 'grass', 0x72994b, 0xe9dcbf),
    village: theme('village', 'dirt', 0xb0986c, 0xf0d4ad),
    field: theme('field', 'grass', 0x92944b, 0xdce2bd),
    forest: theme('forest', 'moss', 0x4c6943, 0x9eafa0, 0xd8ebcc, 1.2),
    mine: theme('mine', 'dirt', 0x69635a, 0x343b42, 0xc8d8ed, 0.8, 28, 65),
    deepMine: theme('mine', 'stone', 0x50535e, 0x202634, 0xa1bbed, 0.65, 25, 60),
    outpost: theme('outpost', 'dirt', 0x9b8962, 0xcdd6bb),
    swamp: theme('swamp', 'moss', 0x4e6051, 0x718e82, 0xb2d9bf, 0.95, 25, 62),
    camp: theme('camp', 'dirt', 0x7b7854, 0xa4b3a0),
    square: theme('square', 'cobble', 0xb3a28b, 0xefd8b4),
    bridge: theme('bridge', 'planks', 0xa18b6a, 0xc2d3d5),
    market: theme('market', 'cobble', 0xada391, 0xe7d8c1),
    gate: theme('gate', 'cobble', 0x9d9fa1, 0xcbd4dd),
    library: theme('library', 'stone', 0x928783, 0x514958, 0xffd59b, 1.1),
    castle: theme('castle', 'cobble', 0xb7afa1, 0xd8d6ce),
    hall: theme('hall', 'stone', 0xa69c90, 0x3d3445, 0xffd09c, 1.25, 35, 90),
    battlement: theme('battlement', 'stone', 0x999694, 0x929eaf),
    tower: theme('tower', 'stone', 0x6a7285, 0x172338, 0xaac5ff, 0.85, 38, 100),
    well: theme('well', 'cobble', 0xa99b7d, 0xe6d4b4),
    crypt: theme('crypt', 'stone', 0x555965, 0x252535, 0xb3b8e0, 0.7, 28, 65),
    elf: theme('elf', 'moss', 0x3e6961, 0x244953, 0xb0ebdf, 1.05, 30, 85),
    moon: theme('moon', 'stone', 0xb8c9d9, 0x192d52, 0xbad7ff, 1.3, 45, 120),
    ruins: theme('ruins', 'stone', 0x61616d, 0x282b3b, 0xb4bdd7, 0.75, 28, 70),
    road: theme('road', 'dirt', 0x9d906c, 0xc9d7c3),
});

export function themeForBattle(data) {
    if (data?.mode !== 'campaign') return 'meadow';
    const id = data.stage?.id;
    if (typeof id !== 'string') return 'meadow';
    if (Object.hasOwn(BRANCHES, id)) return BRANCHES[id];
    if (/^d-(set|jewel)-[123]$/.test(id)) return 'ruins';
    if (id.startsWith('wild-')) return Object.hasOwn(WILD_THEMES, id.slice(5)) ? WILD_THEMES[id.slice(5)] : 'meadow';
    const match = /^c([12])-(\d{2})$/.exec(id);
    if (!match) return 'meadow';
    const no = Number(match[2]);
    if (no < 1 || no > 20) return 'meadow';
    return match[1] === '1' ? CHAPTER_ONE[no] : no <= 12 ? 'elf' : 'moon';
}
