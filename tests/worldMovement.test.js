const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const W=require('../game/world');
const C=require('../game/campaign');
const src=fs.readFileSync('src/ui/world.js','utf8').split('// MOVEMENT_RULES_BEGIN')[1].split('// MOVEMENT_RULES_END')[0];
const rules=import('data:text/javascript;base64,'+Buffer.from(src.slice(src.indexOf('export const'))).toString('base64'));
const fresh=()=>C.ensureCampaign({heroes:{warrior:{level:1,rank:0,exp:0}},items:{},story:{}},Date.now());
const passed=(p,n)=>{for(let i=1;i<=n;i++)p.campaign.cleared.story[`c1-${String(i).padStart(2,'0')}`]=true;W.syncReports(p);};

test('nhảy lên từng bậc, xuống, khe và chạy xa; không vượt NPC hay noJump',async()=>{
    const {jumpTarget,canWalkTile}=await rules;
    const m={grid:['.......'],heights:['0120000'],gaps:[]};
    const blocked=(x,y)=>m.grid[y]?.[x]!=='.'||m.gaps.some(p=>p[0]===x&&p[1]===y);
    assert.equal(canWalkTile(m,0,0,1,0),false);
    assert.equal(jumpTarget(m,0,0,1,0,false,blocked).tx,1);
    assert.equal(jumpTarget(m,1,0,1,0,false,blocked).tx,2);
    assert.equal(jumpTarget(m,2,0,1,0,false,blocked).tx,3);
    m.heights=['0200000'];assert.equal(jumpTarget(m,0,0,1,0,false,blocked),null);
    m.heights=['0000000'];m.gaps=[[1,0]];
    assert.equal(jumpTarget(m,0,0,1,0,false,blocked).tx,2);
    m.heights=['0010000'];assert.equal(jumpTarget(m,0,0,1,0,false,blocked),null);
    m.heights=['0000000'];m.gaps=[[1,0],[2,0]];
    assert.equal(jumpTarget(m,0,0,1,0,false,blocked),null);
    assert.deepEqual(jumpTarget(m,0,0,1,0,true,blocked),{tx:3,ty:0,cost:2});
    m.noJump=[[2,0]];assert.equal(jumpTarget(m,0,0,1,0,true,blocked),null);
    m.gaps=[];m.noJump=[];assert.equal(jumpTarget(m,0,0,1,0,true,(x)=>x===1),null);
});
test('5 nấc thể lực; hồi đúng 1600ms; nhảy xa tốn 2',async()=>{
    const {spendStamina,recoverStamina}=await rules,s={value:5,at:0};
    assert.equal(spendStamina(s,2,0),true);assert.equal(s.value,3);
    for(let i=0;i<3;i++)assert.ok(spendStamina(s,1,0));
    assert.equal(spendStamina(s,1,1599),false);assert.equal(s.value,0);
    recoverStamina(s,1600);assert.equal(s.value,1);
    assert.equal(spendStamina(s,2,1600),false);
    recoverStamina(s,8000);assert.equal(s.value,5);
});

test('mỗi vùng: BFS đi bộ tới tất cả mục tiêu bắt buộc kể cả khi mọi vật truyện hiện',async()=>{
    const {MAPS,flood,exitCells,key}=await import('../tools/world_audit.mjs');
    const extraText=fs.readFileSync('src/world/mapsExtra.js','utf8');
    const EXTRA=JSON.parse(extraText.split('export const EXTRA = ')[1].trim().replace(/;$/,''));
    const errors=[];
    for(const [id,m] of Object.entries(MAPS)){
        const objects=new Map(m.objects.map(o=>[o.id,o]));for(const o of EXTRA[id]??[])objects.set(o.id,o);
        const all=[...objects.values()],solid=new Set();
        for(const n of m.npcs.filter(n=>!W.NPCS[n.id].wander))solid.add(key(n.x,n.y));
        for(const o of all.filter(o=>o.solid&&!o.area))for(const [dx,dy] of o.group??[[0,0]])solid.add(key(o.x+dx,o.y+dy));
        const reached=flood(m,m.spawn,solid);
        const near=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>reached.has(key(x+dx,y+dy)));
        for(const o of [...m.npcs,...all.filter(o=>!o.optional)]){
            const tiles=o.trigger??o.area??[[o.x,o.y]];
            if(!tiles.some(([x,y])=>o.trigger?reached.has(key(x,y)):near(x,y)))errors.push(`${id}/${o.id}`);
        }
        for(const e of m.exits)if(!exitCells(m,e).some(([x,y])=>reached.has(key(x,y))))errors.push(`${id}/exit ${e.scene}`);
        for(const [from,src]of Object.entries(MAPS))for(const e of src.exits)if(e.scene===id&&!reached.has(key(...e.at)))errors.push(`${id}/landing ${from}`);
        if(!m.interior){assert.ok(id==='capital' ? m.jumpSites.length===0 : m.jumpSites.length>=4&&m.jumpSites.length<=7,id);assert.equal(m.heights.length,m.rows);for(const r of m.heights)assert.match(r,new RegExp(`^[012]{${m.cols}}$`));}
    }
    assert.deepEqual(errors,[]);
});

test('NPC và vật truyện hiện/ẩn ở server, giữ đúng sau JSON reload; báo lại không bị mất',()=>{
    const p=fresh();
    const npc=(id,scene='ashford')=>W.worldState(JSON.parse(JSON.stringify(p))).scenes[scene].npcs.find(n=>n.id===id);
    assert.ok(npc('sera').hidden);assert.equal(npc('mira').hidden,false);
    passed(p,2);assert.equal(npc('jessica','outskirts').hidden,false);
    passed(p,3);assert.ok(npc('jessica','outskirts').hidden);
    assert.equal(W.interact(p,{},'outskirts','jessica').ok,false);
    passed(p,6);assert.equal(W.worldState(p).scenes.forest.objects.find(o=>o.id==='sp_swamp').state,'ready');
    passed(p,7);assert.equal(npc('sera').hidden,false);
    assert.equal(W.worldState(p).scenes.forest.objects.find(o=>o.id==='sp_swamp').state,'hidden');
    assert.equal(W.worldState(p).scenes.forest.objects.find(o=>o.id==='sp_grix').state,'ready');
    p.world.quests.sera='done';assert.equal(npc('sera').hidden,false);   // còn nhiệm vụ phụ "Băng cho người bị thương" -> Sera ở lại tới khi xong
    p.world.quests.s_bang='done';assert.ok(npc('sera').hidden);
    delete p.world.reported[7];assert.equal(npc('sera').hidden,false);
    passed(p,20);assert.equal(npc('elise','capital').hidden,false);   // Elise còn nhiệm vụ để giao (Bông hoa cho cha, chuỗi Hầm Mộ)
    p.world.quests.s_hoa=p.world.quests.b_hammo='done';assert.ok(npc('elise','capital').hidden);
    delete p.world.reported[20];assert.equal(npc('elise','capital').hidden,false);
    assert.equal(npc('mira').hidden,false);
});

test('chạy đà cần hai bước cùng hướng, không dừng quá 250ms',async()=>{
    const {runningReady}=await rules;
    assert.ok(runningReady(2,'right','right',250,0));
    assert.equal(runningReady(2,'right','right',251,0),false);
    assert.equal(runningReady(1,'right','right',20,0),false);
    assert.equal(runningReady(2,'left','right',20,0),false);
});
test('rương phụ cần nhảy và có đường tới bằng luật nhảy thực tế',async()=>{
    const {MAPS,flood,key}=await import('../tools/world_audit.mjs');
    const {jumpTarget,canWalkTile,tileHeight,isGap}=await rules;
    for(const [id,m]of Object.entries(MAPS)){
        const bonus=m.objects.filter(o=>o.optional && m.jumpSites.some(site=>site.chest===o.id));if(!bonus.length)continue;
        const chests=new Set(m.objects.filter(o=>o.solid).map(o=>key(o.x,o.y)));
        const blocked=(x,y)=>m.grid[y]?.[x]!=='.'||isGap(m,x,y)||chests.has(key(x,y));
        const seen=new Set([key(...m.spawn)]),q=[m.spawn];
        const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
        for(let i=0;i<q.length;i++){
            const [x,y]=q[i];
            const add=(xx,yy)=>{const k=key(xx,yy);if(!seen.has(k)){seen.add(k);q.push([xx,yy]);}};
            for(const [dx,dy]of dirs){
                if(!blocked(x+dx,y+dy)&&canWalkTile(m,x,y,x+dx,y+dy))add(x+dx,y+dy);
                const run=[1,2].every(n=>!blocked(x-dx*n,y-dy*n)&&tileHeight(m,x-dx*n,y-dy*n)===tileHeight(m,x,y));
                const t=jumpTarget(m,x,y,dx,dy,run,blocked);if(t)add(t.tx,t.ty);
            }
        }
        const walked=flood(m,m.spawn,chests);
        for(const o of bonus){
            const adjacent=dirs.map(([dx,dy])=>[o.x+dx,o.y+dy]).filter(([x,y])=>tileHeight(m,x,y)===tileHeight(m,o.x,o.y));
            assert.ok(adjacent.some(p=>seen.has(key(...p))),`${id}/${o.id}: không nhảy tới được`);
            assert.ok(!adjacent.some(p=>walked.has(key(...p))),`${id}/${o.id}: đi bộ mở được`);
        }
    }
});
test('rương nhảy mở một lần, sau reload không nhận thêm vàng',()=>{
    const p=fresh(),wallet={gold:0,diamond:0,stone:0};
    const chest=W.SCENES.outskirts.objects.find(o=>o.id.startsWith('jump_'));
    assert.ok(W.interact(p,wallet,'outskirts',chest.id).ok);
    const amount=wallet.gold;
    assert.equal(W.interact(JSON.parse(JSON.stringify(p)),wallet,'outskirts',chest.id).ok,false);
    assert.equal(wallet.gold,amount);assert.equal(amount,120);
});
