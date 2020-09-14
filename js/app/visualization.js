const Empty = Object.freeze([]);

class Visualization {
    container;
    camera;
    orthoCamera;
    controls;
    renderer;
    xFromLeftClippingPlane;
    xFromRightClippingPlane;
    yFromBottomClippingPlane;
    yFromTopClippingPlane;
    zFromBackClippingPlane;
    zFromFrontClippingPlane;
    clippingPlanes;
    scene;
    uiScene;
    lut;
    colorsLutSprite;
    points;
    minX; maxX; minY; maxY; minZ; maxZ;
    mesh;
    dummy;
    startTime;
    gui;
    stats;
    animationFrozen;
    colorsEnabled;
    colorMap;

    constructor(points) {
        this.points = points;
        const { minX, minY, minZ, maxX, maxY, maxZ } = VectorFieldPointUtils.minMaxCoords(this.points);
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;
        this.dummy = new THREE.Object3D();
        this.initContainer();
        this.initScene();
        this.visualizePoints();
        this.initCameraAndControls();
        this.initLight();
        this.initRenderer();
        this.initGui();
        this.initStats();
        this.animationFrozen = false;
    }

    initContainer() {
        this.container = DOMManipulator.getSceneContainer();
        DOMManipulator.showSceneContainer();
        DOMManipulator.showProgressStatus('Creating scene...');
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.uiScene =  new THREE.Scene();
    }

    visualizePoints() {
        DOMManipulator.showProgressStatus('Calculating minimum distance between points...');
        // TODO improve the algorithm so that it can be user reliably
        // const radius = VectorFieldPointUtils.minimum_distance(this.points) / 2;
        const radius = 0.001;

        DOMManipulator.showProgressStatus('Creating points...');
        const geometry = new THREE.SphereBufferGeometry(radius);

        this.colorsEnabled = true;
        this.colorMap = 'rainbow';
        this.lut = new Lut( this.colorMap, 512 );

        this.colorsLutSprite = new THREE.Sprite( new THREE.SpriteMaterial( {
            map: new THREE.CanvasTexture( this.lut.createCanvas() )
        } ) );
        this.colorsLutSprite.scale.x = 0.08;
        this.uiScene.add( this.colorsLutSprite );

        const instanceColors = [];

        let color;
        for (let i = 0; i < this.points.length; i++) {
            color = this.lut.getColor(this.points[i].vector.length);
            instanceColors.push( color.r );
            instanceColors.push( color.g );
            instanceColors.push( color.b );
        }

        geometry.setAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( instanceColors ), 3 ) );

        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        material.vertexColors = true;

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

        this.orthoCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 1, 2 );
        this.orthoCamera.position.set(0.96, 0, 1 );
    }

    initLight() {
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 3));
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.xFromLeftClippingPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 1);
        this.xFromRightClippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1);
        this.yFromBottomClippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1);
        this.yFromTopClippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1);
        this.zFromBackClippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1);
        this.zFromFrontClippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1);
        this.clippingPlanes = [
            this.xFromLeftClippingPlane,
            this.xFromRightClippingPlane,
            this.yFromBottomClippingPlane,
            this.yFromTopClippingPlane,
            this.zFromBackClippingPlane,
            this.zFromFrontClippingPlane
        ];
        this.renderer.clippingPlanes = Empty;
        this.renderer.autoClear = false;
    }

    initGui() {
        const thisHandle = this;

        this.gui = new dat.GUI();
        const folderClipping = this.gui.addFolder('Clipping');

        const propsClipping = {
            get 'Enabled'() {
                return thisHandle.renderer.clippingPlanes !== Empty;
            },
            set 'Enabled'(v) {
                thisHandle.renderer.clippingPlanes = v ? thisHandle.clippingPlanes : Empty;
            },
            get 'X left'() {
                return thisHandle.xFromLeftClippingPlane.constant;
            },
            set 'X left'(v) {
                thisHandle.xFromLeftClippingPlane.constant = v;
            },
            get 'X right'() {
                return thisHandle.xFromRightClippingPlane.constant;
            },
            set 'X right'(v) {
                thisHandle.xFromRightClippingPlane.constant = v;
            },
            get 'Y bottom'() {
                return thisHandle.yFromBottomClippingPlane.constant;
            },
            set 'Y bottom'(v) {
                thisHandle.yFromBottomClippingPlane.constant = v;
            },
            get 'Y top'() {
                return thisHandle.yFromTopClippingPlane.constant;
            },
            set 'Y top'(v) {
                thisHandle.yFromTopClippingPlane.constant = v;
            },
            get 'Z back'() {
                return thisHandle.zFromBackClippingPlane.constant;
            },
            set 'Z back'(v) {
                thisHandle.zFromBackClippingPlane.constant = v;
            },
            get 'Z front'() {
                return thisHandle.zFromFrontClippingPlane.constant;
            },
            set 'Z front'(v) {
                thisHandle.zFromFrontClippingPlane.constant = v;
            }
        }

        // for clipping range assume points are normalized
        folderClipping.add(propsClipping, 'Enabled');
        folderClipping.add(propsClipping, 'X left', -1, 1);
        folderClipping.add(propsClipping, 'X right', -1, 1);
        folderClipping.add(propsClipping, 'Y bottom', -1, 1);
        folderClipping.add(propsClipping, 'Y top', -1, 1);
        folderClipping.add(propsClipping, 'Z back', -1, 1);
        folderClipping.add(propsClipping, 'Z front', -1, 1);

        const folderAnimation = this.gui.addFolder('Animation');
        const propsAnimation = {
            get 'Enabled'() {
                return !thisHandle.animationFrozen;
            },
            set 'Enabled'(v) {
                thisHandle.freezeAnimation(!v);
            }
        }

        folderAnimation.add(propsAnimation, 'Enabled');

        const folderColors = this.gui.addFolder('Colors');
        const propsColors = {
            get 'Enabled'() {
                return !!thisHandle.colorsEnabled;
            },
            set 'Enabled'(v) {
                thisHandle.toggleColors(v);
            },
            get 'Color Map'() {
                return thisHandle.colorMap;
            },
            set 'Color Map'(v) {
                thisHandle.updateColors(v);
            }
        }

        folderColors.add(propsColors, 'Enabled');
        // folderColors.add(propsColors, 'Color Map', [ 'rainbow', 'cooltowarm', 'blackbody', 'grayscale' ]);
    }

    initStats() {
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
    }

    start() {
        window.addEventListener('resize', this.onWindowResize);

        DOMManipulator.addElementToSceneContainer(this.renderer.domElement);

        this.startTime = performance.now();
        this.renderer.setAnimationLoop(() => {
            this.stats.begin();
            this.update();
            this.controls.update();
            this.render();
            this.stats.end();
        });
    }

    update() {
        if (this.animationFrozen) return;
        let x, y, z;
        const time = performance.now() - this.startTime;
        const slowFactor = 500;
        this.points.forEach((point, index) => {
            x = point.vector.x === 0 ? point.x : point.x + (point.vector.length * time * point.vector.x / slowFactor) % (2 * point.vector.x);
            y = point.vector.y === 0 ? point.y : point.y + (point.vector.length * time * point.vector.y / slowFactor) % (2 * point.vector.y);
            z = point.vector.z === 0 ? point.z : point.z + (point.vector.length * time * point.vector.z / slowFactor) % (2 * point.vector.z);

            this.dummy.position.set(x, y, z);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(index, this.dummy.matrix);
        });
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    render() {
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        this.renderer.render(this.uiScene, this.orthoCamera);
    }

    onWindowResize = () => {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    fitCameraToScene() {
        const offset = 1.25;
        // min max coords have to be calculated manually because of instanced mesh's geometry

        const center = new THREE.Vector3((this.maxX + this.minX) / 2, (this.maxY + this.minY) / 2, (this.maxZ + this.minZ) / 2);
        const size = new THREE.Vector3((this.maxX - this.minX), (this.maxY - this.minY), (this.maxZ - this.minZ));

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = maxDim / 2 / Math.tan(fov / 2);

        cameraZ *= offset; // zoom out a little so that objects don't fill the screen        

        this.camera.position.x = center.x;
        this.camera.position.y = center.y;
        this.camera.position.z = center.z + cameraZ;

        const cameraToFarEdge = (this.minZ < 0) ? -this.minZ + cameraZ : cameraZ - this.minZ;

        this.camera.far = cameraToFarEdge * 3;
        this.camera.updateProjectionMatrix();

        this.controls.target = center;
        this.controls.maxDistance = cameraToFarEdge * 2;
    }

    freezeAnimation(frozen) {
        if (frozen) {
            this.points.forEach((point, index) => {
                this.dummy.position.set(point.x, point.y, point.z);
                this.dummy.updateMatrix();
                this.mesh.setMatrixAt(index, this.dummy.matrix);
            });
            this.mesh.instanceMatrix.needsUpdate = true;
        } else {
            this.startTime = performance.now();
        }
        this.animationFrozen = frozen;
    }

    toggleColors(active) {
        if (active) {
            this.uiScene.add(this.colorsLutSprite);
            this.mesh.material.vertexColors = true;
        } else {
            this.uiScene.remove(this.colorsLutSprite);
            this.mesh.material.vertexColors = false;
        }
        this.mesh.material.needsUpdate = true;
        this.colorsEnabled = active;
    }

    // updateColors(colorMap) {
    //     this.lut.setColorMap(colorMap);
    //     // this.lut.setMin(0);
    //     // this.lut.setMax(1);

    //     const colors = this.mesh.geometry.attributes.color;

    //     let color;
    //     for (let i = 0; i < this.points.length; i++) {
    //         color = this.lut.getColor(this.points[i].vector.length);

    //         if ( color === undefined ) {
    //             console.log( 'Unable to determine color for value: ', colorValue );
    //         } else {
    //             colors.setXYZ(i, color.r, color.g, color.b);
    //         }
    //     }

    //     colors.needsUpdate = true;

    //     const map = this.colorsLutSprite.material.map;
    //     this.lut.updateCanvas( map.image );
    //     map.needsUpdate = true;

    //     this.colorMap = colorMap;
    // }
}