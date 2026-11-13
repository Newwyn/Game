"""Valoria palace furniture. Offline, deterministic numpy/Pillow geometry.

Run from any directory. Units are tiles, +Y up, +Z front. The town helpers
are imported unchanged; the wall and ceiling pieces keep their mounting origins.
"""
from pathlib import Path
import math
import json
import hashlib
import struct
import numpy as np
from PIL import Image, ImageDraw
import meshkit as mk
from meshkit import Mesh, box, beam, cylinder, face, render, validate, export_glb
from make_town_kit import lathe, sheet, model, emit

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'src/assets/world3d/custom'
TEAM = ROOT/'.team'
RED=np.array([.55,.07,.10]); BLUE=np.array([.08,.20,.50])
GOLD=np.array([.85,.62,.18]); LIGHT=np.array([1,.82,.38]); DARK=GOLD*.62
IVORY=np.array([.90,.86,.78]); WHITE=np.array([1,.97,.91])
WOOD=np.array([.24,.13,.07]); GREEN=np.array([.08,.29,.11])
STEEL=np.array([.47,.58,.65]); INK=np.array([.025,.035,.045])
FLOORS=dict(bed_royal=(2,3),bed_princess=(2,3),dining_table=(6,2),chair=(1,1),
 armchair=(1,1),throne=(2,2),fireplace=(2,1),wardrobe=(2,1),bookcase=(2,1),
 vanity=(2,1),desk=(2,1),side_table=(1,1),vase_floor=(1,1),armor_stand=(1,1),
 candelabra=(1,1),stairs_up=(3,2),stairwell_down=(3,2),bench_cushion=(2,1),
 council_table=(3,3),bust_pedestal=(1,1),column=(1,1),harp=(1,1),
 planter_topiary=(1,1),balustrade=(2,.4),globe_stand=(1,1),chest_treasure=(1,1),
 rug_red=(3,2),rug_blue=(3,2))
WALLS=dict(frame_portrait=(1,1.55,.10),frame_landscape=(1.9,1.45,.10),
 window_drapes=(1.8,2.6,.25),door_double=(1.8,2.5,.2),banner_royal=(.9,2.4,.12),
 sconce=(.5,.7,.3),weapon_rack=(1.8,1.4,.2),cloth_of_state=(2.6,2.8,.15))


def oval(p,s,color,sides=12,rings=6):
    """Faceted ellipsoid with exact poles, for puffed upholstery and carving."""
    p=np.array(p); s=np.array(s)/2
    sides=min(sides,12); rings=min(rings,6)
    def v(j,k):
        a=math.pi*j/rings; t=math.tau*k/sides
        return p+s*np.array([math.sin(a)*math.cos(t),-math.cos(a),math.sin(a)*math.sin(t)])
    for j in range(rings):
        for k in range(sides):
            pts=[v(j,k),v(j,k+1),v(j+1,k+1),v(j+1,k)]
            if j==0: pts=pts[1:]
            elif j==rings-1: pts=pts[:3]
            face(pts,np.array(color)*(.94+.06*math.sin(math.pi*(j+.5)/rings)),np.mean(pts,0)-p)


def cushion(p,s,col):
    # Rounded rectangular horizontal rings preserve a broad, upholstered face.
    x,y,z=p; w,h,d=s
    outline=[(-.38,-.5),(.38,-.5),(.5,-.38),(.5,.38),(.38,.5),(-.38,.5),(-.5,.38),(-.5,-.38)]
    rings=[]
    for yy,scale in ((-.5,.80),(-.2,1),(.2,1),(.5,.78)):
        rings.append([[x+a*w*scale,y+yy*h,z+b*d*scale] for a,b in outline])
    face(rings[0],col,[0,-1,0]); face(rings[-1],np.array(col)*1.12,[0,1,0])
    for j in range(3):
        for i in range(8):
            pts=[rings[j][i],rings[j][(i+1)%8],rings[j+1][(i+1)%8],rings[j+1][i]]
            face(pts,np.array(col)*(.83 if j==0 else 1),np.mean(pts,0)-p)


def trim(p,s,col=GOLD):
    x,y,z=p; w,h,d=s
    box([x,y-h*.12,z],[w,h*.76,d],col*.65)
    box([x,y+h*.38,z],[w+.025,h*.24,d+.025],col)


def turned(x,z,y,h,r=.08,col=GOLD):
    profile=[(0,0),(r,0),(r,.08*h),(r*.42,.22*h),
             (r*.85,.57*h),(r*.5,.80*h),(r,h),(0,h)]
    lathe(profile,col,6,(x,y,z))


def ring(p,rx,ry,tube,col=GOLD,plane='xy',steps=24):
    x,y,z=p
    steps=min(steps,16)
    def point(t):
        return [x+rx*math.cos(t),y+ry*math.sin(t),z] if plane=='xy' else [x+rx*math.cos(t),y,z+ry*math.sin(t)]
    for i in range(steps): cylinder(point(i*math.tau/steps),point((i+1)*math.tau/steps),tube,col,5,caps=False)


def relief(points,p,scale=1,col=GOLD,flat=False):
    # Convex pieces, optionally laid on the XZ plane for bedding and rugs.
    x,y,z=p
    verts=[[x+a*scale,y+.002 if flat else y+b*scale,z+b*scale if flat else z] for a,b in points]
    face(verts,col,[0,1,0] if flat else [0,0,1])


def fleur(p,s=.3,flat=False):
    parts=[[(0,-.5),(-.10,-.13),(-.08,.28),(0,.5),(.08,.28),(.10,-.13)],
           [(-.08,-.04),(-.34,.06),(-.38,.28),(-.22,.34),(-.12,.17)],
           [(.08,-.04),(.12,.17),(.22,.34),(.38,.28),(.34,.06)],
           [(-.23,-.10),(.23,-.10),(.23,-.20),(-.23,-.20)]]
    for pts in parts: relief(pts,p,s,LIGHT,flat)


def lion(p,s=.5,flat=False):
    # Rampant silhouette: mane/head, torso, raised forelegs, haunches, curled tail.
    parts=[ [(-.08,-.22),(.12,-.16),(.20,.18),(-.03,.25),(-.15,.05)],
      [(-.13,.23),(-.16,.40),(-.04,.52),(.12,.47),(.20,.32),(.07,.20)],
      [(.08,.37),(.31,.35),(.30,.25),(.12,.24)],
      [(.10,.10),(.35,.16),(.39,.34),(.46,.32),(.43,.06),(.15,-.04)],
      [(-.01,.03),(-.28,.18),(-.31,.34),(-.39,.32),(-.36,.08),(-.08,-.08)],
      [(-.09,-.13),(-.27,-.34),(-.38,-.35),(-.38,-.43),(-.19,-.43),(.05,-.20)],
      [(.09,-.15),(.24,-.33),(.39,-.33),(.39,-.42),(.18,-.43),(-.03,-.22)],
      [(-.12,-.12),(-.32,-.05),(-.43,.13),(-.40,.34),(-.34,.30),(-.35,.13),(-.25,.02)] ]
    # Some silhouette pieces are concave; triangulate each as a fan of convex strips.
    for pts in parts:
        for i in range(1,len(pts)-1): relief([pts[0],pts[i],pts[i+1]],p,s,LIGHT,flat)


def candle(x,y,z,h=.23,r=.035):
    lathe([(0,0),(r*2,0),(r*2,.025),(r,.045),(r,h),(0,h)],WHITE,8,(x,y,z))
    cylinder([x,y+h,z],[x,y+h+.025,z],.009,INK,5)
    oval([x,y+h+.065,z],[r*1.4,.12,r*1.4],[1,.55,.025],6,3)
    oval([x,y+h+.045,z+.008],[r*.75,.055,r*.75],[1,1,.32],6,3)


def candlestick(x,y,z,h=.5,arms=1):
    turned(x,z,y,h*.67,.07)
    for i in range(arms):
        dx=(i-(arms-1)/2)*.16
        if dx: beam([x,y+h*.38,z],[x+dx,y+h*.65,z],.025,.025,GOLD)
        lathe([(0,0),(.065,0),(.075,.025),(0,.04)],GOLD,8,(x+dx,y+h*.65,z))
        candle(x+dx,y+h*.68,z,h*.32)


def goblet(x,y,z):
    lathe([(0,0),(.065,0),(.065,.025),(.018,.045),(.018,.13),(.07,.17),(.075,.25),(.06,.25),(.05,.19),(0,.17)],GOLD,6,(x,y,z))
    cylinder([x,y+.224,z],[x,y+.23,z],.057,RED*.45,8)


def plate(x,y,z,r=.19):
    lathe([(0,0),(r*.75,0),(r,.035),(r,.05),(r*.78,.038),(0,.025)],IVORY,8,(x,y,z))
    lathe([(r*.88,.042),(r*.96,.044),(r*.96,.049),(r*.88,.047)],GOLD,8,(x,y,z))


def vase(x,y,z,h=.6,r=.18):
    lathe([(0,0),(r*.65,0),(r*.7,h*.1),(r,h*.35),(r*.9,h*.6),
           (r*.4,h*.83),(r*.45,h),(r*.3,h),(r*.28,h*.83),(0,h*.75)],IVORY,12,(x,y,z))
    for yy,rr,cc in ((.10,.73,GOLD),(.39,1.01,BLUE),(.57,.94,BLUE),(.96,.45,GOLD)):
        cylinder([x,y+h*yy,z],[x,y+h*(yy+.035),z],r*rr,cc,12)


def lilies(x,y,z,span=.28,h=.42):
    for i in range(5):
        a=i*math.tau/5; xx=x+span*.65*math.cos(a); zz=z+span*.65*math.sin(a); yy=y+h*(.75+.25*(i%2))
        beam([x,y,z],[xx,yy,zz],.018,.018,GREEN)
        oval([(x+xx)/2+.04,(y+yy)/2,(z+zz)/2],[.14,.045,.07],GREEN,6,3)
        for k in range(5):
            t=k*math.tau/5
            face([[xx,yy,zz],[xx+.12*math.cos(t-.3),yy+.08,zz+.12*math.sin(t-.3)],
                  [xx+.15*math.cos(t),yy+.055,zz+.15*math.sin(t)],
                  [xx+.12*math.cos(t+.3),yy+.08,zz+.12*math.sin(t+.3)]],WHITE,[0,1,0])
        oval([xx,yy+.035,zz],[.045,.07,.045],GOLD,6,3)


def legs(w,d,h,col=WOOD):
    for x in (-w/2,w/2):
        for z in (-d/2,d/2): turned(x,z,0,h,.065,col)


def panel(x,y,z,w,h,col=WOOD):
    box([x,y,z],[w,h,.045],GOLD*.65)
    box([x,y,z+.026],[w-.06,h-.07,.025],col*1.3)
    box([x,y,z+.042],[w-.14,h-.15,.018],col*.8)


def curtain(x,z,bottom,top,width,col,depth=.045):
    grid=[]
    for j in range(7):
        t=j/6; narrow=1-.60*math.exp(-((t-.38)/.18)**2)
        grid.append([[x+(u-.5)*width*narrow,bottom+t*(top-bottom),z+depth*math.cos(u*math.tau*4)] for u in np.linspace(0,1,9)])
    sheet(grid,col,.012)
    box([x,bottom+(top-bottom)*.38,z+depth+.012],[width*.46,.055,.025],GOLD)
    for dx in (-.035,.035):
        beam([x+dx,bottom+(top-bottom)*.38,z+depth+.025],[x+dx,bottom+(top-bottom)*.26,z+depth+.03],.013,.013,GOLD)
        oval([x+dx,bottom+(top-bottom)*.25,z+depth+.03],[.04,.10,.04],LIGHT,6,3)


def bed(princess=False):
    col=BLUE if princess else RED; wood=IVORY if princess else WOOD
    h=2.38 if princess else 2.58
    legs(1.5,2.5,.40,wood)
    trim([0,.40,0],[1.76,.18,2.76],wood)
    trim([0,.53,0],[1.78,.06,2.78])
    cushion([0,.67,0],[1.67,.24,2.62],IVORY)
    cushion([0,.79,.30],[1.68,.15,1.98],col)
    for x in (-.72,.72): box([x,.877,.30],[.035,.012,1.92],GOLD)
    (fleur if princess else lion)([0,.88,.43],.8,True)
    cushion([0,.87,-.60],[1.64,.17,.32],WHITE)
    if not princess:
        for x in np.linspace(-.67,.67,9): box([x,.96,-.59],[.025,.012,.075],INK)
    for x in (-.41,.41): cushion([x,.91,-.99],[.69,.22,.43],WHITE)
    if princess:
        for x in (-.52,0,.52): cushion([x,.99,-.71],[.36,.18,.28],BLUE*1.4 if x else GOLD)
    panel(0,1.14,-1.31,1.58,.70,wood)
    fleur([0,1.24,-1.255],.41)
    for x in (-.83,.83):
        for z in (-1.33,1.33):
            turned(x,z,0,h,.07,wood)
            for yy in (.45,1.5,h-.13): cylinder([x,yy,z],[x,yy+.045,z],.082,GOLD,8)
            oval([x,h+.09,z],[.15,.20,.15],LIGHT,8,4)
            curtain(x*.91,z,.35,h-.06,.24,col if not princess else WHITE,.033)
    # Open central canopy: broad draped perimeter leaves bedding readable from above.
    for x in (-.82,.82): box([x,h-.015,0],[.14,.12,2.78],GOLD)
    for z in (-1.33,1.33):
        box([0,h-.015,z],[1.80,.12,.14],GOLD)
        grid=[[[x,h-.08-j*.11-.13*(1-(x/.9)**2),z+.045*math.cos(x*20)] for x in np.linspace(-.9,.9,19)] for j in range(3)]
        sheet(grid,col)
        for x in np.linspace(-.86,.86,19):
            yy=h-.32-.13*(1-(x/.9)**2)
            beam([x,yy,z+.05],[x,yy-.07,z+.05],.022,.022,GOLD)
    for x in (-.70,.70):
        sheet([[[x+dx,h+.025-.07*math.sin(t*math.pi),-1.36+t*2.72] for dx in (-.18,0,.18)] for t in np.linspace(0,1,13)],col)


def dining():
    legs(4.8,1.18,.87)
    beam([-2.4,.30,0],[2.4,.30,0],.12,.12,WOOD)
    trim([0,.89,0],[5.75,.12,1.73],WOOD)
    box([0,.96,0],[5.78,.025,1.78],WHITE)
    # Continuous wavy skirt, with a gold hem that follows the folds.
    for sign in (-1,1):
        for end in (False,True):
            length=1.78 if end else 5.78
            def point(u,j):
                t=-length/2+u*length; v=.90+.035*math.cos(u*math.tau*20)*j
                return [sign*(2.89+.025*math.cos(u*math.tau*8)*j),.97-.32*j,t] if end else [t,.97-.32*j,sign*v]
            sheet([[point(u,j) for u in np.linspace(0,1,13)] for j in (0,.5,1)],WHITE,.008)
            sheet([[np.array(point(u,1))+[0,dy,0] for u in np.linspace(0,1,13)] for dy in (0,.035)],GOLD,.006)
    box([0,.982,0],[5.70,.012,.32],RED)
    for x in (-2.28,-.76,.76,2.28):
        for z in (-.57,.57):
            plate(x,.985,z,.19); goblet(x+.28,.985,z*.70)
            box([x-.25,1.005,z],[.024,.012,.24],STEEL)
    for x in (-1.85,1.85): candlestick(x,.99,0,.48,3)
    plate(0,.99,0,.33); oval([0,1.13,0],[.53,.25,.32],[.38,.14,.04])
    for x in (-.23,.23): oval([x,1.09,.12],[.15,.13,.18],[.55,.24,.07],8,4)
    plate(.85,.99,0,.23)
    for i in range(6): oval([.85+.12*math.cos(i),1.10+(i%2)*.05,.12*math.sin(i)],[.13,.13,.13],RED if i%2 else GREEN,8,4)
    oval([-.87,1.06,.05],[.43,.16,.20],[.76,.43,.16],10,4)
    for x in (-1.0,-.89,-.78): box([x,1.14,.05],[.025,.012,.13],IVORY)
    vase(2.60,.99,-.06,.38,.12)
    ring([2.73,1.18,-.06],.08,.12,.02,GOLD,steps=12)


def chair(arm=False):
    legs(.56,.56,.43)
    trim([0,.43,0],[.69,.10,.69])
    cushion([0,.54,0],[.69,.18,.67],BLUE if arm else RED)
    for x in (-.30,.30): turned(x,-.28,.40,.97 if not arm else .67,.045)
    if arm:
        cushion([0,.87,-.26],[.72,.52,.24],BLUE)
        for x in (-.35,.35):
            turned(x,.21,.43,.32,.045)
            cushion([x,.79,0],[.18,.21,.70],BLUE)
            box([x,.68,0],[.05,.035,.65],GOLD)
    else:
        panel(0,1.04,-.29,.58,.72,WOOD)
        cushion([0,1.04,-.24],[.45,.62,.12],RED)
        fleur([0,1.40,-.21],.18)
        for x in (-.24,.24):
            for y in (.76,.92,1.08,1.24): oval([x,y,-.16],[.027,.027,.025],LIGHT,6,3)


def state_lion(p,s):
    """New relief for the sword throne: profile mane, muzzle, paws and curled tail."""
    layer=0
    def poly(points,col=GOLD,dz=0):
        nonlocal layer
        layer+=1
        relief(points,np.asarray(p)+[0,0,dz+layer*.00003],s,col)
    def stroke(a,b,w,col=GOLD):
        a=np.array(a); b=np.array(b); v=b-a; side=np.array([-v[1],v[0]])/np.linalg.norm(v)*w/2
        poly([a-side,b-side,b+side,a+side],col)
    poly([(-.17,-.21),(.02,-.24),(.13,-.04),(.08,.18),(-.11,.15),(-.19,-.05)])
    # Gold mane, with a lighter cheek and an unmistakable protruding muzzle.
    mane=[(.045+(.17 if i%2==0 else .14)*math.cos(i*math.tau/16),
           .26+(.17 if i%2==0 else .14)*math.sin(i*math.tau/16)) for i in range(16)]
    for i in range(16): poly([(.045,.26),mane[i],mane[(i+1)%16]],LIGHT)
    poly([(.08,.19),(.25,.22),(.27,.30),(.13,.34)],GOLD,.001)
    poly([(.06,.38),(.11,.46),(.16,.36)],GOLD)
    poly([(.235,.29),(.275,.29),(.267,.32),(.235,.32)],RED*.40,.002)
    poly([(.132,.308),(.163,.308),(.163,.328),(.132,.328)],RED*.40,.003)
    for a,b,w in (((.06,.11),(.25,.11),.075),((.25,.11),(.32,.27),.065),
                  ((.07,.015),(.30,-.04),.07),((.30,-.04),(.40,.05),.06),
                  ((-.01,-.19),(.13,-.34),.095),((.13,-.34),(.33,-.38),.07),
                  ((-.12,-.19),(-.23,-.35),.10),((-.23,-.35),(-.38,-.38),.07)):
        stroke(a,b,w)
    for x,y in ((.32,.27),(.40,.05),(.33,-.38),(-.38,-.38)):
        poly([(x-.055,y-.035),(x+.055,y-.035),(x+.07,y+.035),(x-.045,y+.045)],LIGHT)
    tail=[(-.17,-.12),(-.32,-.02),(-.40,.13),(-.39,.30),(-.29,.38),(-.22,.30)]
    for a,b in zip(tail,tail[1:]): stroke(a,b,.038)
    poly([(-.25,.33),(-.19,.36),(-.16,.23),(-.25,.25)],LIGHT)


def forged_sword(a,b,width=.10,gold=False,hilt=True):
    """Pointed diamond-section blade, visible two-tone ridge and squared guard."""
    a=np.array(a,float); b=np.array(b,float); direction=mk.unit(b-a)
    normal=np.array([0.,0.,1.]) if abs(direction[2])<.85 else np.array([0.,1.,0.])
    normal=mk.unit(normal-direction*np.dot(normal,direction))
    side=mk.unit(np.cross(direction,normal))
    dark=np.array([.20,.21,.24]) if not gold else np.array([.62,.45,.14])
    edge=np.array([.45,.47,.52]) if not gold else GOLD
    shine=np.array([.70,.72,.76]) if not gold else LIGHT
    def section(center,w):
        return [center-side*w/2,center+normal*.025,center+side*w/2,center-normal*.018]
    bottom=section(a,width); shoulder=section(a+(b-a)*.82,width*.72)
    for k in range(4):
        j=(k+1)%4; col=[edge,dark,edge*.6,dark*.7][k]
        pts=[bottom[k],bottom[j],shoulder[j],shoulder[k]]
        face(pts,col,np.mean(pts,0)-(a+b)/2)
        face([shoulder[k],shoulder[j],b],col,np.mean([shoulder[k],shoulder[j],b],0)-(a+b)/2)
    face(bottom,dark,-direction)
    # Narrow forged glint follows one bevel; the broad ridge stays readable.
    inner=a+side*width*.40+normal*.006
    outer=a+side*width*.5+normal*.002
    si=a+(b-a)*.82+side*width*.29+normal*.006
    so=a+(b-a)*.82+side*width*.36+normal*.002
    face([inner,si,so,outer],shine,normal)
    face([si,b+normal*.002,so],shine,normal)
    if hilt:
        beam(a-side*width*1.25,a+side*width*1.25,.045,.05,edge)
        cylinder(a-direction*.22,a-direction*.025,.032,dark*.48,6)
        for t in (.12,):
            cylinder(a-direction*(t+.012),a-direction*t,.036,edge,6)
        oval(a-direction*.255,[.085,.085,.085],edge,6,3)


def throne(rng):
    steel=np.array([.20,.21,.24]); stone=IVORY*.46
    for y,w,d,h in ((.08,1.88,1.88,.16),(.25,1.68,1.68,.18)):
        trim([0,y,0],[w,h,d],stone)
    # A monolithic seat fused to the dais, clad with overlapping angular plates.
    cushion([0,.62,.02],[1.32,.64,1.22],steel*.63)
    for x in (-.61,.61):
        for j in range(3):
            cushion([x,.45+j*.18,.02],[.20,.26,1.29-j*.05],steel*(.85+j*.12))
    for i in range(11):
        x=(i-5)*.112
        forged_sword([x,.36,.66],[x+rng.uniform(-.028,.028),.94+rng.uniform(-.04,.03),.61],.105,i%5==0,False)
    for i in range(9):
        x=(i-4)*.135
        forged_sword([x,.93,.55],[x+rng.uniform(-.02,.02),.96,-.52],.125,i%5==0,False)
    cushion([0,1.035,.12],[1.16,.17,.99],RED*.62)
    # 33 upward blades in three staggered layers. Central gold blades anchor
    # Valoria's sunburst, with asymmetry supplied by this model's seeded RNG.
    for layer,count in enumerate((13,11,9)):
        for i in range(count):
            t=(i-(count-1)/2)/((count-1)/2)
            x=t*(.86-layer*.035)
            top=3.70-layer*.43-.91*abs(t)**.85+rng.uniform(-.055,.045)
            base=[x*.56+rng.uniform(-.035,.035),.98+layer*.13,-.49+layer*.13]
            tip=[x+rng.uniform(-.025,.025),top,-.70+layer*.14]
            gold=(i==count//2 or (i+layer)%8==0)
            forged_sword(base,tip,.105+layer*.015,gold)
    # Short crossing blades fuse the lower fan and protect the sides.
    for sign in (-1,1):
        forged_sword([sign*.61,.63,-.22],[sign*.86,1.94,-.26],.13,False,False)
        forged_sword([sign*.66,.73,-.24],[sign*.35,2.25,-.30],.11,False,False)
        cushion([sign*.66,.92,.03],[.23,.71,1.16],steel*.8)
        # Three swords run rearward along each arm: grips/pommels face +Z.
        for j in range(3):
            x=sign*(.57+j*.085); y=1.32+.035*(1-abs(j-1))
            forged_sword([x,y,.35],[x+sign*.025,y+.13,-.52],.07,j==1)
    # A narrow embroidered cloth lets blades remain visible on both sides.
    sheet([[[x,1.16+t*1.34,-.115+.022*math.cos(x*35)]
            for x in np.linspace(-.19,.19,9)] for t in np.linspace(0,1,9)],RED*.66,.012)
    for x in (-.175,.175): box([x,1.84,-.083],[.018,1.32,.012],GOLD)
    state_lion([0,2.08,-.075],.30)
    for x in np.linspace(-.17,.17,9):
        beam([x,1.18,-.085],[x,1.10,-.085],.018,.018,GOLD)


def fireplace():
    trim([0,.06,0],[1.86,.12,.86],IVORY)
    box([0,.67,-.34],[1.63,1.15,.12],INK)
    for x in (-.72,.72):
        box([x,.72,-.04],[.30,1.30,.65],IVORY)
        panel(x,.75,.292,.23,.88,IVORY)
        for y in (.20,1.20): trim([x,y,-.04],[.34,.12,.67],IVORY)
    for y,w,h in ((1.36,1.84,.18),(1.49,1.88,.08)):
        trim([0,y,-.04],[w,h,.84],IVORY)
    fleur([0,1.36,.392],.24)
    for z in (-.15,.08): cylinder([-.46,.23,z],[.46,.23,z],.085,WOOD,8)
    for x in (-.34,.34):
        beam([x,.12,.25],[x,.49,.25],.035,.035,GOLD)
        oval([x,.48,.25],[.09,.10,.09],GOLD,8,4)
    for i in range(7):
        x=(i-3)*.12; h=.36+.19*math.sin(i*2)**2
        oval([x,.30+h/2,-.02],[.15,h,.16],[1,.22,.008],6,3)
        oval([x,.34+h*.20,.07],[.08,h*.65,.075],[1,.90,.08],6,3)
    # Mantel clock: stepped foot, oval dial and legible hands.
    trim([0,1.60,-.06],[.52,.14,.31])
    oval([0,1.91,-.08],[.53,.64,.24],GOLD)
    oval([0,1.94,.05],[.41,.45,.035],WHITE)
    beam([0,1.94,.075],[0,2.09,.075],.025,.015,INK)
    beam([0,1.94,.077],[.12,1.89,.077],.025,.015,INK)
    fleur([0,2.28,-.015],.18)
    for x in (-.66,.66): vase(x,1.54,-.06,.43,.13)


def cabinet(bookcase=False):
    legs(1.47,.55,.15)
    box([0,1.25,-.33],[1.69,2.18,.14],WOOD*.65)
    for x in (-.82,.82):
        box([x,1.23,0],[.15,2.20,.70],WOOD)
        for y in (.25,2.22): trim([x,y,.02],[.19,.12,.74])
    for y in (.18,2.30,2.39): trim([0,y,0],[1.83,.12 if y!=2.39 else .06,.79],WOOD if y==.18 else GOLD)
    if bookcase:
        for row in range(4):
            y=.29+row*.49
            box([0,y,0],[1.56,.07,.66],WOOD*1.35)
            for i in range(10):
                x=-.68+i*.145; h=.24+((i*7+row*3)%5)*.035
                if row==2 and i>6: continue
                col=[RED,BLUE,GREEN,WOOD*1.6,IVORY][(i+row)%5]
                box([x,y+h/2+.04,.05],[.105,h,.40],col)
                for yy in (y+.08,y+h-.015): box([x,yy,.257],[.087,.018,.009],GOLD)
            if row==2:
                for j in range(3):
                    box([.53,y+.08+j*.07,.05],[.32,.05,.40],BLUE if j%2 else RED)
                    box([.53,y+.08+j*.07,.257],[.25,.025,.012],IVORY)
        vase(.48,1.84,.02,.22,.10)
        oval([.48,2.14,.02],[.30,.30,.30],BLUE,12,6)
        ring([.48,2.14,.02],.18,.18,.012,GOLD,steps=16)
    else:
        for x in (-.39,.39):
            for y,h in ((.72,.83),(1.66,.83)): panel(x,y,.365,.69,h,WOOD)
            fleur([x,1.65,.425],.29)
            cylinder([x*.18,1.17,.41],[x*.18,1.17,.445],.045,GOLD,8)
            ring([x*.18,1.12,.448],.035,.06,.012,GOLD,steps=10)
    fleur([0,2.39,.408],.18)


def desk(vanity=False):
    legs(1.5,.53,.74)
    trim([0,.78,-.04],[1.82,.14,.73],WOOD)
    trim([0,.87,-.04],[1.85,.05,.76])
    for x in (-.60,0,.60):
        panel(x,.75,.34,.51,.14,WOOD)
        oval([x,.75,.40],[.055,.04,.03],GOLD,6,3)
    if vanity:
        for x in (-.48,.48): turned(x,-.24,.90,.66,.045)
        oval([0,1.51,-.25],[1.05,1.02,.13],GOLD,20,8)
        oval([0,1.51,-.175],[.88,.85,.028],[.68,.85,.92],20,8)
        beam([-.22,1.62,-.153],[.12,1.83,-.153],.045,.012,WHITE)
        fleur([0,2.05,-.22],.20)
        for i in range(3):
            x=-.69+i*.15
            vase(x,.90,.09,.15+i*.04,.05)
        box([.57,.98,.08],[.30,.16,.23],BLUE)
        trim([.57,1.07,.08],[.32,.035,.25])
        for x in (-.20,.20):
            for z in (.12,.34): turned(x,z,0,.38,.035)
        cushion([0,.42,.23],[.53,.15,.39],RED)
    else:
        # Open book, raised spine and separately angled page blocks.
        for sign in (-1,1):
            sheet([[[sign*u,.94+.045*(1-u/.31),z] for u in (0,.15,.31)] for z in (-.19,.17)],IVORY,.025)
            for j in range(5): box([sign*.17,.977,-.12+j*.05],[.19,.008,.009],WOOD*.65)
        for x in (-.65,-.48): cylinder([x,.97,-.20],[x,.97,.15],.055,IVORY,10)
        candlestick(.67,.90,-.15,.40)
        lathe([(0,0),(.07,0),(.07,.10),(.035,.13),(0,.13)],INK,8,(.43,.90,.20))
        beam([.43,1.02,.20],[.59,1.31,.18],.015,.015,GOLD)
        relief([(-.03,0),(.02,.21),(.13,.30),(.12,.12)],[.48,1.08,.18],.7,WHITE)
        oval([-.37,.925,.23],[.10,.035,.10],RED,8,3)


def side_table():
    turned(0,0,0,1.0,.17,WOOD)
    for a in np.arange(3)*math.tau/3:
        beam([0,.20,0],[.31*math.cos(a),.04,.31*math.sin(a)],.10,.10,WOOD)
    lathe([(0,.96),(.40,.96),(.43,1.0),(.41,1.045),(0,1.045)],GOLD,20)
    vase(0,1.045,0,.28,.10); lilies(0,1.27,0,.20,.31)


def floor_vase():
    vase(0,0,0,.96,.26)
    for a in np.arange(5)*math.tau/5:
        x=.23*math.cos(a); z=.23*math.sin(a)
        beam([0,.82,0],[x,1.31,z],.018,.018,GREEN)
        oval([x,1.32,z],[.16,.36,.09],BLUE,8,4)
        oval([x,1.37,z+.045],[.08,.12,.02],GOLD,8,4)
        oval([x,1.38,z+.06],[.04,.07,.015],GREEN,8,4)


def armor():
    trim([0,.05,0],[.70,.10,.66],WOOD)
    cylinder([0,.10,-.12],[0,1.80,-.12],.045,WOOD,8)
    for x in (-.14,.14):
        cushion([x,.18,.10],[.20,.18,.36],STEEL)
        turned(x,0,.23,.69,.075,STEEL)
        oval([x,.61,.065],[.18,.23,.17],STEEL*1.25)
    oval([0,1.19,0],[.48,.65,.33],STEEL)
    sheet([[[-.21,.85,.18],[.21,.85,.18]],[[-.19,1.42,.18],[.19,1.42,.18]]],BLUE)
    lion([0,1.14,.20],.30)
    for x in (-.29,.29):
        oval([x,1.43,0],[.24,.22,.29],STEEL)
        beam([x,1.38,0],[x*1.13,1.04,.11],.12,.14,STEEL)
        oval([x*1.13,1.04,.11],[.12,.16,.13],GOLD)
    oval([0,1.75,0],[.34,.39,.32],STEEL)
    box([0,1.77,.16],[.27,.035,.018],INK)
    box([0,1.70,.18],[.035,.19,.035],STEEL*1.3)
    oval([0,2.04,-.04],[.14,.33,.30],RED)
    beam([.37,.12,.16],[.37,1.96,.16],.027,.027,WOOD)
    relief([(-.02,-.14),(-.15,-.04),(-.17,.12),(-.02,.07),(.03,.21),(.07,.05),(.04,-.14)],[.37,1.83,.17],.65,STEEL)


def floor_candelabra():
    turned(0,0,0,1.48,.15)
    for i in range(5):
        x=(i-2)*.16; y=1.40+.14*(1-abs(i-2)/2)
        if x:
            beam([0,1.10,0],[x,1.22,0],.035,.035,GOLD)
            beam([x,1.22,0],[x,y,0],.035,.035,GOLD)
        lathe([(0,0),(.06,0),(.07,.025),(0,.04)],GOLD,8,(x,y,0))
        candle(x,y+.04,0,.22)


def railing(a,b,height=.90,base=0):
    a=np.array(a,float); b=np.array(b,float)
    for t in np.linspace(0,1,7):
        x,z=a+(b-a)*t
        turned(x,z,base,height-.10,.06,IVORY)
    beam([*a[:1],base+height,a[1]],[b[0],base+height,b[1]],.13,.14,IVORY)
    beam([a[0],base+.07,a[1]],[b[0],base+.07,b[1]],.12,.12,IVORY)


def stairs(down=False):
    if down:
        box([0,.025,0],[2.82,.05,1.82],INK)
        # Recess illusion stays above y=0, so it fits a normal uncut game floor.
        for i in range(8):
            z=.78-i*.21; y=.35-i*.04
            box([0,y/2,z],[2.34,y,.21],IVORY*(.16+.07*(7-i)))
            box([0,y+.005,z],[.95,.01,.21],RED*(.20+.10*(7-i)))
        for x in (-1.32,1.32): railing([x,-.82],[x,.82],.90)
        railing([-1.32,-.82],[1.32,-.82],.90)
    else:
        for i in range(8):
            z=.80-i*.225; h=(i+1)*.1875
            box([0,h/2,z],[2.78,h,.225],IVORY*(.86+.02*(i%3)))
            box([0,h+.009,z],[1.10,.018,.225],RED)
            box([0,h-.084,z+.114],[1.10,.1875,.012],RED*.86)
            for x in (-.57,.57): box([x,h+.012,z],[.045,.025,.225],GOLD)
            for x in (-.57,.57): box([x,h-.084,z+.117],[.045,.1875,.014],GOLD)
            for x in (-1.29,1.29): turned(x,z,h,.65,.065,IVORY)
        for x in (-1.29,1.29):
            beam([x,.85,.83],[x,2.16,-.80],.13,.13,GOLD)
            for z,h in ((.80,.1875),(-.775,1.5)):
                turned(x,z,h,.75,.10,IVORY)
                oval([x,h+.83,z],[.18,.18,.18],GOLD)


def bench():
    legs(1.53,.53,.35)
    trim([0,.37,0],[1.80,.11,.74])
    cushion([0,.50,0],[1.80,.20,.76],RED)
    for x in np.linspace(-.65,.65,5):
        for z in (-.17,.17): oval([x,.601,z],[.04,.018,.04],GOLD,6,3)
    for x in (-.85,.85):
        for z in (-.32,.32):
            beam([x,.48,z],[x,.29,z],.018,.018,GOLD)
            oval([x,.27,z],[.065,.13,.065],GOLD,6,3)


def council():
    turned(0,0,0,.90,.35,WOOD)
    for a in np.arange(4)*math.pi/2:
        beam([0,.30,0],[.85*math.cos(a),.09,.85*math.sin(a)],.18,.18,WOOD)
    lathe([(0,.87),(1.36,.87),(1.43,.93),(1.43,.98),(1.36,1.02),(0,1.02)],WOOD,32)
    lathe([(1.36,.975),(1.43,.975),(1.43,.997),(1.36,.997)],GOLD,32)
    box([0,1.035,0],[1.45,.015,1.10],IVORY)
    for x in (-.72,.72): cylinder([x,1.075,-.55],[x,1.075,.55],.052,IVORY,10)
    for pts in ([(-.55,-.35),(-.12,-.40),(.03,-.13),(-.25,.06),(-.48,-.03)],[(.18,.05),(.52,-.10),(.61,.27),(.26,.39),(.06,.25)]):
        relief(pts,[0,1.046,0],1,GREEN,True)
    for x,z in ((-.30,-.20),(.36,.17),(.0,.35)):
        turned(x,z,1.055,.10,.045)
        beam([x,1.10,z],[x,1.35,z],.015,.015,GOLD)
        relief([(0,0),(.16,-.03),(0,-.13)],[x,1.35,z],1,RED)
    for x in (-1.0,1.0): candlestick(x,1.02,0,.40)
    for z in (-.91,.91): goblet(.35,1.02,z)


def pedestal(height=.99):
    for y,w,h in ((.06,.63,.12),(.18,.53,.12),(height-.07,.58,.14)):
        trim([0,y,0],[w,h,w],IVORY)
    cylinder([0,.20,0],[0,height-.13,0],.21,IVORY,16)
    for a in np.arange(12)*math.tau/12:
        cylinder([.205*math.cos(a),.24,.205*math.sin(a)],[.205*math.cos(a),height-.16,.205*math.sin(a)],.026,IVORY*1.12,6)


def bust():
    pedestal()
    oval([0,1.15,0],[.62,.34,.32],IVORY)
    cylinder([0,1.23,0],[0,1.44,0],.10,IVORY,10)
    oval([0,1.57,0],[.34,.44,.32],IVORY)
    oval([0,1.72,-.04],[.36,.23,.31],IVORY*.75)
    oval([0,1.57,.17],[.08,.12,.08],IVORY*1.1,6,3)
    for x in (-.07,.07): box([x,1.62,.151],[.065,.018,.02],IVORY*.48)
    for x in (-.15,.15): beam([x,1.26,.14],[x*.3,1.03,.17],.05,.04,IVORY*.70)


def column():
    for y,w,h in ((.07,.84,.14),(.20,.72,.12),(2.78,.70,.14),(2.94,.84,.12)):
        trim([0,y,0],[w,h,w],IVORY if y<1 else GOLD)
    cylinder([0,.26,0],[0,2.70,0],.26,IVORY,20)
    for a in np.arange(16)*math.tau/16:
        cylinder([.255*math.cos(a),.34,.255*math.sin(a)],[.255*math.cos(a),2.60,.255*math.sin(a)],.028,IVORY*.83,6)
    for y in (.29,2.64): cylinder([0,y,0],[0,y+.07,0],.30,GOLD,16)


def harp():
    trim([0,.05,-.06],[.72,.10,.52])
    beam([-.27,.14,-.10],[-.30,1.49,-.10],.13,.13,GOLD)
    beam([-.27,.14,-.10],[.29,1.34,-.10],.13,.22,WOOD)
    for a,b in zip([[-.30,1.49,-.10],[-.10,1.62,-.10],[.12,1.56,-.10]],
                   [[-.10,1.62,-.10],[.12,1.56,-.10],[.29,1.34,-.10]]): beam(a,b,.11,.11,GOLD)
    for i in range(9):
        x=-.22+i*.052; bottom=.25+(x+.22)*1.9; top=1.49-.12*(x+.22)
        cylinder([x,bottom,-.10],[x,top,-.10],.006,LIGHT,5)
    oval([-.30,1.62,-.10],[.15,.16,.15],GOLD)
    for x in (-.14,.14): turned(x,.29,0,.29,.03,WOOD)
    cushion([0,.32,.29],[.43,.12,.29],BLUE)


def topiary():
    lathe([(0,0),(.26,0),(.28,.10),(.17,.18),(.22,.32),(.34,.46),(.35,.55),(.28,.55),(0,.42)],IVORY,12)
    cylinder([0,.46,0],[0,1.40,0],.045,WOOD,8)
    for i,(y,r) in enumerate(((.81,.40),(1.18,.30),(1.49,.21))):
        oval([0,y,0],[r*2,r*1.55,r*2],GREEN*(1+i*.14),12,6)
    for a in np.arange(10)*math.tau/10:
        oval([.29*math.cos(a),.82,.29*math.sin(a)],[.19,.20,.19],GREEN*1.2,6,3)


def globe():
    turned(0,0,0,.65,.16,WOOD)
    for a in np.arange(3)*math.tau/3:
        beam([0,.18,0],[.32*math.cos(a),.03,.32*math.sin(a)],.08,.08,WOOD)
    oval([0,1.02,0],[.63,.63,.63],BLUE,20,10)
    ring([0,1.02,0],.38,.38,.025,GOLD)
    ring([0,.99,0],.39,.39,.025,WOOD,'xz')
    # Irregular contiguous continent silhouettes, projected onto the sphere.
    def on_sphere(a,b):
        return np.array([.334*math.cos(b)*math.cos(a),1.02+.334*math.sin(b),.334*math.cos(b)*math.sin(a)])
    for a,b,outline in ((1.2,.3,[(-.35,-.2),(-.3,.3),(-.08,.5),(.30,.35),(.36,.08),(.15,-.13),(.08,-.48),(-.1,-.40)]),
                        (2.8,-.1,[(-.3,-.25),(-.37,.16),(-.18,.38),(.17,.34),(.28,.06),(.10,-.14),(.06,-.48)]),
                        (-.6,.25,[(-.26,-.2),(-.35,.10),(-.10,.32),(.3,.14),(.36,-.25),(.04,-.36)])):
        center=on_sphere(a,b)
        for i,delta in enumerate(outline):
            other=outline[(i+1)%len(outline)]
            pts=[center,on_sphere(a+delta[0],b+delta[1]),on_sphere(a+other[0],b+other[1])]
            face(pts,IVORY*.65,np.mean(pts,0)-[0,1.02,0])


def chest():
    legs(.61,.39,.12)
    box([0,.29,0],[.80,.37,.60],WOOD)
    box([0,.48,0],[.68,.02,.48],INK)
    for x in (-.28,.28): box([x,.29,.306],[.07,.37,.018],GOLD)
    for y in (.14,.46): trim([0,y,0],[.82,.045,.62])
    # Lid stands open behind the treasure, with a barrel-vault silhouette.
    cushion([0,.68,-.25],[.80,.40,.12],WOOD)
    for x in (-.29,.29): box([x,.68,-.175],[.06,.38,.025],GOLD)
    for i in range(25):
        x=((i*7)%11-5)*.058; z=((i*3)%7-3)*.06; y=.50+(i%3)*.018
        cylinder([x,y,z],[x,y+.022,z],.048,GOLD if i%2 else LIGHT,8)
    for i in range(5):
        oval([-.25+i*.11,.55+(i%2)*.06,.13],[.10,.10,.10],BLUE if i%2 else RED,6,3)
    lathe([(.12,.56),(.16,.56),(.16,.62),(.12,.62)],GOLD,12,(.08,0,-.08))
    for a in np.arange(5)*math.tau/5:
        x=.08+.14*math.cos(a); z=-.08+.14*math.sin(a)
        beam([x,.61,z],[x,.73,z],.04,.04,LIGHT)
        oval([x,.75,z],[.06,.06,.06],RED,6,3)


def rug(blue=False):
    col=BLUE if blue else RED
    box([0,.004,0],[2.72,.008,1.80],col)
    for x in (-1.29,1.29): box([x,.010,0],[.09,.004,1.78],GOLD)
    for z in (-.83,.83): box([0,.010,z],[2.63,.004,.07],GOLD)
    for x in (-1.19,1.19): box([x,.013,0],[.022,.004,1.58],IVORY)
    for z in (-.73,.73): box([0,.013,z],[2.40,.004,.022],IVORY)
    relief([(-.63,0),(0,-.60),(.63,0),(0,.60)],[0,.016,0],1,GOLD,True)
    relief([(-.53,0),(0,-.50),(.53,0),(0,.50)],[0,.018,0],1,col*.65,True)
    (fleur if blue else lion)([0,.021,0],.75,True)
    for x in (-.93,.93):
        for z in (-.49,.49): fleur([x,.016,z],.28,True)
    for x in (-1.40,1.40):
        for z in np.linspace(-.85,.85,25): box([x,.005,z],[.10,.006,.018],IVORY)


@model
def floor_model(rng,kind):
    builders={'bed_royal':lambda:bed(), 'bed_princess':lambda:bed(True),
      'dining_table':dining,'chair':chair,'armchair':lambda:chair(True),'throne':lambda:throne(rng),
      'fireplace':fireplace,'wardrobe':cabinet,'bookcase':lambda:cabinet(True),
      'vanity':lambda:desk(True),'desk':desk,'side_table':side_table,'vase_floor':floor_vase,
      'armor_stand':armor,'candelabra':floor_candelabra,'stairs_up':stairs,
      'stairwell_down':lambda:stairs(True),'bench_cushion':bench,'council_table':council,
      'bust_pedestal':bust,'column':column,'harp':harp,'planter_topiary':topiary,
      'balustrade':lambda:railing([-.88,0],[.88,0]),'globe_stand':globe,
      'chest_treasure':chest,'rug_red':rug,'rug_blue':lambda:rug(True)}
    builders[kind]()


def frame(w,h,iw,ih):
    box([0,h/2,.01],[iw,ih,.02],WOOD*.4)
    # Inner edges are exact; all ornament remains strictly outside the opening.
    bw=(w-iw)/2; bh=(h-ih)/2
    for x in (-(iw+bw)/2,(iw+bw)/2): box([x,h/2,.05],[bw,h,.08],GOLD)
    for y in (bh/2,h-bh/2): box([0,y,.05],[iw,bh,.08],GOLD)
    for x in (-w/2+bw*.25,w/2-bw*.25): box([x,h/2,.094],[bw*.25,h-.035,.012],LIGHT)
    for y in (bh*.25,h-bh*.25): box([0,y,.094],[w-.025,bh*.25,.012],LIGHT)
    for x in (-w/2+bw/2,w/2-bw/2):
        for y in (bh/2,h-bh/2): oval([x,y,.087],[bw*.75,bh*.75,.025],DARK,8,4)
    fleur([0,h+.055,.08],.18)
    # Backing is exactly z=.02; opening centered in the nominal rectangle.


def arch(w,h,depth,col,fill=None):
    radius=w/2; spring=h-radius
    if fill is not None:
        box([0,spring/2,.025],[w-.20,spring,.05],fill)
        verts=[[0,spring,.05]]+[[ (radius-.10)*math.cos(t),spring+(radius-.10)*math.sin(t),.05] for t in np.linspace(0,math.pi,19)]
        face(verts,fill,[0,0,1])
    for x in (-radius+.055,radius-.055): box([x,spring/2,depth/2],[.11,spring,depth],col)
    for i in range(18):
        a=i*math.pi/18; b=(i+1)*math.pi/18
        pts=[[r*math.cos(t),spring+r*math.sin(t),z] for z in (0,depth) for r,t in ((radius-.11,a),(radius,a),(radius,b),(radius-.11,b))]
        for ids in ((0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)):
            pp=np.array(pts)[list(ids)]; face(pp,np.array(col)*(1 if i%2 else .89),pp.mean(0)-np.mean(pts,0))


def wall_model(kind):
    with Mesh() as m:
        if kind.startswith('frame_'):
            frame(*((1,1.4,.76,1.16) if kind=='frame_portrait' else (1.9,1.3,1.62,1.02)))
        elif kind=='cloth_of_state':
            # Broad vertical folds tighten at the gathered heading; the hem
            # follows their profile instead of floating in front of the fabric.
            def cloth_point(u,t):
                x=(u-.5)*2.34*(.94+.06*(1-t))
                return [x,.14+t*2.32+.035*math.cos(u*math.tau*8)*(1-t),
                        .073+(.043-.015*t)*math.cos(u*math.tau*8)]
            sheet([[cloth_point(u,t) for u in np.linspace(0,1,49)]
                   for t in np.linspace(0,1,10)],RED,.008)
            for u in np.linspace(0,1,49):
                x,y,z=cloth_point(u,0)
                beam([x,y,z],[x,y-.09,z],.018,.018,GOLD)
                oval([x,y-.09,z],[.027,.035,.027],GOLD,6,3)
            for u in (.025,.975):
                sheet([[np.array(cloth_point(u+du,t))+[0,0,.004]
                        for du in (-.006,.006)] for t in np.linspace(0,1,10)],GOLD,.003)
            state_lion([0,1.38,.125],1.65)
            for y,w,h in ((2.49,2.50,.12),(2.57,2.58,.06)):
                box([0,y,.065],[w,h,.12],GOLD if y<2.55 else LIGHT)
            # Original five-point Valorian crown, inside the overall 2.8 height.
            box([0,2.64,.08],[.49,.065,.09],GOLD)
            for i in range(5):
                x=(i-2)*.105; top=2.74+.035*(i==2)
                relief([(-.05,0),(.05,0),(.028,.09),(0,top-2.65),(-.028,.09)],
                       [x,2.65,.13],1,LIGHT)
                oval([x,top,.105],[.035,.035,.035],GOLD,6,3)
        elif kind=='window_drapes':
            arch(1.8,2.6,.14,IVORY,[.61,.85,1])
            for x in (-.25,0,.25): box([x,1.20,.082],[.04,2.18,.055],IVORY)
            for y in (.72,1.40,1.94): box([0,y,.083],[1.48,.04,.055],IVORY)
            for x in (-.66,.66): curtain(x,.165,.06,2.36,.36,RED,.030)
            box([0,2.40,.19],[1.70,.13,.10],GOLD)
            for x in np.linspace(-.80,.80,17): oval([x,2.29,.21],[.045,.10,.045],GOLD,6,3)
        elif kind=='door_double':
            arch(1.8,2.5,.19,IVORY,WOOD)
            for x in (-.36,.36):
                for y,h in ((.48,.74),(1.32,.70)): panel(x,y,.061,.58,h,WOOD)
                for y in (.25,1.5): box([x*1.75,y,.12],[.20,.045,.025],GOLD)
                ring([x*.25,1.02,.14],.045,.075,.016,GOLD,steps=12)
            box([0,1.04,.083],[.025,2.08,.018],GOLD)
            fleur([0,2.35,.195],.22)
        elif kind=='banner_royal':
            grid=[[[x, .11+t*2.08-(.13*(1-abs(x)/.37) if t==0 else 0),.055+.025*math.cos(x*33)] for x in np.linspace(-.37,.37,17)] for t in np.linspace(0,1,9)]
            # Raise bottom tip to zero while keeping the rod at the required height.
            for row in grid:
                for p in row: p[1]+=.070
            sheet(grid,BLUE,.008)
            for x in (-.34,.34): box([x,1.19,.09],[.025,1.96,.012],GOLD)
            lion([0,1.40,.097],.60); fleur([0,.59,.098],.34)
            cylinder([-.40,2.28,.055],[.40,2.28,.055],.025,GOLD,8)
            for x in (-.42,.42): oval([x,2.28,.055],[.06,.10,.06],LIGHT,8,4)
            for x in np.linspace(-.35,.35,19):
                y=.180-.13*(1-abs(x)/.37)
                beam([x,y,.07],[x,y-.045,.07],.017,.017,GOLD)
        elif kind=='sconce':
            oval([0,.30,.035],[.20,.60,.07],GOLD,12,6)
            for x in (-.15,.15):
                beam([0,.14,.07],[x,.26,.22],.035,.035,GOLD)
                candle(x,.28,.22,.20,.026)
            fleur([0,.57,.08],.18)
        elif kind=='weapon_rack':
            cushion([0,.70,.03],[1.72,1.36,.06],WOOD)
            for sign in (-1,1):
                beam([sign*.60,.19,.10],[-sign*.62,1.26,.10],.075,.035,STEEL)
                beam([sign*.56,.35,.115],[sign*.35,.12,.115],.055,.045,GOLD)
                beam([sign*.65,.16,.115],[sign*.76,.065,.115],.055,.045,WOOD)
            relief([(-.37,.36),(.37,.36),(.32,-.13),(0,-.44),(-.32,-.13)],[0,.73,.15],1,GOLD)
            relief([(-.31,.30),(.31,.30),(.26,-.10),(0,-.36),(-.26,-.10)],[0,.73,.16],1,BLUE)
            lion([0,.74,.17],.48)
    # Keep the wall plane, but put the lowest geometry at the hanging origin.
    p,n,c=m.arrays(); p[:,1]-=p[:,1].min(); m.positions=list(p)
    return m


def chandelier():
    with Mesh() as m:
        turned(0,0,2.37,.80,.12)
        for y,r,count in ((2.48,.79,10),(2.99,.48,6)):
            ring([0,y,0],r,r,.035,GOLD,'xz',steps=24)
            for i in range(count):
                a=i*math.tau/count; x=r*math.cos(a); z=r*math.sin(a)
                beam([0,y+.19,0],[x*.72,y-.02,z*.72],.032,.032,GOLD)
                beam([x*.72,y-.02,z*.72],[x,y+.04,z],.032,.032,GOLD)
                candle(x,y+.05,z,.15,.027)
                oval([x,y-.10,z],[.07,.18,.07],[.68,.87,.95],6,3)
        for j in range(12):
            # Alternating linked ovals; chain terminates exactly at 4.2.
            if j%2==0: ring([0,3.23+j*.079,0],.032,.051,.007,GOLD,steps=10)
            else:
                with Mesh() as link: ring([0,0,0],.032,.051,.007,GOLD,steps=10)
                emit(link,[0,3.23+j*.079,0],90)
        cylinder([0,4.15,0],[0,4.20,0],.09,GOLD,10)
    return m


def compact_glb(path):
    """Lossless indexing of identical POSITION/NORMAL/COLOR tuples.

    Keep hard edges and every vertex colour intact. The existing exporter still
    owns the GLB/material schema; only redundant vertices are removed afterward.
    """
    data=path.read_bytes(); length=struct.unpack_from('<I',data,12)[0]
    doc=json.loads(data[20:20+length]); binary=data[28+length:]
    attributes=[]
    for view in doc['bufferViews'][:3]:
        attributes.append(np.frombuffer(binary,dtype='<f4',count=view['byteLength']//4,offset=view['byteOffset']).reshape(-1,3))
    unique,indices=np.unique(np.concatenate(attributes,axis=1),axis=0,return_inverse=True)
    arrays=[np.asarray(unique[:,i:i+3],dtype='<f4') for i in (0,3,6)]+[np.asarray(indices,dtype='<u4')]
    parts=[]; offset=0
    for i,a in enumerate(arrays):
        raw=a.tobytes(); parts.append(raw)
        doc['bufferViews'][i]['byteOffset']=offset
        doc['bufferViews'][i]['byteLength']=len(raw)
        doc['accessors'][i]['count']=len(a)
        offset+=len(raw)
    doc['buffers'][0]['byteLength']=offset
    js=json.dumps(doc,separators=(',',':')).encode(); js+=b' '*((-len(js))%4)
    binary=b''.join(parts)
    path.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(js)+len(binary))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(binary),b'BIN\0')+binary)


def check(name,path):
    arrays=validate(path)
    # Expand the real exported indices for the shared triangle-list rasterizer.
    data=path.read_bytes(); length=struct.unpack_from('<I',data,12)[0]
    doc=json.loads(data[20:20+length]); view=doc['bufferViews'][3]
    indices=np.frombuffer(data[28+length:],dtype='<u4',count=doc['accessors'][3]['count'],offset=view['byteOffset'])
    arrays=tuple(a[indices] for a in arrays)
    p,n,c=arrays; lo=p.min(0); hi=p.max(0); eps=2e-6
    assert len(p)//3<=(6000 if name in FLOORS or name in WALLS or name=='chandelier' else 9000),(name,len(p)//3)
    if name in FLOORS:
        limit=np.array(FLOORS[name])/2-.04
        assert np.all(lo[[0,2]]>=-limit-eps) and np.all(hi[[0,2]]<=limit+eps),(name,lo,hi,limit)
        assert abs(lo[1])<eps,(name,lo)
        assert np.allclose(lo[[0,2]],-hi[[0,2]],atol=eps),name
    if name in WALLS:
        w,h,d=WALLS[name]
        assert lo[0]>=-w/2-eps and hi[0]<=w/2+eps,(name,lo,hi)
        assert lo[1]>=-eps and hi[1]<=h+eps,(name,lo,hi)
        assert abs(lo[1])<eps,(name,'wall bottom origin')
        assert lo[2]>=-eps and hi[2]<=d+eps,(name,lo,hi)
    if name=='throne': assert hi[1]<=3.8+eps
    if name=='chair': assert np.all(hi[[0,2]]-lo[[0,2]]<=.8+eps)
    if name=='vase_floor': assert np.max(np.linalg.norm(p[:,[0,2]],axis=1))<=.38+eps
    if name=='column': assert max(hi[[0,2]]-lo[[0,2]])<=.90+eps and abs(hi[1]-3)<eps
    if name=='chest_treasure': assert np.all(hi[[0,2]]-lo[[0,2]]<=np.array([.9,.7])+eps)
    if name.startswith('rug_'): assert hi[1]<=.03+eps
    if name=='chandelier':
        assert np.max(np.linalg.norm(p[:,[0,2]],axis=1))<=.95+eps
        assert lo[1]>=2.29 and abs(hi[1]-4.2)<eps
    if name.startswith('frame_'):
        iw,ih,h=(.76,1.16,1.4) if name=='frame_portrait' else (1.62,1.02,1.3)
        # Inspect actual triangles at the image plane: none may intrude into
        # the open rectangle. Check triangle AABBs (stronger than vertex-only).
        tris=p.reshape(-1,3,3); mins=tris.min(1); maxs=tris.max(1)
        intrude=(maxs[:,0]>-iw/2+eps)&(mins[:,0]<iw/2-eps)&(maxs[:,1]>(h-ih)/2+eps)&(mins[:,1]<(h+ih)/2-eps)&(maxs[:,2]>.02+eps)
        assert not intrude.any(),(name,'obstructed image opening')
        backing=p[np.isclose(p[:,2],.02,atol=eps)]
        assert np.allclose(backing.min(0)[:2],[-iw/2,(h-ih)/2],atol=eps)
        assert np.allclose(backing.max(0)[:2],[iw/2,(h+ih)/2],atol=eps)
    return arrays


def scenes(assets):
    for title in ('royal_bedroom','dining_hall'):
        placements=[]
        with Mesh() as m:
            for x in range(-4,5):
                for z in range(-3,4): box([x,-.045,z],[.99,.08,.99],IVORY*.8 if (x+z)%2 else WOOD*.65)
            box([0,1.50,-3.5],[9,3,.14],IVORY*.66)
            for y in (.15,.78,2.85): box([0,y,-3.40],[9,.06,.07],GOLD)
            def place(name,pos,angle=0):
                emit(assets[name],pos,angle)
                placements.append(dict(model='palace_'+name+'.glb',position=pos,rotationYDegrees=angle))
            for x in (-4,4): place('column',[x,0,-3.1])
            for x in (-2.7,2.7): place('window_drapes',[x,.15,-3.41])
            if title=='royal_bedroom':
                place('bed_royal',[0,0,-1.5]); place('rug_red',[0,0,1.1])
                place('bench_cushion',[0,0,.65]); place('wardrobe',[-3.4,0,-.8],90)
                place('vanity',[2.8,0,-2.7]); place('armchair',[2.7,0,.4],-25)
                place('side_table',[-1.6,0,-1.8]); place('vase_floor',[1.6,0,-2.3])
                place('fireplace',[-3.4,0,1.4],90); place('candelabra',[1.7,0,-.5])
            else:
                place('dining_table',[0,0,0])
                for x in (-2.28,-.76,.76,2.28):
                    place('chair',[x,0,-1.5]); place('chair',[x,0,1.5],180)
                place('chair',[-3.4,0,0],90); place('chair',[3.4,0,0],-90)
                place('fireplace',[0,0,-2.9]); place('armor_stand',[-3.6,0,-2.7])
                place('planter_topiary',[3.6,0,-2.7])
                # Chandelier separate on the high side avoids obscuring banquet dressing.
                place('chandelier',[0,1.1,-1.0])
        render(TEAM/f'preview_palace_{title}.png',*m.arrays(),size=(1400,1000),eye=(3,8.4,7),margin=.055,background=(231,223,205))
        (TEAM/f'palace_{title}.json').write_text(json.dumps(dict(placements=placements,cameraDirection=[3,8.4,7],previewOnly='9x7 tiled floor and back wall; chandelier raised 1.1 in dining test scene.'),indent=2))


def main():
    import palace_grand as grand
    TEAM.mkdir(exist_ok=True); OUT.mkdir(exist_ok=True,parents=True)
    protected={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.glob('*.glb') if p.stem.removeprefix('palace_') not in grand.GRAND_NAMES}
    baseline=json.loads((TEAM/'palace_original_hashes.json').read_text())
    assert len(baseline)==37
    scratch=TEAM/'palace_legacy_regenerated'; scratch.mkdir(exist_ok=True)
    proof={}
    rows=[]; assets={}
    legacy=[*FLOORS,*(n for n in WALLS if n!='cloth_of_state'),'chandelier','cloth_of_state']
    for i,name in enumerate([*legacy,*grand.GRAND_NAMES]):
        is_new=name in grand.GRAND_NAMES
        m=grand.build(name,1900+i) if is_new else floor_model(seed=900+i,kind=name) if name in FLOORS else wall_model(name) if name in WALLS else chandelier()
        path=(OUT if is_new else scratch)/f'palace_{name}.glb'
        with m: export_glb(path,'palace_'+name)
        compact_glb(path)
        print(name,flush=True); arrays=check(name,path); assets[name]=arrays
        if is_new: grand.check_grand(name,arrays)
        else:
            original=OUT/path.name
            before=baseline[path.name]
            regenerated=hashlib.sha256(path.read_bytes()).hexdigest()
            after=hashlib.sha256(original.read_bytes()).hexdigest()
            assert before==regenerated==after,(name,'legacy hash mismatch')
            proof[path.name]=dict(before=before,regenerated=regenerated,after=after,identical=True)
        p,n,c=arrays
        for suffix,eye in (('',(3,8.3,6.3)),('_low',(4,3.2,7))):
            render(TEAM/f'preview_palace_{name}{suffix}.png',*arrays,size=(480,480),eye=eye,background=(231,223,205))
        rows.append(dict(file=path.name,triangles=len(p)//3,bytes=path.stat().st_size,minimum=p.min(0).tolist(),maximum=p.max(0).tolist(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),seed=1900+i if is_new else 900+i))
    total=sum(r['bytes'] for r in rows)
    new_rows=rows[len(legacy):]
    assert sum(r['bytes'] for r in rows[:len(legacy)])<6_000_000
    assert sum(r['bytes'] for r in new_rows)<5_000_000
    (TEAM/'palace_manifest.json').write_text(json.dumps(rows,indent=2))
    (TEAM/'palace_grand_manifest.json').write_text(json.dumps(new_rows,indent=2))
    (TEAM/'palace_grand_hash_proof.json').write_text(json.dumps(proof,indent=2))
    for suffix in ('','_low'):
        contact=Image.new('RGB',(1440,math.ceil(len(assets)/6)*265),(244,237,220)); d=ImageDraw.Draw(contact)
        for i,name in enumerate(assets):
            tile=Image.open(TEAM/f'preview_palace_{name}{suffix}.png'); tile.thumbnail((236,236))
            x=(i%6)*240; y=(i//6)*265; contact.paste(tile,(x+2,y))
            d.text((x+8,y+241),name.replace('_',' ').upper(),fill=(54,43,29))
        contact.save(TEAM/f'preview_palace_contact{suffix}.png')
    scenes(assets)
    grand.hall(assets)
    assert all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in protected.items())
    (TEAM/'palace_protected_hashes.json').write_text(json.dumps(protected,indent=2))
    print(f'PALACE TOTAL: {len(rows)} models; {sum(r["triangles"] for r in rows)} triangles; {total:,} bytes',flush=True)


if __name__=='__main__': main()


