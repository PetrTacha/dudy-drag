import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { GameConfig, Part, PIPE_SCALE, PIPE_POSITION_LEFT, PIPE_POSITION_RIGHT } from './parts';
import { Pipe } from './pipe';
//import GLTF loader from examples
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

//margins for initial position generation
const REQUIRED_DISTANCE = 100000000;

function resizeCanvas(canvas: HTMLCanvasElement) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log("Canvas size" + canvas.width + " " + canvas.height);
}

function pad(n: number, minWidth: number) {
    const sn = n.toString();
    return sn.length >= minWidth ? sn : new Array(minWidth - sn.length + 1).join('0') + n;
}


export class PipeGame {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    loader: THREE.TextureLoader;
    model_loader = new GLTFLoader();
    config: GameConfig;
    pipes = new Map();
    parts: [] = [];
    movables: THREE.Mesh[] = [];
    finished = false;
    startTime = 0;
    selected: THREE.Mesh | undefined;
    piecesCount: number = 0;
    pipesCount: number = 0;
    first_game = true;
    scaleFactor = 3;

    constructor(config: GameConfig, canvas: HTMLCanvasElement) {
        console.log("-> AAAAAAAAA");
        canvas.width = 1919;
        canvas.height = 1079;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            canvas.width / -2, canvas.width / 2,
            canvas.height / 2, canvas.height / -2,
            1,
            1000
        );
        this.camera.position.z = 500;
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
        this.renderer.setSize(canvas.width, canvas.height);
        this.loader = new THREE.TextureLoader();
        this.config = config;

        this.renderer.setClearColor(0xffffff, 0);
        // this.renderMenu();
        this.restart();
    }

    get canvas() {
        return this.renderer.domElement;
    }

    init() {
        if (this.first_game) {
            //this.initBackground();
            this.initDragControls();
            this.first_game = false;
        }
        // if(this.pipes.size == 0){
        //     this.initPipes();
        // }
        this.startTime = Date.now();
        //console.log(this.scene);
        this.initParts();
        this.renderToolsMenu()
    }

    restart() {
        //console.log("restarting")
        this.finished = false;
        // remove pipes from scene
        if (this.pipes.size > 0) {
            for (var i = 0; i < this.config.pipes.length; i++) {
                var pipe = this.pipes.get(i);
                //remove pieces from scene
                for (let j = 0; j < pipe.parts.length; j++) {
                    this.scene.remove(pipe.parts[j].mesh);
                }
                this.scene.remove(pipe.mesh)
            }
            this.pipes = new Map();
            this.scene.remove(...this.movables);
        }

        this.init();
    }

    initBackground() {
        const backgroundTexture = this.loader.load(this.config.backgroundImageUrl, () => {
            const backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture });
            const backgroundGeometry = new THREE.PlaneGeometry(this.canvas.width, this.canvas.height);
            const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
            this.scene.add(backgroundMesh);
        }, undefined, (error: ErrorEvent) => {
            console.log("Background image not found.", error);
        });
    }


    initDragControls() {
        const dragControls = new DragControls(this.movables, this.camera, this.canvas);

        dragControls.addEventListener('dragstart', (event) => {
            //get dragged mesh
            this.selected = event.object as THREE.Mesh;
            //console.log(this.selected);
        });

        dragControls.addEventListener('drag', () => {
            if (this.selected && this.pipes.size > 0 && this.selected?.userData.piece.isOn() == true) {
                var pipe_id = this.selected?.userData.piece.pipe_id;
                this.selected?.userData.piece.snapOnPipe(this.pipes.get(pipe_id).position, this.scene)
            } else {
                this.selected?.position.setZ(this.piecesCount * 2);
            }
        });

        dragControls.addEventListener('dragend', (event) => {
            //this.selected?.position.setZ(this.selected?.userData.piece.layer);
            if (this.selected && this.pipes.size > 0) {
                var pipe_id = this.selected?.userData.piece.pipe_id;
                if (this.selected.position.distanceTo(this.pipes.get(pipe_id).getPosition()) < REQUIRED_DISTANCE) {
                    if (!this.pipes.get(pipe_id).isOnPipe(this.selected?.userData.piece.id)) {
                        this.pipes.get(pipe_id).setLayer(this.selected?.userData.piece.layer);
                        this.pipes.get(pipe_id).addPiece(this.selected?.userData.piece.id);

                    }
                    this.selected?.userData.piece.snapOnPipe(this.pipes.get(pipe_id).position, this.scene);
                    // this.testGameFinished();
                }
                //drop to the floor
                if (this.selected?.userData.piece.isOn() == false) {
                    this.selected?.userData.piece.resetPosition();
                }
                //snap off the Pipe
                if (this.selected?.userData.piece.isOn() == true && this.selected.position.distanceTo(this.pipes.get(pipe_id).getPosition()) > REQUIRED_DISTANCE) {
                    this.selected?.userData.piece.snapOffPipe(this.scene);
                    this.pipes.get(pipe_id).removePiece(this.selected?.userData.piece.id);
                    this.pipes.get(pipe_id).removeLayer(this.selected?.userData.piece.layer);

                }
            }
        });
    }


    render() {
        this.renderer.render(this.scene, this.camera);
    }

    initParts() {
        const pipe_config = this.config.pipes[0].parts[0];
        if (!pipe_config) return;
        this.model_loader.load(pipe_config, (gltf) => {
            const model = gltf.scene.children[0] as THREE.Mesh;
            const mat = model.material as THREE.MeshBasicMaterial;
            mat.transparent = true;
            if (mat.map)
                mat.map.encoding = THREE.LinearEncoding;

            model.scale.set(PIPE_SCALE, PIPE_SCALE, 1);
            const piece = new Part(
                this.initPartPosition(),
                model,
                { x: 200, y: 200 },
                pipe_config
            );

            // this.pipes.get(pipe_id).addPart(piece);
            this.movables.push(piece.mesh);
            this.scene.add(piece.mesh);
        });
    }

    renderToolsMenu() {

        const root = document.getElementById('root') as HTMLElement;
        const canvasToolMenu = document.createElement('div');
        canvasToolMenu.classList.add('canvas-tool-menu');


        canvasToolMenu.innerHTML = `
    <div class="tool" data-tool="plus">
        PLUS
    </div>
    <div class="tool" data-tool="minus"> 
        MINUS
    </div>
    <div class="tool" data-tool="rotate">
        ROTATE
    </div>
    <div class="tool" data-tool="mirror">
    MIRROR
    </div>
`;

        /* Main menu is visible no need to restart game */
        const toolsBt = canvasToolMenu.querySelectorAll('.tool') as NodeList;

        for (let i = 0; i < toolsBt.length; i++) {
            toolsBt[i].onclick = (e) => {
                console.log("-> e", e.target.dataset.tool);
                switch (e.target.dataset.tool) {
                    case "plus":
                        this.toolPlusEvent();
                        break;
                    case "minus":
                        this.toolMinusEvent();
                        break;
                    case "rotate":
                        this.toolRotateEvent();
                        break;
                    case "mirror":
                        this.toolMirrorEvent();
                        break;
                    default:
                        break;
                }
            }
        }
        root.appendChild(canvasToolMenu);
    }

    private initPartPosition() {
        var position_x = -375;
        var position_y = -50;

        var random_offset_x = Math.floor(Math.random() * 300);
        var random_offset_y = Math.floor(Math.random() * 100);
        position_x += random_offset_x;
        position_y += random_offset_y;

        return { x: position_x, y: position_y };
    }

    private toolPlusEvent() {
        if (!this.selected) return;
        const boundingBox = new THREE.Box3().setFromObject(this.selected);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        this.selected.scale.set(this.selected.scale.x + this.scaleFactor, this.selected.scale.y + this.scaleFactor, this.selected.scale.z);
        const newBoundingBox = new THREE.Box3().setFromObject(this.selected);
        const newCenter = new THREE.Vector3();
        newBoundingBox.getCenter(newCenter);
        const translation = center.clone().sub(newCenter);
        this.selected.position.add(translation);
    }

    private toolMinusEvent() {
        if (!this.selected) return;
        const boundingBox = new THREE.Box3().setFromObject(this.selected);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        this.selected.scale.set(this.selected.scale.x - this.scaleFactor, this.selected.scale.y - this.scaleFactor, this.selected.scale.z);
        const newBoundingBox = new THREE.Box3().setFromObject(this.selected);
        const newCenter = new THREE.Vector3();
        newBoundingBox.getCenter(newCenter);
        const translation = center.clone().sub(newCenter);
        this.selected.position.add(translation);
    }

    private toolRotateEvent() {
        if (!this.selected) return;
        const angleInRadians = THREE.MathUtils.degToRad(15);
        const axisOfRotation = new THREE.Vector3(0, 0, 1);

        const boundingBox = new THREE.Box3().setFromObject(this.selected);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);

        this.selected.rotateOnWorldAxis(axisOfRotation, angleInRadians);

        const newBoundingBox = new THREE.Box3().setFromObject(this.selected);
        const newCenter = new THREE.Vector3();
        newBoundingBox.getCenter(newCenter);
        const translation = center.clone().sub(newCenter);
        this.selected.position.add(translation);


    }

    private toolMirrorEvent() {
        //TODO
        if (!this.selected) return;
        // Define the axis along which you want to mirror (for example, mirroring along the X-axis)
        // const axis = new THREE.Vector3(1, 0, 0); // X-axis

// Create a scaling vector to mirror the mesh along the specified axis
//         const scaleVector = new THREE.Vector3(-1, 1, 1); // Mirroring along X-axis
// console.log("-> rotateASDAS");
// // Apply the scaling transformation to the mesh
//         this.selected.scale.copy(scaleVector);
    }
}


