/* 仪表盘:①烛数+转速+τ ②ω 历史曲线(阶梯响应) ③叶轮俯视 ④热流示意 */
(function (MECH) {
  var el = {}, D = MECH.DIM;
  var soft = "rgba(233,238,242,0.5)";
  var omegaHist = [];

  MECH.DASH = { panels: [
    { title: "SPEED · 烛数与转速", meta: "ω=k·n", dot: "teal",
      html: '<div class="big" id="d-rpm">0</div><div class="k">RPM · 目标 ' + Math.round(D.k * 1 / (2 * Math.PI) * 60) + '</div>' +
            '<div class="bar"><i id="d-bar"></i></div>' +
            '<div class="rowline"><span>烛数</span><b id="d-cn">1</b></div>' +
            '<div class="chip" id="d-chip">—</div>',
      init: initSpd, draw: drawSpd },
    { title: "RESPONSE · ω 响应曲线", meta: "τ≈1.6s", dot: "blue", canvasH: 96, draw: drawResp },
    { title: "TOP · 叶轮俯视", meta: "12 叶 45° + 4 马", dot: "yellow", canvasH: 96, draw: drawTop },
    { title: "HEAT · 热流示意", meta: "烛→气流→叶轮", dot: "green", canvasH: 96, draw: drawHeat }
  ] };

  function initSpd(sec) {
    el.rpm = sec.querySelector("#d-rpm");
    el.bar = sec.querySelector("#d-bar");
    el.cn = sec.querySelector("#d-cn");
    el.chip = sec.querySelector("#d-chip");
  }

  function drawSpd(st, ph, pt, ctx, w, h) {
    var rpm = st.omega / (2 * Math.PI) * 60;
    if (el.rpm) el.rpm.textContent = String(Math.round(rpm));
    if (el.bar) el.bar.style.width = Math.min(100, rpm / (D.k * 4 / (2 * Math.PI) * 60) * 100) + "%";
    if (el.cn) el.cn.textContent = st.candles + " / 4";
    if (el.chip) {
      var target = D.k * st.candles;
      var ok = Math.abs(st.omega - target) < 0.06;
      el.chip.textContent = st.candles === 0 ? "全熄 · 慢停" :
        (ok ? "稳态 " + Math.round(target / (2 * Math.PI) * 60) + " RPM" : "热流建立中…");
      el.chip.className = "chip" + (ok ? " on" : st.candles > 0 ? " warn" : "");
    }
  }

  function drawResp(st, ph, pt, ctx, w, h) {
    omegaHist.push(st.omega);
    if (omegaHist.length > 200) omegaHist.shift();
    ctx.clearRect(0, 0, w, h);
    var maxW = D.k * 4.2;
    ctx.strokeStyle = "rgba(233,238,242,0.16)";
    ctx.beginPath(); ctx.moveTo(0, h - 12); ctx.lineTo(w, h - 12); ctx.stroke();
    /* 目标阶梯(烛数) */
    ctx.strokeStyle = "rgba(233,201,60,0.5)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (var i = 0; i < omegaHist.length; i++) {
      var px = i / 199 * w;
      var py = h - 12 - Math.min(1, omegaHist[i] / maxW) * (h - 20);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = soft;
    ctx.font = "600 7.5px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("ω 实测(阶梯响应可见,τ≈1.6s)", 4, 10);
  }

  /* ③ 叶轮俯视:12 叶 45° + 4 马 */
  function drawTop(st, ph, pt, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    var cx = w * 0.42, cy = h / 2, R = Math.min(cx, cy) - 8;
    ctx.strokeStyle = "rgba(233,238,242,0.3)";
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    for (var i = 0; i < D.blades; i++) {
      var a = i / D.blades * Math.PI * 2 + st.phi;
      ctx.strokeStyle = "#B08D57";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.45, cy + Math.sin(a) * R * 0.45);
      ctx.lineTo(cx + Math.cos(a + 0.7) * R, cy + Math.sin(a + 0.7) * R);
      ctx.stroke();
    }
    for (var k = 0; k < D.horseN; k++) {
      var ha = k / D.horseN * Math.PI * 2 + st.phi;
      ctx.fillStyle = k % 2 ? "#E86A9E" : "#B08D57";
      ctx.fillRect(cx + Math.cos(ha) * R * 1.15 - 3, cy + Math.sin(ha) * R * 1.15 - 3, 6, 6);
    }
    ctx.fillStyle = soft;
    ctx.font = "600 7.5px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("逆时针(热推)", 4, 12);
  }

  /* ④ 热流示意:烛点 → 上升箭头 → 叶轮 */
  function drawHeat(st, ph, pt, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2;
    /* 烛点 */
    for (var k = 0; k < 4; k++) {
      var x = cx - 27 + k * 18;
      var on = k < st.candles;
      ctx.fillStyle = on ? "#F2A53A" : "rgba(233,238,242,0.2)";
      ctx.beginPath(); ctx.arc(x, h - 18, 5, 0, Math.PI * 2); ctx.fill();
    }
    /* 上升气流箭头 */
    var n = 2 + st.candles * 2;
    ctx.strokeStyle = "rgba(127,216,216,0.6)";
    ctx.lineWidth = 1.6;
    for (var i = 0; i < n; i++) {
      var x2 = cx - 24 + (i + 0.5) * 48 / Math.max(n, 1);
      var y0 = h - 26 - (st.time * 30 + i * 12) % 40;
      ctx.beginPath();
      ctx.moveTo(x2, y0 + 8);
      ctx.lineTo(x2, y0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2 - 2.5, y0 + 3);
      ctx.lineTo(x2, y0 - 1);
      ctx.lineTo(x2 + 2.5, y0 + 3);
      ctx.stroke();
    }
    /* 叶轮 */
    ctx.strokeStyle = "#B08D57";
    ctx.beginPath(); ctx.arc(cx, 16, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, 16);
    ctx.lineTo(cx + Math.cos(st.phi) * 12, 16 + Math.sin(st.phi) * 12);
    ctx.stroke();
    ctx.fillStyle = soft;
    ctx.font = "600 7.5px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("烛数 n → ω_target = k·n(阶梯)", 4, 10);
  }
})(window.MECH = window.MECH || {});
