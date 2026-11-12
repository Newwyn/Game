"""Dependency-free flat-shaded mesh construction, GLB validation and previews.

Functions operate on the active Mesh; use ``with Mesh() as mesh:`` to build
independent assets. The default mesh preserves the original well API.
"""
from pathlib import Path
import json
import math
import struct
import numpy as np
from PIL import Image, ImageDraw

POSITIONS, NORMALS, COLORS = [], [], []

class Mesh:
    def __init__(self):
        self.positions, self.normals, self.colors = [], [], []

    def __enter__(self):
        global POSITIONS, NORMALS, COLORS
        self.previous = POSITIONS, NORMALS, COLORS
        POSITIONS, NORMALS, COLORS = self.positions, self.normals, self.colors
        return self

    def __exit__(self, *args):
        global POSITIONS, NORMALS, COLORS
        POSITIONS, NORMALS, COLORS = self.previous

    def arrays(self):
        return tuple(np.asarray(a, dtype=float) for a in
                     (self.positions, self.normals, self.colors))

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


def export_glb(path, name="well"):
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
         'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':name}],
         'meshes':[{'name':name,'primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'COLOR_0':2},'indices':3,'material':0,'mode':4}]}],
         'materials':[{'name':name,'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],
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


def validate(path, well=False):
    data=path.read_bytes()
    magic,version,length=struct.unpack_from('<4sII',data)
    assert (magic,version,length)==(b'glTF',2,len(data))
    size,kind=struct.unpack_from('<I4s',data,12)
    assert kind==b'JSON' and size%4==0
    doc=json.loads(data[20:20+size])
    bsize,bkind=struct.unpack_from('<I4s',data,20+size)
    binary=data[28+size:]
    assert bkind==b'BIN\0' and len(binary)==bsize==doc['buffers'][0]['byteLength']
    assert bsize % 4 == 0
    assert len(doc['materials']) == 1
    material=doc['materials'][0]
    assert material['doubleSided'] is False
    assert material['pbrMetallicRoughness']['metallicFactor'] == 0
    assert material['pbrMetallicRoughness']['roughnessFactor'] == .9
    primitive=doc['meshes'][0]['primitives'][0]
    assert primitive['attributes'] == {'POSITION':0,'NORMAL':1,'COLOR_0':2}
    assert primitive['mode'] == 4 and primitive['indices'] == 3
    arrays=[]
    for acc in doc['accessors']:
        view=doc['bufferViews'][acc['bufferView']]
        width=1 if acc['type']=='SCALAR' else 3
        assert view['byteLength']==acc['count']*width*4
        assert view['byteOffset'] % 4 == 0
        assert 0 <= view['byteOffset'] < len(binary)
        assert view['byteOffset']+view['byteLength'] <= len(binary)
        assert acc['componentType'] == (5125 if width==1 else 5126)
        arrays.append(np.frombuffer(binary,dtype='<u4' if width==1 else '<f4',
                      count=acc['count']*width,offset=view['byteOffset']).reshape(-1,width))
    p,n,c,idx=arrays
    assert len(p)==len(n)==len(c) and idx.max()<len(p)
    assert len(idx) % 3 == 0
    assert np.isfinite(n).all() and np.isfinite(c).all()
    tri_normals=n[idx.reshape(-1,3)]
    assert np.allclose(tri_normals[:,0],tri_normals[:,1])
    assert np.allclose(tri_normals[:,0],tri_normals[:,2])
    assert np.isfinite(p).all() and np.allclose(np.linalg.norm(n,axis=1),1)
    assert np.all((c>=0)&(c<=1))
    acc=doc['accessors'][0]
    assert np.allclose(p.min(0),acc['min']) and np.allclose(p.max(0),acc['max'])
    bounds=p.max(0)-p.min(0)
    if well:
        assert np.all(np.abs(bounds-[2.2,3.2,2.2])<[.45,.12,.25]),bounds
        assert abs(p[:,1].min())<1e-6
    triangles=p[idx.reshape(-1,3)]
    crosses=np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0])
    assert np.all(np.sum(crosses*n[idx.reshape(-1,3)[:,0]],axis=1)>1e-9)
    count=len(idx)//3
    if well:
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



def rock(center, size, color=(.32,.26,.21), seed=0, sides=10, rings=6):
    """Closed displaced faceted blob, exact supplied axis-aligned dimensions."""
    rng = np.random.default_rng(seed)
    verts = [[0,-1,0]]
    for j in range(1,rings):
        phi = math.pi*j/rings
        for k in range(sides):
            theta = math.tau*k/sides + .13*(j%2)
            r = rng.uniform(.82,1.16)
            verts.append([math.sin(phi)*math.cos(theta)*r,
                          -math.cos(phi)+rng.uniform(-.065,.065),
                          math.sin(phi)*math.sin(theta)*r])
    verts.append([.07,1,.02])
    verts=np.array(verts)
    verts=(verts-verts.min(0))/(verts.max(0)-verts.min(0))-.5
    verts=verts*np.asarray(size)+center
    triangles=[]
    for k in range(sides):
        triangles.append([0,1+k,1+(k+1)%sides])
    for j in range(rings-2):
        for k in range(sides):
            a=1+j*sides+k; b=1+j*sides+(k+1)%sides
            d=a+sides; e=b+sides
            triangles.extend([[a,b,e],[a,e,d]])
    top=len(verts)-1
    for k in range(sides):
        triangles.append([top,top-sides+k,top-sides+(k+1)%sides])
    for ids in triangles:
        pts=verts[ids]
        height=(pts[:,1].mean()-center[1])/size[1]+.5
        tone=rng.uniform(.86,1.12)*(.77+.23*height)
        face(pts,np.asarray(color)*tone,pts.mean(0)-center)


def cliff_slab(center=(0,2.5,0), size=(6.2,5,1.6), seed=0, nx=18, ny=18):
    """Watertight triangulated slab: vertical seams, ledges, recessed strata.

    Shared grid vertices prevent cracks. Narrow dark strata and periodic depth
    steps make painted recesses; the upper lip projects toward +Z.
    """
    rng=np.random.default_rng(seed)
    w,h,d=size; cx,cy,cz=center
    points=np.zeros((ny+1,nx+1,3))
    for j in range(ny+1):
        for i in range(nx+1):
            x=-w/2+w*i/nx
            y=-h/2+h*j/ny
            if i not in (0,nx): x+=rng.uniform(-.09,.09)*w/6
            if j not in (0,ny): y+=rng.uniform(-.055,.055)*h/5
            recess = (j%4==1)
            z=d*(.27+.045*math.sin(i*.72+j*.8)+rng.uniform(-.022,.022))
            z-=d*.15*recess
            z+=d*.16*(j==ny)
            points[j,i]=[cx+x,cy+y,cz+z]
    for j in range(ny):
        for i in range(nx):
            a,b=points[j,i],points[j,i+1]
            e,f=points[j+1,i+1],points[j+1,i]
            for tri in ((a,b,e),(a,e,f)):
                tone=rng.uniform(.95,1.05)*(.76+.24*j/ny)
                if j%4==0: tone*=.65
                if i%7==3 and j%4 in (1,2): tone*=.77
                face(tri,np.array([.285,.225,.175])*tone,[0,0,1])
    back=cz-d/2
    for j in range(ny):
        for i in (0,nx):
            a,b=points[j,i],points[j+1,i]
            face([a,b,[b[0],b[1],back],[a[0],a[1],back]], [.235,.194,.158],[-1 if i==0 else 1,0,0])
    for j in (0,ny):
        for i in range(nx):
            a,b=points[j,i],points[j,i+1]
            face([a,b,[b[0],b[1],back],[a[0],a[1],back]], [.29,.24,.19],[0,-1 if j==0 else 1,0])
    face([[cx-w/2,cy-h/2,back],[cx+w/2,cy-h/2,back],
          [cx+w/2,cy+h/2,back],[cx-w/2,cy+h/2,back]],[.22,.18,.15],[0,0,-1])


def render(path,p,n,c, size=(700,700), eye=(4,2.8,6), margin=.10,
           background=(27,32,36), title=None):
    """Auto-framed orthographic, single-sided, Z-buffered software renderer."""
    width,height=size
    eye=unit(eye); right=unit(np.cross([0,1,0],eye)); up=np.cross(eye,right)
    camera=np.stack([right,up,eye],axis=1)
    q=p@camera
    low,high=q[:,:2].min(0),q[:,:2].max(0)
    scale=min(width*(1-2*margin)/(high[0]-low[0]),height*(1-2*margin)/(high[1]-low[1]))
    midpoint=(low+high)/2
    screen=np.column_stack([width/2+(q[:,0]-midpoint[0])*scale,
                            height/2-(q[:,1]-midpoint[1])*scale,q[:,2]])
    canvas=np.empty((height,width,3),float); canvas[:]=background
    depth=np.full((height,width),-np.inf)
    light=unit([-3,7,5])
    for i in range(0,len(p),3):
        if np.dot(n[i],eye)<=0: continue
        tri=screen[i:i+3]
        lo=np.maximum(np.floor(tri[:,:2].min(0)).astype(int),0)
        hi=np.minimum(np.ceil(tri[:,:2].max(0)).astype(int),[width-1,height-1])
        if np.any(lo>hi): continue
        xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1)+.5,np.arange(lo[1],hi[1]+1)+.5)
        a,b,d=tri
        denom=(b[1]-d[1])*(a[0]-d[0])+(d[0]-b[0])*(a[1]-d[1])
        if abs(denom)<1e-8: continue
        w0=((b[1]-d[1])*(xx-d[0])+(d[0]-b[0])*(yy-d[1]))/denom
        w1=((d[1]-a[1])*(xx-d[0])+(a[0]-d[0])*(yy-d[1]))/denom
        w2=1-w0-w1
        z=w0*a[2]+w1*b[2]+w2*d[2]
        section=np.s_[lo[1]:hi[1]+1,lo[0]:hi[0]+1]
        mask=(w0>=0)&(w1>=0)&(w2>=0)&(z>depth[section])
        shade=.49+.51*max(0,np.dot(n[i],light))
        color=(w0[...,None]*c[i]+w1[...,None]*c[i+1]+w2[...,None]*c[i+2])*shade
        rgb=np.where(color<=.0031308,12.92*color,1.055*np.maximum(color,0)**(1/2.4)-.055)*255
        canvas[section][mask]=rgb[mask]; depth[section][mask]=z[mask]
    im=Image.fromarray(np.uint8(np.clip(canvas,0,255)))
    if title:
        draw=ImageDraw.Draw(im)
        draw.text((24,20),title,fill=(215,212,198))
    path.parent.mkdir(parents=True,exist_ok=True)
    im.save(path)
