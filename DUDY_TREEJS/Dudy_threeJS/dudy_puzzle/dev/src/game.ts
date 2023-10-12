import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { GameConfig, Part, PIPE_SCALE, PIPE_POSITION_LEFT, PIPE_POSITION_RIGHT } from './parts';
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
    scaleFactor = 3;
    firstLoad = true;

    constructor(config: GameConfig, canvas: HTMLCanvasElement) {
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
        if(this.firstLoad){
            this.initDragControls();
            this.firstLoad = false;
        }

        this.startTime = Date.now();

        this.initParts();
        this.renderToolsMenu();

    }

    restart() {
        for (const part of this.movables) {
            this.scene.remove(part);
        }
        //console.log("restarting")
        // this.finished = false;
        // // remove pipes from scene
        // if (this.pipes.size > 0) {
        //     for (let i = 0; i < this.config.pipes.length; i++) {
        //         let pipe = this.pipes.get(i);
        //         //remove pieces from scene
        //         for (let j = 0; j < pipe.parts.length; j++) {
        //             this.scene.remove(pipe.parts[j].mesh);
        //         }
        //         this.scene.remove(pipe.mesh)
        //     }
        //     this.pipes = new Map();
        //     this.scene.remove(...this.movables);
        // }

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
            this.movables.forEach(mesh => {
                mesh.position.setZ(10);
            })
            this.selected?.position.setZ(100);
        });

        dragControls.addEventListener('drag', () => {
            this.selected?.position.setZ(100);
        });

        dragControls.addEventListener('dragend', (event) => {
        });
    }


    render() {
        this.renderer.render(this.scene, this.camera);
    }

    initParts() {
        // const pipe_config = this.config.pipeGroups[0].parts[0];
        const pipe_config = this.config.pipeGroups;
        if (!pipe_config) return;
        for (const pipeGroup of this.config.pipeGroups) {
            const startingCoordinates = pipeGroup.startingCoordinates;
            for (const part of pipeGroup.parts) {
                this.model_loader.load(part, (gltf) => {
                    const model = gltf.scene.children[0] as THREE.Mesh;
                    const mat = model.material as THREE.MeshBasicMaterial;
                    mat.transparent = true;
                    if (mat.map)
                        mat.map.encoding = THREE.LinearEncoding;

                    model.scale.set(PIPE_SCALE, PIPE_SCALE, 1);
                    const piece = new Part(
                        this.initPartPosition(startingCoordinates.x, startingCoordinates.y),
                        model,
                        { x: 200, y: 200 }
                    );

                    // this.pipes.get(pipe_id).addPart(piece);
                    this.movables.push(piece.mesh);
                    this.scene.add(piece.mesh);
                });
            }
        }
    }

    renderToolsMenu() {

        const root = document.getElementById('root') as HTMLElement;
        const canvasToolMenu = document.createElement('div');
        canvasToolMenu.classList.add('canvas-tool-menu');

        const a = this.config.icons[0];


        canvasToolMenu.innerHTML = `
    <div class="manipulation-tool">
        <div class="tool" data-tool="plus">
            <img class="tool-icon" src="${this.config.icons[0]}" alt="plus">
        </div>
        <div class="tool" data-tool="minus"> 
           <img class="tool-icon" src="${this.config.icons[1]}" alt="minus">
        </div>
         <div class="tool" data-tool="rotateRight">
            <img class="tool-icon" src="${this.config.icons[2]}" alt="rotateRight">
        </div>
        <div class="tool" data-tool="rotateLeft">
            <img class="tool-icon" src="${this.config.icons[3]}" alt="rotateLeft">
        </div>
    </div>
    <div class="tool trash-can" data-tool="reset">
        <img class="tool-icon" src="${this.config.icons[4]}" alt="reset">
    </div>`;

        /* Main menu is visible no need to restart game */
        const toolsBt = canvasToolMenu.querySelectorAll('.tool') as NodeList;

        for (let i = 0; i < toolsBt.length; i++) {
            // @ts-ignore
            toolsBt[i].onclick = (e: any) => {
                console.log("-> e", e.target.dataset.tool);
                switch (e.target.dataset.tool) {
                    case "plus":
                        this.toolPlusEvent();
                        break;
                    case "minus":
                        this.toolMinusEvent();
                        break;
                    case "rotateLeft":
                        this.toolRotateEvent(1);
                        break;
                    case "rotateRight":
                        this.toolRotateEvent(-1);
                        break;
                    case "reset":
                        this.restart();
                        break;
                    default:
                        break;
                }
            }
        }
        root.appendChild(canvasToolMenu);
    }

    private initPartPosition(x: number, y: number) {
        let position_x = -375;
        let position_y = -50;

        let random_offset_x = Math.floor(Math.random() * 300);
        let random_offset_y = Math.floor(Math.random() * 100);
        position_x += random_offset_x;
        position_y += random_offset_y;

        let randomX = Math.floor(Math.random() * 10);
        let randomY = Math.floor(Math.random() * 10);
        // return { x: position_x, y: position_y };
        //TODO split
        return { x: x + randomX, y: y + randomY, z: 10 };
    }

    private toolPlusEvent() {
        console.log("-> this.selected", this.selected);
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

    private toolRotateEvent(direction: number) {

        if (!this.selected) return;
        const angleInRadians = THREE.MathUtils.degToRad(direction * 15);
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

}


