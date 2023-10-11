import { PipeGame } from './game';

function readTextFile(file: string, callback: CallableFunction) {
    const rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onload = () => callback(rawFile.responseText);
    rawFile.send(null);
}


function init(text: string){    
    const config = JSON.parse(text);
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const game = new PipeGame(config, canvas);

    const frame = () => {
        requestAnimationFrame(frame);
        game.render();
    };
    frame();

}


window.onpointerdown = () => {
    window.parent.postMessage({"type":"activity", "data":"buttonPress"}, "*");
}

window.onload = () => {
    readTextFile("config.json", init);
}