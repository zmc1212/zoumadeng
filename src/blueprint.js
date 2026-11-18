/* 图纸面板(B 键):走马灯剖视图 + 叶片安装角详图 + 公式 + 尺寸表 */
(function (MECH) {
  var red = "#8C2F1E";

  MECH.BP = {
    no: "Fig. 19 · 复原剖视图",
    title: "走马灯 · 热气推轮 · 人马宛转",
    src: "《燕京岁时记》走马灯 · 原理同燃气轮机(热气流冲击叶轮)",
    draw: function (ctx, w, h) {
      var D = MECH.DIM;
      ctx.clearRect(0, 0, w, h);
      var chainH = 44, chainY = h - chainH - 12, topY = 34;
      var ink = "#2A2620";
      ctx.fillStyle = red;
      ctx.font = "700 11px Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText("ω_target = k·n(k=1.35 rad/s/支)· τ≈1.6s · 12 叶均布 30° · 4 马 90°", w * 0.045, topY - 10);

      /* ============ 左:剖视图 ============ */
      var S = Math.min(w * 0.42 / 1.0, (chainY - topY - 26) / 1.0);
      var ox = w * 0.05, oy = chainY - 16;
      var X = function (m) { return ox + (m + 0.34) * S; }, Y = function (m) { return oy - m * S; };
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      ctx.lineWidth = 1.4;
      ctx.font = "700 11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("剖视 SECTION", ox, Y(0.94));
      /* 纸罩(虚线) */
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(X(-D.shadeR), Y(D.axleH * 0.62 + D.shadeH / 2), D.shadeR * 2 * S, D.shadeH * S);
      ctx.setLineDash([]);
      ctx.font = "600 8px sans-serif";
      ctx.fillStyle = "rgba(42,38,32,0.6)";
      ctx.fillText("纸罩(马影投面)", X(-D.shadeR), Y(D.axleH * 0.62 + D.shadeH / 2) - 4);
      /* 立轴 */
      ctx.beginPath(); ctx.moveTo(X(0), Y(0.10)); ctx.lineTo(X(0), Y(D.axleH)); ctx.stroke();
      /* 叶轮(俯视横线) */
      ctx.beginPath();
      ctx.moveTo(X(-D.wheelR), Y(D.axleH));
      ctx.lineTo(X(D.wheelR), Y(D.axleH));
      ctx.stroke();
      for (var i = 0; i < 6; i++) {
        var bx = X(-D.wheelR + i * (2 * D.wheelR / 5));
        ctx.beginPath();
        ctx.moveTo(bx, Y(D.axleH));
        ctx.lineTo(bx + 0.03 * S * Math.cos(D.bladeAngle), Y(D.axleH) - 0.03 * S * Math.sin(D.bladeAngle));
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(42,38,32,0.6)";
      ctx.fillText("叶轮 12 叶 · 安装角 45°", X(-D.wheelR), Y(D.axleH) - 8);
      /* 纸马 */
      ctx.strokeRect(X(-D.horseR) - 5, Y(D.axleH - 0.075) - 4, 10, 7);
      ctx.fillStyle = "rgba(42,38,32,0.6)";
      ctx.fillText("纸马挂环", X(-D.horseR) - 5, Y(D.axleH - 0.075) - 8);
      /* 烛 */
      ctx.beginPath(); ctx.arc(X(-0.075), Y(0.13), 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(0.075), Y(0.13), 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(-0.075), Y(0.13) - 6); ctx.lineTo(X(-0.075), Y(0.13) - 16);
      ctx.moveTo(X(0.075), Y(0.13) - 6); ctx.lineTo(X(0.075), Y(0.13) - 16);
      ctx.stroke();
      ctx.fillText("烛位 ×4", X(-0.075) - 18, Y(0.13) + 12);
      /* 底座 */
      ctx.strokeRect(X(-0.17), Y(0), 0.34 * S, 0.1 * S);

      /* ============ 右:ω-烛数响应 ============ */
      var ox2 = w * 0.55;
      ctx.font = "700 11px sans-serif";
      ctx.fillStyle = ink;
      ctx.fillText("ω-烛数阶梯响应", ox2, topY + 18);
      var gx = ox2, gy = topY + 32, gw = w - ox2 - 24, gh = (chainY - gy) * 0.5;
      ctx.strokeStyle = "rgba(42,38,32,0.5)";
      ctx.strokeRect(gx, gy, gw, gh);
      /* 三档稳态线 */
      var maxY = D.k * 4.2;
      [[1, "1 烛"], [2, "2 烛"], [4, "4 烛"]].forEach(function (row) {
        var y = gy + gh - D.k * row[0] / maxY * gh;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(gx + 4, y); ctx.lineTo(gx + gw - 4, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = "600 8px sans-serif";
        ctx.fillStyle = "rgba(42,38,32,0.55)";
        ctx.fillText(row[1] + " " + (D.k * row[0]).toFixed(2), gx + gw - 56, y - 3);
      });
      ctx.fillStyle = "rgba(42,38,32,0.55)";
      ctx.fillText("τ≈1.6s 热流惯性", gx + 8, gy + 14);

      /* ============ 底部:参数链 ============ */
      var boxes = [
        ["烛焰加热", "n=1..4 支"], ["热气上升", "冲叶轮"], ["叶片 45°", "12 叶均布"],
        ["叶轮自转", "ω=k·n"], ["纸马环行", "同轴 ×4"], ["马影投罩", "宛转如生"]
      ];
      var bwid = (w * 0.91) / boxes.length;
      for (var b = 0; b < boxes.length; b++) {
        var bx2 = w * 0.045 + b * bwid;
        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.strokeRect(bx2, chainY, bwid - 10, chainH);
        ctx.font = "700 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(boxes[b][0], bx2 + (bwid - 10) / 2, chainY + 17);
        ctx.font = "600 8.5px Menlo, monospace";
        ctx.fillStyle = "rgba(42,38,32,0.55)";
        ctx.fillText(boxes[b][1], bx2 + (bwid - 10) / 2, chainY + 32);
        if (b < boxes.length - 1) {
          ctx.beginPath();
          ctx.moveTo(bx2 + bwid - 10, chainY + 20);
          ctx.lineTo(bx2 + bwid - 2, chainY + 20);
          ctx.stroke();
        }
      }
    },
    table:
      '<h4>灯体</h4><table>' +
      '<tr><th>纸罩</th><td>高 0.42 · 径 0.34(半透)</td><td>马影投面</td></tr>' +
      '<tr><th>立轴</th><td>高 0.46 · 竹签</td><td>—</td></tr>' +
      '<tr><th>叶轮</th><td>12 叶 · 安装角 45° · 轮径 0.20</td><td>—</td></tr>' +
      '<tr><th>纸马(×4)</th><td>90° 等分 · 环行半径 0.13</td><td>红/铜相间</td></tr>' +
      '<tr><th>烛位(×4)</th><td>90° 等分 · 火苗随烛数明灭</td><td>—</td></tr>' +
      '</table><h4>运动学</h4><table>' +
      '<tr><th>稳态角速度</th><td>ω = k·n = 1.35×n</td><td>1.35~5.4 rad/s</td></tr>' +
      '<tr><th>对应转速</th><td>13 / 26 / 52 RPM(1/2/4 烛)</td><td>—</td></tr>' +
      '<tr><th>热流惯性</th><td>τ ≈ 1.6 s(一阶趋近)</td><td>—</td></tr>' +
      '</table><h4>运行期自检</h4>' +
      '<p>载入模拟 1/2/4 烛各 8s:稳态 ω 与 k·n 偏差 > 0.06 rad/s 拒绝启动;熄烛衰减同理校验。</p>' +
      '<h4>文献</h4>' +
      '<p>《燕京岁时记》:「走马灯者,剪纸为轮,以烛嘘之,则车驰马骤,团团不休」——热气流推叶轮,即燃气轮机之雏形。</p>'
  };
})(window.MECH = window.MECH || {});
