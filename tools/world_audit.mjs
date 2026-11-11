// Soát dữ liệu tĩnh, không cần mạng hay chạy game.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const root = new URL('../', import.meta.url);
export const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const moduleData = async p => import('data:text/javascript;base64,' + Buffer.from(read(p)).toString('base64'));
export const { MAPS } = await moduleData('src/world/maps.js');
export const { TERRAIN } = await moduleData('src/world/terrain3d.js');
export const { LAYOUTS } = await moduleData('src/world3d/layouts.js');
const { EXTRA } = await moduleData('src/world/mapsExtra.js');
const WD = createRequire(import.meta.url)('../game/world.js');
export const key = (x, y) => `${x},${y}`;
export const walk = (m, x, y) => Number.isInteger(x) && Number.isInteger(y) && m.grid[y]?.[x] === '.';
const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
export function flood(m, start = m.spawn, blocked = new Set()) {
    const seen = new Set(), q = [];
    if (walk(m, ...start) && !blocked.has(key(...start))) { seen.add(key(...start)); q.push(start); }
    for (let i = 0; i < q.length; i++) for (const [dx,dy] of dirs) {
        const x = q[i][0]+dx, y = q[i][1]+dy, k = key(x,y);
        if (walk(m,x,y) && !seen.has(k) && !blocked.has(k)) { seen.add(k); q.push([x,y]); }
    }
    return seen;
}
// Chân nhà xét tâm ô; hàng rào đi qua ô nào chặn ô đó; vật nhỏ lấy một ô.
export function footprint(id) {
    const cells = new Set();
    const put = (x,y) => cells.add(key(Math.floor(x),Math.floor(y)));
    for (const [type,...p] of LAYOUTS[id]?.items ?? []) {
        if (['house','hall'].includes(type)) {
            const b=p[0];
            for(let y=Math.floor(b.z0); y<b.z1; y++) for(let x=Math.floor(b.x0); x<b.x1; x++)
                if(x+.5>=b.x0 && x+.5<b.x1 && y+.5>=b.z0 && y+.5<b.z1) put(x,y);
        } else if (['fence','palisade','castleWall'].includes(type)) {
            const [[x,y],[xx,yy]]=p, n=Math.ceil(Math.hypot(xx-x,yy-y)*20);
            for(let i=0;i<=n;i++) put(x+(xx-x)*i/n,y+(yy-y)*i/n);
        } else if (['cliff','flowerbed'].includes(type)) {
            for(let y=Math.floor(p[1]);y<p[3];y++) for(let x=Math.floor(p[0]);x<p[2];x++)
                if(x+.5>=p[0] && x+.5<p[2] && y+.5>=p[1] && y+.5<p[3]) put(x,y);
        } else if(type==='model') put(p[1],p[2]);
        else if(!['plaza','clear','mist','rails','stoneBridge'].includes(type) && typeof p[0]==='number' && typeof p[1]==='number') put(p[0],p[1]);
    }
    return cells;
}
export function exitCells(m,e) {
    if(e.tiles) return e.tiles;
    return Array.from({length:e.b-e.a+1},(_,i)=> {
        const k=e.a+i;
        return e.edge==='left'?[0,k]:e.edge==='right'?[m.cols-1,k]:e.edge==='up'?[k,0]:[k,m.rows-1];
    });
}
const distance=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
const opposite={left:'right',right:'left',up:'down',down:'up'};
export function audit(maps=MAPS) {
    const result={};
    for(const [id,m] of Object.entries(maps)) {
        const issues=result[id]=[], seen=flood(m), foot=footprint(id);
        const add=(type,p,msg)=>issues.push({type,at:p,text:msg});
        const check=(p,label)=>{if(!walk(m,...p)) add('a',p,`${label}: ô bị chặn`); else if(!seen.has(key(...p))) add('a',p,`${label}: không tới được từ spawn`);};
        check(m.spawn,'spawn');
        for(const [from,src] of Object.entries(maps)) for(const e of src.exits) if(e.scene===id) check(e.at,`đáp từ ${from}`);
        for(const n of m.npcs) check([n.x,n.y],`nhà NPC ${n.id}`);
        const objects=new Map(m.objects.map(o=>[o.id,o]));
        for(const o of EXTRA[id]??[]) objects.set(o.id,o);
        for(const o of objects.values()) for(const p of o.trigger??[]) check(p,`trigger ${o.id}`);
        for(const e of m.exits) {
            for(const p of e.tiles??[]) check(p,`cửa → ${e.scene}`);
            const cells=exitCells(m,e).filter(p=>walk(m,...p)), dest=maps[e.scene];
            if(!cells.length) add('b',exitCells(m,e)[0],`lối → ${e.scene} không có ô đi được`);
            if(!dest) {add('b',e.at,`vùng ${e.scene} không tồn tại`);continue;}
            const backs=dest.exits.filter(b=>b.scene===id);
            const near=backs.filter(b=>exitCells(dest,b).some(p=>distance(p,e.at)<=1));
            if(!backs.length) add('b',e.at,`→ ${e.scene}: thiếu lối ngược`);
            else if(!near.length) add('b',e.at,`→ ${e.scene}: điểm đáp xa lối ngược`);
            if(e.edge && (!near.some(b=>b.edge===opposite[e.edge]) || e.face!==e.edge)) add('b',cells[0]??e.at,`→ ${e.scene}: hướng nối mép / mặt không khớp`);
            if(near.length && !near.some(b=>exitCells(dest,b).some(([x,y])=> {
                const [dx,dy]=e.face==='left'?[-1,0]:e.face==='right'?[1,0]:e.face==='up'?[0,-1]:[0,1];
                return (e.at[0]-x)*dx+(e.at[1]-y)*dy>0;
            }))) add('b',e.at,`→ ${e.scene}: mặt chưa quay ra khỏi lối vào`);
            if(e.door && e.face!==(dest.interior?'up':'down')) add('b',e.at,`→ ${e.scene}: mặt cửa không hợp`);
            for(const p of cells) if(near.length && !near.some(b=>distance(b.at,p)<=1)) add('b',p,`→ ${e.scene}: quay lại xa ô vừa rời`);
        }
        for(let y=0;y<m.rows;y++) for(let x=0;x<m.cols;x++) {
            const k=key(x,y), t=TERRAIN[id]?.[y]?.[x], solid=foot.has(k)||'tbw'.includes(t??'!');
            if(walk(m,x,y)) {
                if(solid) add('c',[x,y],`đi xuyên vật 3D (${foot.has(k)?'công trình':t})`);
                if(!seen.has(k)) add('d',[x,y],'túi ô không tới được từ spawn');
                if((!walk(m,x-1,y)&&!walk(m,x+1,y)) || (!walk(m,x,y-1)&&!walk(m,x,y+1))) add('d',[x,y],'khe rộng một ô — cần xem');
            } else if('gp'.includes(t??'!')&&!solid&&dirs.some(([dx,dy])=>walk(m,x+dx,y+dy))) add('c',[x,y],'tường vô hình trên cỏ/đường');
        }
        // Thử bỏ từng ô trong vùng đi lang thang: chỉ báo khi thực sự cắt thành phần liên thông.
        for(const n of m.npcs.filter(n=>WD.NPCS[n.id]?.wander)) for(let y=n.y-2;y<=n.y+2;y++) for(let x=n.x-2;x<=n.x+2;x++) {
            const k=key(x,y); if(!seen.has(k)) continue;
            const start=[...seen].find(s=>s!==k)?.split(',').map(Number);
            if(start && flood(m,start,new Set([k])).size<seen.size-1) add('e',[x,y],`NPC ${n.id} có thể chắn lối duy nhất`);
        }
    }
    return result;
}
export function report() {
    const result=audit();
    const lines=['# Báo cáo bản đồ', '', 'Tọa độ (x,y), tính từ 0. a: điểm đến/cửa/NPC; b: nối vùng; c: lệch hình 3D; d: túi/khe cần xem; e: NPC chắn lối.',
        'BFS dùng lưới tĩnh; NPC và vật truyện thay đổi theo tiến trình. Chân nhà xét tâm ô; rào xét các ô đoạn thẳng đi qua; vật nhỏ lấy một ô. Đây là phép soát dữ liệu, chưa thay kiểm tra hình trong game.', ''];
    for(const [id,issues] of Object.entries(result)) {
        const counts=Object.fromEntries('abcde'.split('').map(t=>[t,issues.filter(i=>i.type===t).length]));
        console.log(id,JSON.stringify(counts));
        lines.push(`## ${id} — ${issues.length} mục (${Object.entries(counts).map(([k,v])=>`${k}: ${v}`).join(', ')})`,'');
        for(const i of issues) lines.push(`- (${i.type}) (${i.at}) ${i.text}`);
        if(!issues.length) lines.push('Không thấy lỗi.');
        lines.push('');
    }
    const patch=read('tools/build_maps.py').match(/# AUDIT_CHANGES_BEGIN\n([\s\S]*?)# AUDIT_CHANGES_END/);
    if(patch) lines.push('## Các ô đã sửa ở Ashford','',...patch[1].trim().split('\n').map(s=>s.replace(/^# /,'- ')),'');
    lines.push('## Phạm vi demo','','Đã sửa Ashford và lối nối trực tiếp. Các mục d/e chỉ liệt kê, chưa tự sửa. Các vùng khác giữ nguyên trừ hành lang phía bắc Vương Đạo nối Ashford. Thiếu ảnh nguồn .team/art nên sinh bằng chế độ --data-only từ dữ liệu hiện có.');
    fs.mkdirSync(new URL('demo/',root),{recursive:true});
    fs.writeFileSync(new URL('demo/BAO_CAO_BAN_DO.md',root),lines.join('\n'));
    return result;
}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])) report();
