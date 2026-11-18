/* 底部仪表盘核心:按站点 MECH.DASH.panels 配置生成 DOM + 画布。
   panel = {title, meta?, dot?, html?, canvasH?, init?(section), draw?(state, ph, pt)} */
(function (MECH) {
  var panels = [];

  function build() {
    var dash = document.getElementById("dash");
    dash.innerHTML = "";
    panels = (MECH.DASH && MECH.DASH.panels) || [];
    panels.forEach(function (p) {
      var sec = document.createElement("section");
      sec.className = "panel";
      var header = '<header><i class="dot ' + (p.dot || "yellow") + '"></i><b>' + p.title + '</b>' +
        (p.meta ? '<span class="meta">' + p.meta + '</span>' : "") + '</header>';
      var body = '<div class="body">' + (p.html || "");
      sec.innerHTML = header + body;
      if (p.canvasH) {
        var c = document.createElement("canvas");
        c.style.display = "block";
        c.style.width = "100%";
        c.style.height = p.canvasH + "px";
        c.style.borderRadius = "4px";
        var bodyEl = sec.querySelector(".body");
        bodyEl.appendChild(c);
        p._ctx = mkCanvas(c, p.canvasH);
      }
      if (p.init) p.init(sec);
      dash.appendChild(sec);
    });
  }

  function mkCanvas(c, h) {
    var w = c.clientWidth || 160;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = w * dpr; c.height = h * dpr;
    var ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: w, h: h };
  }

  function update(state, ph, pt) {
    panels.forEach(function (p) {
      if (p.draw && p._ctx) p.draw(state, ph, pt, p._ctx.ctx, p._ctx.w, p._ctx.h);
      else if (p.draw) p.draw(state, ph, pt, null, 0, 0);
    });
  }

  MECH.Dash = { build: build, update: update, mkCanvas: mkCanvas };
})(window.MECH = window.MECH || {});
