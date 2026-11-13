"""Grand hall extension. Geometry only; the palace entrypoint owns exports.

No legacy geometry is changed. All decoration is solid geometry or raised
vertex-coloured relief, and all random variations use the supplied seed.
"""
from make_palace_kit import *

MARBLE=np.array([.93,.90,.84]); VEIN=np.array([.80,.78,.74])
DAMASK=np.array([.42,.05,.09]); PATTERN=np.array([.55,.09,.13])
GRAND_NAMES=('wall_royal','wall_royal_pilaster','column_grand','dais_grand',
 'throne_grand','statue_knight','statue_lion','brazier','banner_grand',
 'window_grand','cloth_of_state_grand','torchere')


def crown(x,y,z,w,h,depth=.06):
    box([x,y+h*.12,z],[w,h*.24,depth],GOLD)
    for i in range(5):
        xx=x+(i-2)*w*.19; hh=h*(1 if i==2 else .78 if i%2 else .88)
        relief([(-w*.095,0),(w*.095,0),(w*.06,hh*.48),(0,hh),(-w*.06,hh*.48)],
               [xx,y+h*.22,z+depth/2],1,LIGHT)
        oval([xx,y+h*.22+hh,z],[w*.055,w*.055,depth],LIGHT,6,3)


def leaf(a,b,w,col=GOLD):
    a=np.array(a); b=np.array(b); mid=a+(b-a)*.54
    side=mk.unit(np.cross(b-a,[0,0,1]))*w/2
    ridge=mid+[0,0,.035]
    for pts,cc in (([a,mid-side,ridge],col*.78),([a,ridge,mid+side],col),
                   ([mid-side,b,ridge],col),([ridge,b,mid+side],LIGHT)):
        face(pts,cc,[0,0,1])


def lion_head(p,s):
    x,y,z=p
    oval([x,y,z],[s,s*1.13,s*.45],DARK,10,5)
    for i in range(12):
        a=i*math.tau/12
        leaf([x+math.cos(a)*s*.23,y+math.sin(a)*s*.25,z+s*.16],
             [x+math.cos(a)*s*.50,y+math.sin(a)*s*.57,z+s*.13],s*.20)
    oval([x,y+s*.035,z+s*.20],[s*.56,s*.62,s*.39],GOLD,10,5)
    for sign in (-1,1):
        oval([x+sign*s*.15,y-s*.13,z+s*.38],[s*.30,s*.23,s*.22],LIGHT,8,4)
        box([x+sign*s*.135,y+s*.13,z+s*.39],[s*.09,s*.045,s*.025],INK)
    oval([x,y-s*.075,z+s*.48],[s*.15,s*.11,s*.10],DARK,6,3)
    box([x,y-s*.27,z+s*.36],[s*.25,s*.026,s*.03],DARK)


def shield(x,y,z,s):
    pts=[(-.42,.48),(.42,.48),(.38,-.10),(0,-.50),(-.38,-.10)]
    relief(pts,[x,y,z],s,GOLD)
    relief(pts,[x,y+.01,z+.008],s*.83,BLUE)
    lion([x,y+.02,z+.012],s*.52)


def capital(y,width=.88,z=0):
    # Two tiers of acanthus and paired scrolls on all four faces.
    lathe([(0,0),(.23,0),(.25,.09),(.29,.19),(.36,.34),(0,.34)],GOLD,12,(0,y,z))
    for angle in (0,90,180,270):
        with Mesh() as detail:
            for x in (-.20,0,.20):
                leaf([x*.55,y+.035,.25],[x,y+.27,.34],.14)
            for x in (-.28,.28):
                ring([x,y+.29,.32],.085,.075,.025,LIGHT,steps=10)
        emit(detail,[0,0,z],angle)
    box([0,y+.395,z],[width,.11,width],MARBLE)
    box([0,y+.46,z],[width,.02,width],LIGHT)


def wall_royal():
    box([0,2.10,-.055],[3,4.2,.49],MARBLE)
    for y,h,d,col in ((.10,.20,.60,MARBLE),(.26,.10,.55,VEIN),(.89,.12,.57,MARBLE),
                       (1.00,.06,.60,GOLD),(3.78,.09,.53,GOLD),(3.88,.11,.55,MARBLE),
                       (4.01,.15,.58,MARBLE),(4.17,.06,.60,MARBLE)):
        # Gilding belongs to the front only; the rear stays uninterrupted marble.
        box([0,y,.245 if col is GOLD else 0],[3,h,.11 if col is GOLD else d],col)
    for x in (-.98,0,.98):
        box([x,.58,.205],[.85,.49,.04],VEIN)
        for xx in (x-.40,x+.40): box([xx,.58,.25],[.027,.47,.03],GOLD)
        for yy in (.36,.80): box([x,yy,.25],[.81,.025,.03],GOLD)
        box([x,.58,.235],[.72,.35,.02],MARBLE)
        relief([(-.26,-.13),(-.25,-.14),(.19,.12),(.18,.13)],[x,.58,.247],1,VEIN)
    box([0,2.39,.206],[2.74,2.64,.035],DAMASK)
    for x in (-1.40,1.40):
        box([x,2.39,.255],[.07,2.68,.075],GOLD)
        box([x*.95,2.39,.25],[.018,2.53,.025],LIGHT)
    for y in (1.07,3.71): box([0,y,.255],[2.86,.065,.075],GOLD)
    for j in range(8):
        for i in range(9):
            x=-1.17+i*.29+(j%2)*.075; y=1.26+j*.31
            relief([(0,-.10),(-.065,0),(0,.10),(.065,0)],[x,y,.226],1,PATTERN)
            relief([(0,-.07),(-.035,0),(0,.07),(.035,0)],[x,y,.227],1,DAMASK)
    for x in np.linspace(-1.40,1.40,21):
        box([x,3.91,.281],[.065,.12,.035],GOLD)
    for x in np.linspace(-1.30,1.30,14): leaf([x,4.09,.25],[x,4.145,.26],.07)


def wall_royal_pilaster():
    box([0,2.15,-.12],[.46,4.30,.48],MARBLE)
    for y,h,w,d in ((.10,.20,.64,.80),(.24,.08,.59,.73),(.34,.12,.52,.66),
                      (3.80,.10,.56,.70),(4.08,.20,.60,.76),(4.25,.10,.64,.80)):
        box([0,y,.04],[w,h,d],MARBLE)
    for y in (.21,.39,3.76,4.19): box([0,y,.04],[.60,.035,.76],GOLD)
    for x in (-.18,-.09,0,.09,.18):
        cylinder([x,.43,.16],[x,3.74,.16],.043,MARBLE,8)
        box([x,2.08,.206],[.018,3.25,.008],VEIN)
    for x in (-.20,-.10,0,.10,.20): leaf([x*.7,3.79,.25],[x,4.10,.35],.11)
    for x in (-.20,.20): ring([x,4.06,.35],.075,.065,.022,LIGHT,steps=10)
    shield(0,2.10,.23,.48)
    lion_head([0,2.13,.25],.21)


def column_grand():
    for y,h,w,col in ((.10,.20,.92,MARBLE),(.225,.05,.90,GOLD),(.31,.12,.76,MARBLE)):
        box([0,y,0],[w,h,w],col)
    lathe([(0,.37),(.34,.37),(.34,.43),(.29,.49),(.27,.55),(0,.55)],MARBLE,24)
    lathe([(0,3.58),(.25,3.58),(.31,3.68),(.31,3.73),(0,3.73)],MARBLE,24)
    # Sixteen concave channels, cut into the entasis rather than painted stripes.
    levels=((.53,.27),(1.50,.29),(2.65,.275),(3.60,.25))
    def flute(a,y,r):
        radius=r-.023*(.5+.5*math.cos(a*16))
        return [radius*math.cos(a),y,radius*math.sin(a)]
    for i in range(64):
        a=i*math.tau/64; b=(i+1)*math.tau/64
        for (y,r),(yy,rr) in zip(levels,levels[1:]):
            face([flute(a,y,r),flute(b,y,r),flute(b,yy,rr),flute(a,yy,rr)],
                 VEIN if i%4 in (0,3) else MARBLE,[math.cos((a+b)/2),0,math.sin((a+b)/2)])
    lathe([(.29,1.34),(.31,1.34),(.31,1.55),(.29,1.55)],DAMASK,24)
    for y in (1.34,1.53): cylinder([0,y,0],[0,y+.025,0],.32,GOLD,24)
    for i in range(8):
        with Mesh() as motif: fleur([0,1.445,.315],.14)
        emit(motif,angle=i*45)
    capital(3.73,.92)


def dais_grand():
    def tile(x0,x1,z0,z1,y,col):
        face([[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]],col,[0,1,0])
    def runner_tread(w,z0,z1,y):
        cuts=(-w/2,-.65,-.60,.60,.65,w/2)
        for i,col in enumerate((MARBLE,GOLD,DAMASK,GOLD,MARBLE)):
            tile(cuts[i],cuts[i+1],z0,z1,y,col)
    # Constant rear edge; each successive tread recedes at the front and sides.
    for level,(w,d) in enumerate(((8.90,4.90),(8.16,4.16),(7.42,3.42))):
        top=(level+1)*.30; z=-2.45+d/2
        # Replace the slab top with tessellated inlays, avoiding coplanar overlays.
        with Mesh() as slab: box([0,top-.15,z],[w,.30,d],MARBLE)
        p,n,c=slab.arrays(); keep=n[:,1]<.99; emit((p[keep],n[keep],c[keep]))
        box([0,top-.025,z+d/2+.002],[w,.035,.008],GOLD)
        for x in (-w/2-.002,w/2+.002): box([x,top-.025,z],[.008,.035,d],GOLD)
        front=z+d/2
        if level<2:
            runner_tread(w,front-.74,front,top)
            tile(-w/2,-w/2+.37,-2.45,front-.74,top,MARBLE)
            tile(w/2-.37,w/2,-2.45,front-.74,top,MARBLE)
        else:
            tile(-w/2,-.9,-2.45,front,top,MARBLE)
            tile(.9,w/2,-2.45,front,top,MARBLE)
            tile(-.9,.9,-2.45,-1.75,top,MARBLE)
            runner_tread(1.8,.05,front,top)
        box([0,top-.15,front+.001],[1.30,.30,.002],DAMASK)
        for x in (-.62,.62):
            box([x,top-.15,front+.003],[.045,.30,.002],GOLD)
    # A 32-point sunburst tessellated into a square marble panel, all at exactly .90.
    def radial(a,r): return [r*math.cos(a),.9,-.85+r*math.sin(a)]
    for i in range(64):
        a=i*math.tau/64; b=(i+1)*math.tau/64
        ra=.80 if i%2 else .39; rb=.39 if i%2 else .80
        oa=.90/max(abs(math.cos(a)),abs(math.sin(a)))
        ob=.90/max(abs(math.cos(b)),abs(math.sin(b)))
        face([[0,.9,-.85],radial(a,ra),radial(b,rb)],LIGHT,[0,1,0])
        face([radial(a,ra),radial(a,.85),radial(b,.85),radial(b,rb)],BLUE,[0,1,0])
        face([radial(a,.85),radial(a,.88),radial(b,.88),radial(b,.85)],GOLD,[0,1,0])
        face([radial(a,.88),radial(a,oa),radial(b,ob),radial(b,.88)],MARBLE,[0,1,0])
    for x in (-3.48,3.48):
        for z in (-2.20,.70):
            box([x,1.08,z],[.31,.36,.31],MARBLE)
            box([x,1.27,z],[.37,.06,.37],GOLD)
            oval([x,1.43,z],[.25,.26,.25],LIGHT,10,5)


def throne_grand(rng):
    steel=np.array([.15,.17,.20])
    for y,h,w,d in ((.12,.24,2.82,2.82),(.32,.16,2.64,2.50),(.48,.16,2.40,2.24)):
        box([0,y,0],[w,h,d],steel)
        box([0,y+h/2-.02,d/2],[w,.035,.025],GOLD)
    box([0,.90,.02],[1.95,.72,1.96],steel*.85)
    for i in range(15):
        x=(i-7)*.13
        forged_sword([x,.42,1.01],[x+rng.uniform(-.05,.05),1.24,.98],.16,i%4==0,False)
    # 72 swords in four deep fan layers. The tips taper into a cathedral silhouette.
    for layer,count in enumerate((21,19,17,15)):
        for i in range(count):
            t=(i-(count-1)/2)/((count-1)/2)
            tip=[t*(1.36-layer*.025),5.10-layer*.39-1.30*abs(t)**.75+rng.uniform(-.04,.04),-1.26+layer*.22]
            base=[t*.79,1.25+layer*.15,-.82+layer*.20]
            forged_sword(base,tip,.12+layer*.018,(i+layer)%4==0,hilt=False)
    # Bright, separate blade halo: head is framed by radial points, not a solid disk.
    ring([0,2.89,-.25],.66,.66,.035,GOLD)
    for a in np.linspace(-.20,math.pi+.20,15):
        forged_sword([.56*math.cos(a),2.89+.56*math.sin(a),-.23],
                     [1.04*math.cos(a),2.89+1.04*math.sin(a),-.30],.105,True,False)
    cushion([0,1.38,.17],[1.70,.27,1.60],DAMASK)
    for x in (-.80,.80): box([x,1.49,.17],[.035,.026,1.45],GOLD)
    sheet([[[x,1.51+t*1.80,-.12+.025*math.cos(x*24)] for x in np.linspace(-.46,.46,17)]
           for t in np.linspace(0,1,6)],DAMASK,.018)
    for x in (-.43,.43): box([x,2.39,-.075],[.033,1.77,.02],GOLD)
    state_lion([0,2.58,-.065],.74)
    crown(0,3.02,-.055,.35,.17,.025)
    for sign in (-1,1):
        box([sign*1.02,1.24,.12],[.29,.87,1.88],steel)
        for j in range(4):
            x=sign*(.88+j*.085)
            forged_sword([x,1.83,.72],[x,1.95,-.80],.085,j%3==0)
        lion_head([sign*1.02,1.79,.96],.44)
        turned(sign*1.22,-.96,.53,3.18,.075,GOLD)
        oval([sign*1.22,3.80,-.96],[.20,.25,.20],GOLD,10,5)
        fleur([sign*1.22,4.03,-.85],.37)
    crown(0,5.03,-1.20,.52,.24,.09)
    forged_sword([0,4.62,-1.20],[0,5.10,-1.20],.14,True,False)


def statue_knight():
    for y,h,w,d,col in ((.12,.24,1.90,1.90,MARBLE),(.31,.14,1.70,1.70,VEIN),(.43,.10,1.55,1.55,GOLD)):
        box([0,y,0],[w,h,d],col)
    box([0,.28,.951],[.73,.17,.008],GOLD)
    for x in np.linspace(-.27,.27,9): box([x,.28,.957],[.035,.07,.004],DARK)
    # Broad sculpted cloak, flaring to the base, with gold edging.
    grid=[[[u*(.72-.18*t),.51+2.95*t,-.47-.13*math.cos(u*math.pi*4)] for u in np.linspace(-1,1,17)] for t in np.linspace(0,1,8)]
    sheet(grid,VEIN,.07)
    for sign in (-1,1): beam([sign*.72,.51,-.60],[sign*.54,3.46,-.60],.045,.045,GOLD)
    for x in (-.34,.34):
        oval([x,.65,.20],[.47,.32,.80],MARBLE,10,4)
        beam([x,.72,0],[x,1.56,-.04],.35,.35,MARBLE)
        oval([x,1.59,.09],[.42,.42,.43],MARBLE,8,4)
        beam([x,1.70,-.04],[x*.78,2.30,-.03],.44,.44,MARBLE)
    # Cuirass and articulated skirt plates.
    oval([0,2.80,-.04],[1.14,1.20,.70],MARBLE,10,5)
    for x in (-.38,0,.38): box([x,2.19,.12],[.35,.42,.43],MARBLE)
    box([0,2.40,.04],[1.03,.10,.67],GOLD)
    fleur([0,2.94,.32],.44)
    for sign in (-1,1):
        oval([sign*.65,3.19,0],[.55,.52,.64],MARBLE,10,5)
        beam([sign*.71,3.09,.05],[sign*.66,2.69,.20],.31,.32,MARBLE)
        oval([sign*.66,2.70,.20],[.34,.34,.36],VEIN,8,4)
        beam([sign*.62,2.69,.24],[sign*.15,2.63,.51],.26,.27,MARBLE)
        oval([sign*.14,2.64,.55],[.29,.25,.27],MARBLE,8,4)
    cylinder([0,3.25,0],[0,3.65,0],.21,VEIN,10)
    # Great helm: boxy faceted barrel and narrow cross-shaped sight slit.
    lathe([(0,3.52),(.31,3.52),(.34,3.72),(.34,4.10),(.23,4.26),(0,4.30)],MARBLE,8)
    box([0,3.96,.322],[.48,.055,.021],INK)
    box([0,3.85,.34],[.055,.37,.03],GOLD)
    for x in (-.21,-.13,.13,.21): box([x,3.77,.326],[.023,.065,.018],INK)
    crown(0,4.27,0,.34,.10,.07)
    forged_sword([0,2.42,.66],[0,.53,.69],.24,False,False)
    cylinder([0,2.41,.66],[0,2.87,.66],.065,GOLD,10)
    beam([-.42,2.44,.66],[.42,2.44,.66],.09,.10,GOLD)
    oval([0,2.91,.66],[.14,.14,.14],GOLD,8,4)


def statue_lion():
    box([0,.10,0],[.90,.20,1.90],MARBLE)
    box([0,.23,0],[.82,.06,1.80],GOLD)
    oval([0,.72,-.25],[.64,.96,.88],GOLD,12,6)
    for sign in (-1,1):
        oval([sign*.25,.51,-.25],[.31,.50,.57],GOLD,10,4)
        beam([sign*.22,.47,.42],[sign*.21,1.02,.18],.17,.20,GOLD)
        oval([sign*.23,.36,.53],[.29,.20,.43],LIGHT,8,4)
        for dx in (-.07,0,.07): box([sign*.23+dx,.37,.73],[.018,.045,.025],DARK)
    lion_head([0,1.38,.17],.72)
    for x in (-.20,.20): oval([x,1.72,.15],[.17,.18,.12],LIGHT,8,4)
    # Curled tail follows the side of the seated haunch rather than leaving the footprint.
    pts=[[.31,.73,-.45],[.37,.45,-.61],[.34,.33,-.79],[.12,.32,-.83],[-.04,.38,-.75],[.02,.48,-.64]]
    for a,b in zip(pts,pts[1:]): cylinder(a,b,.045,GOLD,7)
    oval(pts[-1],[.12,.16,.12],DARK,8,4)
    shield(-.16,.60,.76,.52)
    oval([-.22,.85,.74],[.24,.14,.22],LIGHT,8,4)


def flame(p,h,r,col,lean=0):
    x,y,z=p
    lathe([(0,0),(r*.8,h*.12),(r,h*.31),(r*.57,h*.61),(0,h)],col,7,(x,y,z))


def brazier():
    for i in range(3):
        a=i*math.tau/3; x=.32*math.cos(a); z=.32*math.sin(a)
        oval([x,.065,z],[.22,.13,.23],GOLD,8,4)
        beam([x,.10,z],[x*.63,.90,z*.63],.075,.075,GOLD)
        with Mesh() as head: lion_head([0,.16,0],.13)
        emit(head,[x,0,z],90-math.degrees(a))
    lathe([(0,.79),(.18,.79),(.32,.88),(.44,1.02),(.45,1.12),(.40,1.15),(.36,1.02),(.16,.91),(0,.91)],GOLD,16)
    ring([0,1.10,0],.43,.43,.025,LIGHT,'xz')
    for i in range(7):
        a=i*math.tau/7
        flame([.24*math.cos(a),1.02,.24*math.sin(a)],.57+(i%3)*.10,.10,[.94,.13,.025])
        flame([.15*math.cos(a),1.04,.15*math.sin(a)],.64+(i%2)*.14,.12,[1,.43,.025])
    flame([0,1.07,0],.68,.19,[1,.91,.24])
    for i in range(5):
        a=i*2.4; oval([.22*math.cos(a),1.70+i*.04,.22*math.sin(a)],[.035,.055,.035],[1,.61,.04],6,3)


def banner_grand():
    # Two pointed ends, central notch: a true swallowtail hem.
    def hem(x): return .12+.36*(1-abs(x)/.70)
    sheet([[[x,hem(x)+(3.38-hem(x))*t,.067+.022*math.cos(x*23)]
            for x in np.linspace(-.70,.70,29)] for t in np.linspace(0,1,8)],BLUE,.008)
    for x in (-.67,.67): box([x,1.79,.10],[.075,3.15,.015],DAMASK)
    state_lion([0,2.05,.108],1.23); crown(0,2.67,.11,.52,.24,.025)
    for x in np.linspace(-.69,.69,31):
        y=hem(x); beam([x,y,.096],[x,y-.10,.096],.018,.018,GOLD)
    cylinder([-.78,3.46,.075],[.78,3.46,.075],.035,GOLD,10)
    for x in (-.79,.79): oval([x,3.46,.075],[.10,.18,.10],LIGHT,8,4)
    for x in (-.74,.74):
        cylinder([x,3.42,.08],[x,3.10,.08],.013,GOLD,6)
        oval([x,3.04,.08],[.07,.15,.07],GOLD,8,4)


def window_grand():
    arch(2.18,3.70,.19,MARBLE,[.36,.69,.94])
    box([0,.06,.12],[2.18,.12,.24],MARBLE)
    for x in (-.48,0,.48): box([x,1.33,.075],[.045,2.48,.045],GOLD)
    for y in (.78,1.52,2.50): box([0,y,.076],[1.95,.045,.045],GOLD)
    for j,y in enumerate((.43,1.14,1.99)):
        for i,x in enumerate((-.72,-.24,.24,.72)):
            col=([.57,.82,1],[.36,.65,.90],[.85,.61,.30],[.45,.73,.88])[(i+j)%4]
            box([x,y,.055],[.42,.62 if j<2 else .86,.012],col)
    ring([0,2.96,.11],.30,.30,.028,GOLD,steps=16)
    for i in range(8):
        a=i*math.tau/8
        beam([0,2.96,.11],[.29*math.cos(a),2.96+.29*math.sin(a),.11],.021,.021,GOLD)
    oval([0,2.96,.115],[.12,.12,.025],LIGHT,8,4)
    for x in (-.86,.86): curtain(x,.207,.16,2.98,.40,DAMASK,.024)
    box([0,3.04,.22],[1.95,.11,.08],GOLD)
    for x in np.linspace(-.91,.91,23): beam([x,3.00,.25],[x,2.88,.25],.019,.019,GOLD)
    relief([(-.12,.13),(.12,.13),(.08,-.13),(-.08,-.13)],[0,3.54,.195],1,GOLD)


def cloth_of_state_grand():
    # Wall-mount depth is compressed; the folds remain deep relative to the cloth.
    sheet([[[x,.12+t*3.40,.075+.042*math.cos(x*17)] for x in np.linspace(-1.84,1.84,65)]
           for t in np.linspace(0,1,9)],DAMASK,.009)
    state_lion([0,2.01,.135],2.03); crown(0,2.98,.14,.86,.30,.035)
    for x in (-1.48,1.48):
        curtain(x,.119,.11,3.52,.74,RED,.033)
        # Ermine inner edges follow the tied-back silhouette.
        sign=1 if x>0 else -1
        fur=[]
        for j in range(24):
            t=j/23; narrow=1-.60*math.exp(-((t-.38)/.18)**2)
            xx=x-sign*.34*narrow; yy=.12+t*3.36
            fur.append([[xx+dx,yy,.185+.005*math.cos(j*2)] for dx in (-.06,0,.06)])
            if j%2==0: relief([(-.014,.025),(.014,.025),(0,-.025)],[xx,yy,.197],1,INK)
        sheet(fur,WHITE,.012)
    for x in np.linspace(-1.80,1.80,49): beam([x,.12,.11],[x,.015,.11],.02,.02,GOLD)
    for y,w,h,d in ((3.56,3.88,.12,.16),(3.66,3.96,.08,.20)):
        box([0,y,d/2],[w,h,d],GOLD)
    for x in np.linspace(-1.85,1.85,29): oval([x,3.48,.15],[.045,.12,.045],LIGHT,6,3)
    crown(0,3.70,.10,1.04,.22,.12)
    for x in (-1.82,1.82): fleur([x,3.81,.17],.30)


def torchere():
    lathe([(0,0),(.35,0),(.38,.08),(.31,.15),(.14,.22),(.10,.35),(.07,1.65),(.16,1.78),(0,1.82)],GOLD,12)
    for y in (.27,1.10,1.65): oval([0,y,0],[.23,.16,.23],LIGHT,10,4)
    for i in range(7):
        a=i*math.tau/6; r=0 if i==6 else .36
        x=r*math.cos(a); z=r*math.sin(a); y=2.08 if i==6 else 1.94
        if r:
            beam([0,1.51,0],[x,1.75,z],.045,.045,GOLD)
            beam([x,1.75,z],[x,y,z],.04,.04,GOLD)
        lathe([(0,0),(.075,0),(.085,.04),(0,.06)],GOLD,8,(x,y,z))
        candle(x,y+.06,z,.32 if i==6 else .27,.032)


def build(name,seed):
    with Mesh() as m:
        if name=='throne_grand': throne_grand(np.random.default_rng(seed))
        else: globals()[name]()
    p,n,c=m.arrays()
    # Hanging origin is the lowest ornament; floor models are constructed at y=0.
    if name in ('banner_grand','cloth_of_state_grand'): p[:,1]-=p[:,1].min()
    m.positions=list(p)
    return m


def check_grand(name,arrays):
    p,n,c=arrays; lo=p.min(0); hi=p.max(0); eps=3e-6
    assert len(p)//3<=9000,(name,len(p)//3)
    assert abs(lo[1])<eps,(name,'origin',lo)
    if name=='wall_royal':
        assert np.allclose(lo,[-1.5,0,-.30],atol=eps) and np.allclose(hi,[1.5,4.2,.30],atol=eps),(name,lo,hi)
    elif name=='wall_royal_pilaster':
        assert np.allclose(lo,[-.32,0,-.36],atol=eps) and np.allclose(hi,[.32,4.3,.44],atol=eps),(name,lo,hi)
    elif name in ('banner_grand','window_grand','cloth_of_state_grand'):
        w,h,d={'banner_grand':(1.7,3.6,.15),'window_grand':(2.2,3.7,.28),'cloth_of_state_grand':(4,4,.2)}[name]
        assert lo[0]>=-w/2-eps and hi[0]<=w/2+eps and hi[1]<=h+eps and lo[2]>=-eps and hi[2]<=d+eps,(name,lo,hi)
    else:
        w,d,h={'column_grand':(1,1,4.2),'dais_grand':(9,5,1.6),'throne_grand':(3,3,5.4),
          'statue_knight':(2,2,4.5),'statue_lion':(1,2,2.0),'brazier':(1,1,2.0),'torchere':(1,1,2.7)}[name]
        lim=np.array([w,d])/2-.04
        assert np.all(lo[[0,2]]>=-lim-eps) and np.all(hi[[0,2]]<=lim+eps) and hi[1]<=h+eps,(name,lo,hi,lim)
        if name=='column_grand': assert abs(hi[1]-4.2)<eps
        if name=='dais_grand':
            # Central walking surface excludes corner posts. Check actual exported upward faces.
            sel=(n[:,1]>.99)&(np.abs(p[:,0])<3.2)
            assert abs(p[sel,1].max()-.90)<eps
            for y in (.30,.60,.90): assert np.any(np.isclose(p[sel,1],y,atol=eps))
        if name=='statue_knight': assert hi[1]>=4.3
        if name=='statue_lion': assert hi[1]>=1.8
        if name=='brazier': assert hi[1]>=1.8
        if name=='torchere': assert hi[1]>=2.5


def hall(assets):
    placements=[]
    with Mesh() as m:
        # 27-tile-wide hall end, with long sightlines framing the central procession.
        for x in range(-13,14):
            for z in range(-5,8):
                box([x,-.055,z],[.992,.10,.992],MARBLE*.82 if (x+z)%2 else VEIN*.75)
        box([0,.006,3.5],[2.0,.012,7.0],DAMASK)
        for x in (-.96,.96): box([x,.014,3.5],[.045,.004,7],GOLD)
        def place(name,pos,angle=0):
            emit(assets[name],pos,angle)
            placements.append(dict(model='palace_'+name+'.glb',position=pos,rotationYDegrees=angle))
        for x in range(-12,13,3): place('wall_royal',[x,0,-5.0])
        for x in np.arange(-13.5,13.6,3): place('wall_royal_pilaster',[float(x),0,-5.0])
        # A raised central architectural tier gives the 6.2-high throne a proper backdrop.
        for x in (-3,0,3): place('wall_royal',[x,4.2,-5.0])
        for x in (-4.5,-1.5,1.5,4.5): place('wall_royal_pilaster',[x,4.2,-5.0])
        place('cloth_of_state_grand',[0,3.80,-4.55])
        place('dais_grand',[0,0,-1.88]); place('throne_grand',[0,.90,-2.85])
        for sign in (-1,1):
            place('statue_knight',[sign*5.3,0,-3.20])
            place('statue_lion',[sign*3.0,0,1.50])
            place('brazier',[sign*4.18,0,1.63])
            place('torchere',[sign*1.85,.90,-3.35])
            for z in (-3.6,.2,4.0): place('column_grand',[sign*8.1,0,z])
            for x in (6,12): place('window_grand',[sign*x,.24,-4.69])
            place('banner_grand',[sign*9,.38,-4.69])
            place('banner_grand',[sign*3,4.55,-4.69])
    arrays=m.arrays()
    render(TEAM/'preview_palace_throne_hall.png',*arrays,size=(2100,1450),eye=(2.5,11,10),margin=.035,background=(231,223,205))
    render(TEAM/'preview_palace_throne_hall_low.png',*arrays,size=(2100,1350),eye=(3,5,13),margin=.035,background=(231,223,205))
    (TEAM/'palace_throne_hall.json').write_text(json.dumps(dict(placements=placements,cameraDirection=[2.5,11,10],
        notes='27-wide back wall; central second tier reaches 8.5. Preview floor and aisle runner only; all architecture is exported kit geometry.'),indent=2))
