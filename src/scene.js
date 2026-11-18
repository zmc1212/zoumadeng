/* 场景:渲染器 / 灯光 / 蓝图地面 / 材质库 / 根节点 / 粒子池
   站点可在加载期设置 MECH.FOG=[near,far] / MECH.FOV / MECH.FAR / MECH.SHADOW_BOX */
(function (MECH) {
  var M = {};              // 共享材质
  var sun = null;
  var groundTex = null;
  var pool = [];

  function mesh(geo, mat, x, y, z, cast, receive) {
    var m = new THREE.Mesh(geo, mat);
    if (x !== undefined) m.position.set(x, y, z);
    m.castShadow = cast !== false;
    m.receiveShadow = receive !== false;
    return m;
  }

  function makePool(scene, n) {
    var tex = MECH.Textures.puff();
    var arr = [];
    for (var i = 0; i < n; i++) {
      var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
      var sp = new THREE.Sprite(mat);
      sp.visible = false;
      scene.add(sp);
      arr.push({ sp: sp, life: -1, max: 1.1, vx: 0, vy: 0, vz: 0, base: 1, grow: 1.9 });
    }
    return arr;
  }

  function spawn(arr, x, y, z, opt) {
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      if (p.life >= 0) continue;
      p.life = 0;
      p.max = opt.max;
      p.base = opt.base;
      p.grow = opt.grow || 1.9;
      p.vx = opt.vx; p.vy = opt.vy; p.vz = opt.vz;
      p.sp.position.set(x, y, z);
      p.sp.scale.set(opt.base, opt.base, 1);
      p.sp.material.opacity = opt.opacity;
      p.sp.material.color.set(opt.tint || 0xE8E4DA);
      p.sp.visible = true;
      return;
    }
  }

  function stepPool(arr, dt) {
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      if (p.life < 0) continue;
      p.life += dt;
      var t = p.life / p.max;
      if (t >= 1) { p.life = -1; p.sp.visible = false; continue; }
      p.sp.scale.set(p.base * (0.35 + p.grow * t), p.base * (0.35 + p.grow * t), 1);
      p.sp.material.opacity = 0.62 * (1 - t) * (1 - t);
      p.sp.position.x += p.vx * dt;
      p.sp.position.y += p.vy * dt;
      p.sp.position.z += p.vz * dt;
      p.vy *= (1 - 0.65 * dt);
    }
  }

  function init() {
    var stage = document.getElementById("stage");
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    // 软件渲染(SwiftShader 等)下降像素比 + 精简阴影,保证可交互帧率
    var softGL = false;
    try {
      var gl = renderer.getContext();
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      var gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "";
      softGL = /swiftshader|software|basic render/i.test(String(gpu));
    } catch (e) { /* 保留默认 */ }
    renderer.setPixelRatio(softGL ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = softGL ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.physicallyCorrectLights = true;
    stage.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    scene.background = MECH.Textures.sky();
    var fog = MECH.FOG || [22, 58];
    scene.fog = new THREE.Fog(0x16324A, fog[0], fog[1]);

    var camera = new THREE.PerspectiveCamera(MECH.FOV || 38, stage.clientWidth / stage.clientHeight, 0.1, MECH.FAR || 140);
    camera.position.set(5, 4.2, 10.5);

    var hemi = new THREE.HemisphereLight(0xd8e8f5, 0x1c2c3c, 0.85);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff4e2, 2.0);
    sun.position.set(-6, 9, 7);
    sun.castShadow = true;
    var sb = MECH.SHADOW_BOX || 9;
    sun.shadow.mapSize.set(softGL ? 1024 : 2048, softGL ? 1024 : 2048);
    sun.shadow.camera.left = -sb; sun.shadow.camera.right = sb;
    sun.shadow.camera.top = sb; sun.shadow.camera.bottom = -sb;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    scene.add(sun.target);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    /* ---- 共享材质库(先建,零件全部依赖) ---- */
    M.wood = new THREE.MeshStandardMaterial({ map: MECH.Textures.wood("#8A5A2B", "rgba(70,42,16,0.5)"), roughness: 0.82, metalness: 0.05 });
    M.woodD = new THREE.MeshStandardMaterial({ map: MECH.Textures.wood("#5A3A1E", "rgba(40,24,8,0.55)"), roughness: 0.86, metalness: 0.05 });
    M.woodL = new THREE.MeshStandardMaterial({ map: MECH.Textures.wood("#A97844", "rgba(90,58,26,0.4)"), roughness: 0.8, metalness: 0.05 });
    M.lacquer = new THREE.MeshStandardMaterial({ color: 0x8C2F2A, roughness: 0.42, metalness: 0.12 });
    M.lacquerD = new THREE.MeshStandardMaterial({ color: 0x5E2420, roughness: 0.48, metalness: 0.12 });
    M.brass = new THREE.MeshStandardMaterial({ color: 0xB08D57, metalness: 0.8, roughness: 0.3 });
    M.bronze = new THREE.MeshStandardMaterial({ color: 0x8A6E3F, metalness: 0.62, roughness: 0.48 });
    M.gold = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.85, roughness: 0.25 });
    M.iron = new THREE.MeshStandardMaterial({ color: 0x23252A, metalness: 0.5, roughness: 0.52 });
    M.ironD = new THREE.MeshStandardMaterial({ color: 0x1A1C20, metalness: 0.5, roughness: 0.6 });
    M.steel = new THREE.MeshStandardMaterial({ color: 0xAEB4BC, metalness: 0.75, roughness: 0.34 });
    M.steelD = new THREE.MeshStandardMaterial({ color: 0x70767E, metalness: 0.6, roughness: 0.5 });
    M.white = new THREE.MeshStandardMaterial({ color: 0xE9EEF2, metalness: 0.05, roughness: 0.5 });
    M.dark = new THREE.MeshStandardMaterial({ color: 0x10131A, metalness: 0.1, roughness: 0.7 });
    M.rope = new THREE.MeshStandardMaterial({ color: 0xA98B5E, roughness: 0.92, metalness: 0.02 });
    M.water = new THREE.MeshStandardMaterial({ color: 0x4FA3C7, transparent: true, opacity: 0.55, roughness: 0.25, metalness: 0.1 });
    M.stone = new THREE.MeshStandardMaterial({ color: 0x6E7076, roughness: 0.9, metalness: 0.05 });
    M.paper = new THREE.MeshStandardMaterial({ map: MECH.Textures.paper(), roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide });

    /* ---- 蓝图地面 ---- */
    groundTex = MECH.Textures.ground();
    var ground = mesh(new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 }), 0, 0, 0, false, true);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    /* ---- 机构根节点 ---- */
    var root = new THREE.Group();
    scene.add(root);

    /* ---- 粒子池(蒸汽/水雾/尘) ---- */
    pool = makePool(scene, 30);

    MECH.Scene3D = {
      scene: scene,
      camera: camera,
      renderer: renderer,
      root: root,
      mesh: mesh,
      M: M,
      scrollGround: function (dx, dz) {
        if (!groundTex) return;
        groundTex.offset.x = dx / 8;         // 地贴 tile 世界宽度 8
        if (dz) groundTex.offset.y = -dz / 8;
      },
      spawnPuff: function (x, y, z, opt) {
        opt = opt || {};
        spawn(pool, x, y, z, {
          max: opt.max || 1.15,
          base: opt.base || 0.55,
          grow: opt.grow,
          vx: opt.vx !== undefined ? opt.vx : (Math.random() - 0.5) * 0.6,
          vy: opt.vy !== undefined ? opt.vy : 1.35 + Math.random() * 0.6,
          vz: opt.vz !== undefined ? opt.vz : (Math.random() - 0.5) * 0.6,
          opacity: opt.opacity || 0.62,
          tint: opt.tint
        });
      }
    };
  }

  function update(dt) {
    stepPool(pool, dt);
    if (sun) {
      var t = MECH.Scene3D ? MECH.Scene3D.camera.position : null;
      if (t) {
        // 太阳跟随注视目标,保证阴影范围稳定
        var tg = MECH.orbitCtl ? MECH.orbitCtl.target : null;
        if (tg) {
          sun.position.set(tg.x - 6, 9, tg.z + 7);
          sun.target.position.set(tg.x, 0, tg.z);
        }
      }
    }
  }

  MECH.SceneInit = init;
  MECH.SceneUpdate = update;
})(window.MECH = window.MECH || {});
