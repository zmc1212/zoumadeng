/* 走马灯部件建模与注册(11 件)。
   纸罩圆柱(半透)+ 顶置 12 叶轮(45° 安装)+ 4 纸马环 + 底座烛台 4 烛。
   烛数由阶段/方向键控制:火苗出现/消失、光强、ω_target 联动。 */
(function (MECH) {
  var P = MECH.P, M3 = null, D = MECH.DIM;

  function group() { return new THREE.Group(); }

  function buildBase() {
    var g = group();
    g.add(P.cyl(0.16, 0.18, 0.06, M3.woodD, 0, 0.03, 0, 26));
    g.add(P.cyl(0.12, 0.14, 0.04, M3.brass, 0, 0.08, 0, 22));
    return g;
  }

  function buildCandle(k) {   // 烛 + 火苗
    var g = group();
    var a = k * Math.PI / 2;
    var x = Math.cos(a) * 0.075, z = Math.sin(a) * 0.075;
    g.add(P.cyl(0.018, 0.02, 0.10, M3.white, x, 0.13, z, 10));
    var wick = group();
    wick.add(P.mesh(new THREE.ConeGeometry(0.014, 0.05, 8),
      new THREE.MeshStandardMaterial({ color: 0xF2A53A, emissive: 0xF2A53A, emissiveIntensity: 1.6, transparent: true, opacity: 0.9 }),
      0, 0.028, 0));
    wick.position.set(x, 0.19, z);
    g.add(wick);
    g.userData.wick = wick;
    g.userData.k = k;
    return { group: g };
  }

  function buildAxle() {   // 立轴 + 顶横梁
    var g = group();
    g.add(P.cyl(D.axleR, D.axleR, D.axleH, M3.woodD, 0, D.axleH / 2 + 0.10, 0, 8));
    g.add(P.box(0.03, 0.03, 0.42, M3.woodD, 0, D.axleH + 0.11, 0));
    return g;
  }

  function buildWheel() {   // 12 叶轮(叶片安装角 45°)
    var g = group();
    g.add(P.torus(D.wheelR, 0.008, M3.wood, 0, 0, 0, 30));
    g.add(P.torus(D.wheelR * 0.45, 0.006, M3.wood, 0, 0, 0, 20));
    for (var i = 0; i < D.blades; i++) {
      var a = i / D.blades * Math.PI * 2;
      var b = P.box(D.wheelR * 0.62, 0.05, 0.004, M3.paper, 0, 0, 0);
      b.position.set(Math.cos(a) * D.wheelR * 0.72, 0.02 * (i % 2), Math.sin(a) * D.wheelR * 0.72);
      b.rotation.y = -a + Math.PI / 2 - D.bladeAngle;   // 45° 安装角
      g.add(b);
    }
    return { group: g };
  }

  function buildHorses() {   // 4 纸马剪影(平板,挂轮下)
    var g = group();
    var horses = [];
    for (var k = 0; k < D.horseN; k++) {
      var h = group();
      var body = P.box(0.09, 0.055, 0.004, k % 2 ? M3.lacquer : M3.bronze, 0, 0, 0);
      h.add(body);
      var head = P.box(0.028, 0.03, 0.004, k % 2 ? M3.lacquer : M3.bronze, 0.048, 0.032, 0);
      head.rotation.z = 0.5;
      h.add(head);
      var legF = P.box(0.008, 0.03, 0.004, k % 2 ? M3.lacquerD : M3.bronze, 0.032, -0.045, 0);
      h.add(legF);
      var legB = P.box(0.008, 0.03, 0.004, k % 2 ? M3.lacquerD : M3.bronze, -0.032, -0.045, 0);
      h.add(legB);
      var a = k / D.horseN * Math.PI * 2;
      h.position.set(Math.cos(a) * D.horseR, -0.075, Math.sin(a) * D.horseR);
      h.rotation.y = -a + Math.PI / 2;
      g.add(h);
      horses.push(h);
    }
    g.userData.horses = horses;
    return { group: g };
  }

  function buildShade() {   // 纸罩(半透圆柱)+ 上下木圈
    var g = group();
    var shade = new THREE.Mesh(
      new THREE.CylinderGeometry(D.shadeR, D.shadeR, D.shadeH, 36, 1, true),
      new THREE.MeshStandardMaterial({ map: M3.paper.map, transparent: true, opacity: 0.4, roughness: 0.85, side: THREE.DoubleSide }));
    shade.position.y = D.axleH * 0.62;
    shade.receiveShadow = true;
    g.add(shade);
    var ringT = P.torus(D.shadeR, 0.008, M3.woodD, 0, D.axleH * 0.62 + D.shadeH / 2, 0, 34);
    ringT.rotation.x = P.ROTX;
    g.add(ringT);
    var ringB = P.torus(D.shadeR, 0.008, M3.woodD, 0, D.axleH * 0.62 - D.shadeH / 2, 0, 34);
    ringB.rotation.x = P.ROTX;
    g.add(ringB);
    return g;
  }

  /* —— 注册 —— */
  MECH.PART_DEFS = function () {
    M3 = MECH.Scene3D.M;
    function def(o) { return MECH._def(o); }

    def({ id: "base", name: "BASE · 底座烛台", sub: "烛位 ×4", phase: 0, at: 0.15, dur: 1.0,
      build: buildBase, target: [0, 0, 0], start: [0, 1.4, 1.6], mid: [0, 0.7, 0.7], anchor: [0, 0.1, 0.3] });
    for (var k = 0; k < D.candleN; k++) {
      def({ id: "candle" + k, name: "CANDLE · 烛 " + (k + 1), sub: "火苗随烛数明灭", phase: 0, at: 0.7 + k * 0.35, dur: 0.8, kind: "kine",
        build: (function (kk) { return function () { return buildCandle(kk); }; })(k),
        target: [0, 0, 0], off: [(k % 2 ? 0.8 : -0.8), 1.0, 0.9] });
    }
    def({ id: "axle", name: "AXLE · 立轴", sub: "竹签轴", phase: 1, at: 2.6, dur: 1.0, kind: "kine",
      build: buildAxle, target: [0, 0, 0], off: [0, 1.4, 1.4] });
    def({ id: "wheel", name: "WHEEL · 12 叶轮", sub: "安装角 45°", phase: 2, at: 4.4, dur: 1.2, kind: "kine",
      build: buildWheel, target: [0, D.axleH + 0.06, 0], off: [0, 1.2, 1.4] });
    def({ id: "horses", name: "HORSES · 纸马 ×4", sub: "绕轴环行 90° 等分", phase: 2, at: 5.4, dur: 1.1, kind: "kine",
      build: buildHorses, target: [0, D.axleH - 0.02, 0], off: [0, 1.0, 1.4] });
    def({ id: "shade", name: "SHADE · 纸罩", sub: "半透 · 马影投罩", phase: 3, at: 7.4, dur: 1.2,
      build: buildShade, target: [0, 0, 0], start: [0, 3.0, 0], mid: [0, 1.8, 0.4], anchor: [0, 0.3, 0.35] });
  };

  /* —— 运动学分发 —— */
  var lightRef = null;
  MECH.KINE = function (st) {
    var e = MECH.Parts.entry("axle");
    if (e && e.shown) e.group.rotation.y = st.phi;
    e = MECH.Parts.entry("wheel");
    if (e && e.shown) e.group.rotation.y = st.phi;
    e = MECH.Parts.entry("horses");
    if (e && e.shown) e.group.rotation.y = st.phi;
    /* 烛火:烛数决定明灭 + 光强 */
    for (var k = 0; k < D.candleN; k++) {
      var c = MECH.Parts.entry("candle" + k);
      if (c && c.shown) {
        var on = k < st.candles;
        c.group.userData.wick.visible = on;
        c.group.userData.wick.scale.setScalar(on ? 0.8 + 0.25 * Math.sin(st.time * 12 + k * 2) : 0.001);
      }
    }
    /* 点光源:强度随烛数(挂一次) */
    if (!lightRef) {
      lightRef = new THREE.PointLight(0xFFB14E, 0, 3.5);
      lightRef.position.set(0, 0.35, 0);
      MECH.Scene3D.scene.add(lightRef);
    }
    lightRef.intensity = 0.25 * st.candles * (st.candles > 0 ? 1 : 0);
  };
})(window.MECH = window.MECH || {});
