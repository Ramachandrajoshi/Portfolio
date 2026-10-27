/** GLSL for the procedural city. Fog chunks come from Three.js so scene fog applies uniformly. */

export const buildingVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aStyle;
  varying vec3 vNormalObj;
  varying vec3 vLocal;
  varying vec3 vHalf;
  varying float vSeed;
  varying float vStyle;
  #include <fog_pars_vertex>
  void main() {
    vec3 scale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    vLocal = position * scale;          // x,z ∈ [-half, half], y ∈ [0, height]
    vHalf = vec3(scale.x * 0.5, scale.y, scale.z * 0.5);
    vNormalObj = normal;
    vSeed = aSeed;
    vStyle = aStyle;
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

export const buildingFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uRim;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform float uWindows;
  uniform float uTime;
  varying vec3 vNormalObj;
  varying vec3 vLocal;
  varying vec3 vHalf;
  varying float vSeed;
  varying float vStyle;
  #include <fog_pars_fragment>

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec3 n = normalize(vNormalObj);
    float height = vHalf.y;
    vec3 base = vStyle < 0.5 ? uColorA : (vStyle < 1.5 ? uColorB : uColorC);
    float diffuse = max(dot(n, normalize(vec3(0.45, 0.85, 0.3))), 0.0);
    vec3 col = base * (0.75 + 0.6 * diffuse);
    // Sky-lit tops, darker street level.
    col *= mix(0.6, 1.15, smoothstep(0.0, height, vLocal.y));

    if (abs(n.y) < 0.5) {
      bool alongZ = abs(n.x) > 0.5;
      float u = alongZ ? vLocal.z : vLocal.x;
      float halfWidth = alongZ ? vHalf.z : vHalf.x;
      vec2 cell = vec2(u / 1.1, vLocal.y / 1.7);
      vec2 id = floor(cell);
      vec2 f = fract(cell);
      // Anti-aliasing: as cells shrink below a few pixels, blend to their average.
      vec2 fw = fwidth(cell);
      float lod = clamp(max(fw.x, fw.y) * 2.6 - 0.35, 0.0, 1.0);

      float isWindow = step(0.2, f.x) * step(f.x, 0.8) * step(0.28, f.y) * step(f.y, 0.78);
      float band = step(1.0, id.y) * step(vLocal.y, height - 1.2) * step(abs(u), halfWidth - 0.45);
      float faceOffset = n.x * 13.0 + n.z * 7.0;
      float h = hash(id + vec2(vSeed * 91.0 + faceOffset, vSeed * 37.0));
      float litThreshold = 0.74 - vSeed * 0.12;
      float lit = step(litThreshold, h);
      // A few windows flicker slowly (frozen under reduced motion: uTime stays 0).
      lit *= 0.75 + 0.25 * step(0.08, fract(h * 17.0 + uTime * 0.05));
      vec3 windowColor = mix(uCool, uWarm, step(0.82, hash(id + 3.7)));
      float glow = 0.3 + 0.4 * hash(id + 9.1);

      vec3 sharp = isWindow * lit * windowColor * glow;
      vec3 average = 0.3 * (1.0 - litThreshold) * mix(uCool, uWarm, 0.18) * 0.5;
      col += mix(sharp, average, lod) * uWindows * band;
      col = mix(col, col * 0.7 + vec3(0.01, 0.02, 0.045), isWindow * (1.0 - lit) * 0.5 * (1.0 - lod) * band);

      // Vertical edge highlight keeps silhouettes readable at night.
      float edge = 1.0 - smoothstep(0.0, 0.22, halfWidth - abs(u));
      col += uRim * edge * (vStyle > 1.5 ? 0.35 : 0.12) * smoothstep(0.0, height, vLocal.y);
    }
    // Roofline glow.
    float rim = smoothstep(height - 0.35, height - 0.02, vLocal.y) * (abs(n.y) < 0.5 ? 1.0 : 0.0);
    col += uRim * rim * (vStyle > 1.5 ? 1.0 : 0.4);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;

export const groundVertex = /* glsl */ `
  varying vec2 vWorld;
  #include <fog_pars_vertex>
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

export const groundFragment = /* glsl */ `
  uniform vec3 uGround;
  uniform vec3 uRoad;
  uniform vec3 uLine;
  uniform vec3 uSidewalk;
  uniform float uTime;
  uniform vec3 uPads[5];
  uniform vec3 uPadColors[5];
  varying vec2 vWorld;
  #include <fog_pars_fragment>

  void main() {
    vec2 p = vWorld;
    float city = step(max(abs(p.x), abs(p.y)), 73.0);
    // Distance to the nearest road centre line (roads at ±10, ±30, ±50, ±70).
    float dx = abs(mod(p.x, 20.0) - 10.0);
    float dz = abs(mod(p.y, 20.0) - 10.0);
    float roadX = step(dx, 3.0);
    float roadZ = step(dz, 3.0);
    float road = max(roadX, roadZ) * city;
    float intersection = roadX * roadZ;

    vec3 col = mix(uGround, uSidewalk, city);
    col = mix(col, uRoad, road);

    // Curb lines.
    float curb = (1.0 - smoothstep(0.0, 0.07, abs(dx - 3.0))) * (1.0 - roadZ) + (1.0 - smoothstep(0.0, 0.07, abs(dz - 3.0))) * (1.0 - roadX);
    col += uLine * curb * city * 0.35;
    // Dashed centre lines (not inside intersections).
    float dashX = (1.0 - smoothstep(0.04, 0.09, dx)) * step(0.5, fract(p.y / 4.0)) * (1.0 - intersection);
    float dashZ = (1.0 - smoothstep(0.04, 0.09, dz)) * step(0.5, fract(p.x / 4.0)) * (1.0 - intersection);
    col += uLine * (dashX + dashZ) * city * 0.55;

    // Boulevard towards the Spire: a lit walkway with chevrons pointing north.
    float boulevard = step(max(abs(p.x), abs(p.y + 20.0)), 7.0);
    float walkway = (1.0 - smoothstep(1.4, 1.5, abs(p.x))) * boulevard;
    col = mix(col, uRoad, walkway * 0.8);
    float chevron = 1.0 - smoothstep(0.0, 0.08, abs(fract((p.y + abs(p.x) * 0.8) / 3.0) - 0.5) - 0.42);
    col += uLine * chevron * walkway * 0.35;
    col += uLine * (1.0 - smoothstep(0.0, 0.05, abs(abs(p.x) - 1.5))) * boulevard * 0.5;

    // Central plaza: concentric rings.
    float r = length(p);
    float plaza = 1.0 - step(7.0, max(abs(p.x), abs(p.y)));
    float rings = (1.0 - smoothstep(0.0, 0.06, abs(fract(r / 1.6) - 0.5) - 0.44)) * plaza;
    col += uLine * rings * 0.12;
    col += uLine * (1.0 - smoothstep(0.0, 0.08, abs(r - 6.0))) * 0.6;

    // Landmark pads glow in their district colour.
    for (int i = 0; i < 5; i++) {
      float d = length(p - uPads[i].xy) - uPads[i].z;
      col += uPadColors[i] * (1.0 - smoothstep(0.0, 0.12, abs(d))) * 0.9;
      col += uPadColors[i] * (1.0 - smoothstep(0.0, 4.0, max(d, 0.0))) * 0.07;
    }

    // Outside the walkable city: a faint survey grid.
    float gx = 1.0 - smoothstep(0.0, 0.05, abs(fract(p.x / 10.0) - 0.5) - 0.47);
    float gz = 1.0 - smoothstep(0.0, 0.05, abs(fract(p.y / 10.0) - 0.5) - 0.47);
    col += uLine * max(gx, gz) * (1.0 - city) * 0.08;

    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;

export const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSpeed;
  attribute float aSize;
  varying float vAlpha;
  #include <fog_pars_vertex>
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * aSpeed, 46.0) + 0.5;
    p.x += sin(uTime * 0.2 + position.z) * 0.6;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (60.0 / -mvPosition.z);
    vAlpha = smoothstep(0.0, 6.0, p.y) * (1.0 - smoothstep(34.0, 46.0, p.y));
    #include <fog_vertex>
  }
`;

export const particleFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  #include <fog_pars_fragment>
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.1, 0.5, d)) * vAlpha;
    gl_FragColor = vec4(uColor, a * 0.8);
    #include <fog_fragment>
  }
`;

export const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(1.0 - clamp(d, 0.0, 1.0), 2.2) * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;

export const uvVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    #ifdef USE_INSTANCING
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    #else
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #endif
  }
`;
