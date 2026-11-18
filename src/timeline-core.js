/* 时间线核心:阶段推进 / 相机接管 / seek 对齐 / DOM 状态卡。
   站点 timeline.js 提供:
   MECH.PHASES     = [{id,name,dur,dot,mode,cam:{theta,phi,r,target},drift}, ...]
   MECH.PHASE_IDS  = [8 个阶段 id(数字键 1-8)]
   MECH.newState   = fn() 状态对象
   MECH.tick       = fn(state, ph, pt, dt) 每帧运动学/事件(相机调整前)
   MECH.status     = fn(state, ph, pt) → {mode, hot?, pill, a?, b?, c?}
   MECH.pinnedFor  = fn(ph, state) → [{id,obj,text,sub?,tone?}] 阶段固定标签
   MECH.camAdj     = fn(state, ph, pt) → {theta?,phi?,r?,target?} 可选镜头覆盖
   MECH.onSeek     = fn(i, state, ph) 可选 seek 状态补偿 */
(function (MECH) {
  var idx = -1, pt = 0, cycleT = 0, paused = false;
  var state = null;
  var dom = {};
  var PHASE_START = [];

  function computeStarts() {
    PHASE_START = [];
    var acc = 0;
    MECH.PHASES.forEach(function (ph) { PHASE_START.push(acc); acc += ph.dur; });
  }

  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    dom = { mode: $("st-mode"), a: $("st-a"), b: $("st-b"), c: $("st-c"),
            pill: $("phase-text"), dot: $("phase-dot") };
  }

  function resetCycle() {
    MECH.Parts.reset();
    MECH.Labels.clearAnnounce();
    state = MECH.newState();
    cycleT = 0;
    enter(0);
  }

  function enter(i) {
    idx = i;
    pt = 0;
    if (i === 0) MECH.Parts.begin();
    MECH.Labels.setPinned(MECH.pinnedFor ? MECH.pinnedFor(MECH.PHASES[i], state) : []);
  }

  function applyStatus(ph) {
    var s = MECH.status ? MECH.status(state, ph, pt) : null;
    if (!s) return;
    if (dom.mode) {
      dom.mode.textContent = s.mode || ph.mode;
      dom.mode.className = "mode" + (s.hot ? " hot" : "");
    }
    if (dom.a && s.a !== undefined) dom.a.textContent = s.a;
    if (dom.b && s.b !== undefined) dom.b.textContent = s.b;
    if (dom.c && s.c !== undefined) dom.c.textContent = s.c;
    if (dom.pill) dom.pill.textContent = s.pill || ph.name;
    if (dom.dot) dom.dot.className = ph.dot;
  }

  function update(dt) {
    if (paused) return;
    dt = Math.min(dt, 0.05);
    cycleT += dt;
    pt += dt;

    var ph = MECH.PHASES[idx];
    if (pt >= ph.dur) {
      if (idx >= MECH.PHASES.length - 1) resetCycle();
      else enter(idx + 1);
      ph = MECH.PHASES[idx];
    }

    /* ---- 相机 ---- */
    var cam = { theta: ph.cam.theta, phi: ph.cam.phi, r: ph.cam.r, target: ph.cam.target.slice() };
    if (MECH.camAdj) {
      var o = MECH.camAdj(state, ph, pt);
      if (o) {
        if (o.theta !== undefined) cam.theta = o.theta;
        if (o.phi !== undefined) cam.phi = o.phi;
        if (o.r !== undefined) cam.r = o.r;
        if (o.target) cam.target = o.target;
      }
    }
    MECH.orbitCtl.autoDrift = ph.drift !== undefined ? ph.drift : 0.02;
    MECH.orbitCtl.flyTo(cam);

    /* ---- 站点运动学 ---- */
    MECH.tick(state, ph, pt, dt);        // state.time 由站点自行累计(引擎不覆盖)
    state.seated = MECH.Parts.seatedCount;
    state.phaseId = ph.id;

    MECH.Parts.update(cycleT, state);
    applyStatus(ph);
    MECH.Dash.update(state, ph, pt);
  }

  MECH.Timeline = {
    init: function () {
      computeStarts();
      cacheDom();
      state = MECH.newState();
    },
    start: function () {
      enter(0);
    },
    restart: resetCycle,
    /* 跳转到指定阶段(键盘 1-8 / 后台验收):sealUpTo + 站点补偿 */
    seek: function (id) {
      var i = -1;
      for (var k = 0; k < MECH.PHASES.length; k++) if (MECH.PHASES[k].id === id) i = k;
      if (i < 0) return;
      MECH.Parts.reset();
      MECH.Labels.clearAnnounce();
      state = MECH.newState();
      cycleT = PHASE_START[i];
      MECH.Parts.begin();
      MECH.Parts.sealUpTo(i);
      if (MECH.onSeek) MECH.onSeek(i, state, MECH.PHASES[i]);
      enter(i);
      pt = 0;
    },
    update: update,
    togglePause: function () { paused = !paused; return paused; },
    get paused() { return paused; },
    get phaseId() { return MECH.PHASES[idx] ? MECH.PHASES[idx].id : ""; },
    get cycleT() { return cycleT; },
    get state() { return state; }
  };
})(window.MECH = window.MECH || {});
