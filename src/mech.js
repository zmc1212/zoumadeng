/* 走马灯 — 尺寸常量与热气叶轮运动学
   文献依据:《燕京岁时记》走马灯;原理为热气流推叶轮(燃气轮机雏形)。
   叶轮 12 叶(安装角 45°)顶置,纸马 4 匹绕轴;烛数 n ∈ 1..4,
   ω_target = k·n(k=1.35 rad/s/支),ω 一阶趋近(τ≈1.6s,载入期实测断言)。 */
(function (MECH) {
  var CHI = 0.3;
  var D = {
    CHI: CHI,
    shadeH: 0.42, shadeR: 0.17,
    axleH: 0.46, axleR: 0.006,
    wheelR: 0.10, blades: 12, bladeAngle: 45 * Math.PI / 180,
    horseN: 4, horseR: 0.13,
    candleN: 4,
    k: 1.35,                 // rad/s/支
    tau: 1.6                 // 热流惯性
  };

  function newState() {
    return {
      time: 0, phi: 0, omega: 0, omegaTarget: D.k,
      candles: 1,
      lastPhase: "", manual: false, _keyL: false, _keyR: false
    };
  }

  function step(st, dt) {
    st.time += dt;
    st.omegaTarget = D.k * st.candles;
    st.omega += (st.omegaTarget - st.omega) * Math.min(1, dt / D.tau * 2.2);
    st.phi += st.omega * dt;
  }

  MECH.DIM = D;
  MECH.KS = { newState: newState, step: step };

  (function selfCheck() {
    var errs = [];
    /* 三档烛数稳态 ω = k·n(模拟 8s,误差 < 0.05) */
    [1, 2, 4].forEach(function (n) {
      var st = newState();
      st.candles = n;
      for (var i = 0; i < 240; i++) step(st, 1 / 30);
      if (Math.abs(st.omega - D.k * n) > 0.06) errs.push("ω(n=" + n + ")=" + st.omega.toFixed(2) + " ≠ " + (D.k * n).toFixed(2));
      if (Math.abs(st.omega / (2 * Math.PI) * 60 - n * D.k / (2 * Math.PI) * 60) > 1) errs.push("RPM 项异常");
    });
    /* 12 叶均布 30°、4 马 90° */
    if (360 / D.blades !== 30 || 360 / D.horseN !== 90) errs.push("均布角异常");
    if (errs.length) {
      if (window.MECH_SHOW_BOOT_ERROR) window.MECH_SHOW_BOOT_ERROR("走马灯自检失败: " + errs.join(";"));
      throw new Error(errs.join(";"));
    }
  })();
})(window.MECH = window.MECH || {});
