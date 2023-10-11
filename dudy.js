function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, false);
    console.log("-> rawFile", rawFile);
    rawFile.onload = () => callback(rawFile.responseText);
    rawFile.send(null);
}


let configData = null;





const dragAndMove = () => {
    var elements = Array.from(document.querySelectorAll('svg .selector'));
    console.log("-> elements", elements);
    let offsetX, offsetY, isDragging = false;

    elements.forEach(function (el) {
        // el.addEventListener("mousedown", start);
        // el.addEventListener("mousemove", move);
        el.addEventListener("touchstart", start);
        el.addEventListener("touchmove", move);
    })

    function start(e) {
        console.log("-> START e", e);
        elements.forEach(part => {
            part.closest("svg").style.zIndex = 1;
        })
        isDragging = true;
        const {left, top} = e.target.getBoundingClientRect();
        console.log("-> left", left);
        console.log("-> top", top);
        // Get the first touch point
        if (e.touches && e.touches[0]) {

            const touch = e.touches[0];
            console.log("->  touch.clientX",  touch.clientX);
            console.log("-> touch.clientY ", touch.clientY );
            offsetX = touch.clientX - left;
            console.log("-> offsetX", offsetX);
            offsetY = touch.clientY - top;
            console.log("-> offsetY", offsetY);
        } else {
            offsetX = e.clientX - left;
            offsetY = e.clientY - top;
        }
        // e.target.style.cursor = 'grabbing';
        e.target.closest("svg").style.zIndex = 5;
    }

    function move(e) {

        if (!isDragging) return;

        const targetSvg = e.target.closest("svg");


        if (e.touches && e.touches[0]) {
            const touch = e.touches[0];

            currentTransform = targetSvg.getAttribute("transform") || "";

            let updatedTransform = "";
            if (currentTransform.includes("translate")) {
                updatedTransform =  currentTransform.replace(/translate\((.*?)\)/, `translate(${(touch.clientX - offsetX)}, ${(touch.clientY - offsetY)})`);
            }
            else{
                updatedTransform =  currentTransform + ` translate(${(touch.clientX - offsetX)}, ${(touch.clientY - offsetY)})`;
            }
            // const currentTransform = `translate(${(touch.clientX - offsetX)}, ${(touch.clientY - offsetY)})`;

            targetSvg.setAttribute("transform", updatedTransform);

        }
        else{
            //TODO mouse
            const newTransform = `translate(${e.clientX - offsetX}, ${e.clientY - offsetY})`;

            // Set the updated transform attribute to the SVG element
            targetSvg.setAttribute("transform", newTransform);
        }


    }

    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            // e.target.style.cursor = 'grab';
        }
    });
}

async function initializeBoard() {
    const dudyApp = document.querySelector("#dudyApp");
    const groupParts = configData.groupParts || [];



        groupParts.forEach(group => {
            group.parts.forEach(partUrl => {

                console.log("-> partUrl", partUrl);
                async function printFiles () {
                    console.log("-> PRINT SVG");
                    let url = await fetch(partUrl);
                    let text = await url.text();
                    const svgWrapper = document.createElement("div");
                    svgWrapper.classList.add("svgWrapper")
                    svgWrapper.innerHTML = text;
                    dudyApp.appendChild(svgWrapper);
                }

                printFiles().then(() => {
                    console.log("Part added: ", partUrl)

                    dragAndMove();
                })


            })
        })


}


readTextFile("config.json", function (text) {
    configData = JSON.parse(text)
    console.log("-> data", configData);

    initializeBoard();

});
