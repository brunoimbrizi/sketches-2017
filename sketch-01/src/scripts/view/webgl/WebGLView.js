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
		this.totalFrames = 30 * 3;
		this.steps = 14;

		for (let i = 0; i < 20; i++) {
			const geometry = new THREE.PlaneBufferGeometry(this.steps, 1, this.steps, 1);
			const material = new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: true });

			const mesh = new THREE.Mesh(geometry, material);
			this.scene.add(mesh);
			this.ribbons.push(mesh);

			mesh.freq1 = random(-8, 8);
			mesh.freq2 = random(-8, 8);
		}
  	}

  	updateRibbons() {
  		const progress = (this.frameCount - 1) / this.totalFrames % 1;

		const dt = 0.01211;
		const t0 = this.frameCount * 0.02171 + 20;

		for (let i = 0; i < this.ribbons.length; i++) {
			const ribbon = this.ribbons[i];

			let pr = progress * 1.5 - 0.5 * i / this.ribbons.length;
			if (pr < 0) pr = 0;
			if (pr > 1) pr = 1;

			const tw = 0.075 * sin(PI * pr);

			const Pp = this.getCurvePoint(ribbon.freq1, ribbon.freq2, t0 - dt);
			let P1 = this.getCurvePoint(ribbon.freq1, ribbon.freq2, t0);
			let T1 = new THREE.Vector3().subVectors(P1, Pp);
			let t = t0 - dt;

			const positions = ribbon.geometry.attributes.position.array;
			const halfLength = positions.length / 2;

			for (let i3 = 0, i6 = 0; i3 < halfLength; i3 += 3, i6 += 6) {
				const P = this.getCurvePoint(ribbon.freq1, ribbon.freq2, t);
				const T = new THREE.Vector3().subVectors(P, P1);
				const N = new THREE.Vector3().subVectors(T, T1);
				const B = T.clone().cross(N).normalize();

				const w = sin(PI * i3 / halfLength) * tw;
				const W = B.clone().multiplyScalar(w);
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

		// this.frameCount += 0.1;
		this.frameCount++;
	}

	getCurvePoint(freq1, freq2, t) {
		const sn1 = sin(t * freq1);
		const cs1 = cos(t * freq1);
		const sn2 = sin(t * freq2);
		const cs2 = cos(t * freq2);
		return new THREE.Vector3(sn1 * sn2, cs2, cs1 * sn2);
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
