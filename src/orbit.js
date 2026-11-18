/* 轻量轨道相机:拖拽旋转 / 滚轮缩放 / 时间线镜头自动接管 */
(function (MECH) {
  function Orbit(camera, dom, init) {
    this.camera = camera;
    init = init || {};
    this.target = new THREE.Vector3(0, 1, 0);
    this.targetGoal = new THREE.Vector3(0, 1, 0);
    this.sph = new THREE.Spherical(init.r || 11.5, init.phi || 1.22, init.theta || 0.55);
    this.sphGoal = new THREE.Spherical(init.r || 11.5, init.phi || 1.22, init.theta || 0.55);
    if (init.target) this.target.set(init.target[0], init.target[1], init.target[2]);
    this.targetGoal.copy(this.target);
    this.autoDrift = 0.03;            // rad/s
    this.userUntil = 0;               // 用户交互抑制自动镜头
    this.stiff = 3.2;

    var self = this;
    var dragging = false, lx = 0, ly = 0;

    function poke() { self.userUntil = performance.now() + 3500; }

    dom.addEventListener("pointerdown", function (e) {
      dragging = true; lx = e.clientX; ly = e.clientY; poke();
      dom.setPointerCapture && dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      poke();
      var dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      self.sph.theta -= dx * 0.0052;
      self.sph.phi = THREE.MathUtils.clamp(self.sph.phi - dy * 0.0042, 0.3, 1.48);
      self.sphGoal.theta = self.sph.theta;
      self.sphGoal.phi = self.sph.phi;
    });
    window.addEventListener("pointerup", function () { dragging = false; });
    dom.addEventListener("wheel", function (e) {
      e.preventDefault(); poke();
      self.sph.radius = THREE.MathUtils.clamp(self.sph.radius * (1 + e.deltaY * 0.0011), 2.6, 30);
      self.sphGoal.radius = self.sph.radius;
    }, { passive: false });
  }

  /* 时间线推镜头:目标球坐标 + 注视点 */
  Orbit.prototype.flyTo = function (cam) {
    this.sphGoal.theta = cam.theta;
    this.sphGoal.phi = cam.phi;
    this.sphGoal.radius = cam.r;
    this.targetGoal.set(cam.target[0], cam.target[1], cam.target[2]);
  };

  Orbit.prototype.update = function (dt) {
    var auto = performance.now() > this.userUntil;
    var k = 1 - Math.exp(-this.stiff * dt);
    if (auto) {
      this.sphGoal.theta += this.autoDrift * dt;   // 缓慢环绕
      this.sph.theta += (this.sphGoal.theta - this.sph.theta) * k;
      this.sph.phi += (this.sphGoal.phi - this.sph.phi) * k;
      this.sph.radius += (this.sphGoal.radius - this.sph.radius) * k;
      this.target.lerp(this.targetGoal, k);
    }
    this.camera.position.setFromSpherical(this.sph).add(this.target);
    this.camera.lookAt(this.target);
  };

  MECH.Orbit = Orbit;
})(window.MECH = window.MECH || {});
