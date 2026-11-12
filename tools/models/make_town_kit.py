"""Seeded town dressing. Python + numpy + Pillow; run this file to rebuild all.

Public generators return Mesh objects; size is a positive uniform scale.
Positions are metres, Y up, front +Z. No external assets or dependencies.
"""
from pathlib import Path
from functools import wraps
import math
import json
import inspect
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import meshkit as mk
from meshkit import Mesh, box, beam, cylinder, rock, face, ring_segment, render, validate, export_glb

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'src/assets/world3d/custom'
TEAM = ROOT/'.team'
WOOD = np.array([.38,.19,.075])
STONE = np.array([.49,.46,.36])
IRON = np.array([.065,.083,.089])
WATER = np.array([.055,.44,.49])
CREAM = np.array([.92,.79,.52])
GREEN = np.array([.12,.33,.065])
PALETTE = {'red':(.65,.075,.045),'white':(.92,.82,.60),'blue':(.045,.25,.49),
           'yellow':(.94,.55,.075),'green':(.18,.40,.12),'purple':(.39,.13,.38)}

def emit(mesh, pos=(0,0,0), angle=0, scale=1):
    p,n,c = mesh.arrays() if isinstance(mesh,Mesh) else mesh
    t=math.radians(angle)
    rot=np.array([[math.cos(t),0,-math.sin(t)],[0,1,0],[math.sin(t),0,math.cos(t)]])
    mk.POSITIONS.extend(p*scale@rot+pos); mk.NORMALS.extend(n@rot); mk.COLORS.extend(c)

def model(fn):
    @wraps(fn)
    def wrapped(seed=1,size=1,**options):
        if size<=0: raise ValueError('size must be positive')
        for key in ('wood','stone','water','board','bronze','color'):
            if key in options: options[key]=np.asarray(options[key],dtype=float)
        with Mesh() as m: fn(np.random.default_rng(seed),**options)
        p,n,c=m.arrays()
        # Centre irregular outlines exactly. Mounted objects retain their wall plane.
        mounted=fn.__name__=='shop_sign' or (fn.__name__=='lamp' and options.get('wall',False))
        if fn.__name__!='bunting':
            p[:,0]-=(p[:,0].min()+p[:,0].max())/2
            if not mounted: p[:,2]-=(p[:,2].min()+p[:,2].max())/2
            p[:,1]-=p[:,1].min()
        m.positions=list(p*size)
        return m
    return wrapped

def blob(p,s,col,rng,sides=7,rings=3):
    rock(p,s,col,int(rng.integers(1,2**30)),sides,rings)

def nail(x,y,z,r=.018):
    cylinder([x,y,z],[x,y,z+.012],r,IRON,6)

def plank(p,s,rng,color=WOOD):
    col=np.asarray(color)*rng.uniform(.88,1.12)
    box(p,s,col)
    if s[0]>.3:
        for x in (-.39,.39): nail(p[0]+s[0]*x,p[1],p[2]+s[2]/2)

def lathe(profile,color,sides=12,center=(0,0,0)):
    """Closed radial profile, ordered counterclockwise in (radius,height)."""
    cx,cy,cz=center
    for i in range(sides):
        a,b=i*math.tau/sides,(i+1)*math.tau/sides
        for k in range(len(profile)):
            r,y=profile[k]; s,h=profile[(k+1)%len(profile)]
            if r==s==0: continue
            pts=[[cx+r*math.cos(a),cy+y,cz+r*math.sin(a)],
                 [cx+r*math.cos(b),cy+y,cz+r*math.sin(b)],
                 [cx+s*math.cos(b),cy+h,cz+s*math.sin(b)],
                 [cx+s*math.cos(a),cy+h,cz+s*math.sin(a)]]
            if r==0: pts=pts[1:]
            elif s==0: pts=pts[:3]
            face(pts,np.asarray(color)*(.92+.08*math.cos(a)),[(h-y)*math.cos((a+b)/2),r-s,(h-y)*math.sin((a+b)/2)])

def sheet(grid,color,thickness=.018):
    """Solid, triangulated cloth with front/back and closed boundary edges."""
    grid=np.array(grid); ny,nx,_=grid.shape
    normal=np.cross(grid[0,-1]-grid[0,0],grid[-1,0]-grid[0,0])
    offset=normal/np.linalg.norm(normal)*thickness
    for j in range(ny-1):
        for i in range(nx-1):
            a,b,c,d=grid[j,i],grid[j,i+1],grid[j+1,i+1],grid[j+1,i]
            for tri in ([a,b,c],[a,c,d]):
                face(tri,color)
                face((np.array(tri)-offset)[::-1],np.asarray(color)*.8)
    perimeter=list(grid[0])+list(grid[1:,-1])+list(grid[-1,-2::-1])+list(grid[-2:0:-1,0])
    for i,a in enumerate(perimeter):
        b=perimeter[(i+1)%len(perimeter)]
        face([a,a-offset,b-offset,b],np.asarray(color)*.75)

def crate(rng,center=(0,0,0),size=(.65,.6,.6),open_top=False):
    x,y,z=center; w,h,d=size
    box([x,y+.035,z],[w,.07,d],WOOD*.65)
    for j in range(4):
        for zz in (-d/2,d/2): plank([x,y+(j+.5)*h/4,z+zz],[w,h/4-.016,.055],rng)
        for xx in (-w/2,w/2): box([x+xx,y+(j+.5)*h/4,z],[.055,h/4-.016,d],WOOD*(.9+j*.07))
    for xx in (-w*.4,w*.4):
        for zz in (-d/2-.03,d/2+.03): box([x+xx,y+h/2,z+zz],[.065,h,.045],WOOD*1.3)
    if not open_top:
        for i in range(4): box([x+(i-1.5)*w/4,y+h,z],[w/4-.012,.05,d],WOOD*1.15)
        beam([x-w*.42,y+.06,z+d/2+.06],[x+w*.42,y+h-.06,z+d/2+.06],.075,.04,WOOD*1.3)

def barrel(rng,p=(0,0,0),radius=.32,height=.82):
    x,y,z=p
    # Separate bulging staves, closed by lid; recessed seams remain visible.
    for i in range(12):
        t0=i*math.tau/12+.012; t1=(i+1)*math.tau/12-.012
        col=WOOD*rng.uniform(.85,1.25)
        for j in range(3):
            ya,yb=y+j*height/3,y+(j+1)*height/3
            ra=radius*(.83+.17*math.sin(j*math.pi/3)); rb=radius*(.83+.17*math.sin((j+1)*math.pi/3))
            face([[x+ra*math.cos(t0),ya,z+ra*math.sin(t0)],[x+ra*math.cos(t1),ya,z+ra*math.sin(t1)],
                  [x+rb*math.cos(t1),yb,z+rb*math.sin(t1)],[x+rb*math.cos(t0),yb,z+rb*math.sin(t0)]],col,[math.cos((t0+t1)/2),0,math.sin((t0+t1)/2)])
    cylinder([x,y,z],[x,y+height,z],radius*.81,WOOD*.64,12)
    for yy in (.12,.5,.88):
        rr=radius*(.83+.17*math.sin(yy*math.pi))+.012
        lathe([(rr-.022,yy*height-.035),(rr,yy*height-.035),(rr,yy*height+.035),(rr-.022,yy*height+.035)],IRON,12,p)
    cylinder([x,y+height-.015,z],[x,y+height+.007,z],radius*.83,WOOD*1.25,12)
    for xx in (-.5,0,.5):
        length=2*radius*.79*math.sqrt(1-xx*xx)
        box([x+xx*radius*.8,y+height+.008,z],[.009,.005,length],WOOD*.55)
    cylinder([x+.11,y+height,z],[x+.11,y+height+.015,z],.038,WOOD*.5,7)

def sack(rng,p=(0,0,0),size=1,color=(.64,.48,.25)):
    x,y,z=p
    blob([x,y+.29*size,z],np.array([.48,.58,.42])*size,color,rng,8,4)
    blob([x,y+.58*size,z],[.17*size,.15*size,.17*size],np.array(color)*1.1,rng)
    cylinder([x,y+.535*size,z],[x,y+.57*size,z],.09*size,WOOD,8)

def flower(rng,p,color):
    x,y,z=p; h=rng.uniform(.18,.38)
    beam(p,[x,y+h,z],.025,.025,GREEN)
    for sign in (-1,1): blob([x+sign*.075,y+h*.43,z],[.20,.055,.09],GREEN*1.3,rng,5,2)
    for k in range(5):
        t=k*math.tau/5
        blob([x+.055*math.cos(t),y+h,z+.055*math.sin(t)],[.10,.06,.10],color,rng,5,2)
    blob([x,y+h+.02,z],[.055,.045,.055],[1,.64,.06],rng,5,2)

def mug(p,scale=1):
    x,y,z=p
    lathe([(0,0),(.09,0),(.10,.20),(.07,.20),(.065,.04),(0,.04)],CREAM,8,p)
    for a,b in (([x+.09,y+.16,z],[x+.17,y+.16,z]),([x+.17,y+.16,z],[x+.17,y+.045,z]),([x+.17,y+.045,z],[x+.09,y+.045,z])): beam(a,b,.03,.03,CREAM)
    cylinder([x,y+.17,z],[x,y+.18,z],.069,[.21,.09,.025],8)

@model
def market_stall(rng,awning=('red','white'),goods='fruit',wood=WOOD):
    for x in (-1.08,1.08):
        for z in (-.61,.61):
            box([x,1.2,z],[.12,2.4,.12],wood)
            box([x,.15,z],[.15,.15,.15],IRON)
        beam([x,1.85,-.61],[x,2.39,-.24],.08,.08,wood)
    for z in (-.61,.61): beam([-1.15,2.36,z],[1.15,2.36,z],.10,.10,wood)
    for i in range(10): plank([(i-4.5)*.215,.91,.12],[.20,.10,1.3],rng,wood)
    for i in range(9): plank([(i-4)*.24,.49,.70],[.225,.75,.065],rng,wood)
    box([0,.18,.74],[2.24,.09,.07],wood*.7)
    for i in range(10):
        x0=-1.2+i*.24; col=PALETTE[awning[i%2]] if isinstance(awning[i%2],str) else awning[i%2]
        grid=[]
        for j in range(9):
            z=-.80+j*.20
            grid.append([[x,2.58-.29*((z+.8)/1.6)-.12*math.sin(math.pi*(z+.8)/1.6)-.04*math.sin(math.pi*u),z] for x,u in ((x0,0),(x0+.12,.5),(x0+.24,1))])
        sheet(grid,col)
        sheet([[[x0,2.29,.80],[x0+.12,2.29,.80],[x0+.24,2.29,.80]],[[x0,2.10,.80],[x0+.12,2.04,.80],[x0+.24,2.10,.80]]],col)
    for k in range(3):
        x=(k-1)*.68
        crate(rng,(x,.96,.26),(.59,.18,.66),True)
        for i in range(6):
            xx=x+(i%2-.5)*.23; z=.08+(i//2)*.19
            if goods=='fruit':
                blob([xx,1.22,z],[.20,.19,.19],[(.70,.07,.025),(.30,.55,.035),(.94,.42,.025)][k],rng)
                beam([xx,1.29,z],[xx+.018,1.36,z],.018,.018,WOOD)
            elif goods=='bread':
                blob([xx,1.22,z],[.21,.15,.29],[.76,.40,.13],rng)
                for s in (-.055,.025): box([xx,1.291,z+s],[.12,.012,.024],CREAM)
            elif goods=='cloth':
                col=np.array(list(PALETTE.values())[(k*2+i%2)%6])
                cylinder([xx,1.23,z-.08],[xx,1.23,z+.09],.10,col,10)
                cylinder([xx,1.23,z+.091],[xx,1.23,z+.099],.055,col*.6,8)
            else:
                if i%2==0:
                    for q in range(4): blob([xx+q*.055-.06,1.15,z],[.09,.07,.1],[.61,.86,.88],rng,5,2)
                blob([xx,1.22,z],[.12,.08,.26],[.32,.53,.56],rng,6,3)
                sheet([[[xx-.09,1.22,z-.19],[xx+.09,1.22,z-.19]],[[xx-.025,1.22,z-.08],[xx+.025,1.22,z-.08]]],[.20,.37,.39])
                blob([xx+.04,1.25,z+.075],[.022,.022,.022],IRON,rng,5,2)
    # Small painted merchant emblem hangs off the front beam.
    for x in (-.15,.15): cylinder([x,2.25,.82],[x,1.98,.82],.013,IRON,6)
    plank([0,1.92,.83],[.48,.22,.055],rng)
    cylinder([0,1.92,.86],[0,1.92,.88],.072,CREAM,8)

@model
def fountain(rng,stone=STONE,water=WATER):
    cylinder([0,0,0],[0,.13,0],1.56,stone*.8,32)
    for course,(r0,r1,y,h) in enumerate(((1.18,1.60,.05,.18),(1.20,1.48,.23,.28),(1.17,1.54,.51,.14))):
        for i in range(20):
            a=(i+course*.5)*math.tau/20
            ring_segment(r0,r1,y,y+h,a+.008,a+math.tau/20-.008,stone*rng.uniform(.87,1.13),1)
    cylinder([0,.37,0],[0,.40,0],1.20,water,32)
    lathe([(0,.1),(.42,.1),(.42,.54),(.28,.66),(.20,1.53),(.35,1.62),(.35,1.76),(.22,1.88),(0,1.88)],stone,10)
    blob([0,2.10,0],[.48,.6,.48],stone*1.16,rng,8,4)
    for a in np.arange(4)*math.pi/2:
        dx,dz=math.cos(a),math.sin(a)
        blob([dx*.25,1.68,dz*.25],[.23,.26,.23],stone*.9,rng)
        cylinder([dx*.25,1.64,dz*.25],[dx*.46,1.60,dz*.46],.075,IRON,8)
        for j in range(8):
            t=j/8; u=(j+1)/8
            cylinder([dx*(.46+.48*t),1.60-1.2*t*t,dz*(.46+.48*t)],
                     [dx*(.46+.48*u),1.60-1.2*u*u,dz*(.46+.48*u)],.025,water*1.5,5)
        for rr in (.10,.17): lathe([(rr,.401),(rr+.015,.401),(rr+.015,.409),(rr,.409)],water*1.45,12,(dx*.94,0,dz*.94))

def lantern(rng,x,y,z):
    box([x,y+.28,z],[.30,.40,.30],[1,.57,.09])
    for xx in (-.17,.17):
        for zz in (-.17,.17): beam([x+xx,y+.06,z+zz],[x+xx,y+.50,z+zz],.035,.035,IRON)
    for yy in (.06,.49): box([x,y+yy,z],[.41,.055,.41],IRON)
    lathe([(0,.69),(.30,.51),(.30,.49),(0,.49)],IRON,4,(x,y,z))
    cylinder([x,y+.68,z],[x,y+.78,z],.025,IRON,7)
    blob([x,y,z],[.13,.12,.13],IRON,rng)

@model
def lamp(rng,wall=False,color=IRON):
    if wall:
        box([0,.38,.035],[.18,.76,.07],color)
        beam([0,.65,.06],[0,.65,.73],.065,.065,color)
        beam([0,.16,.06],[0,.64,.64],.045,.045,color)
        lantern(rng,0,-.13,.73)
        for y in (.1,.64): nail(0,y,.075,.03)
    else:
        lathe([(0,0),(.24,0),(.24,.12),(.13,.22),(.10,.5),(.065,.6),(.065,2.72),(0,2.72)],color,10)
        beam([0,2.72,0],[.49,2.72,0],.07,.07,color)
        beam([0,2.39,0],[.40,2.72,0],.045,.045,color)
        lantern(rng,.49,2.20,0)
        for y in (.52,1.9,2.55): cylinder([0,y,0],[0,y+.065,0],.10,color*1.4,10)

@model
def bench(rng,back=True,wood=WOOD):
    for x in (-.67,.67):
        for z in (-.22,.22): box([x,.25,z],[.12,.50,.12],wood*.8)
        beam([x,.18,-.27],[x,.18,.27],.10,.10,wood)
    for z in (-.20,0,.20): plank([0,.51,z],[1.8,.10,.18],rng,wood)
    beam([-.67,.22,0],[.67,.22,0],.10,.10,wood)
    if back:
        for x in (-.67,.67): beam([x,.37,-.26],[x,1.08,-.34],.09,.09,wood)
        for y in (.78,1.0): plank([0,y,-.31],[1.8,.16,.08],rng,wood)

@model
def table_set(rng,wood=WOOD):
    for z in (-.86,.86): emit(bench(seed=int(rng.integers(99999)),back=False,wood=wood),[0,0,z])
    for x in (-.60,.60):
        for z in (-.32,.32): beam([x,.02,z*1.2],[x,.82,z],.13,.13,wood)
    beam([-.66,.29,0],[.66,.29,0],.13,.13,wood)
    for z in np.arange(5)*.20-.4: plank([0,.87,z],[1.9,.12,.185],rng,wood)
    for x,z in ((-.54,-.22),(.54,.23),(.34,-.25)): mug([x,.94,z])
    lathe([(0,0),(.23,0),(.25,.045),(.20,.035),(0,.018)],CREAM,12,(0,.935,.14))
    blob([0,1.0,.14],[.25,.09,.15],[.72,.38,.10],rng)

@model
def trough(rng,stone=STONE,water=WATER):
    box([0,.12,0],[1.92,.24,.81],stone*.7)
    for z in (-.39,.39):
        for i in range(5): box([(i-2)*.39,.38,z],[.38,.44,.19],stone*rng.uniform(.9,1.1))
    for x in (-.91,.91): box([x,.38,0],[.18,.44,.64],stone)
    box([0,.39,0],[1.66,.04,.60],water)
    for x in (-.66,.66): box([x,.06,0],[.30,.12,1.0],stone*.85)

@model
def planter(rng,material='wood',flowers=('red','yellow'),length=1.4):
    if material=='wood': crate(rng,(-0.,0,0),(length,.43,.60),True)
    else:
        box([0,.08,0],[length,.16,.62],STONE*.8)
        for z in (-.29,.29):
            for i in range(5): box([(i-2)*length/5,.29,z],[length/5-.012,.42,.12],STONE*rng.uniform(.9,1.1))
        for x in (-length/2+.05,length/2-.05): box([x,.29,0],[.12,.42,.59],STONE)
    box([0,.36,0],[length-.14,.07,.44],[.12,.073,.025])
    for i in range(10): flower(rng,[(i%5-2)*(length-.25)/5,.40,(i//5-.5)*.22],PALETTE[flowers[i%len(flowers)]])

@model
def flowerpots(rng,color=(.62,.24,.105)):
    for k,(x,z,s) in enumerate(((-.42,0,.8),(.20,-.20,1),(.37,.33,.65))):
        lathe([(0,0),(.18*s,0),(.28*s,.35*s),(.29*s,.45*s),(.23*s,.45*s),(.21*s,.34*s),(0,.34*s)],np.array(color)*(1+k*.10),10,(x,0,z))
        cylinder([x,.34*s,z],[x,.36*s,z],.22*s,[.13,.075,.03],10)
        for i in range(4): flower(rng,[x+rng.uniform(-.1,.1),.36*s,z+rng.uniform(-.1,.1)],PALETTE[('red','purple','yellow')[k]])

@model
def shop_sign(rng,symbol='inn',board=WOOD):
    box([0,.68,.035],[.15,1.22,.07],IRON)
    beam([0,1.22,.06],[0,1.22,1.05],.065,.065,IRON)
    beam([0,.82,.06],[0,1.20,.50],.05,.05,IRON)
    for z in (.40,.88): cylinder([0,1.22,z],[0,.96,z],.017,IRON,6)
    # Sign lies in YZ plane, readable from both sides along the street.
    for i in range(4): box([0,.24+i*.18,.65],[.085,.165,.90],np.asarray(board)*rng.uniform(.9,1.13))
    for z in (.25,1.05): box([0,.51,z],[.12,.78,.065],CREAM*.68)
    for side in (-1,1):
        with Mesh() as emblem:
            if symbol=='inn':
                box([0,.49,0],[.30,.33,.055],CREAM)
                for xx in (-.10,0,.10): box([xx,.49,.036],[.012,.29,.012],WOOD)
                for a,b in (([.15,.62,0],[.25,.62,0]),([.25,.62,0],[.25,.38,0]),([.25,.38,0],[.15,.38,0])): beam(a,b,.045,.045,CREAM)
                for i in range(4): blob([-.12+i*.08,.68,.02],[.11,.09,.08],CREAM*1.2,rng,5,2)
            elif symbol=='smith':
                box([0,.34,0],[.37,.08,.065],IRON*2)
                box([0,.45,0],[.19,.20,.06],IRON*2)
                box([-.02,.55,0],[.40,.10,.07],IRON*2)
                beam([.16,.56,0],[.30,.60,0],.07,.055,IRON*2)
                beam([-.16,.62,0],[.10,.83,0],.045,.055,CREAM)
                box([.10,.81,0],[.18,.09,.065],IRON*2)
            else:
                blob([0,.47,0],[.36,.35,.10],[.85,.49,.07],rng,8,3)
                box([0,.68,0],[.20,.055,.08],CREAM)
                cylinder([0,.48,.04],[0,.48,.08],.075,CREAM,10)
        emit(emblem,[side*.065,0,.65],90*side)
    for y in (.12,1.19): nail(0,y,.076,.026)

def wheel(rng,x,y,z,r=.43):
    with Mesh() as w:
        lathe([(r-.075,-.055),(r,-.055),(r,.055),(r-.075,.055)],WOOD,12)
        lathe([(r-.015,-.061),(r+.016,-.061),(r+.016,.061),(r-.015,.061)],IRON,12)
        for i in range(8):
            a=i*math.tau/8
            beam([0,0,0],[r*.88*math.cos(a),0,r*.88*math.sin(a)],.045,.045,WOOD*1.2)
        cylinder([0,-.09,0],[0,.09,0],.10,WOOD,8)
    p,n,c=w.arrays(); rot=np.array([[0,1,0],[1,0,0],[0,0,-1]])
    mk.POSITIONS.extend(p@rot+[x,y,z]); mk.NORMALS.extend(n@rot); mk.COLORS.extend(c)

@model
def cart(rng,load='hay',wood=WOOD):
    zs=(0,) if load=='hay' else (-.64,.64)
    for z in zs:
        cylinder([-.92,.44,z],[.92,.44,z],.065,IRON,8)
        for x in (-.88,.88): wheel(rng,x,.445,z)
    for i in range(7): box([(i-3)*.21,.64,0],[.20,.12,1.8],wood)
    for y in (.82,1.02,1.22):
        for x in (-.72,.72): box([x,y,0],[.075,.16,1.85],wood*rng.uniform(.9,1.15))
        plank([0,y,-.90],[1.45,.16,.075],rng,wood)
    for x in (-.70,.70):
        for z in (-.86,.86): box([x,1.01,z],[.11,.83,.11],wood*.8)
        beam([x,.62,.60],[x,.35,2.10],.085,.085,wood)
    if load=='hay':
        for i in range(8): blob([(i%2-.5)*.55,1.08+(i//4)*.27,(i//2%2-.5)*.72],[.83,.68,.91],[.70,.49,.13],rng,7,3)
        for i in range(36):
            x=rng.uniform(-.6,.6); z=rng.uniform(-.75,.75)
            beam([x,1.57,z],[x+.12,1.60,z+.15],.018,.018,CREAM*.85)
    else:
        barrel(rng,(-.32,.70,-.41),.29,.78)
        crate(rng,(.34,.70,-.38),(.56,.64,.62))
        for x in (-.29,.30): sack(rng,(x,.71,.37),1.05)

@model
def barrels(rng,color=WOOD):
    start=len(mk.COLORS)
    for x,z,h in ((-.46,-.30,.85),(.24,-.34,1.0),(-.48,.38,.72)): barrel(rng,(x,0,z),.30,h)
    with Mesh() as m: barrel(rng,radius=.29,height=.8)
    p,n,c=m.arrays(); rot=np.array([[1,0,0],[0,0,1],[0,-1,0]])
    mk.POSITIONS.extend(p@rot+[.40,.31,.17]); mk.NORMALS.extend(n@rot); mk.COLORS.extend(c)
    mk.COLORS[start:]=list(np.clip(np.asarray(mk.COLORS[start:])*np.asarray(color)/WOOD,0,1))

@model
def crates(rng,cover=('blue','white')):
    for x,z,y in ((-.36,-.12,0),(.37,-.10,0),(-.32,-.10,.65)):
        crate(rng,(x,y,z),(.65,.62,.65))
    grid=[]
    for z,y in ((-.40,1.37),(-.20,1.37),(0,1.37),(.20,1.37),(.34,1.37),(.36,1.03),(.38,.70)):
        grid.append([[x,y+.025*math.cos(i*math.pi),z] for i,x in enumerate(np.linspace(-.62,-.03,7))])
    sheet(grid,PALETTE[cover[0]])
    for z in (-.20,.05):
        for i in range(6):
            xa=-.62+i*.59/6; xb=xa+.59/6
            beam([xa,1.375+.025*math.cos(i*math.pi),z],[xb,1.375+.025*math.cos((i+1)*math.pi),z],.018,.025,PALETTE[cover[1]])

@model
def sacks(rng,color=(.64,.48,.25),count=5):
    for i in range(count):
        x=(i%3-1)*.43; z=(i//3)*.4-.16
        sack(rng,(x,0,z),rng.uniform(.9,1.1),color)
    sack(rng,(0,.43,0),.9,color)

@model
def noticeboard(rng,wood=WOOD):
    for x in (-.78,.78): box([x,1.12,0],[.14,2.24,.14],wood)
    for i in range(7): plank([0,.92+i*.16,0],[1.70,.15,.10],rng,wood)
    for x in (-.82,.82): box([x,1.44,.07],[.11,1.3,.08],wood*.7)
    for x,y,w,h in ((-.45,1.49,.40,.51),(.06,1.55,.38,.45),(.49,1.33,.33,.48),(-.12,1.10,.33,.27)):
        box([x,y,.075],[w,h,.025],CREAM*rng.uniform(.9,1.1)); nail(x,y+h*.4,.092)
        for j in range(4): box([x,y+h*.22-j*.07,.09],[w*rng.uniform(.45,.8),.011,.008],WOOD*.6)
    for sign in (-1,1):
        for i in range(8): beam([-.98+i*.28,2.33,0],[-.98+i*.28,2.10,sign*.44],.265,.055,[.57,.23,.10])
    beam([-1.1,2.35,0],[1.1,2.35,0],.09,.10,wood)

@model
def statue(rng,bronze=(.15,.30,.23),stone=STONE):
    for y,w,h in ((.10,1.25,.20),(.27,1.06,.14),(.65,.86,.64),(1.03,1.12,.12)):
        box([0,y,0],[w,h,w],stone*(.87+y*.12))
    box([0,.65,.439],[.48,.27,.025],bronze)
    for x in (-.18,.18):
        box([x,1.19,.05],[.24,.20,.39],bronze)
        beam([x,1.25,0],[x,1.93,0],.22,.25,bronze)
        blob([x,1.58,.10],[.25,.24,.21],bronze,rng)
    blob([0,2.14,0],[.72,.66,.44],bronze,rng,8,3)
    box([0,1.94,0],[.65,.12,.43],np.array(bronze)*.7)
    cylinder([0,2.40,0],[0,2.53,0],.13,bronze,8)
    blob([0,2.77,0],[.46,.52,.43],bronze,rng,8,3)
    box([0,2.78,.22],[.34,.065,.035],IRON)
    box([0,2.72,.245],[.035,.21,.04],bronze)
    blob([0,3.14,-.02],[.13,.51,.34],bronze,rng,6,3)
    for x in (-.46,.46):
        blob([x,2.36,0],[.31,.29,.37],bronze,rng)
        beam([x,2.30,0],[x*1.2,1.96,.12],.18,.18,bronze)
    # Sword tip touches pedestal; shield is a thick faceted heraldic silhouette.
    beam([-.55,1.10,.22],[-.55,2.14,.22],.075,.045,bronze)
    box([-.55,2.01,.22],[.34,.07,.08],bronze)
    blob([-.55,2.20,.22],[.12,.12,.12],bronze,rng)
    pts=[[-.29,.40,0],[.29,.40,0],[.31,0,0],[0,-.40,0],[-.31,0,0]]
    pts=np.array(pts)+[.52,1.89,.24]
    face(pts,bronze,[0,0,1]); face(pts-[0,0,.09],bronze,[0,0,-1])
    for i in range(5): face([pts[i],pts[(i+1)%5],pts[(i+1)%5]-[0,0,.09],pts[i]-[0,0,.09]],np.array(bronze)*.7)
    box([.52,1.91,.249],[.065,.57,.022],STONE*.8)
    box([.52,2.02,.251],[.46,.065,.022],STONE*.8)

@model
def bunting(rng,length=6,colors=('red','yellow','blue','white')):
    # Explicit endpoint origin convention overrides the floor normalization below.
    def p(x): return [x,3-.48*(1-(2*x/length)**2),0]
    for i in range(24): cylinder(p(-length/2+i*length/24),p(-length/2+(i+1)*length/24),.018,WOOD,5)
    for i in range(12):
        x=-length/2+.25+i*(length-.5)/12; a=np.array(p(x)); b=np.array(p(x+.32)); tip=(a+b)/2+[0,-.48,.045]
        pts=[a,b,tip]; col=PALETTE[colors[i%len(colors)]]
        face(pts,col,[0,0,1]); face(np.array(pts)-[0,0,.02],col,[0,0,-1])
        for j in range(3): face([pts[j],pts[(j+1)%3],np.array(pts[(j+1)%3])-[0,0,.02],np.array(pts[j])-[0,0,.02]],col)

@model
def bridge(rng,material='stone',stone=STONE,wood=WOOD):
    if material=='wood':
        for z in (-.86,.86): box([0,.25,z],[6,.30,.18],wood*.7)
        for i in range(26): plank([-2.88+i*.23,.43,0],[.215,.13,2.40],rng,wood)
        for x in (-2.85,-1.42,0,1.42,2.85):
            for z in (-1.13,1.13):
                box([x,.77,z],[.14,1.54,.14],wood)
                box([x,1.51,z],[.19,.09,.19],wood*1.3)
        for z in (-1.13,1.13):
            for y in (.90,1.35): beam([-3,y,z],[3,y,z],.10,.10,wood)
    else:
        # Extruded voussoir arch: underside parabola leaves a true open passage.
        def low(x): return .98*max(0,1-(x/2.65)**2)
        def top(x): return .38+.88*max(0,1-(x/3)**2)
        for i in range(24):
            a=-3+i*.25+.004; b=a+.242
            for j in range(6):
                z=-1.5+j*.5+.005; zz=z+.49
                verts=np.array([[a,low(a),z],[b,low(b),z],[b,top(b),z],[a,top(a),z],
                                [a,low(a),zz],[b,low(b),zz],[b,top(b),zz],[a,top(a),zz]])
                center=verts.mean(0); col=stone*rng.uniform(.86,1.12)
                for ids in ((0,1,2,3),(4,7,6,5),(0,4,5,1),(3,2,6,7),(0,3,7,4),(1,5,6,2)):
                    pp=verts[list(ids)]; face(pp,col,pp.mean(0)-center)
            for z in (-1.39,1.39):
                h=top((a+b)/2)
                box([(a+b)/2,h+.19,z],[.242,.38,.23],col)
                box([(a+b)/2,h+.39,z],[.249,.06,.29],col*1.1)

@model
def fence(rng,wood=WOOD,length=3):
    for x in (-length/2+.09,length/2-.09):
        box([x,.64,0],[.18,1.28,.18],wood)
        blob([x,1.30,0],[.23,.15,.23],wood*1.2,rng,4,2)
    for y in (.35,.89): plank([0,y,-.065],[length,.13,.12],rng,wood)
    for x in np.linspace(-length/2+.29,length/2-.29,11):
        box([x,.64,.045],[.13,1.10,.08],wood*rng.uniform(.9,1.2))
        pts=[[x-.065,1.19,.085],[x+.065,1.19,.085],[x,1.34,.085]]
        face(pts,wood,[0,0,1]); face(np.array(pts)-[0,0,.08],wood,[0,0,-1])
        for j in range(3): face([pts[j],pts[(j+1)%3],np.array(pts[(j+1)%3])-[0,0,.08],np.array(pts[j])-[0,0,.08]],wood)

@model
def wall_low(rng,stone=STONE,length=3):
    # Dark inset core closes large organic gaps without hiding individual stones.
    box([0,.40,0],[length-.08,.80,.37],np.asarray(stone)*.70)
    for j in range(3):
        count=7 if j%2 else 6; w=length/count
        for i in range(count):
            x=-length/2+(i+.5)*w
            box([x,.14+j*.28,0],[w-.014,.275,.48+rng.uniform(-.025,.025)],stone*rng.uniform(.87,1.10))
            blob([x,.15+j*.28,0],[w-.008,.30,.53],stone*rng.uniform(.9,1.13),rng,7,3)
    for i in range(8): blob([-length/2+(i+.5)*length/8,.88,0],[length/8-.01,.12,.56],stone*1.1,rng,6,2)

@model
def steps(rng,stone=STONE,width=2):
    for j in range(4):
        for i in range(4): box([(i-1.5)*width/4,(j+1)*.105,(1.5-j)*.39],[width/4-.009,(j+1)*.21,.385],stone*rng.uniform(.9,1.12))
        box([0,(j+1)*.21+.02,(1.5-j)*.39+.15],[width+.04,.04,.09],stone*1.1)

@model
def laundry(rng,colors=('white','blue','red')):
    for x in (-2,2):
        box([x,1.18,0],[.13,2.36,.13],WOOD)
        box([x,2.32,0],[.26,.08,.14],WOOD)
    def y(x): return 2.28-.25*(1-(x/2)**2)
    for i in range(20): cylinder([-2+i*.2,y(-2+i*.2),0],[-1.8+i*.2,y(-1.8+i*.2),0],.018,WOOD,5)
    for k in range(5):
        x=-1.45+k*.72; col=PALETTE[colors[k%len(colors)]]
        h=.70 if k%2 else 1.0
        grid=[[[xx,y(xx)-j*h/5,.045*math.sin(i*2+k)] for i,xx in enumerate(np.linspace(x-.27,x+.27,7))] for j in range(6)]
        sheet(grid,col)
        if k%2:
            for side in (-1,1): box([x+side*.32,y(x)-.16,0],[.16,.22,.045],col)
        for dx in (-.22,.22): box([x+dx,y(x+dx)+.015,.025],[.045,.11,.055],CREAM*.7)

@model
def woodpile(rng,wood=WOOD):
    for row in range(3):
        for i in range(4-row):
            x=(i-(3-row)/2)*.31; y=.16+row*.27
            cylinder([x,y,-.48],[x,y,.42],.16,wood*.65,8)
            for z in (-.485,.425):
                cylinder([x,y,z-.006],[x,y,z+.006],.135,CREAM*.65,8)
                cylinder([x,y,z-.009],[x,y,z+.009],.065,WOOD*1.2,8)
    cylinder([.96,0,.15],[.96,.46,.15],.33,wood*.65,10)
    cylinder([.96,.46,.15],[.96,.475,.15],.29,CREAM*.7,10)
    beam([.96,.49,.15],[1.24,1.23,.15],.055,.065,WOOD*1.4)
    box([.89,.57,.15],[.30,.19,.06],IRON*1.9)
    for i in range(5): blob([.7+rng.uniform(-.2,.5),.025,.6+rng.uniform(-.15,.15)],[.12,.05,.06],CREAM*.8,rng,5,2)

@model
def haybale(rng,color=(.76,.53,.16)):
    for x,z,s in ((-.34,-.12,1),(.44,.20,.8)):
        box([x,.33*s,z],[.85*s,.66*s,.68*s],color)
        for xx in (-.25,.25):
            for zz in (-.348,.348): box([x+xx*s,.33*s,z+zz*s],[.035,.67*s,.018],WOOD)
            box([x+xx*s,.666*s,z],[.035,.018,.70*s],WOOD)
        for i in range(30):
            xx=x+rng.uniform(-.4,.4)*s; yy=rng.uniform(.05,.60)*s
            box([xx,yy,z+.345*s],[rng.uniform(.07,.17)*s,.013,.009],np.array(color)*rng.uniform(.75,1.25))
    beam([.85,.08,-.27],[.56,1.72,-.27],.045,.045,WOOD)
    beam([.67,.45,-.27],[1.02,.45,-.27],.045,.045,IRON)
    for x in (.69,.80,.91,1.02): beam([x,.45,-.27],[x+.05,.03,-.22],.025,.025,IRON)

BUILDERS = {
    **{f'town_stall_{g}':(market_stall,dict(goods=g,awning=a)) for g,a in
       [('fruit',('red','white')),('bread',('yellow','white')),('cloth',('purple','white')),('fish',('blue','white'))]},
    'town_fountain':(fountain,{}),'town_lamp_post':(lamp,{}),'town_lamp_wall':(lamp,dict(wall=True)),
    'town_bench':(bench,{}),'town_table_set':(table_set,{}),'town_trough':(trough,{}),
    'town_planter_a':(planter,{}),'town_planter_b':(planter,dict(material='stone',flowers=('purple','white'))),
    'town_flowerpots':(flowerpots,{}),
    **{f'town_sign_{s}':(shop_sign,dict(symbol=s)) for s in ('inn','smith','shop')},
    'town_cart_hay':(cart,{}),'town_cart_goods':(cart,dict(load='goods')),
    'town_barrels':(barrels,{}),'town_crates':(crates,{}),'town_sacks':(sacks,{}),
    'town_noticeboard':(noticeboard,{}),'town_statue':(statue,{}),'town_bunting':(bunting,{}),
    'town_bridge_stone':(bridge,{}),'town_bridge_wood':(bridge,dict(material='wood')),
    'town_fence_wood':(fence,{}),'town_wall_low':(wall_low,{}),'town_steps':(steps,{}),
    'town_laundry':(laundry,{}),'town_woodpile':(woodpile,{}),'town_haybale':(haybale,{})}

def main():
    OUT.mkdir(parents=True,exist_ok=True); TEAM.mkdir(parents=True,exist_ok=True)
    protected={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.glob('*.glb') if not p.name.startswith('town_')}
    assets={}; rows=[]
    for i,(name,(fn,options)) in enumerate(BUILDERS.items()):
        m=fn(seed=120+i,**options)
        with m: export_glb(OUT/(name+'.glb'),name)
        print(name,flush=True)
        arrays=validate(OUT/(name+'.glb')); assets[name]=arrays
        p,n,c=arrays; count=len(p)//3
        assert count<=5000,(name,count)
        if name!='town_bunting': assert abs(p[:,1].min())<1e-6
        render(TEAM/('preview_'+name+'.png'),*arrays,size=(600,600),eye=(4,3.2,6),background=(232,224,206))
        rows.append(dict(file=name+'.glb',triangles=count,bytes=(OUT/(name+'.glb')).stat().st_size,
                         minimum=p.min(0).tolist(),maximum=p.max(0).tolist(),generator=fn.__name__,seed=120+i,options=options))
    total=sum(r['bytes'] for r in rows); assert total<7_000_000,total
    (TEAM/'town_manifest.json').write_text(json.dumps(rows,indent=2))
    contact=Image.new('RGB',(1600,8*240),(245,238,222)); d=ImageDraw.Draw(contact)
    for i,name in enumerate(assets):
        tile=Image.open(TEAM/('preview_'+name+'.png')); tile.thumbnail((380,215))
        x=(i%4)*400; y=(i//4)*240
        contact.paste(tile,(x+(400-tile.width)//2,y)); d.text((x+18,y+218),name.replace('town_','').replace('_',' ').upper(),fill=(55,48,37))
    contact.save(TEAM/'preview_contact.png')
    placements=[]
    with Mesh() as scene:
        rng=np.random.default_rng(710)
        box([0,-.14,0],[17,.22,15],[.26,.32,.13])
        cylinder([0,-.08,0],[0,-.015,0],7.25,[.35,.31,.23],64)
        # Individual cobbles in concentric rings, confined to the round plaza.
        for r in np.arange(.40,7.1,.38):
            count=int(math.tau*r/.42)
            for j in range(count):
                a=(j+.5*(int(r*10)%2))*math.tau/count
                box([r*math.cos(a),-.014,r*math.sin(a)],[.34,.045,.30],STONE*rng.uniform(.72,.98),
                    [[math.cos(a),0,math.sin(a)],[0,1,0],[-math.sin(a),0,math.cos(a)]])
        def place(name,pos,angle=0,scale=1):
            name='town_'+name
            emit(assets[name],pos,angle,scale)
            placements.append(dict(model=name+'.glb',position=pos,rotationYDegrees=angle,scale=[scale]*3))
        place('fountain',[0,.01,0])
        for g,pos,a in [('fruit',[-3.8,.01,-3.3],20),('bread',[-.8,.01,-4.5],0),('cloth',[2.4,.01,-4.0],-20),('fish',[-5,.01,.1],75)]: place('stall_'+g,pos,a)
        for x,z,a in ((-2.6,1.7,-25),(2.8,.5,90),(.1,3.0,180)): place('bench',[x,.01,z],a)
        for x,z in ((-3.7,2.7),(3.5,2.8),(2.1,-2.2),(-2.2,-1.9)): place('planter_a' if x<0 else 'planter_b',[x,.01,z],20)
        for x,z in ((-5.6,-2.4),(4.6,-2.4),(-4.7,3.8),(4.5,3.5)): place('lamp_post',[x,.01,z])
        place('cart_hay',[5.1,.01,.4],-25); place('cart_goods',[-2.8,.01,4.9],80)
        place('table_set',[2.0,.01,4.9],-12)
        place('barrels',[-5.4,.01,2.2]); place('crates',[-3.2,.01,-1.3],20)
        place('sacks',[.8,.01,-3.0]); place('flowerpots',[3.9,.01,4.7])
        place('noticeboard',[.4,.01,-6.1]); place('statue',[5.3,.01,-3.7],-20)
        for x in (-4.7,-1.7): place('wall_low',[x,.01,-6.4])
        for z in (2.7,5.7): place('fence_wood',[-7.1,.01,z],90)
        # Preview-only posts support bunting; ends have matching height and span.
        for x in (-3,3):
            box([x,1.52,-2.45],[.12,3.04,.12],WOOD)
            box([x,.12,-2.45],[.30,.24,.30],STONE)
        place('bunting',[0,.03,-2.45])
    render(TEAM/'preview_square.png',*scene.arrays(),size=(1600,900),eye=(5,9,8),margin=.045,background=(225,218,197))
    (TEAM/'town_square.json').write_text(json.dumps(dict(placements=placements,cameraDirection=[5,9,8],
        previewOnly='17x15 grass ground; radius 7.25 cobbled plaza; bunting support posts at (+/-3,0,-2.45), height 3.04.'),indent=2))
    assert all(hashlib.sha256(p.read_bytes()).hexdigest()==h for p,h in protected.items())
    report=['# Town dressing kit','',f'32 GLBs, {sum(r["triangles"] for r in rows):,} triangles, {total:,} bytes ({total/1e6:.3f} MB).',
        '', 'Generated with `python tools/models/make_town_kit.py`. Only Python, numpy and Pillow. Existing well/mine GLB hashes verified unchanged.',
        '', 'All models use metres, Y up, +Z front, flat normals, COLOR_0, one opaque single-sided material (metallic 0, roughness 0.9).',
        '', '| File | Triangles | Bytes | Bounds min XYZ | Bounds max XYZ |','|---|---:|---:|---|---|']
    for r in rows:
        fmt=lambda v: '('+', '.join(f'{x:.3f}' for x in v)+')'
        report.append(f'| {r["file"]} | {r["triangles"]} | {r["bytes"]} | {fmt(r["minimum"])} | {fmt(r["maximum"])} |')
    report+=['','## Generators and origins','',
        'Every public generator accepts `seed=1`, `size=1` (positive uniform scale), and the options below. Each returns a fresh Mesh; use `with mesh: export_glb(path, name)` to export. Seeds control wood/stone tones and organic shapes. See `town_manifest.json` for exact seeds and variant options.',
        '', 'Ground assets are centered by their complete XZ bounding box, with lowest vertex at y=0. Wall lamps and signs have x centered, wall mounting plane z=0, lower mounting/geometry edge y=0; mount at the desired world height. Signs project along +Z with readable relief on both X-facing sides. Bridges and fence/wall pieces run along X. Steps rise toward -Z and are approached from +Z. Bunting uses the line midpoint on the ground as origin, rope endpoint centers x=+/-3, y=3; tube thickness extends slightly beyond the centers; no posts included.',
        '', '| Function | Additional options (defaults) |','|---|---|']
    for fn in dict.fromkeys(v[0] for v in BUILDERS.values()): report.append(f'| `{fn.__name__}(seed=1, size=1, ...)` | `{str(inspect.signature(fn)).replace("rng, ","").replace("rng","")}` |')
    report+=['','## Square composition','', 'Transforms are uniform scale, Y rotation in degrees, then translation. Orthographic camera direction (5,9,8), approximately 44 degrees down. Preview-only plaza, cobbles, grass, and support posts are built in main(); they are not exported assets. Machine-readable transforms: `.team/town_square.json`.',
             '', '| Asset | Position | Y rotation | Scale |','|---|---|---:|---|']
    for p in placements: report.append(f'| {p["model"]} | {p["position"]} | {p["rotationYDegrees"]} | {p["scale"]} |')
    report+=['','## Deliverables and checks','',
        '`tools/models/make_town_kit.py`; 32 `src/assets/world3d/custom/town_*.glb`; 32 `.team/preview_town_*.png` (600x600); `.team/preview_contact.png`; `.team/preview_square.png` (1600x900); `.team/town_manifest.json`; `.team/town_square.json`; this report.',
        '', 'Each GLB is read back and validated for header/chunk sizes, accessors, finite data, exact declared bounds, indices, unit flat normals, winding versus normals, material and triangle budget. Total size and ground contact are asserted. Existing non-town GLBs are hashed before/after.',
        '', 'Visual review: inspected all 32 models on the contact sheet, the stone bridge at full preview resolution, and the composed square. Corrected crate-cover clipping, filled oversized dry-stone gaps, and turned steps toward the declared front. Final contact sheet and square reviewed again. Validation transcript: `.team/town_validation.log`.',
        '', 'Limitations: assembled overlapping solids, not boolean-unioned or collision meshes; no LOD, animation or textures. Warm lantern panes and water are opaque painted colors, without transparency or emitted light. Cloth has solid thin backs. Software previews have directional/ambient light and depth testing but no cast shadows. Tiny goods and relief symbols are intentionally exaggerated for map readability.']
    (TEAM/'report.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
    print(f'TOWN TOTAL: {total:,} bytes; {len(rows)} models',flush=True)

if __name__=='__main__': main()
