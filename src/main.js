/* 入口:初始化各模块、主循环、交互(拖拽/点击零件/空格暂停/R 重播/数字键 1-8/B 图纸) */
(function (MECH) {
  var lastT = performance.now();
  var raycaster = null, mouse = new THREE.Vector2();
  var downX = 0, downY = 0;

  function boot() {
    MECH.SceneInit();
    var S3 = MECH.Scene3D;

    MECH.INIT_CAM = MECH.PHASES[0].cam;
    MECH.orbitCtl = new MECH.Orbit(S3.camera, S3.renderer.domElement, MECH.INIT_CAM);
    MECH.Labels.init();
    MECH.Parts.init();
    MECH.Dash.build();
    MECH.Blueprint.init();
    MECH.Timeline.init();
    MECH.Timeline.start();

    raycaster = new THREE.Raycaster();
    bindInteractions(S3);

    window.addEventListener("resize", function () {
      var stage = document.getElementById("stage");
      S3.camera.aspect = stage.clientWidth / stage.clientHeight;
      S3.camera.updateProjectionMatrix();
      S3.renderer.setSize(stage.clientWidth, stage.clientHeight);
    });

    MECH.keys = { left: false, right: false };
    window.addEventListener("keydown", function (e) {
      if (e.code === "ArrowLeft") MECH.keys.left = true;
      if (e.code === "ArrowRight") MECH.keys.right = true;
      if (e.code === "Space") {
        e.preventDefault();
        var p = MECH.Timeline.togglePause();
        document.getElementById("phase-text").style.opacity = p ? "0.5" : "1";
      } else if (e.code === "KeyR") {
        MECH.Blueprint.toggle(false);
        MECH.Timeline.restart();
        document.getElementById("phase-text").style.opacity = "1";
      } else if (e.code === "KeyB") {
        MECH.Blueprint.toggle();
      } else if (/^Digit[1-8]$/.test(e.code)) {
        var n = Number(e.code.slice(5)) - 1;
        if (MECH.PHASE_IDS && n < MECH.PHASE_IDS.length) {
          MECH.Blueprint.toggle(false);
          MECH.Timeline.seek(MECH.PHASE_IDS[n]);
          document.getElementById("phase-text").style.opacity = "1";
        }
      }
    });

    window.addEventListener("keyup", function (e) {
      if (e.code === "ArrowLeft") MECH.keys.left = false;
      if (e.code === "ArrowRight") MECH.keys.right = false;
    });

    loop();
  }

  function bindInteractions(S3) {
    var dom = S3.renderer.domElement;
    dom.style.touchAction = "none";
    dom.addEventListener("pointerdown", function (e) { downX = e.clientX; downY = e.clientY; });
    dom.addEventListener("pointerup", function (e) {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;  // 拖拽不算点击
      var rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, S3.camera);
      var groups = [];
      MECH.Parts.list().forEach(function (p) { if (p.group.visible) groups.push(p.group); });
      var hits = raycaster.intersectObjects(groups, true);
      if (hits.length) {
        var g = hits[0].object, pid = null;
        while (g && !pid) {
          if (g.userData && g.userData.partId) pid = g.userData.partId;
          g = g.parent;
        }
        if (pid) {
          var entry = MECH.Parts.entry(pid);
          if (entry) MECH.Labels.announce(pid, entry.anchor || entry.group, entry.name, entry.sub, performance.now(), 2200);
        }
      }
    });
    dom.addEventListener("pointermove", function (e) {
      var rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, S3.camera);
      var groups = [];
      MECH.Parts.list().forEach(function (p) { if (p.group.visible) groups.push(p.group); });
      dom.style.cursor = raycaster.intersectObjects(groups, true).length ? "pointer" : "";
    });
  }

  function frame(now) {
    var dt = Math.min((now - lastT) / 1000, 0.12);
    lastT = now;

    MECH.Timeline.update(dt);          // 内部判断暂停
    MECH.orbitCtl.update(dt);
    MECH.SceneUpdate(dt);
    MECH.Labels.update();
    MECH.Scene3D.renderer.render(MECH.Scene3D.scene, MECH.Scene3D.camera);
    if (!window.MECH_BOOTED) window.MECH_BOOTED = true;
  }

  function loop() {
    requestAnimationFrame(loop);
    frame(performance.now());
  }

  /* 兜底驱动:窗口被遮挡/后台导致 rAF 停滞时,由低频 interval 接管,
     保证动画与时间线不冻结(可见时 rAF 正常,此路不生效)。 */
  setInterval(function () {
    if (document.hidden) return;
    var now = performance.now();
    if (now - lastT < 350) return;     // rAF 正常运行中
    frame(now);
  }, 200);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window.MECH = window.MECH || {});
