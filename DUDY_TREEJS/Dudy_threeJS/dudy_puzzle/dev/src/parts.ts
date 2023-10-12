import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


export const PIPE_SCALE = 15;
export const PIPE_POSITION_LEFT = {x: -800, y: -450}
export const PIPE_POSITION_RIGHT = {x: +500, y:-450}




type PartConfig = {
    id: number,
    layer: number,
    part: string
}

type PipeConfig = {
    id: number,
    layer: number,
    model: string,
    name:string,
    parts: string[],
    startingCoordinates: {x: number, y: number}
}

export type GameConfig = {
    backgroundImageUrl: string,
    winImg: string;
    pipeGroups: PipeConfig[]
    icons: string[]
}


export class Part {
    // id: number;
    mesh: THREE.Mesh;
    // layer: number;
    size: { x: number, y: number };
    position: THREE.Vector3 = new THREE.Vector3();
    snapped = false;


    constructor(piece: { x: number, y: number}, mesh: THREE.Mesh, size: { x: number, y: number }) {
        this.size = size;
        this.mesh = mesh;
        this.mesh.userData.piece = this;
        // this.layer = config.layer;
        this.position.x = piece.x
        this.position.y = piece.y
        this.mesh.position.x = piece.x;
        this.mesh.position.y = piece.y;
        // this.id = config.id;
    }

    // resetHeight() {
    //     this.mesh.position.z = this.zIndex;
    // }

    resetPosition(){
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
    }

    // isOn(){
    //     return this.snapped;
    // }

    setOnPosition(primary_position: THREE.Vector3) {
        this.mesh.position.x = primary_position.x;
        this.mesh.position.y = primary_position.y;
    }


    getPosition() {
        return this.position;
    }

    // snapOnPipe(primary_position: THREE.Vector3, scene: THREE.Scene) {
    //     this.snapped = true;
    //     this.mesh.position.z = this.zIndex;
    //     this.setOnPosition(primary_position);
    // }

    // snapOffPipe(scene: THREE.Scene){
    //     this.mesh.position.z = this.zIndex;
    //     this.resetPosition();
    //     this.snapped = false;
    // }

}
