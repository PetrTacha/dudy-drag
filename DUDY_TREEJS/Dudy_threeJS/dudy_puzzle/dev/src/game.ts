import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { GameConfig, Part, PIPE_SCALE } from './parts';
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
    movables: THREE.Mesh[] = [];
    finished = false;
    startTime = 0;
    selected: THREE.Mesh | undefined;
    scaleFactor = 5;
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
        this.initDragControls();
        this.currentZIndex = 1;
        this.startTime = Date.now();

        if (this.firstLoad) {
            this.firstLoad = false;
            // this.initParts();
            this.renderToolsMenu();
            this.renderSelectModelMenu();
            this.addEventListenersUI();
        }


    }

    restart() {

        for (const part of this.movables) {
            console.log("-> part", part);
            this.scene.remove(part);
        }

        this.movables = []

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
        // I need to move z index of each movable to top on each other, but i have and camera on position z = 1000, so after that I have to reset z index and all movables
        if (this.currentZIndex >= 999) {
            this.movables.forEach(mesh => {
                mesh.position.setZ(1);
            })
            this.currentZIndex = 1
        }
        this.selected?.position.setZ(this.currentZIndex);
        this.currentZIndex += 1;
    }


    initDragControls() {
        const dragControls = new DragControls(this.movables, this.camera, this.canvas);

        dragControls.addEventListener('dragstart', (event) => {
            //get dragged mesh
            this.selected = event.object as THREE.Mesh;
            this.updateZIndex();
        });

        dragControls.addEventListener('drag', () => {
            this.selected?.position.setZ(this.currentZIndex);

        });
    }


    render() {
        this.renderer.render(this.scene, this.camera);
    }

    // initParts() {
    //     // const pipe_config = this.config.pipeGroups[0].parts[0];
    //     const pipe_config = this.config.pipeGroups;
    //     if (!pipe_config) return;
    //     for (const pipeGroup of this.config.pipeGroups) {
    //         const startingCoordinates = pipeGroup.startingCoordinates;
    //         for (const part of pipeGroup.parts) {
    //             // this.addModelIntoScene(part)
    //             // this.model_loader.load(`${part}.glb`, (gltf) => {
    //             //     const model = gltf.scene.children[0] as THREE.Mesh;
    //             //     const mat = model.material as THREE.MeshBasicMaterial;
    //             //     mat.transparent = true;
    //             //     if (mat.map)
    //             //         mat.map.encoding = THREE.LinearEncoding;
    //             //
    //             //     model.scale.set(PIPE_SCALE, PIPE_SCALE, 1);
    //             //     const piece = new Part(
    //             //         this.initPartPosition(startingCoordinates.x, startingCoordinates.y),
    //             //         model,
    //             //         { x: 200, y: 200 }
    //             //     );
    //             //
    //             //     this.movables.push(piece.mesh);
    //             //     this.scene.add(piece.mesh);
    //             // });
    //         }
    //     }
    // }

    addModelIntoScene(part: string) {
        console.log("-> called");
        this.model_loader.load(`${part}.glb`, (gltf) => {
            console.log("-> INSIDE");
            const model = gltf.scene.children[0] as THREE.Mesh;
            const mat = model.material as THREE.MeshBasicMaterial;
            mat.transparent = true;
            console.log("-> this.canvas.width/2, this.canvas.height/2", this.canvas.width / 2, this.canvas.height / 2);
            if (mat.map)
                mat.map.encoding = THREE.LinearEncoding;

            model.scale.set(PIPE_SCALE, PIPE_SCALE, 1);
            const piece = new Part(
                { x: 0, y: 0 },
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
                        this.deleteSelected();
                        break;
                    default:
                        break;
                }
            }
        }
        root.appendChild(canvasToolMenu);
    }

    private deleteSelected() {

        if (this.selected) {
            this.scene.remove(this.selected);

            for (let i = 0; i < this.movables.length; i++) {
                if (this.movables[i].uuid === this.selected?.uuid) {
                    this.movables.splice(i, 1);
                    break;
                }
            }
        }
    }

    // private initPartPosition(x: number, y: number) {
    //     let position_x = -375;
    //     let position_y = -50;
    //
    //     let random_offset_x = Math.floor(Math.random() * 300);
    //     let random_offset_y = Math.floor(Math.random() * 100);
    //     position_x += random_offset_x;
    //     position_y += random_offset_y;
    //
    //     let randomX = Math.floor(Math.random() * 10);
    //     let randomY = Math.floor(Math.random() * 10);
    //     // return { x: position_x, y: position_y };
    //
    //     return { x: x, y: y };
    // }

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
        let selectModel = menuRef?.querySelector(".select-model");

        this.config.pipeGroups.forEach(group => {
            if (!menuRef) return;
            let menuHeader = menuRef.querySelector(".select-header");
            const headerTab = document.createElement('div');
            headerTab.classList.add("menu-tab");
            headerTab.dataset.groupid = `${group.id}`;
            headerTab.innerHTML = group.name;
            menuHeader?.appendChild(headerTab);

            const modelSelectGroup = document.createElement('div');
            modelSelectGroup.classList.add("select-model-group");
            modelSelectGroup.dataset.groupid = `list-${group.id}`
            modelSelectGroup.classList.add("hidden"); // TODO logic

            group.parts.forEach(part => {
                if (!menuRef) return;
                const imageWrapper = document.createElement('div');
                imageWrapper.classList.add("insert-image");
                imageWrapper.dataset.model = part;
                imageWrapper.innerHTML = `<img src="${part}.png" alt="${part}">`
                modelSelectGroup?.appendChild(imageWrapper)
            })
            selectModel?.appendChild(modelSelectGroup);
        })

        //Select first group
        document.querySelector(".menu-tab")?.classList.add("selected");
        document.querySelector(".select-model-group")?.classList.remove("hidden");

    }

    addEventListenersUI() {
        document.querySelectorAll(".insert-image").forEach(selectImage => {
            //TODO to touchstart
            selectImage.addEventListener("click", e => {
                const target = e.target as HTMLButtonElement;
                if (target?.dataset.model) this.addModelIntoScene(target.dataset.model);
            })
        })

        document.querySelectorAll(".menu-tab").forEach(menuTab => {
                menuTab.addEventListener("click", e => {
                    document.querySelectorAll(".menu-tab").forEach(menuTab => {
                        menuTab.classList.remove("selected");
                    });

                    menuTab.classList.add("selected");
                    const target = e.target as HTMLButtonElement;
                    const groupId = target?.dataset.groupid;
                    const list = document.querySelector(`[data-groupid="list-${groupId}"]`);

                    document.querySelectorAll(".select-model-group").forEach(groupList => {
                        groupList?.classList.add("hidden");
                    })

                    list?.classList.remove("hidden");

                })

            }
        )


        //RESET ALL BUTTON
        document.querySelector("#restart")?.addEventListener("click", () => {
            this.restart()
        })


    }

}


