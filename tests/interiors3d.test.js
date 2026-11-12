const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const THREE = require('three');
const W = require('../game/world');
const C = require('../game/campaign');
const ids = ['cathedral_in', 'palace_in', 'archive_in'];
const audit = import('../tools/world_audit.mjs');
const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
const fresh = () => {
    const pr = C.ensureCampaign({}, 0);
    for (let i=1;i<=12;i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2,'0')}`]=true;
    W.ensureWorld(pr);
    return pr;
};

for (const id of ids) {
    test(`${id}: room, interactions and door round-trip remain reachable`, async () => {
        const {MAPS,TERRAIN,LAYOUTS,walk,flood,footprint,key,exitCells} = await audit;
        const m=MAPS[id], scene=W.SCENES[id];
        assert.ok(m.interior && m.interior3d && scene.interior3d);
        assert.deepEqual(TERRAIN[id],Array(m.rows).fill('s'.repeat(m.cols)));
        assert.ok(fs.statSync(`src/assets/maps/${id}.webp`).size>100);
        assert.equal(LAYOUTS[id].style.sky,0x100e13);
        assert.equal(scene.objects.filter(o=>o.type==='note').length,1);
        assert.equal(scene.objects.filter(o=>o.type==='chest').length,1);
        const occupied=new Set([...m.npcs,...m.objects].map(o=>key(o.x,o.y)));
        const reached=flood(m,m.spawn,occupied);
        for(const o of [...m.npcs,...m.objects])
            assert.ok(dirs.some(([dx,dy])=>reached.has(key(o.x+dx,o.y+dy))),`${id}/${o.id}`);
        for(const p of footprint(id)) assert.ok(!walk(m,...p.split(',').map(Number)),`${id} furniture on ${p}`);
        const enter=MAPS.capital.exits.find(e=>e.scene===id), back=m.exits[0];
        assert.ok(enter.door && back.door);
        assert.deepEqual(enter.at,m.spawn);
        assert.deepEqual(back.at,enter.tiles[0]);
        assert.ok(reached.has(key(...exitCells(m,back)[0])));
        assert.ok(walk(m,...enter.at));
        assert.ok(flood(MAPS.capital).has(key(...back.at)));
        const pr=fresh();
        assert.equal(W.move(pr,id,...enter.at,'up').ok,true);
        assert.deepEqual([pr.world.x,pr.world.y],enter.at);
        assert.equal(W.move(pr,'capital',...back.at,'down').ok,true);
        assert.deepEqual([pr.world.x,pr.world.y],back.at);
    });

    test(`${id}: notes, NPC dialogue and chest rewards survive save reload`, () => {
        const pr=fresh(), scene=W.SCENES[id];
        const wallet=pr.wallet;
        for(const n of scene.npcs) assert.ok(W.interact(pr,wallet,id,n).lines.length);
        const note=scene.objects.find(o=>o.type==='note');
        assert.ok(W.interact(pr,wallet,id,note.id).lines.length);
        const chest=scene.objects.find(o=>o.type==='chest');
        assert.ok(chest.reward.gold>=150 && chest.reward.gold<=300);
        assert.equal(W.interact(pr,wallet,id,chest.id).ok,true);
        const saved=JSON.parse(JSON.stringify(pr));
        const before=saved.wallet.gold;
        assert.equal(W.interact(saved,saved.wallet,id,chest.id).ok,false);
        assert.equal(saved.wallet.gold,before);
    });
}

// Read model-space GLB bounds including node transforms, as assets.js does.
function bounds(key) {
    const b=fs.readFileSync(`src/assets/world3d/${key}.glb`);
    const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
    const result=new THREE.Box3();
    function visit(i,parent=new THREE.Matrix4()) {
        const n=gltf.nodes[i];
        const matrix=n.matrix ? new THREE.Matrix4().fromArray(n.matrix) : new THREE.Matrix4().compose(
            new THREE.Vector3(...(n.translation??[0,0,0])),new THREE.Quaternion(...(n.rotation??[0,0,0,1])),new THREE.Vector3(...(n.scale??[1,1,1])));
        matrix.premultiply(parent);
        if(n.mesh!==undefined) for(const p of gltf.meshes[n.mesh].primitives) {
            const a=gltf.accessors[p.attributes.POSITION];
            result.union(new THREE.Box3(new THREE.Vector3(...a.min),new THREE.Vector3(...a.max)).applyMatrix4(matrix));
        }
        for(const child of n.children??[]) visit(child,matrix);
    }
    for(const i of gltf.scenes[gltf.scene??0].nodes) visit(i);
    return result;
}

test('interior models fit blocked tiles using their actual GLB bounds', async () => {
    const {MAPS,LAYOUTS,walk}=await audit;
    for(const id of ids) for(const [kind,key,x,z,o] of LAYOUTS[id].items) {
        if(kind!=='model') continue;
        const s=o.s??1;
        const b=bounds(key).applyMatrix4(new THREE.Matrix4().compose(
            new THREE.Vector3(x,o.y??0,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),o.r??0),new THREE.Vector3(s,o.sy??s,o.sz??s)));
        for(let y=Math.floor(b.min.z+.001);y<Math.ceil(b.max.z-.001);y++)
            for(let xx=Math.floor(b.min.x+.001);xx<Math.ceil(b.max.x-.001);xx++)
                assert.ok(!walk(MAPS[id],xx,y),`${id}/${key} overlaps ${xx},${y}`);
    }
});

test('capital NPCs and story objects stay outside; old village rooms stay flat', async () => {
    const {MAPS}=await audit;
    for(const n of ['elise','corvin','nun']) assert.ok(MAPS.capital.npcs.some(o=>o.id===n));
    assert.ok(W.SCENES.capital.objects.some(o=>o.id==='pages'));
    for(const id of ['tavern_in','forge_in','mira_in']) assert.ok(MAPS[id].interior && !MAPS[id].interior3d);
    assert.match(fs.readFileSync('src/ui/world.js','utf8'),/quality === '2d' \|\| \(!!map\?\.interior && !map\?\.interior3d\)/);
});
