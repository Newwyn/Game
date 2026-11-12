const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const json = (p, name) => JSON.parse(read(p).split(`export const ${name} = `)[1].trim().replace(/;$/, ''));
const maps = json('src/world/maps.js', 'MAPS');
const extra = json('src/world/mapsExtra.js', 'EXTRA').capital;
const m = maps.capital;
const objects = [...new Map([...m.objects, ...extra].map(o => [o.id, o])).values()];
const expected = 'gate_board market_chest crypt jump_capital_step1 jump_capital_step2 pages sp_square sp_archive sp_relief sp_tower clue_poster pg1 pg2 pg3 ch1 ch2 ch3 ch4 ch5 pk_hoa p_thuky so_no g_tao4 n_tuong n_cho hc_cho n_thu_vien g_capital_tao_1 g_capital_tao_2'.split(' ');

test('Valoria is a connected 72 x 44 city with every original interaction ID', async () => {
    const { flood, audit, exitCells } = await import('../tools/world_audit.mjs');
    assert.deepEqual([m.cols, m.rows], [72, 44]);
    const cells = m.grid.reduce((n, row) => n + [...row].filter(c => c === '.').length, 0);
    assert.ok(cells / (72 * 44) >= .35 && cells / (72 * 44) <= .45);
    assert.equal(flood(m).size, cells);
    assert.deepEqual(objects.map(o => o.id).sort(), expected.sort());
    assert.deepEqual(m.npcs.map(o => o.id).sort(), ['corvin', 'elise', 'merchant2', 'nun', 'villager_m2']);
    // Intentional narrow residential lanes are reported as advisory type d.
    assert.deepEqual(audit().capital.filter(i=>i.type!=='d'), []);
    assert.deepEqual(m.jumpSites, []);
    assert.deepEqual(m.gaps, []);
    const solid = new Set([...m.npcs, ...objects.filter(o => o.solid)].map(o => `${o.x},${o.y}`));
    const reached = flood(m, m.spawn, solid);
    for (const o of [...m.npcs, ...objects]) {
        assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => reached.has(`${o.x+dx},${o.y+dy}`)), o.id);
        if (m.grid[o.y][o.x] !== '.') assert.equal(o.solid, true, o.id);
    }
    for (const e of m.exits) for (const [x,y] of exitCells(m,e)) assert.ok(reached.has(`${x},${y}`));
    for (const src of Object.values(maps)) for (const e of src.exits.filter(e => e.scene === 'capital')) assert.ok(reached.has(e.at.join(',')));
});

test('Valoria buildings and props have reserved ground', async () => {
    const { CAPITAL_ITEMS, CAPITAL_DETAIL, CAPITAL_STYLE } = await import('../src/world3d/capitalLayout.js');
    assert.deepEqual(CAPITAL_STYLE.ground.s, [.09, .10, .62]);
    const covered = new Set();
    const cover = (x0,y0,x1,y1) => {
        for (let y=Math.floor(y0); y<y1; y++) for (let x=Math.floor(x0); x<x1; x++) covered.add(`${x},${y}`);
    };
    for (const [kind,...p] of [...CAPITAL_ITEMS, ...CAPITAL_DETAIL]) {
        if (kind === 'house' || kind === 'hall') {
            const b=p[0]; cover(b.x0,b.z0,b.x1,b.z1);
            for(let y=b.z0;y<b.z1;y++) for(let x=b.x0;x<b.x1;x++) assert.equal(m.grid[y][x],'#',`${kind} ${x},${y}`);
            // Painted houses select a rotated kit for wide rectangles.
            const choices=[[2,2,0],[2,3,0],[3,4,0],[2,3,1],[3,4,1]];
            const score=([w,d,t])=>Math.abs(Math.log((t?d:w)/(t?w:d))-Math.log((b.x1-b.x0)/(b.z1-b.z0)))+(t?0:.05);
            const turn=kind==='house' ? choices.sort((a,b)=>score(a)-score(b))[0][2] : 0;
            const door=turn ? [b.x1,Math.floor((b.z0+b.z1)/2)] : [Math.floor(b.door),b.z1];
            assert.equal(m.grid[door[1]][door[0]],'.',`door ${door}`);
        } else if(kind==='castleWall') {
            cover(Math.min(p[0][0],p[1][0])-.49,p[0][1]-.49,Math.max(p[0][0],p[1][0])+.49,p[0][1]+.49);
        } else if(kind==='well') cover(p[0]-1,p[1]-1,p[0]+1,p[1]+1);
        else if(kind==='model') {
            const [name,x,y,opt]=p;
            const file=fs.readFileSync(path.join(__dirname,'../src/assets/world3d',name+'.glb'));
            const glb=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)).toString());
            const bounds=glb.accessors[0],s=opt.s??1;
            if(name.endsWith('bridge_stone')) continue;
            cover(x+bounds.min[0]*s,y+bounds.min[2]*(opt.sz??s),x+bounds.max[0]*s,y+bounds.max[2]*(opt.sz??s));
        }
    }
    // Terrain trees/water explain their own blockers; masonry and reserved
    // niches must have a corresponding structure or model footprint.
    const terrain=json('src/world/terrain3d.js','TERRAIN').capital;
    for(let y=0;y<44;y++)for(let x=0;x<72;x++)
        if(m.grid[y][x]==='#' && terrain[y][x]==='s')
            assert.ok(covered.has(`${x},${y}`),`uncovered blocker ${x},${y}`);
    for(const [kind,...p] of CAPITAL_DETAIL) {
        const x=kind==='model'?p[1]:p[0], y=kind==='model'?p[2]:p[1];
        assert.equal(m.grid[Math.floor(y)][Math.floor(x)],'#',`hidden detail ${p}`);
        if(kind==='model')assert.ok(fs.existsSync(path.join(__dirname,'../src/assets/world3d',p[0]+'.glb')));
    }
});

test('Valoria canal, two bridges, gateways and orchard keep their district roles', async () => {
    const terrain=json('src/world/terrain3d.js','TERRAIN').capital;
    for(const y of [30,31]) for(let x=2;x<70;x++) if(!(x>=11&&x<17)&&!(x>=33&&x<39)) assert.equal(terrain[y][x],'w');
    const { CAPITAL_ITEMS }=await import('../src/world3d/capitalLayout.js');
    assert.equal(CAPITAL_ITEMS.filter(i=>i[1]==='custom/town_bridge_stone').length,2);
    assert.deepEqual(m.spawn,[35,42]);
    assert.deepEqual(m.exits.find(e=>e.scene==='road').tiles,[[35,43]]);
    for(const o of objects.filter(o=>o.id.includes('tao'))) assert.ok(o.x>=22&&o.x<30&&o.y>=4&&o.y<17,o.id);
});


test('Valoria has dense terraces and visible, varied street furniture', async () => {
    const { CAPITAL_ITEMS, CAPITAL_DETAIL }=await import('../src/world3d/capitalLayout.js');
    const houses=CAPITAL_ITEMS.filter(i=>i[0]==='house');
    const props=[...CAPITAL_ITEMS,...CAPITAL_DETAIL].filter(i=>i[0]==='model' && !i[1].endsWith('bridge_stone'));
    assert.ok(houses.length>=70 && houses.length<=90,`houses: ${houses.length}`);
    assert.ok(props.length>=250,`props: ${props.length}`);
    assert.ok(new Set(props.map(i=>i[1])).size>=20);
    assert.deepEqual(new Set(houses.map(i=>i[1].wall)),new Set(['plaster','stone']));
    const occupied=new Set();
    for(const [,b] of houses) {
        assert.ok(b.x1-b.x0>=3 && b.x1-b.x0<=5);
        assert.ok(b.z1-b.z0>=3 && b.z1-b.z0<=4);
        for(let y=b.z0;y<b.z1;y++)for(let x=b.x0;x<b.x1;x++) {
            assert.ok(!occupied.has(`${x},${y}`),'overlapping houses');
            occupied.add(`${x},${y}`);
        }
    }
    for(const [,name,x,y] of props) {
        const cell=`${Math.floor(x)},${Math.floor(y)}`;
        assert.equal(m.grid[Math.floor(y)][Math.floor(x)],'#',`hidden prop ${name} ${cell}`);
        assert.ok(!occupied.has(cell),`prop inside house ${name} ${cell}`);
    }
    assert.equal(props.filter(i=>i[1]==='custom/well').length,2);
    assert.ok(props.filter(i=>i[1].includes('town_stall_')).length>=10);
    // North and south market rows leave at least two uninterrupted aisle rows.
    for(const y of [20,21]) for(let x=25;x<48;x++) assert.equal(m.grid[y][x],'.');
    for(const [,name,x,y,opt] of CAPITAL_ITEMS.filter(i=>i[1]==='custom/town_bridge_stone')) {
        assert.equal(opt.s*6,4,'four-tile bank-to-bank span');
        assert.equal(opt.sz*3,6,'six-tile bridge deck width');
        for(let yy=29;yy<33;yy++) for(const xx of [x-2,x-1,x+1,x+2]) assert.equal(m.grid[yy][xx],'.');
    }
});


test('runtime and standalone capital exports stay synchronized', async () => {
    const { CAPITAL_ITEMS, CAPITAL_DETAIL, CAPITAL_STYLE }=await import('../src/world3d/capitalLayout.js');
    const { LAYOUTS }=await import('../src/world3d/layouts.js');
    assert.ok(JSON.stringify(LAYOUTS.capital) === JSON.stringify({ style: CAPITAL_STYLE, items: CAPITAL_ITEMS, detailItems: CAPITAL_DETAIL }), 'runtime capital layout must be regenerated');
});


test('all pass-one interaction coordinate contracts are unchanged', () => {
    const expected = {"corvin": [10, 11], "elise": [42, 12], "nun": [10, 21], "villager_m2": [40, 37], "merchant2": [30, 20], "gate_board": [40, 39], "market_chest": [44, 25], "crypt": [21, 18], "jump_capital_step1": [6, 11], "jump_capital_step2": [50, 11], "pages": [12, 11], "sp_square": [29, 22], "sp_archive": [15, 11], "sp_relief": [31, 37], "sp_tower": [48, 11], "clue_poster": [33, 38], "pg1": [18, 11], "pg2": [46, 21], "pg3": [58, 21], "ch1": [8, 21], "ch2": [16, 21], "ch3": [50, 19], "ch4": [8, 39], "ch5": [59, 39], "pk_hoa": [25, 14], "p_thuky": [46, 12], "so_no": [44, 12], "g_tao4": [25, 6], "n_tuong": [27, 25], "n_cho": [43, 20], "hc_cho": [46, 24], "n_thu_vien": [8, 11], "g_capital_tao_1": [23, 8], "g_capital_tao_2": [23, 12]};
    for(const o of [...m.npcs,...objects]) assert.deepEqual([o.x,o.y],expected[o.id],o.id);
});
