// ============================================================
// PLACEHOLDER CHARACTER VIEW — hình tròn vẽ bằng canvas cho lớp chưa có asset
// ============================================================
import * as THREE from 'three';
import { CharacterView } from './CharacterView.js';

function createCharTexture(color, label, isMyTeam) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 160;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(64, 70, 45, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(48, 52, 18, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(46, 62, 12, 0, Math.PI * 2); ctx.arc(82, 62, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(50, 62, 5, 0, Math.PI * 2); ctx.arc(78, 62, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#111';
    ctx.fillRect(20, 75, 88, 10);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, 64, 135);

    if (isMyTeam) {
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(64, 70, 48, 0, Math.PI * 2); ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

export class PlaceholderCharacterView extends CharacterView {
    constructor(member, classDef, isMyTeam) {
        super(member, classDef, isMyTeam);
        const mat = new THREE.SpriteMaterial({ map: createCharTexture(member.color, member.name, isMyTeam) });
        this.body = new THREE.Sprite(mat);
        this.body.scale.set(1.8, 2.2, 1);
        this.body.position.y = 0.6; // chân chạm mặt đất
        this.root.add(this.body);
        this.setBarHeight(2.0);
    }

    setOpacity(value) {
        this.body.material.opacity = value;
    }

    // flashHit(): SpriteMaterial không làm trắng được — bỏ qua cho tới khi quái có asset thật
}
