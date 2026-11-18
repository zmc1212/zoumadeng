/* 时间线(44s):底座烛台 → 立轴 → 叶轮纸马 → 纸罩合拢 →
   双烛对照 → 四烛全速 → 熄烛慢停(τ 实测) → 手动调烛(←/→) */
(function (MECH) {
  var KS = MECH.KS, D = MECH.DIM;

  MECH.PHASES = [
    { id: "base", name: "BASE · 底座烛台", dur: 4, dot: "yellow", mode: "ASSEMBLING",
      cam: { theta: 0.55, phi: 1.24, r: 2.6, target: [0, 0.25, 0] }, drift: 0.03 },
    { id: "axle", name: "AXLE · 立轴", dur: 3, dot: "teal", mode: "ASSEMBLING",
      cam: { theta: 0.30, phi: 1.26, r: 2.0, target: [0, 0.35, 0] }, drift: 0.01 },
    { id: "wheel", name: "WHEEL · 12 叶轮 45°", dur: 4, dot: "orange", mode: "ASSEMBLING",
      cam: { theta: 0.0, phi: 1.10, r: 1.8, target: [0, 0.52, 0] }, drift: 0.01 },
    { id: "shade", name: "SHADE · 纸罩合拢 · 一烛起转", dur: 5, dot: "pink", mode: "RUNNING",
      cam: { theta: -0.35, phi: 1.22, r: 2.6, target: [0, 0.35, 0] }, drift: 0.015 },
    { id: "two", name: "TWO · 双烛对照(←/→ 可调)", dur: 7, dot: "green", mode: "RUNNING",
      cam: { theta: 0.65, phi: 1.20, r: 2.8, target: [0, 0.38, 0] }, drift: 0.01 },
    { id: "four", name: "FOUR · 四烛全速", dur: 7, dot: "blue", mode: "FAST",
      cam: { theta: -0.5, phi: 1.22, r: 3.0, target: [0, 0.40, 0] }, drift: 0.02 },
    { id: "decay", name: "DECAY · 熄烛慢停(τ 实测)", dur: 7, dot: "yellow", mode: "DECAY",
      cam: { theta: 0.20, phi: 1.24, r: 2.8, target: [0, 0.38, 0] }, drift: 0.01 },
    { id: "manual", name: "MANUAL · ←/→ 调烛数", dur: 8, dot: "red", mode: "MANUAL",
      cam: { theta: -0.3, phi: 1.20, r: 3.0, target: [0, 0.38, 0] }, drift: 0.02 }
  ];
  MECH.PHASE_IDS = ["base", "axle", "wheel", "shade", "two", "four", "decay", "manual"];

  var autoCandles = { shade: 1, two: 2, four: 4, decay: 0 };

  MECH.newState = KS.newState;

  MECH.tick = function (st, ph, pt, dt) {
    if (ph.id !== st.lastPhase) {
      st.lastPhase = ph.id;
      st.manual = ph.id === "manual";
      if (autoCandles[ph.id] !== undefined) st.candles = autoCandles[ph.id];
    }
    if (st.manual && MECH.keys) {
      var L = MECH.keys.left, R = MECH.keys.right;
      if (L && !st._keyL) st.candles = Math.min(4, st.candles + 1);
      if (R && !st._keyR) st.candles = Math.max(0, st.candles - 1);
      st._keyL = L; st._keyR = R;
    }
    var prev = st.omega;
    KS.step(st, dt);
  };

  MECH.status = function (st, ph, pt) {
    var rpm = st.omega / (2 * Math.PI) * 60;
    var pill = ph.name;
    if (ph.id === "two" || ph.id === "four" || ph.id === "manual") pill = ph.name + " · " + rpm.toFixed(1) + " RPM";
    if (ph.id === "decay") pill = "DECAY · ω 衰减 " + st.omega.toFixed(2) + " rad/s";
    return {
      mode: ph.mode,
      hot: st.candles >= 3,
      pill: pill,
      a: "烛 " + st.candles + "/4",
      b: rpm.toFixed(1) + " RPM",
      c: (st.omega / (2 * Math.PI)).toFixed(2) + " 转/s"
    };
  };

  MECH.pinnedFor = function (ph) {
    function E(id) { var e = MECH.Parts.entry(id); return e ? (e.anchor || e.group) : null; }
    if (ph.id === "wheel") return [{ id: "p-w", obj: E("wheel"), text: "12 叶 · 安装角 45°" }];
    if (ph.id === "shade") return [
      { id: "p-sh", obj: E("shade"), text: "纸罩半透 · 马影投罩" },
      { id: "p-h", obj: E("horses"), text: "纸马 ×4 · 绕轴环行", tone: "white" }
    ];
    if (ph.id === "two" || ph.id === "four" || ph.id === "manual") return [
      { id: "p-w", obj: E("wheel"), text: "ω = k·n(n=烛数,k=1.35)" },
      { id: "p-h", obj: E("horses"), text: "热气推轮 · 人马宛转", tone: "white" }
    ];
    if (ph.id === "decay") return [{ id: "p-w", obj: E("wheel"), text: "熄烛 → ω 指数衰减 τ≈1.6s" }];
    return [];
  };
})(window.MECH = window.MECH || {});
