// A fire guardian spirit hovering: a broad flame body with a 1 px dark outline, a charred visor with two glowing
// eyes, a burning heart in the chest, flame arms with clenched fists and charred bracers (the near fist held
// forward, the far arm swung back clear of the body so both read), no legs (the body pours down into a swinging
// tail of fire), a crest of flame streaming back off its head, licks and embers rising off it. Faces right; the
// anchor is the floor under it. Drawn at the hero's pixel density (about 30 px per game unit). The body itself is
// in ./_guard.js, shared with fire/ignar-guard-throw and fire/ignar-guard-roar.
import { fit } from "../../core/index.js";
import { hotFirst } from "./_lib.js";
import { drawGuard, HOVER, REST } from "./_guard.js";

export const meta = {
  name: "Ignar guard",
  desc: "A fire guardian spirit hovering: an outlined flame body, charred visor and glowing eyes, fists and bracers, a crest streaming back and a swinging tail of fire for legs.",
  tags: ["fire", "spirit", "elemental", "summon", "guardian", "creature", "loop"],
  size: [72, 104],
  origin: [36, 101],
  duration: HOVER,
  loop: true,
  fps: 15,
  bg: "dark",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#f05a10", "#ff7a18", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    seed: 9,
  },
};

export function draw(p, t, o) {
  drawGuard(p, t, o, hotFirst(fit(o.palette, 9)), REST);
}
