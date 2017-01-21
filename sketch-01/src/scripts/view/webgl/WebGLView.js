const glslify = require('glslify');

export default class WebGLView {

	constructor(view) {
		this.view = view;
		this.renderer = this.view.renderer;

		this.initThree();
		this.initControls();
		// this.initObject();
		this.initRibbon();
	}

	initThree() {
		// scene
		this.scene = new THREE.Scene();

		// camera
		this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
		this.camera.position.z = 300;
	}

	initControls() {
		this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
		this.controls.target.set(0, 0, 0);
		this.controls.rotateSpeed = 2.0;
		this.controls.zoomSpeed = 0.8;
		this.controls.panSpeed = 0.8;
		this.controls.noZoom = false;
		this.controls.noPan = false;
		this.controls.staticMoving = false;
		this.controls.dynamicDampingFactor = 0.15;
		this.controls.maxDistance = 3000;
		this.controls.enabled = true;
	}

	initObject() {
		const geometry = new THREE.BoxGeometry(200, 200, 200);
		// const geometry = new THREE.PlaneGeometry(400, 400, 20, 20);

		const material = new THREE.ShaderMaterial({
			uniforms: {},
			vertexShader: glslify('../../../shaders/default.vert'),
			fragmentShader: glslify('../../../shaders/default.frag'),
			wireframe: true
		});

		const mesh = new THREE.Mesh(geometry, material);
		this.scene.add(mesh);
	}

	initRibbon() {
		let t = 30;
		const steps = 500;
		const dt = 0.08;

		const geometry = new THREE.PlaneBufferGeometry(steps, t, steps, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: true });

		const mesh = new THREE.Mesh(geometry, material);
		this.scene.add(mesh);
		this.ribbon = mesh;

		// modify vertices
		let P1 = this.getCurvePoint(t);
  		let T1 = new THREE.Vector3().subVectors(P1, this.getCurvePoint(t - dt));

  		t += dt;

		const positions = geometry.attributes.position.array;
		const halfLength = positions.length / 2;

		for (let i3 = 0, i6 = 0; i3 < halfLength; i3 += 3, i6 += 6) {
			const P = this.getCurvePoint(t);
			const T = new THREE.Vector3().subVectors(P, P1);
			const N = new THREE.Vector3().subVectors(T, T1);
			const B = T.clone().cross(N).normalize();

			const W = B.clone().multiplyScalar(dt);
			const Pa = new THREE.Vector3().subVectors(P, W);
			const Pb = new THREE.Vector3().addVectors(P, W);

			P1 = P;
			T1 = T;
			t += dt;

			positions[i3 + 0] = Pa.x;
			positions[i3 + 1] = Pa.y;
			positions[i3 + 2] = Pa.z;

			positions[i3 + 0 + halfLength] = Pb.x;
			positions[i3 + 1 + halfLength] = Pb.y;
			positions[i3 + 2 + halfLength] = Pb.z;
		}

		// geometry.attributes.position.needsUpdate = true;
	}

	getCurvePoint(t) {
		const r = 1 + 0.5 * sin(t * 1.82845);
		return new THREE.Vector3(
			sin(t * 1.42482) * r,
			sin(t * 1.28472) * r,
			sin(t * 1.11723) * r
		);
	}

	// ---------------------------------------------------------------------------------------------
	// PUBLIC
	// ---------------------------------------------------------------------------------------------

	update() {
		this.controls.update();
	}

	draw() {
		this.renderer.render(this.scene, this.camera);
	}

	// ---------------------------------------------------------------------------------------------
	// EVENT HANDLERS
	// ---------------------------------------------------------------------------------------------

	resize() {
		if (!this.renderer) return;
		this.camera.aspect = this.view.sketch.width / this.view.sketch.height;
		this.camera.updateProjectionMatrix();;

		this.renderer.setSize(this.view.sketch.width, this.view.sketch.height);
	}
}
