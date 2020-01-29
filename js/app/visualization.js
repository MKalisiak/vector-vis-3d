class Visualization {
    container;
    camera;
    controls;
    renderer;
    scene;
    points;
    mesh;
    dummy;
    startTime;

    constructor(points) {
        this.points = points;
        this.dummy = new THREE.Object3D();
        this.initContainer();
        this.initScene();
        this.visualizePoints();
        this.initCameraAndControls();
        this.initLight();
        this.initRenderer();
    }

    initContainer() {
        this.container = DOMManipulator.getSceneContainer();
        DOMManipulator.showSceneContainer();
        DOMManipulator.showProgressStatus('Creating scene...');
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
    }

    visualizePoints() {
        DOMManipulator.showProgressStatus('Calculating minimum distance between points...');
        // TODO improve the algorithm so that it can be user reliably
        // const radius = VectorFieldPointUtils.minimum_distance(this.points) / 2;
        const radius = 0.001;

        DOMManipulator.showProgressStatus('Creating points...');
        const geometry = new THREE.SphereBufferGeometry(radius);

        // TODO check if using a standard material with light will make fps drop
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.points.length);
        this.mesh.frustumCulled = false;

        this.points.forEach((point, index) => {
            this.dummy.position.set(point.x, point.y, point.z);
            this.dummy.updateMatrix();

            this.mesh.setMatrixAt(index, this.dummy.matrix);
        });
        this.mesh.updateMatrixWorld();

        this.scene.add(this.mesh);
    }

    initCameraAndControls() {
        const fov = 35;
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const near = 0.1;
        const far = 1000;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        
        this.controls = new THREE.TrackballControls(this.camera, this.container);
        this.controls.rotateSpeed = 5.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.2;

        this.fitCameraToScene();
    }

    initLight() {
        // TODO check if using a standard material with light will make fps drop
        // this.scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 5));
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    start() {
        window.addEventListener('resize', this.onWindowResize);

        DOMManipulator.addElementToSceneContainer(this.renderer.domElement);

        this.startTime = performance.now();
        this.renderer.setAnimationLoop(() => {
            this.update();
            this.controls.update();
            this.render();
        });
    }

    update() {
        const vector = new THREE.Vector3();
        const time = performance.now() - this.startTime;
        const slowFactor = 500;
        this.points.forEach((point, index) => {
            vector.set(
                point.x + (point.vector.length * time * point.vector.x / slowFactor) % (2 * point.vector.x),
                point.y + (point.vector.length * time * point.vector.y / slowFactor) % (2 * point.vector.y),
                point.z + (point.vector.length * time * point.vector.z / slowFactor) % (2 * point.vector.z)
            );

            this.dummy.position.set(vector.x, vector.y, vector.z);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(index, this.dummy.matrix);
        });
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize = () => {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    fitCameraToScene() {
        const offset = 1.25;
        // min max coords have to be calculated manually because of instanced mesh's geometry
        const { minX, minY, minZ, maxX, maxY, maxZ } = VectorFieldPointUtils.minMaxCoords(this.points);

        const center = new THREE.Vector3((maxX + minX) / 2, (maxY + minY) / 2, (maxZ + minZ) / 2);
        const size = new THREE.Vector3((maxX - minX), (maxY - minY), (maxZ - minZ));

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = maxDim / 2 / Math.tan(fov / 2);

        cameraZ *= offset; // zoom out a little so that objects don't fill the screen

        this.camera.position.x = center.x;
        this.camera.position.y = center.y;
        this.camera.position.z = center.z + cameraZ;

        const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

        this.camera.far = cameraToFarEdge * 3;
        this.camera.updateProjectionMatrix();

        this.controls.target = center;
        this.controls.maxDistance = cameraToFarEdge * 2;
    }
}