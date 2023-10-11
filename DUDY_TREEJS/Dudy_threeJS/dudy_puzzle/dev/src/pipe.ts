import * as THREE from 'three';
import { Part } from './parts';


export class Pipe {
    mesh: THREE.Mesh;
    id: number = 0;
    position: { x: number, y: number , z:number}; //position
    size: { x: number, y: number };
    merged = false;
    zIndex: number;
    onCount: number;
    currentLayer: number;
    onPipe: number[] = [];
    parts: Part[] = [];

    constructor(id: number, mesh: THREE.Mesh, size: { x: number, y: number }, zIndex: number) {
        this.id = id;
        this.currentLayer = 0;
        this.position = mesh.position;
        this.size = size;
        this.mesh = mesh;
        this.mesh.userData.piece = this;
        this.zIndex = zIndex;
        this.onCount = 0;
        this.parts = [];
    }

    addPart(part: Part){
        this.parts.push(part)
    }

    partsOff(){
        this.currentLayer = 0;
        this.onPipe = [];
        this.onCount = 0;
    }

    isOnPipe(dressId: number) {
        return this.onPipe.indexOf(dressId) > -1;
    }

    addPiece(dressId: number){
        this.onPipe.push(dressId);
        this.onCount++;
    }

    removePiece(dressId: number){
        let index = this.onPipe.indexOf(dressId);
        if(index > -1){
            this.onPipe.splice(index, 1);
        }
        
        this.onCount--;
    }

    getOnCount() {
        return this.onCount;
    }

    removeLayer(layer: number) {
        if(layer == this.currentLayer){
            this.currentLayer--;
        }
    }

    setLayer(layer: number) {
        if(layer > this.currentLayer){
            this.currentLayer = layer;
        }
    }

    getLayer() {
        return this.currentLayer;
    }

    resetHeight() {
        this.mesh.position.z = this.zIndex;
    }

    getPosition() {
        return new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    }


}