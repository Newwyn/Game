"""Build a vertex-coloured medieval well, export GLB, validate, and preview.

Only Python, numpy and Pillow are needed. All dimensions are metres, Y up.
"""
from pathlib import Path
import json
import math
import struct

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
RNG = np.random.default_rng(24)
POSITIONS, NORMALS, COLORS = [], [], []


def unit(v):
    v = np.asarray(v, dtype=float)
    return v / np.linalg.norm(v)


def face(points, color, outward=None):
    """Triangulate a planar convex polygon, optionally enforce outward normal."""
    points = np.asarray(points, dtype=float)
    normal = unit(np.cross(points[1] - points[0], points[2] - points[0]))
    if outward is not None and np.dot(normal, outward) < 0:
        points = points[::-1]
        normal = -normal
    for i in range(1, len(points) - 1):
        for p in (points[0], points[i], points[i + 1]):
            POSITIONS.append(p)
            NORMALS.append(normal)
            # Subtle height-based painted occlusion; no texture dependency.
            shade = .82 + .18 * min(p[1] / 1.5, 1)
            COLORS.append(np.clip(np.asarray(color) * shade, 0, 1))


def box(center, size, color, axes=None):
    """Oriented solid box; axes are its three local unit vectors."""
    axes = np.eye(3) if axes is None else np.asarray(axes)
    center = np.asarray(center)
    corners = np.array([[x, y, z] for x in (-1, 1)
                        for y in (-1, 1) for z in (-1, 1)])
    points = center + (corners * np.asarray(size) / 2) @ axes
    for ids in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1),
                (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
        polygon = points[list(ids)]
        tone = .87 if abs(np.dot(unit(polygon.mean(0)-center), axes[1])) > .9 else 1
        face(polygon, np.asarray(color)*tone, polygon.mean(0)-center)


def beam(a, b, width, depth, color):
    direction = unit(np.asarray(b)-a)
    side = unit(np.cross(direction, [0, 0, 1] if abs(direction[2]) < .9 else [1, 0, 0]))
    box((np.asarray(a)+b)/2, [width, np.linalg.norm(np.asarray(b)-a), depth],
        color, [side, direction, np.cross(side, direction)])


def cylinder(a, b, radius, color, sides=12, caps=True):
    axis = unit(np.asarray(b)-a)
    u = unit(np.cross(axis, [0, 0, 1] if abs(axis[2]) < .9 else [1, 0, 0]))
    v = np.cross(axis, u)
    offsets = [radius*(u*math.cos(t)+v*math.sin(t))
               for t in np.linspace(0, 2*math.pi, sides, endpoint=False)]
    bottom, top = np.asarray(a)+offsets, np.asarray(b)+offsets
    for i in range(sides):
        j = (i+1) % sides
        face([bottom[i], bottom[j], top[j], top[i]], color, offsets[i]+offsets[j])
    if caps:
        face(bottom, np.asarray(color)*.75, -axis)
        face(top, np.asarray(color)*.75, axis)


def ring_segment(inner, outer, low, high, start, end, color, steps=3):
    """Solid wedge with independent inner/outer faces and bevelled top edges."""
    angles = np.linspace(start, end, steps+1)
    # Four radial/height profile corners, with bevels on both upper edges.
    profile = [(inner, low), (outer, low), (outer, high-.035),
               (outer-.025, high), (inner+.018, high), (inner, high-.035)]
    rings = [np.array([[r*math.cos(t), y, r*math.sin(t)] for r, y in profile])
             for t in angles]
    center_r, center_y = (inner+outer)/2, (low+high)/2
    for i in range(steps):
        t = (angles[i]+angles[i+1])/2
        for k in range(len(profile)):
            j = (k+1) % len(profile)
            r = (profile[k][0]+profile[j][0])/2
            y = (profile[k][1]+profile[j][1])/2
            outward = [(r-center_r)*math.cos(t), y-center_y, (r-center_r)*math.sin(t)]
            tint = .66 if k == 5 else 1
            face([rings[i][k], rings[i+1][k], rings[i+1][j], rings[i][j]],
                 np.asarray(color)*tint, outward)
    face(rings[0], color, [math.sin(start), 0, -math.cos(start)])
    face(rings[-1], color, [-math.sin(end), 0, math.cos(end)])


def build():
    stone = np.array([.55, .53, .46])
    for i in range(16):
        t = i*math.tau/16
        ring_segment(.57, 1.04, 0, .16, t+.007, t+math.tau/16-.007,
                     stone*RNG.uniform(.85, 1.08), steps=2)
    for course in range(3):
        for i in range(14):
            t = (i + .5*(course % 2))*math.tau/14
            color = stone*RNG.uniform(.84, 1.14)
            if course == 0 and i % 3 == 0:
                color *= [.83, 1.02, .73]
            ring_segment(.64, .89+RNG.uniform(-.018,.018), .17+course*.285,
                         .17+(course+1)*.285-.012+RNG.uniform(-.007,.007),
                         t+.012, t+math.tau/14-.012, color, steps=2)
    cylinder([0,.24,0], [0,.255,0], .635, [.055,.17,.18], 40)
    wood = [.34, .18, .085]
    for x in (-.95,.95):
        box([x,1.34,0], [.18,2.52,.20], wood)
        box([x,.25,0], [.215,.21,.235], [.25,.17,.10])
        for z in (-.108,.108):
            box([x-.035,1.49,z], [.022,2.0,.006], [.26,.13,.055])
        beam([x,2.21,0], [x*.66,2.51,0], .095,.12,[.43,.25,.12])
    box([0,2.51,0], [2.08,.18,.22], [.40,.23,.105])
    cylinder([-1.10,1.98,0], [1.10,1.98,0], .105, [.39,.22,.10], 14)
    for x in (-.74,.74):
        cylinder([x-.035,1.98,0], [x+.035,1.98,0], .15, [.24,.13,.065], 12)
    beam([1.11,1.98,0], [1.11,1.72,.20], .07,.075,[.28,.16,.08])
    cylinder([.99,1.72,.20], [1.16,1.72,.20], .055, [.47,.29,.14], 10)
    # Rope winds around the horizontal roller then descends to the bucket bail.
    for i in range(40):
        t0, t1 = i*math.tau/10, (i+1)*math.tau/10
        cylinder([-.14+i*.007,1.98+.119*math.cos(t0),.119*math.sin(t0)],
                 [-.14+(i+1)*.007,1.98+.119*math.cos(t1),.119*math.sin(t1)],
                 .014,[.72,.57,.34],6)
    cylinder([.14,1.98,.12], [.14,1.54,.12], .017,[.76,.62,.39],8)
    # Open tapered bucket, separate staves and two dark wooden hoops.
    bx,bz = .14,.12
    for i in range(12):
        t0,t1 = i*math.tau/12+.015, (i+1)*math.tau/12-.015
        pts = []
        for y,r in ((1.06,.135),(1.35,.18),(1.35,.145),(1.09,.105)):
            pts.append([[bx+r*math.cos(t),y,bz+r*math.sin(t)] for t in (t0,t1)])
        color = np.array([.49,.30,.14])*RNG.uniform(.85,1.12)
        center = np.array([bx+ .14*math.cos((t0+t1)/2),1.21,bz+.14*math.sin((t0+t1)/2)])
        for k in range(4):
            j=(k+1)%4
            poly=np.array([pts[k][0],pts[k][1],pts[j][1],pts[j][0]])
            face(poly,color,poly.mean(0)-center)
        for side in range(2):
            poly=np.array([pts[k][side] for k in range(4)])
            face(poly,color,poly.mean(0)-center)
    cylinder([bx,1.065,bz],[bx,1.09,bz],.13,[.24,.13,.06],12)
    for y,r in ((1.11,.146),(1.29,.174)):
        for i in range(12):
            t0,t1=i*math.tau/12,(i+1)*math.tau/12
            cylinder([bx+r*math.cos(t0),y,bz+r*math.sin(t0)],
                     [bx+r*math.cos(t1),y,bz+r*math.sin(t1)],.018,[.21,.17,.12],6)
    for i in range(12):
        t0,t1=i*math.pi/12,(i+1)*math.pi/12
        cylinder([bx+.18*math.cos(t0),1.35+.19*math.sin(t0),bz],
                 [bx+.18*math.cos(t1),1.35+.19*math.sin(t1),bz],.014,[.28,.20,.12],6)
    # Roof boards and individually overlapping clay tiles. Ridge runs along Z.
    slope=.53
    for sign in (-1,1):
        along=unit([sign,-slope,0])
        normal=unit([sign*slope,1,0])
        axes=[along,normal,[0,0,1]]
        box([sign*.54,3.12-slope*.54,0],[1.25,.065,2.10],wood,axes)
        for row in range(5):
            x=.99-row*.22
            for col in range(9):
                z=(col-4)*.232+RNG.uniform(-.008,.008)
                box([sign*x,3.16-slope*x+row*.002,z],
                    [.285,.055,.225], np.array([.64,.265,.135])*RNG.uniform(.86,1.13),axes)
        for z in (-1.025,1.025):
            beam([0,3.115,z],[sign*1.12,2.52,z],.095,.105,[.35,.18,.08])
    for i in range(9):
        # Low ridge caps, deliberately chunky silhouette.
        box([0,3.17,(i-4)*.232],[.16,.06,.226],[.70,.31,.16])


def export_glb(path):
    arrays = [np.asarray(POSITIONS,'<f4'), np.asarray(NORMALS,'<f4'),
              np.asarray(COLORS,'<f4'), np.arange(len(POSITIONS),dtype='<u4')]
    views,accessors,parts=[],[],[]
    offset=0
    for i,a in enumerate(arrays):
        raw=a.tobytes()
        views.append({'buffer':0,'byteOffset':offset,'byteLength':len(raw),
                      'target':34963 if i==3 else 34962})
        acc={'bufferView':i,'componentType':5125 if i==3 else 5126,
             'count':len(a),'type':'SCALAR' if i==3 else 'VEC3'}
        if i==0:
            acc.update(min=a.min(0).tolist(),max=a.max(0).tolist())
        accessors.append(acc)
        parts.append(raw)
        offset+=len(raw)
    doc={'asset':{'version':'2.0','generator':'Procedural village well'},
         'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':'well'}],
         'meshes':[{'name':'well','primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'COLOR_0':2},'indices':3,'material':0,'mode':4}]}],
         'materials':[{'name':'well','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],
                      'metallicFactor':0,'roughnessFactor':.9},'doubleSided':False}],
         'buffers':[{'byteLength':offset}],'bufferViews':views,'accessors':accessors}
    js=json.dumps(doc,separators=(',',':')).encode()
    js+=b' '*((-len(js))%4)
    binary=b''.join(parts)
    data=struct.pack('<4sII',b'glTF',2,28+len(js)+len(binary))
    data+=struct.pack('<I4s',len(js),b'JSON')+js
    data+=struct.pack('<I4s',len(binary),b'BIN\0')+binary
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(data)


def validate(path):
    data=path.read_bytes()
    magic,version,length=struct.unpack_from('<4sII',data)
    assert (magic,version,length)==(b'glTF',2,len(data))
    size,kind=struct.unpack_from('<I4s',data,12)
    assert kind==b'JSON' and size%4==0
    doc=json.loads(data[20:20+size])
    bsize,bkind=struct.unpack_from('<I4s',data,20+size)
    binary=data[28+size:]
    assert bkind==b'BIN\0' and len(binary)==bsize==doc['buffers'][0]['byteLength']
    arrays=[]
    for acc in doc['accessors']:
        view=doc['bufferViews'][acc['bufferView']]
        width=1 if acc['type']=='SCALAR' else 3
        assert view['byteLength']==acc['count']*width*4
        arrays.append(np.frombuffer(binary,dtype='<u4' if width==1 else '<f4',
                      count=acc['count']*width,offset=view['byteOffset']).reshape(-1,width))
    p,n,c,idx=arrays
    assert len(p)==len(n)==len(c) and idx.max()<len(p)
    assert np.isfinite(p).all() and np.allclose(np.linalg.norm(n,axis=1),1)
    assert np.all((c>=0)&(c<=1))
    acc=doc['accessors'][0]
    assert np.allclose(p.min(0),acc['min']) and np.allclose(p.max(0),acc['max'])
    bounds=p.max(0)-p.min(0)
    assert np.all(np.abs(bounds-[2.2,3.2,2.2])<[.45,.12,.25]),bounds
    assert abs(p[:,1].min())<1e-6
    triangles=p[idx.reshape(-1,3)]
    crosses=np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0])
    assert np.all(np.sum(crosses*n[idx.reshape(-1,3)[:,0]],axis=1)>1e-9)
    count=len(idx)//3
    assert 2000<=count<=6000,count
    print(f'Validated: {count} triangles; {len(data):,} bytes; bounds {bounds.round(3)}')
    return p,n,c


def preview(path,p,n,c):
    """Orthographic software rasterizer with depth testing and back-face culling."""
    size=900
    eye=unit([4,2.8,5])
    right=unit(np.cross([0,1,0],eye))
    up=np.cross(eye,right)
    camera=np.stack([right,up,eye],axis=1)
    q=(p-[0,1.55,0])@camera
    screen=np.column_stack([450+q[:,0]*225,455-q[:,1]*225,q[:,2]])
    base=Image.new('RGB',(size,size),(229,224,211))
    draw=ImageDraw.Draw(base)
    draw.ellipse((204,682,702,807),fill=(204,198,183))
    draw.ellipse((250,702,656,784),fill=(190,185,169))
    canvas=np.array(base,dtype=float)
    depth=np.full((size,size),-np.inf)
    light=unit([-3,6,4])
    for i in range(0,len(p),3):
        if np.dot(n[i],eye)<=0:
            continue
        tri=screen[i:i+3]
        lo=np.maximum(np.floor(tri[:,:2].min(0)).astype(int),0)
        hi=np.minimum(np.ceil(tri[:,:2].max(0)).astype(int),size-1)
        if np.any(lo>hi):
            continue
        xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1)+.5,np.arange(lo[1],hi[1]+1)+.5)
        a,b,d=tri
        denom=(b[1]-d[1])*(a[0]-d[0])+(d[0]-b[0])*(a[1]-d[1])
        if abs(denom)<1e-8:
            continue
        w0=((b[1]-d[1])*(xx-d[0])+(d[0]-b[0])*(yy-d[1]))/denom
        w1=((d[1]-a[1])*(xx-d[0])+(a[0]-d[0])*(yy-d[1]))/denom
        w2=1-w0-w1
        z=w0*a[2]+w1*b[2]+w2*d[2]
        section=np.s_[lo[1]:hi[1]+1,lo[0]:hi[0]+1]
        mask=(w0>=0)&(w1>=0)&(w2>=0)&(z>depth[section])
        shade=.57+.43*max(0,np.dot(n[i],light))
        color=(w0[...,None]*c[i]+w1[...,None]*c[i+1]+w2[...,None]*c[i+2])*shade
        # Convert linear vertex colour to display sRGB (matching a glTF viewer).
        rgb=np.where(color<=.0031308,12.92*color,1.055*np.maximum(color,0)**(1/2.4)-.055)*255
        canvas[section][mask]=rgb[mask]
        depth[section][mask]=z[mask]
    path.parent.mkdir(parents=True,exist_ok=True)
    Image.fromarray(np.uint8(np.clip(canvas,0,255))).save(path)


if __name__=='__main__':
    build()
    output=ROOT/'src/assets/world3d/custom/well.glb'
    export_glb(output)
    preview(ROOT/'.team/preview_well.png',*validate(output))
