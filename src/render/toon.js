// ============================================================
// TOON SHADING KIỂU "VẼ TAY" (tham khảo phong cách Tree of Savior)
// ============================================================
// - Bóng đổ chia 4 bậc nhưng chuyển mềm (LinearFilter) -> giống màu nước, không gắt như anime cel
// - Viền ngoài mỏng, màu tối hơn màu gốc (không dùng đen tuyền) -> mềm mắt
import * as THREE from 'three';

// Gradient: tối nhất 0.62 để vùng tối vẫn ấm và đọc được màu, giống tranh vẽ tay
const GRADIENT_STEPS = [158, 190, 226, 255];
let gradientMap = null;

function getGradientMap() {
    if (gradientMap) return gradientMap;
    const data = new Uint8Array(GRADIENT_STEPS.length * 4);
    GRADIENT_STEPS.forEach((v, i) => data.set([v, v, v, 255], i * 4));
    gradientMap = new THREE.DataTexture(data, GRADIENT_STEPS.length, 1, THREE.RGBAFormat);
    gradientMap.minFilter = THREE.LinearFilter;
    gradientMap.magFilter = THREE.LinearFilter; // chuyển bậc mềm
    gradientMap.generateMipmaps = false;
    gradientMap.needsUpdate = true;
    return gradientMap;
}

/**
 * Vật liệu toon.
 * @param {number|string} color
 * @param {object} [opts] { emissive, emissiveIntensity, map }
 */
export function toonMaterial(color, opts = {}) {
    return new THREE.MeshToonMaterial({
        color,
        gradientMap: getGradientMap(),
        emissive: opts.emissive ?? 0x000000,
        emissiveIntensity: opts.emissiveIntensity ?? 1,
        map: opts.map ?? null,
        side: opts.side ?? THREE.FrontSide,
    });
}

/** Màu viền: cùng tông màu gốc nhưng tối hơn nhiều */
export function outlineColorFor(color) {
    const c = new THREE.Color(color);
    const hsl = {};
    c.getHSL(hsl);
    return new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 0.8 + 0.1), Math.max(0.05, hsl.l * 0.28));
}

/** Vật liệu viền "inverted hull": đẩy đỉnh ra theo pháp tuyến, chỉ vẽ mặt sau.
 *  Hỗ trợ cả SkinnedMesh (model có xương): three.js tự bật SKINNING khi vẽ SkinnedMesh. */
export function outlineMaterial(color, thickness = 0.012) {
    return new THREE.ShaderMaterial({
        uniforms: {
            outlineColor: { value: outlineColorFor(color) },
            thickness: { value: thickness },
            opacity: { value: 1 },
        },
        vertexShader: /* glsl */`
            #include <common>
            #include <skinning_pars_vertex>
            uniform float thickness;
            void main() {
                #include <beginnormal_vertex>
                #include <skinbase_vertex>
                #include <skinnormal_vertex>
                #include <begin_vertex>
                #include <skinning_vertex>
                // Bù tỉ lệ scale của mesh để viền dày đều trên mọi bộ phận
                vec3 scale = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
                transformed += normalize(objectNormal) * thickness / scale;
                #include <project_vertex>
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3 outlineColor;
            uniform float opacity;
            void main() {
                gl_FragColor = vec4(outlineColor, opacity);
            }
        `,
        side: THREE.BackSide,
        transparent: true,
    });
}

/** Gắn viền cho một mesh (mesh con dùng chung geometry; với SkinnedMesh thì dùng chung bộ xương) */
export function addOutline(mesh, thickness, colorOverride) {
    const color = colorOverride ?? mesh.material.color ?? new THREE.Color(0x333333);
    const mat = outlineMaterial(color, thickness);
    let outline;
    if (mesh.isSkinnedMesh) {
        outline = new THREE.SkinnedMesh(mesh.geometry, mat);
        outline.position.copy(mesh.position);
        outline.quaternion.copy(mesh.quaternion);
        outline.scale.copy(mesh.scale);
        outline.bind(mesh.skeleton, mesh.bindMatrix);
        outline.frustumCulled = false;
        mesh.parent.add(outline);
    } else {
        outline = new THREE.Mesh(mesh.geometry, mat);
        mesh.add(outline);
    }
    outline.name = `${mesh.name || 'part'}_outline`;
    outline.userData.isOutline = true;
    outline.renderOrder = -1;
    return outline;
}
