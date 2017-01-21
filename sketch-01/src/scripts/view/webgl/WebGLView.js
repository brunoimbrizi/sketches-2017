const glslify = require('glslify');

export default class WebGLView {

	constructor(view) {
		this.view = view;
		this.renderer = this.view.renderer;

		this.initThree();
		this.initControls();
		// this.initObject();
		this.initRibbons();
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

	initRibbons() {
		this.ribbons = [];
		this.frameCount = 1;
		this.totalFrames = 30 * 4;
		this.steps = 30;

		for (let i = 0; i < 1; i++) {
			const geometry = new THREE.PlaneBufferGeometry(this.steps, 1, this.steps, 1);
			const material = new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: true });

			const mesh = new THREE.Mesh(geometry, material);
			this.scene.add(mesh);
			this.ribbons.push(mesh);

			mesh.params1 = new THREE.Vector3(random(-1, 1), random(-1, 1), random(-1, 1)).multiplyScalar(6);
			mesh.params2 = new THREE.Vector3(random(-1, 1), random(-1, 1), random(-1, 1)).multiplyScalar(20);
		}
  	}

  	updateRibbons() {
  		const progress = this.frameCount / this.totalFrames % 1;

  		// console.log(progress);

		const dt = min(0.018, progress * 0.1);
		const t0 = this.frameCount * 0.01 + 20;
		const phase = this.frameCount * 0.0179 + 20;
		const extent = min(0.05, 0.5 - progress / 2);

		for (let i = 0; i < this.ribbons.length; i++) {
			const ribbon = this.ribbons[i];

			// const params1 = new THREE.Vector3(random(-1, 1), random(-1, 1), random(-1, 1));
			// const params2 = new THREE.Vector3(random(-1, 1), random(-1, 1), random(-1, 1));

			const Pp = this.getCurvePoint(ribbon.params1, ribbon.params2, t0 - dt, phase);
			let P1 = this.getCurvePoint(ribbon.params1, ribbon.params2, t0, phase);
			let T1 = new THREE.Vector3().subVectors(P1, Pp);
			let t = t0 - dt;

			const positions = ribbon.geometry.attributes.position.array;
			const halfLength = positions.length / 2;

			for (let i3 = 0, i6 = 0; i3 < halfLength; i3 += 3, i6 += 6) {
				const P = this.getCurvePoint(ribbon.params1, ribbon.params2, t, phase);
				const T = new THREE.Vector3().subVectors(P, P1);
				const N = new THREE.Vector3().subVectors(T, T1);
				const B = T.clone().cross(N).normalize();

				const W = B.clone().multiplyScalar(extent);
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

			ribbon.geometry.attributes.position.needsUpdate = true;
		}

		this.frameCount++;
	}

	getCurvePoint(params1, params2, t, phase) {
		return new THREE.Vector3(
			sin(params1.x * t + (1 + sin(params2.x * t + phase) * 0.5)),
			sin(params1.y * t + (1 + sin(params2.y * t + phase) * 0.5)),
			sin(params1.z * t + (1 + sin(params2.z * t + phase) * 0.5))
		);
	}

	// ---------------------------------------------------------------------------------------------
	// PUBLIC
	// ---------------------------------------------------------------------------------------------

	update() {
		this.controls.update();
		this.updateRibbons();
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
