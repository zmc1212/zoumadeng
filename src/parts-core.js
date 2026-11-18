/* 部件核心:注册表 + 装配飞行控制器 + 运动学分发。
   站点 parts.js 通过 MECH.P.def(...) 注册部件:
   kinds: static 贝塞尔飞入 / screw 飞入+拧转 / roll 沿 X 滚入(无滑移) /
          kine 运动学部件(built 返回 {group, anchor, kine}) / none 立即在位。
   每帧顺序:MECH.KINE(state)(场景级动件) → 各部件 kine → roll。 */
(function (MECH) {
  var list = [];
  var byId = {};
  var kineList = [];
  var seatedCount = 0;
  var flying = false;
  var refs = {};           // 站点可用:Parts.ref("needle", obj) 存运行中动件

  var ROTX = Math.PI / 2, ROTZ = Math.PI / 2;

  function mesh(geo, mat, x, y, z, cast, receive) {
    var m = new THREE.Mesh(geo, mat);
    if (x !== undefined) m.position.set(x, y, z);
    m.castShadow = cast !== false;
    m.receiveShadow = receive !== false;
    return m;
  }
  function box(w, h, d, mat, x, y, z) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
  function cyl(rt, rb, h, mat, x, y, z, seg) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat, x, y, z); }
  function torus(r, t, mat, x, y, z, seg) { return mesh(new THREE.TorusGeometry(r, t, 10, seg || 26), mat, x, y, z); }
  function sph(r, mat, x, y, z) { return mesh(new THREE.SphereGeometry(r, 16, 12), mat, x, y, z); }

  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function bez(p0, p1, p2, t) {
    var a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t;
    return new THREE.Vector3(
      a * p0[0] + b * p1[0] + c * p2[0],
      a * p0[1] + b * p1[1] + c * p2[1],
      a * p0[2] + b * p1[2] + c * p2[2]);
  }

  function def(o) {
    var built = o.build();
    var g = built.group || built;
    (o.world ? MECH.Scene3D.scene : MECH.Scene3D.root).add(g);
    var p = {
      id: o.id, name: o.name, sub: o.sub || null, phase: o.phase,
      at: o.at, dur: o.dur || 1.1, kind: o.kind || "static",
      group: g, anchor: built.anchor || null,
      kine: built.kine || null,
      target: o.target || [0, 0, 0],
      start: o.start || null, mid: o.mid || null,
      off: o.off || [0, 0, 0], offSign: o.offSign || 1,
      dist: o.dist || 0, wheelR: o.wheelR || 1, spin: o.spin || null,
      sealed: false, shown: false, line: null
    };
    g.userData.partId = o.id;
    if (p.kine) kineList.push(p.kine);
    list.push(p);
    byId[o.id] = p;
    return p;
  }

  function announce(p) {
    MECH.Labels.announce(p.id, p.anchor || p.group, p.name, p.sub, performance.now(), 2400);
  }

  function makeLine(p) {
    if (p.kind !== "static" && p.kind !== "screw") return null;
    var pts = [];
    for (var i = 0; i <= 24; i++) pts.push(bez(p.start, p.mid, p.target, i / 24));
    var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineDashedMaterial({ color: 0xB08D57, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.45 }));
    line.computeLineDistances();
    MECH.Scene3D.scene.add(line);
    return line;
  }

  function removeLine(p) {
    if (!p.line) return;
    MECH.Scene3D.scene.remove(p.line);
    p.line.geometry.dispose();
    p.line.material.dispose();
    p.line = null;
  }

  function sealOne(p) {
    p.sealed = true;
    seatedCount++;
    p.group.visible = true;
    if (p.kind === "kine") {
      /* kine 部件:几何以原点为中心建模,落座于 target;旋转由 kine 每帧接管 */
      p.group.position.set(p.target[0], p.target[1], p.target[2]);
      p.group.rotation.set(0, 0, 0);
    } else if (p.kind === "roll") {
      p.group.position.set(p.target[0], p.target[1] || 0, 0);
    } else {
      p.group.position.set(p.target[0], p.target[1], p.target[2]);
      p.group.rotation.x = 0;
    }
    removeLine(p);
  }

  function rollUpdate(p, cycleT) {
    if (p.sealed) return;
    var t = (cycleT - p.at) / p.dur;
    if (t <= 0) { p.group.visible = false; return; }
    if (!p.shown) { p.shown = true; p.group.visible = true; announce(p); }
    var tt = Math.min(t, 1);
    var e = 1 - Math.pow(1 - tt, 3);
    p.group.position.set(p.target[0] - p.dist * (1 - e), p.target[1] || 0, 0);
    if (p.spin) p.spin(p, (p.dist / p.wheelR) * e);   // 滚动无滑移:转角 = 位移 / 轮半径
    if (t >= 1) { p.sealed = true; seatedCount++; }
  }

  function applyKine(state) {
    if (MECH.KINE) MECH.KINE(state);
    kineList.forEach(function (k) { k(state); });
  }

  function update(cycleT, state) {
    applyKine(state);
    list.forEach(function (p) {
      if (p.kind === "roll") { rollUpdate(p, cycleT); return; }
      if (p.sealed) return;
      var t = (cycleT - p.at) / p.dur;
      if (t <= 0) { p.group.visible = false; return; }
      if (!p.shown) {
        p.shown = true;
        p.group.visible = true;
        if (!p.line && (p.kind === "static" || p.kind === "screw")) p.line = makeLine(p);
        announce(p);
      }
      var tt = Math.min(t, 1);
      var e = easeInOut(tt);
      if (p.kind === "kine") {
        p.group.position.set(
          p.target[0] + p.off[0] * (1 - e),
          p.target[1] + p.off[1] * (1 - e),
          p.target[2] + p.off[2] * (1 - e));
        p.group.rotation.y = (1 - e) * 0.4 * p.offSign;
      } else if (p.kind !== "none") {
        p.group.position.copy(bez(p.start, p.mid, p.target, e));
        if (p.kind === "screw") p.group.rotation.x = (1 - e) * 4.2;
      }
      if (t >= 1) sealOne(p);
    });
  }

  function resetAll() {
    flying = false;
    seatedCount = 0;
    list.forEach(function (p) {
      p.sealed = false;
      p.shown = false;
      p.group.visible = false;
      p.group.position.set(0, 0, 0);
      p.group.rotation.set(0, 0, 0);
      removeLine(p);
    });
  }

  function sealUpTo(phaseIdx) {
    flying = true;
    list.forEach(function (p) {
      if (p.phase < phaseIdx) {
        if (!p.sealed) sealOne(p);
        p.shown = true;
      }
    });
  }

  MECH.Parts = {
    init: function () {
      refs = {};
      kineList = [];
      list = [];
      byId = {};
      if (MECH.PART_DEFS) MECH.PART_DEFS();
      resetAll();
    },
    begin: function () {
      resetAll();
      flying = true;
      list.forEach(function (p) {
        if (p.kind === "none") { sealOne(p); p.shown = true; }
        else if (p.kind === "static" || p.kind === "screw") p.line = makeLine(p);
      });
    },
    update: update,
    reset: resetAll,
    sealUpTo: sealUpTo,
    ref: function (id, obj) { if (obj) refs[id] = obj; return refs[id]; },
    group: function (id) { return byId[id] ? byId[id].group : null; },
    list: function () { return list; },
    get seatedCount() { return seatedCount; },
    entry: function (id) { return byId[id] || null; }
  };

  /* 建模助手(站点 parts.js 使用) */
  MECH.P = { mesh: mesh, box: box, cyl: cyl, torus: torus, sph: sph, ROTX: ROTX, ROTZ: ROTZ, bez: bez, easeInOut: easeInOut };
  MECH._def = def;
})(window.MECH = window.MECH || {});
