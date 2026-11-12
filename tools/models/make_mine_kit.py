"""Generate the complete mine kit, validate GLBs, render previews and report.
Run from any directory: python tools/models/make_mine_kit.py
Requires only Python, numpy and Pillow. No downloaded assets or textures.
"""
from pathlib import Path
import math
import json
import hashlib
import numpy as np
from meshkit import Mesh, face, box, beam, cylinder, rock, cliff_slab, export_glb, validate, render, unit

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'src/assets/world3d/custom'
TEAM=ROOT/'.team'
WOOD=np.array([.30,.135,.047])
IRON=np.array([.075,.09,.095])
STONE=np.array([.32,.265,.215])
TEAL=np.array([.025,.74,.64])


def crystal(base,height,radius,seed=1,lean=(0,0)):
    rng=np.random.default_rng(seed)
    base=np.array(base,float); sides=5
    bottom=[]; shoulder=[]
    for i in range(sides):
        t=math.tau*i/sides
        v=np.array([math.cos(t)*radius,0,math.sin(t)*radius])
        bottom.append(base+v)
        shoulder.append(base+v*.85+[lean[0]*.7,height*.72,lean[1]*.7])
    tip=base+np.array([lean[0],height,lean[1]])
    for i in range(sides):
        j=(i+1)%sides
        shade=rng.uniform(.62,1.18)
        face([bottom[i],bottom[j],shoulder[j],shoulder[i]], TEAL*shade,
             np.array(bottom[i])-base)
        face([shoulder[i],shoulder[j],tip], TEAL*min(1.25,shade+.17),
             np.array(shoulder[i])-base)
    face(bottom,TEAL*.4,[0,-1,0])


def timber(a,b,width=.28,depth=.3,seed=1):
    beam(a,b,width,depth,WOOD)
    a,b=np.array(a,float),np.array(b,float)
    # Painted grain strips, inset from the ends, on the camera-facing surface.
    direction=unit(b-a); side=unit(np.cross(direction,[0,0,1]))
    rng=np.random.default_rng(seed)
    for k in (-1,0,1):
        offset=side*width*k*.23+[0,0,depth/2+.002]
        aa=a+(b-a)*rng.uniform(.06,.18)+offset
        bb=a+(b-a)*rng.uniform(.79,.94)+offset
        beam(aa,bb,.008,.003,WOOD*(.62 if k!=0 else 1.3))
    for t in (.1,.9):
        p=a+(b-a)*t+[0,0,depth/2+.008]
        cylinder(p,p+[0,0,.014],.024,IRON,6)


def lantern(x,y,z,scale=1):
    # y is the very top of the hook; lantern hangs beneath it.
    def p(a,b,c): return [x+a*scale,y+b*scale,z+c*scale]
    cylinder(p(0,0,0),p(0,-.24,0),.022*scale,IRON,6)
    box(p(0,-.42,0),np.array([.23,.30,.21])*scale,[1,.57,.07])
    for xx in (-.13,.13):
        for zz in (-.12,.12):
            beam(p(xx,-.26,zz),p(xx,-.58,zz),.026*scale,.026*scale,IRON)
    box(p(0,-.6,0),np.array([.31,.055,.29])*scale,IRON)
    box(p(0,-.25,0),np.array([.31,.065,.29])*scale,IRON)
    rock(p(0,-.19,0),np.array([.33,.14,.31])*scale,IRON,42,6,2)


def frame(width=2.4,height=3.2,z=0,light=True):
    post=width/2-.16
    for x in (-post,post):
        timber([x,0,z],[x,height-.22,z],.30,.34)
        box([x,.18,z],[.34,.12,.38],IRON)
        timber([x,height-.94,z],[x-math.copysign(.57,x),height-.25,z],.16,.23)
    timber([-width/2,height-.16,z],[width/2,height-.16,z],.32,.39)
    if light:
        beam([.52,height-.31,z],[.52,height-.31,z+.35],.055,.055,IRON)
        lantern(.52,height-.31,z+.35,.85)


def wall(seed,ore=False,shoring=False):
    rng=np.random.default_rng(seed)
    cliff_slab(seed=seed)
    for i in range(14):
        x=rng.uniform(-2.65,2.65)
        y=rng.uniform(.7,4.5)
        rock([x,y,.48],[rng.uniform(.5,1.25),rng.uniform(.35,.75),.72],STONE,seed*100+i)
    for i in range(12):
        h=rng.uniform(.15,.46)
        rock([rng.uniform(-2.8,2.8),h/2,.68],[rng.uniform(.25,.7),h,rng.uniform(.3,.65)],STONE,seed*200+i,sides=8,rings=4)
    if ore:
        for i in range(12):
            x=-1.6+i*.25; y=1.5+i*.17+.15*math.sin(i)
            rock([x,y,.77],[.44,.30,.13],[.055,.18,.16],200+i,sides=7,rings=3)
            # Crystal points aimed toward camera, growing along a diagonal seam.
            with Mesh() as gem:
                crystal([0,0,0],.22+i%3*.04,.09,50+i)
            p,n,c=gem.arrays(); rot=np.array([[1,0,0],[0,0,1],[0,-1,0]])
            emit(p@rot+[x,y,.85],n@rot,c)
    if shoring: frame(3.6,4.05,.91,False)


def emit(p,n,c):
    import meshkit
    meshkit.POSITIONS.extend(p); meshkit.NORMALS.extend(n); meshkit.COLORS.extend(c)


def entrance():
    for sign in (-1,1):
        cliff_slab([sign*2.25,2.5,0],[1.7,5,1.6],41+sign,nx=9,ny=22)
    cliff_slab([0,4.175,0],[2.8,1.65,1.6],45,nx=16,ny=8)
    rng=np.random.default_rng(66)
    for i in range(21):
        if i<12:
            x=(-1 if i%2 else 1)*rng.uniform(1.85,2.72); y=rng.uniform(.45,4.55)
        else: x=rng.uniform(-1.3,1.3); y=rng.uniform(3.75,4.65)
        rock([x,y,.53],[rng.uniform(.45,.8),.58,.68],STONE,670+i)
    for i in range(10):
        x=(-1 if i%2 else 1)*rng.uniform(1.8,2.9)
        rock([x,.14,.79],[.4,.28,.43],STONE,700+i,8,3)
    # Solid tunnel panels, continuous at boundaries, darkening into depth.
    for i in range(6):
        z=.60-(i+.5)*.5; tone=.14*(1-i/6)**2+.004
        col=np.array([.9,.78,.65])*tone
        box([0,.035,z],[2.8,.07,.505],col*.62)
        for sign in (-1,1): box([sign*1.43,1.65,z],[.10,3.3,.505],col)
        box([0,3.32,z],[2.9,.12,.505],col*.65)
        if i in (1,3):
            for sign in (-1,1): box([sign*1.32,1.53,z],[.12,3,.13],WOOD*(.28-i*.045))
            box([0,3.02,z],[2.76,.15,.13],WOOD*(.28-i*.045))
    box([0,1.65,-2.43],[2.95,3.3,.08],[.0025,.003,.004])
    frame(3.28,3.55,.90,True)
    # Rails run out of the tunnel along Z.
    for z in np.arange(-2.2,1.6,.36): box([0,.075,z],[1.65,.10,.16],WOOD*.48)
    for x in (-.52,.52):
        box([x,.14,-.30],[.075,.08,3.8],IRON)
        box([x,.185,-.30],[.11,.025,3.8],IRON*1.5)


def cart():
    for x in (-.44,.44):
        cylinder([x,.19,-.49],[x,.19,.49],.045,IRON,8)
        for z in (-.43,.43):
            cylinder([x,.19,z-.055],[x,.19,z+.055],.19,IRON,12)
            cylinder([x,.19,z-.061],[x,.19,z+.061],.10,[.13,.15,.15],10)
            cylinder([x,.19,z-.067],[x,.19,z+.067],.035,WOOD,8)
    box([0,.34,0],[1.30,.12,.80],WOOD*.65)
    for j in range(3):
        y=.455+j*.16
        for z in (-.39,.39): box([0,y,z],[1.3,.145,.09],WOOD*(1+j*.13))
        for x in (-.605,.605): box([x,y,0],[.09,.145,.7],WOOD*(.95+j*.12))
    for x in (-.48,.48):
        for z in (-.446,.446):
            box([x,.62,z],[.075,.53,.025],IRON)
            for y in (.43,.76): cylinder([x,y,z-.018],[x,y,z+.018],.022,[.20,.22,.21],6)
    box([0,.87,-.39],[1.34,.05,.12],IRON)
    box([0,.87,.39],[1.34,.05,.12],IRON)
    rng=np.random.default_rng(81)
    for i in range(14):
        rock([rng.uniform(-.46,.46),rng.uniform(.76,.87),rng.uniform(-.24,.24)],
             [.29,.28,.26],STONE*.8,810+i,8,4)
    for i,x in enumerate((-.35,.05,.30)):
        crystal([x,.80,.03],.30-i*.035,.10,83+i,(.05,.02))


def rails():
    rng=np.random.default_rng(91)
    for i in range(58):
        h=rng.uniform(.018,.055)
        rock([rng.uniform(-1.9,1.9),h/2,rng.uniform(-.72,.72)],
             [rng.uniform(.08,.23),h,rng.uniform(.08,.18)],STONE*.68,910+i,6,2)
    for i in range(11):
        angle=rng.uniform(-.035,.035)
        axes=[[math.cos(angle),0,math.sin(angle)],[0,1,0],[-math.sin(angle),0,math.cos(angle)]]
        box([-1.85+i*.37,.035,0],[.17,.07,1.45],WOOD*rng.uniform(.65,.95),axes)
        for z in (-.51,.51):
            box([-1.85+i*.37,.076,z],[.23,.012,.20],IRON*.7)
    for z in (-.51,.51):
        box([0,.081,z],[4,.026,.055],IRON)
        box([0,.108,z],[4,.024,.095],IRON*1.5)


def crystals():
    rock([0,.16,0],[1.4,.32,.95],STONE*.7,101,10,5)
    spec=[(0,0,1.29,.18,.10),(-.33,.04,.94,.15,-.20),(.35,-.06,.88,.16,.20),
          (-.46,.19,.59,.13,-.16),(.46,.22,.62,.13,.12),(-.18,.31,.50,.13,-.08),
          (.16,.34,.61,.12,.14),(.04,-.23,1.05,.14,-.1)]
    for i,(x,z,h,r,l) in enumerate(spec): crystal([x,.21,z],h,r,100+i,(l,.05))


def stalactites():
    rock([0,4.88,0],[6,.24,.68],STONE,111,18,3)
    rng=np.random.default_rng(111)
    for i in range(9):
        x=-2.7+i*.67; length=1.45 if i==4 else rng.uniform(.55,1.35)
        with Mesh() as spike:
            rock([0,length/2,0],[.46,length,.46],STONE,112+i,7,4)
        # Sharpen the hanging tip while retaining a broad ceiling attachment.
        p,n,c=spike.arrays()
        p[:,0]*=(p[:,1]/length)**.7; p[:,2]*=(p[:,1]/length)**.7
        # Recompute flat normals after tapering; retain each triangle winding.
        p += [x,4.85-length,0]
        for j in range(0,len(p),3):
            pts=p[j:j+3]
            if np.linalg.norm(np.cross(pts[1]-pts[0],pts[2]-pts[0]))>1e-9: face(pts,c[j])


def orepile():
    rng=np.random.default_rng(120)
    for i in range(14):
        h=rng.uniform(.25,.55)
        rock([rng.uniform(-.67,.23),h/2,rng.uniform(-.38,.3)],
             [rng.uniform(.35,.60),h,rng.uniform(.3,.52)],STONE,120+i,9,4)
    rock([-.23,.55,-.06],[.53,.47,.50],STONE*.85,144,9,5)
    for i in range(4): crystal([-.65+i*.20,.36,.24],.25,.085,150+i)
    # Crate with visible individual slats and cross brace.
    for i in range(4):
        for z in (-.28,.28): box([.59,.08+i*.135,z],[.62,.12,.055],WOOD*(.88+i*.08))
        for x in (.28,.90): box([x,.08+i*.135,0],[.055,.12,.56],WOOD)
        box([.35+i*.155,.56,0],[.14,.055,.59],WOOD*1.15)
    for x in (.31,.87): box([x,.29,.317],[.08,.57,.045],WOOD*.7)
    beam([.30,.06,.345],[.88,.52,.345],.07,.045,WOOD*1.25)
    # Pickaxe leans against ore, handle grounded; curved, pointed iron head.
    timber([-.72,.035,.56],[-.18,.91,.15],.055,.055)
    beam([-.53,.87,.15],[-.18,.94,.15],.085,.075,IRON*1.8)
    beam([-.18,.94,.15],[.11,.83,.15],.085,.075,IRON*1.8)
    for a,b in (([-.53,.87,.15],[-.67,.75,.15]),([.11,.83,.15],[.22,.67,.15])):
        cylinder(a,b,.035,IRON*1.6,5)


BUILDERS={'mine_wall_a':lambda:wall(10),'mine_wall_b':lambda:wall(20,ore=True),
          'mine_wall_c':lambda:wall(30,shoring=True),'mine_entrance':entrance,
          'mine_cart':cart,'mine_rails':rails,'mine_support':frame,
          'mine_crystals':crystals,'mine_stalactites':stalactites,'mine_orepile':orepile}


def transformed(arrays,position,rotation,scale):
    p,n,c=arrays; t=math.radians(rotation)
    rot=np.array([[math.cos(t),0,-math.sin(t)],[0,1,0],[math.sin(t),0,math.cos(t)]])
    p=(p*np.array(scale))@rot+position
    n=(n/np.array(scale))@rot; n/=np.linalg.norm(n,axis=1)[:,None]
    if np.prod(scale)<0:
        p=p.reshape(-1,3,3)[:,::-1].reshape(-1,3)
        n=n.reshape(-1,3,3)[:,::-1].reshape(-1,3)
        c=c.reshape(-1,3,3)[:,::-1].reshape(-1,3)
    return p,n,c


def main():
    assets={}; rows=[]
    for name,builder in BUILDERS.items():
        with Mesh() as mesh:
            builder(); export_glb(OUT/(name+'.glb'),name)
        arrays=validate(OUT/(name+'.glb')); assets[name]=arrays
        p,n,c=arrays
        count=len(p)//3
        if name.startswith('mine_wall'): assert 1500<=count<=4000
        if name=='mine_entrance': assert 3000<=count<=6000
        if name=='mine_rails': assert p[:,1].max()<=.120001
        if name!='mine_stalactites': assert abs(p[:,1].min())<1e-6, (name,p[:,1].min())
        render(TEAM/('preview_'+name+'.png'),p,n,c,title=name.upper().replace('_',' '))
        rows.append((name,count,(OUT/(name+'.glb')).stat().st_size,p.min(0).tolist(),p.max(0).tolist()))
    placements=[]; pieces=[]
    def place(name,pos,rot=0,scale=(1,1,1)):
        placements.append({'model':name+'.glb','position':pos,'rotationYDegrees':rot,'scale':list(scale)})
        pieces.append(transformed(assets[name],pos,rot,scale))
    names=['mine_wall_a','mine_wall_c','mine_wall_b','mine_entrance','mine_wall_a','mine_wall_b','mine_wall_c']
    for i,name in enumerate(names):
        x=(i-3)*6
        place(name,[x,0,0],scale=(-1,1,1) if i==4 else (1,1,1))
        place('mine_stalactites',[x,0,.96])
    for x in (-4,0,4): place('mine_rails',[x,0,2.35])
    place('mine_cart',[-2.6,.12,2.35])
    for x in (-10,10): place('mine_support',[x,0,1.5])
    for x in (-14,7.2): place('mine_crystals',[x,0,1.5],-15 if x<0 else 20)
    place('mine_orepile',[3.1,0,1.35],-12)
    place('mine_orepile',[-7.3,0,1.55],15)
    # Preview-only ground strip provides context; models remain independent.
    with Mesh() as ground:
        box([0,-.11,1.4],[42.4,.20,7.7],[.135,.112,.086])
    pieces.append(ground.arrays())
    combined=tuple(np.concatenate([a[k] for a in pieces]) for k in range(3))
    render(TEAM/'preview_scene.png',*combined,size=(1600,700),eye=(0,2.5,11),margin=.035,
           title='THE DEEP VEIN  /  MINE BATTLE BACKGROUND')
    (TEAM/'mine_scene.json').write_text(json.dumps({'placements':placements,'cameraDirection':[0,2.5,11],
        'previewGround':{'center':[0,-.11,1.4],'size':[42.4,.2,7.7],'color':[.135,.112,.086]}},indent=2))
    (TEAM/'mine_manifest.json').write_text(json.dumps([{'file':r[0]+'.glb','triangles':r[1],'bytes':r[2],'min':r[3],'max':r[4],'origin':[0,0,0]} for r in rows],indent=2))
    total=sum(r[2] for r in rows); assert total<4_000_000
    report=['# Mine kit report','',f'10 validated GLBs; {sum(r[1] for r in rows):,} triangles; {total:,} bytes total ({total/1_000_000:.3f} MB).',
      '', 'All assets: metres, Y up, front +Z; one opaque single-sided material, metallic 0, roughness 0.9; flat normals and COLOR_0 only.',
      '', '| File | Triangles | Bytes | Minimum XYZ | Maximum XYZ |','|---|---:|---:|---|---|']
    for name,count,size,low,high in rows:
        fmt=lambda a:'('+', '.join(f'{v:.6f}' for v in a)+')'
        report.append(f'| `{name}.glb` | {count:,} | {size:,} | {fmt(low)} | {fmt(high)} |')
    report += ['', '## Origins and placement', '',
      'All origins are (0, 0, 0), horizontally centered on the designed footprint, at floor level. Natural rubble and crystal silhouettes are asymmetric. The cart origin is on the wheel contact plane. The rails origin is at gravel-bed level. Stalactites deliberately use the wall-floor origin: the ceiling is y=5, with tips hanging down, so place at the same Y as the walls.',
      '', 'Scene transforms below are applied as scale, then Y rotation, then translation. Rotations are in degrees. Negative X scale mirrors the second wall A; three.js handles the reflected winding. All other scales are positive. Seven 6.2-wide sections have 6-unit center spacing (0.2 overlap); centers range -18 to 18 and the complete silhouette spans -21.1 to 21.1.',
      '', '| Model | Position XYZ | Y rotation | Scale XYZ |','|---|---|---:|---|']
    for a in placements: report.append(f"| {a['model']} | {a['position']} | {a['rotationYDegrees']} | {a['scale']} |")
    report += ['', 'Full precision bounds and counts: `.team/mine_manifest.json`. Machine-readable composition: `.team/mine_scene.json`. Camera looks from +Z slightly above, direction (0, 2.5, 11), orthographic. Scene preview ground is contextual only; its geometry and color are recorded in the JSON. The tunnel approach track meets the transverse cart track as a simple mine loading junction.',
      '', '## Files and reproduction','',
      '- `tools/models/meshkit.py`: shared mesh builder, shape helpers, seeded rocks/cliff slabs, GLB writer/validator and rasterizers.',
      '- `tools/models/make_well.py`: original well geometry, now imports shared helpers.',
      '- `tools/models/make_mine_kit.py`: generates all ten mine GLBs, previews, scene JSON and this report.',
      '- `src/assets/world3d/custom/`: the ten GLBs listed above plus regenerated `well.glb`.',
      '- `.team/preview_mine_*.png`: ten 700 x 700 individual previews. `.team/preview_contact.png` is an additional review contact sheet.',
      '- `.team/preview_scene.png`: 1600 x 700 composed scene; `.team/preview_well.png`: regenerated original preview.',
      '- `.team/well_before.sha256`: original well hash used to verify byte-identical output.',
      '', 'Run `python tools/models/make_well.py` and `python tools/models/make_mine_kit.py` from the repository root. No installs, network, Blender or server required.',
      '', '## Validation and limitations','',
      'Every exported asset is re-read from disk: GLB header and lengths, JSON/BIN chunks, accessor counts, finite positions, unit normals, vertex colors, index bounds, declared bounds, and triangle winding versus normals are checked. Wall/entrance triangle budgets, ground contact, rail height and total file size are asserted. The original well GLB remains byte-identical after refactoring.',
      '', 'Visual review: inspected the composed scene and all ten model previews; moved ceiling ornaments forward to expose the stalactites and reduced rock-face noise to strengthen the layered strata. No visible wall gaps were found in the final front view.',
      '', 'Teal ore and lantern light are painted vertex colors, not actual emitted light; add game glow sprites/lights as planned. Preview lighting is a directional/ambient software approximation without cast shadows. Meshes are assembled overlapping closed solids, not boolean-unioned or collision-ready. No texture maps, animations or LODs are supplied.']
    (TEAM/'report.md').write_text('\n'.join(report)+'\n')
    print(f'KIT TOTAL: {total:,} bytes')

if __name__=='__main__': main()
