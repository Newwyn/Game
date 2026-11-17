// ============================================================
// 6 QUÂN CỜ của Leon kiểu SPRITE: Tốt · Xe · Mã · Tượng · Vua · Hậu
// Tấm đứng do Codex vẽ, tấm động tác do Flow vẽ (art/leon/<quân>/, art/leon/<quân>/flow/), chỉ tách nền + căn chân.
// Atlas: tools/sprite_pack.py art/leon/<quân>/sprite_spec.json -> src/assets/sprites/chess_<quân>_sprite.webp + chess_<quân>Sprite.json
// Khung xương ẩn mượn của Golem — tên clip tranh = tên clip khung xương:
//   attack = đánh thường · aura = chiêu thứ 1 (hàng trên tấm skill) · summon = chiêu thứ 2 (hàng dưới) · charge = giữ dáng niệm
// ============================================================
import pawnUrl from '../../assets/sprites/chess_pawn_sprite.webp';
import pawnMeta from './chess_pawnSprite.json';
import rookUrl from '../../assets/sprites/chess_rook_sprite.webp';
import rookMeta from './chess_rookSprite.json';
import knightUrl from '../../assets/sprites/chess_knight_sprite.webp';
import knightMeta from './chess_knightSprite.json';
import bishopUrl from '../../assets/sprites/chess_bishop_sprite.webp';
import bishopMeta from './chess_bishopSprite.json';
import kingUrl from '../../assets/sprites/chess_king_sprite.webp';
import kingMeta from './chess_kingSprite.json';
import queenUrl from '../../assets/sprites/chess_queen_sprite.webp';
import queenMeta from './chess_queenSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);
// dead: số khung gục thật có trong atlas (Tốt / Mã / Vua / Hậu chỉ tách được 3 khung) · attack: bỏ khung nào lỗi thì liệt kê lại
const piece = (image, meta, { dead = 4, attack = r('attack', 8), release = 4, hold = ['skillA3', 'skillA4'] } = {}) => ({
    image, meta,
    idle: { A: { frames: r('idle', 4), fps: 3 }, C: { frames: ['idle1'], breath: true } },
    defaultIdle: 'C',
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        attack:  { mode: 'strike', frames: attack, release },
        aura:    { mode: 'strike', frames: [...r('skillA', 4), 'ready1'], release: 3 },
        summon:  { mode: 'clip', frames: r('skillB', 4), noLift: true },
        charge:  { mode: 'loop', frames: hold, fps: 3 },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'loop', frames: ['hurt3', 'hurt4'], fps: 3 },
        dead:    { mode: 'once', frames: r('dead', dead), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: r('ready', 4) },
        victoryIdle: { mode: 'still', frames: ['idle1'] },
    },
    lean: [],
});

export const CHESS_PAWN_SPRITE = piece(pawnUrl, pawnMeta, { dead: 3 });
export const CHESS_ROOK_SPRITE = piece(rookUrl, rookMeta);
// Mã: khung attack2 bị dính mũi thương của khung bên cạnh -> bỏ
export const CHESS_KNIGHT_SPRITE = piece(knightUrl, knightMeta, { dead: 3, attack: ['attack1', 'attack3', 'attack4', 'attack5', 'attack6', 'attack7', 'attack8'], release: 3 });
export const CHESS_BISHOP_SPRITE = piece(bishopUrl, bishopMeta, { hold: ['skillA2', 'skillA3', 'skillA4'] });
// Vua: Phán Quyết = giơ kiếm (skillB2, skillB3) rồi chém (skillB4)
export const CHESS_KING_SPRITE = piece(kingUrl, kingMeta, { dead: 3, hold: ['skillB2', 'skillB3'] });
export const CHESS_QUEEN_SPRITE = piece(queenUrl, queenMeta, { dead: 3, hold: ['skillB1', 'skillB2'] });
