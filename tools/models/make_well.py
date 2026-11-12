"""Build a vertex-coloured medieval well, export GLB, validate, and preview.

Only Python, numpy and Pillow are needed. All dimensions are metres, Y up.
"""
from pathlib import Path
import math

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
RNG = np.random.default_rng(24)
from meshkit import face, box, beam, cylinder, ring_segment, unit, export_glb, validate, preview


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


if __name__=='__main__':
    build()
    output=ROOT/'src/assets/world3d/custom/well.glb'
    export_glb(output)
    preview(ROOT/'.team/preview_well.png',*validate(output, well=True))
