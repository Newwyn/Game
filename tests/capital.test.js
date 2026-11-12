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
    assert.deepEqual(audit().capital, []);
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

test('Valoria layout exports match the standalone audit layout; buildings and props have reserved ground', async () => {
    const { CAPITAL_ITEMS, CAPITAL_DETAIL, CAPITAL_STYLE } = await import('../src/world3d/capitalLayout.js');
    const { LAYOUTS } = await import('../src/world3d/layouts.js');
    assert.deepEqual(LAYOUTS.capital, { items: CAPITAL_ITEMS, detailItems: CAPITAL_DETAIL, style: CAPITAL_STYLE });
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
    const plan=read('tools/build_capital.py').replace(/\r/g,'').split('PLAN = """\n')[1].split('\n"""')[0].split('\n');
    for(let y=0;y<44;y++)for(let x=0;x<72;x++)if('HWD'.includes(plan[y][x]))assert.ok(covered.has(`${x},${y}`),`uncovered blocker ${x},${y}`);
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
