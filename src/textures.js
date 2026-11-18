/* 程序化贴图:天空 / 蓝图地面网格 / 木纹 / 纸面 / 软粒子(零素材) */
(function (MECH) {
  function cv(w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  }

  /* 深蓝图纸风天空渐变 */
  function sky() {
    var c = cv(64, 256), x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#1E4058");
    g.addColorStop(0.55, "#16324A");
    g.addColorStop(1, "#102338");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 256);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* 蓝图地面:暗蓝纸 + 细网格 + 主网格线,tile 世界宽度 8 */
  function ground() {
    var c = cv(512, 512), x = c.getContext("2d");
    x.fillStyle = "#122C42";
    x.fillRect(0, 0, 512, 512);
    x.strokeStyle = "rgba(233,238,242,0.09)";
    x.lineWidth = 1;
    for (var i = 1; i < 16; i++) {
      var p = i * 32;
      x.beginPath(); x.moveTo(p + 0.5, 0); x.lineTo(p + 0.5, 512); x.stroke();
      x.beginPath(); x.moveTo(0, p + 0.5); x.lineTo(512, p + 0.5); x.stroke();
    }
    x.strokeStyle = "rgba(233,238,242,0.20)";
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, 1); x.lineTo(512, 1); x.stroke();
    x.beginPath(); x.moveTo(1, 0); x.lineTo(1, 512); x.stroke();
    /* 主格中心的十字刻度 */
    x.strokeStyle = "rgba(176,141,87,0.30)";
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(252, 256); x.lineTo(260, 256); x.moveTo(256, 252); x.lineTo(256, 260); x.stroke();
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(30, 30);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* 木纹:横向波浪纤维 + 结疤,固定伪随机保证稳定 */
  function wood(base, streak, size) {
    size = size || 256;
    var c = cv(size, size), x = c.getContext("2d");
    x.fillStyle = base;
    x.fillRect(0, 0, size, size);
    for (var i = 0; i < 52; i++) {
      var y0 = (i * 17.3 + (i * i * 7.1) % 23) % size;
      var amp = 1.5 + (i * 13.7) % 4;
      var alpha = 0.05 + ((i * 29) % 10) / 100;
      x.strokeStyle = (i % 5 === 0) ? streak : "rgba(0,0,0," + alpha.toFixed(2) + ")";
      x.lineWidth = 0.8 + ((i * 7) % 3) * 0.7;
      x.beginPath();
      for (var px = 0; px <= size; px += 8) {
        var py = y0 + Math.sin(px * 0.028 + i * 1.7) * amp;
        if (px === 0) x.moveTo(px, py); else x.lineTo(px, py);
      }
      x.stroke();
    }
    for (var k = 0; k < 5; k++) {
      var kx = (k * 83 + 31) % size, ky = (k * 131 + 57) % size;
      var kr = 4 + (k * 11) % 7;
      var g = x.createRadialGradient(kx, ky, 1, kx, ky, kr);
      g.addColorStop(0, "rgba(0,0,0,0.28)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.beginPath(); x.arc(kx, ky, kr, 0, Math.PI * 2); x.fill();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* 纸面(伞面/风箱纸糊/图轴) */
  function paper() {
    var c = cv(256, 256), x = c.getContext("2d");
    x.fillStyle = "#E7DCC2";
    x.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 260; i++) {
      var fx = (i * 97 + 13) % 256, fy = (i * 149 + 41) % 256;
      x.fillStyle = "rgba(120,96,60," + (0.04 + (i % 7) / 100).toFixed(3) + ")";
      x.fillRect(fx, fy, 1 + (i % 3), 1);
    }
    x.strokeStyle = "rgba(120,96,60,0.10)";
    x.lineWidth = 1;
    for (var j = 0; j < 8; j++) {
      x.beginPath();
      x.moveTo(0, j * 32.5);
      x.lineTo(256, j * 32.5 + 4);
      x.stroke();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* 软粒子贴图(蒸汽/水雾/尘) */
  function puff() {
    var c = cv(128, 128), x = c.getContext("2d");
    var g = x.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.45, "rgba(255,255,255,0.42)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  /* 仪表盘表盘面:主刻度 + 红区(供站点 dashboard 预渲染) */
  function dialFace(canvas, size, opt) {
    opt = opt || {};
    var x = canvas.getContext("2d");
    var cx = size / 2, cy = size / 2, R = size / 2 - 4;
    x.clearRect(0, 0, size, size);
    x.fillStyle = "#F3EEE1";
    x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#23252A"; x.lineWidth = 3;
    x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    var a0 = 135 * Math.PI / 180, sweep = 270 * Math.PI / 180;
    var ticks = opt.ticks || 9, max = opt.max || 1, redFrom = opt.redFrom;
    for (var i = 0; i <= ticks; i++) {
      var f = i / ticks;
      var a = a0 + f * sweep;
      var inner = R * (i % 2 === 0 ? 0.74 : 0.82);
      x.strokeStyle = (redFrom !== undefined && f * max >= redFrom) ? "#D6543A" : "#23252A";
      x.lineWidth = i % 2 === 0 ? 2.2 : 1.3;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      x.lineTo(cx + Math.cos(a) * R * 0.94, cy + Math.sin(a) * R * 0.94);
      x.stroke();
      if (i % 2 === 0) {
        x.fillStyle = "#23252A";
        x.font = "700 " + Math.round(size * 0.085) + "px Menlo, monospace";
        x.textAlign = "center"; x.textBaseline = "middle";
        x.fillText(String(Math.round(f * max)), cx + Math.cos(a) * R * 0.60, cy + Math.sin(a) * R * 0.60);
      }
    }
    x.fillStyle = "#5C584C";
    x.font = "600 " + Math.round(size * 0.07) + "px Menlo, monospace";
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(opt.label || "", cx, cy + R * 0.36);
    return canvas;
  }

  MECH.Textures = { sky: sky, ground: ground, wood: wood, paper: paper, puff: puff, dialFace: dialFace };
})(window.MECH = window.MECH || {});
