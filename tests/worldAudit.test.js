const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const WD = require('../game/world');
const T = require('../game/testTools');
const C = require('../game/campaign');
const text = fs.readFileSync(path.join(__dirname, '../src/world/maps.js'), 'utf8');
const MAPS = JSON.parse(text.split('export const MAPS = ')[1].trim().replace(/;$/, ''));
const fresh = () => C.ensureCampaign({ heroes: { warrior: { level: 1, rank: 0, exp: 0 } }, items: {}, story: {} }, Date.now());

test('mọi điểm đáp của mọi lối ra là ô đi được và không trùng NPC', () => {
    for (const [id,m] of Object.entries(MAPS)) for (const e of m.exits) {
        const target=MAPS[e.scene], [x,y]=e.at;
        assert.equal(target.grid[y]?.[x], '.', `${id} → ${e.scene} (${x},${y})`);
        assert.ok(!target.npcs.some(n=>n.x===x && n.y===y), `${id}: đáp trùng NPC`);
    }
});

test('tool dịch chuyển dùng spawn vùng đích, kể cả dịch chuyển lại cùng vùng', () => {
    const p=fresh();
    for(const id of Object.keys(MAPS)) for(let i=0;i<2;i++) {
        p.world={...WD.ensureWorld(p),scene:'outskirts',x:3,y:12};
        if(i) p.world.scene=id;
        const version=p.world.teleportVersion??0;
        assert.ok(T.apply(p,{op:'teleport',scene:id},[]).ok);
        assert.deepEqual([p.world.x,p.world.y],MAPS[id].spawn);
        assert.equal(MAPS[id].grid[p.world.y][p.world.x],'.');
        assert.equal(WD.worldState(p).teleportVersion,version+1);
    }
});

test('đổi vùng và save cũ không giữ điểm đáp bị chặn hoặc ngoài bản đồ', () => {
    const p=fresh();
    for(const [x,y] of [[3,12],[-1,0],[999,999],[NaN,NaN]]) {
        WD.move(p,'ashford',x,y,'down');
        assert.deepEqual([p.world.x,p.world.y],MAPS.ashford.spawn);
        p.world.x=x;p.world.y=y;
        WD.ensureWorld(p);
        assert.deepEqual([p.world.x,p.world.y],MAPS.ashford.spawn);
    }
});

test('Ashford hết a/b/c; các lối nối Ashford quay lại đúng làn và hướng', async () => {
    const {audit,exitCells}=await import('../tools/world_audit.mjs');
    assert.deepEqual(audit().ashford.filter(i=>'abc'.includes(i.type)),[]);
    const opposite={left:'right',right:'left',up:'down',down:'up'};
    for(const [id,m] of Object.entries(MAPS)) for(const e of m.exits.filter(e=>e.edge&&(id==='ashford'||e.scene==='ashford'))) {
        const dest=MAPS[e.scene];
        for(const p of exitCells(m,e)) {
            const back=dest.exits.find(b=>b.scene===id && b.edge===opposite[e.edge] && exitCells(dest,b).some(q=>Math.abs(q[0]-e.at[0])+Math.abs(q[1]-e.at[1])===1));
            assert.ok(back,`${id} → ${e.scene}`);
            assert.equal(Math.abs(back.at[0]-p[0])+Math.abs(back.at[1]-p[1]),1);
            assert.equal(e.face,e.edge);
        }
    }
});

test('audit phát hiện điểm chặn, thiếu lối ngược và chân công trình 3D', async () => {
    const {audit,footprint}=await import('../tools/world_audit.mjs');
    const maps=structuredClone(MAPS);
    maps.ashford.spawn=[0,0];
    maps.outskirts.exits=maps.outskirts.exits.filter(e=>e.scene!=='ashford');
    const row=[...maps.ashford.grid[9]];row[32]='.';maps.ashford.grid[9]=row.join('');
    const issues=audit(maps).ashford;
    assert.ok(issues.some(i=>i.type==='a' && i.at.join(',')==='0,0'));
    assert.ok(issues.some(i=>i.type==='b' && i.text.includes('thiếu lối ngược')));
    assert.ok(issues.some(i=>i.type==='c' && i.at.join(',')==='32,9'));
    assert.ok(footprint('ashford').has('5,12'), 'giếng');
    assert.ok(footprint('ashford').has('36,10'), 'hàng rào');
});

test('ra khỏi ba nhà đứng trước đúng cửa, mặt quay xuống', () => {
    for(const id of ['tavern_in','forge_in','mira_in']) {
        const door=MAPS.ashford.exits.find(e=>e.scene===id).tiles[0];
        const back=MAPS[id].exits[0];
        assert.deepEqual(back.at,[door[0],door[1]+1]);
        assert.equal(back.face,'down');
    }
});

// Ngoại ô có xung đột hình học chưa thể sửa trong phạm vi file được phép.
test('bảy vùng hết lỗi điểm đáp và lối nối; sáu vùng hết lệch hình, Ngoại ô báo đúng hai ô rào',async()=>{
    const {audit}=await import('../tools/world_audit.mjs');
    const result=audit();
    for(const id of ['outskirts','forest','ashford','road','capital','sylvaren','lunaria']) {
        assert.deepEqual(result[id].filter(i=>'ab'.includes(i.type)),[],id);
        const c=result[id].filter(i=>i.type==='c');
        if(id==='outskirts')assert.deepEqual(c.map(i=>i.at),[[6,11],[6,12]]);
        else assert.deepEqual(c,[],id);
    }
});
