import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { GameConfig, Part, PIPE_SCALE, PIPE_POSITION_LEFT, PIPE_POSITION_RIGHT } from './parts';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

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
    currentZIndex = 1;

    constructor(config: GameConfig, canvas: HTMLCanvasElement) {
        // canvas.width = 1919;
        // canvas.height = 1079;

        canvas.width = 1300;
        canvas.height = 1079;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            canvas.width / -2, canvas.width / 2,
            canvas.height / 2, canvas.height / -2,
            1,
            1000
        );
        this.camera.position.z = 1000;
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
        this.renderSelectModelMenu();

    }

    restart() {

        for (const part of this.movables) {
            this.scene.remove(part);
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


    updateZIndex() {
        // I need to move z index of each movable to top on each other, but i have and camera on position z = 1000, so after that i have to reset z index and all movables
        if(this.currentZIndex >= 999){
            this.movables.forEach(mesh => {
                mesh.position.setZ(1);
            })
            this.currentZIndex = 1
        }
        this.selected?.position.setZ(this.currentZIndex);
        this.currentZIndex+=1;
    }


    initDragControls() {
        const dragControls = new DragControls(this.movables, this.camera, this.canvas);

        dragControls.addEventListener('dragstart', (event) => {
            //get dragged mesh
            this.selected = event.object as THREE.Mesh;
            // this.movables.forEach(mesh => {
            //     mesh.position.setZ(10);
            // })

            this.updateZIndex();
        });

        dragControls.addEventListener('drag', () => {
            this.selected?.position.setZ(this.currentZIndex);

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
                // this.addModelIntoScene(part)
                // this.model_loader.load(`${part}.glb`, (gltf) => {
                //     const model = gltf.scene.children[0] as THREE.Mesh;
                //     const mat = model.material as THREE.MeshBasicMaterial;
                //     mat.transparent = true;
                //     if (mat.map)
                //         mat.map.encoding = THREE.LinearEncoding;
                //
                //     model.scale.set(PIPE_SCALE, PIPE_SCALE, 1);
                //     const piece = new Part(
                //         this.initPartPosition(startingCoordinates.x, startingCoordinates.y),
                //         model,
                //         { x: 200, y: 200 }
                //     );
                //
                //     this.movables.push(piece.mesh);
                //     this.scene.add(piece.mesh);
                // });
            }
        }
    }

    addModelIntoScene(part: string) {
        this.model_loader.load(`${part}.glb`, (gltf) => {
            const model = gltf.scene.children[0] as THREE.Mesh;
            const mat = model.material as THREE.MeshBasicMaterial;
            mat.transparent = true;
            console.log("-> this.canvas.width/2, this.canvas.height/2", this.canvas.width/2, this.canvas.height/2);
            if (mat.map)
                mat.map.encoding = THREE.LinearEncoding;

            model.scale.set(PIPE_SCALE, PIPE_SCALE, 1);
            const piece = new Part(
                this.initPartPosition(100, 100),
                model,
                { x: 200, y: 200 }
            );

            // this.pipes.get(pipe_id).addPart(piece);
            this.movables.push(piece.mesh);
            this.scene.add(piece.mesh);
            this.selected = piece.mesh;
            this.updateZIndex();
        });

    }

    renderToolsMenu() {

        const root = document.querySelector('.container') as HTMLElement;
        const canvasToolMenu = document.createElement('div');
        canvasToolMenu.classList.add('canvas-tool-menu');
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

    renderSelectModelMenu() {
        let menuRef = document.querySelector("#select-menu");

        this.config.pipeGroups.forEach(group => {
            group.parts.forEach(part => {
                if(!menuRef) return;
                const imageWrapper = document.createElement('div');
                imageWrapper.classList.add("insert-image");
                imageWrapper.dataset.model = part;
                imageWrapper.innerHTML = `<img src="${part}.png" alt="${part}">`
                menuRef.appendChild(imageWrapper)
            })

        })

        document.querySelectorAll(".insert-image").forEach(selectImage => {

            console.log("-> selectImage", selectImage);
            //TODO to touchstart
            selectImage.addEventListener("click", e=>{
                console.log("-> e.target", e.target?.dataset.model);
                this.addModelIntoScene(e.target?.dataset.model);
            })
        })

    }

}


