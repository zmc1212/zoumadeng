/* 图纸面板核心(B 键切换):全屏图纸面板 = 矢量重绘图 + 尺寸表。
   站点 blueprint.js 提供:
   MECH.BP = { no:"Fig. 01", title:"指南车总图", src:"《宋史·舆服志》",
               draw(ctx, w, h), table:"<table>…</table>" } */
(function (MECH) {
  var root = null, canvas = null, ctx = null, tableEl = null;
  var isOpen = false;

  function init() {
    root = document.createElement("div");
    root.id = "bp";
    root.hidden = true;
    root.innerHTML =
      '<div id="bp-inner">' +
      '<div id="bp-head"><div><div id="bp-no"></div><div id="bp-title"></div></div>' +
      '<div id="bp-src"></div></div>' +
      '<div id="bp-body"><div id="bp-canvas-wrap"><canvas id="bp-canvas"></canvas></div>' +
      '<div id="bp-table"></div></div>' +
      '<div id="bp-foot">B 关闭图纸 · 按 1-8 返回机构 · 图为依据文献尺寸矢量重绘(示意,非原件影印)</div>' +
      '</div>';
    document.getElementById("sheet").appendChild(root);
    canvas = document.getElementById("bp-canvas");
    ctx = canvas.getContext("2d");
    tableEl = document.getElementById("bp-table");
    window.addEventListener("resize", function () { if (isOpen) draw(); });
  }

  function fill() {
    var bp = MECH.BP || {};
    document.getElementById("bp-no").textContent = bp.no || "";
    document.getElementById("bp-title").textContent = bp.title || "";
    document.getElementById("bp-src").textContent = bp.src || "";
    tableEl.innerHTML = bp.table || "";
    draw();
  }

  function draw() {
    var wrap = document.getElementById("bp-canvas-wrap");
    var w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    var x = canvas.getContext("2d");
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (MECH.BP && MECH.BP.draw) MECH.BP.draw(x, w, h);
  }

  function toggle(force) {
    isOpen = force !== undefined ? force : !isOpen;
    if (isOpen) fill();
    root.hidden = !isOpen;
    if (isOpen) draw();
  }

  MECH.Blueprint = { init: init, toggle: toggle, redraw: draw, get isOpen() { return isOpen; } };
})(window.MECH = window.MECH || {});
