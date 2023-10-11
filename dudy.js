// function readTextFile(file, callback) {
//     var rawFile = new XMLHttpRequest();
//     rawFile.overrideMimeType("application/json");
//     rawFile.open("GET", file, false);
//     console.log("-> rawFile", rawFile);
//     rawFile.onload = () => callback(rawFile.responseText);
//     rawFile.send(null);
// }
//
// readTextFile("config.json", function(text){
//     data = JSON.parse(text)
//     console.log("-> data", data);
//
//     squareArray = new Array(0);
//
//     initializeBoard();
//
// });
//
//
// function initializeBoard() {
//     const seznam = document.querySelector("#seznam");
//     console.log("-> seznam", seznam);
//     const canvas =  document.createElement("canvas");
//
//     seznam.appendChild(canvas)
//     imageUrls = data.images[0].images[0];
//     console.log("-> imageUrls", imageUrls);
//
//     const img = document.createElement("img");
//     img.src = imageUrls;
//
//     let context = canvas.getContext('2d');
//
//     make_base();
//
//     function make_base()
//     {
//         let base_image = new Image();
//         base_image.src = imageUrls;
//         base_image.onload = function(){
//             context.drawImage(base_image, 0, 0);
//         }
//     }
//
// }

const circle = document.querySelector("#circle");
circle.addEventListener("click",(e)=>{
    console.log("-> e", e);
    event.preventDefault();
    console.log("CLICKEd")
})




const svgContainer = document.getElementById('svg-container');
const images = document.querySelectorAll('image'); // Select all image elements

images.forEach((image, index) => {
    image.addEventListener('click', () => {
        const x = event.clientX - svgContainer.getBoundingClientRect().left;
        const y = event.clientY - svgContainer.getBoundingClientRect().top;

        // Create a transparent rectangle to sample the pixel
        const transparentRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        transparentRect.setAttribute('x', x);
        transparentRect.setAttribute('y', y);
        transparentRect.setAttribute('width', 1);
        transparentRect.setAttribute('height', 1);
        transparentRect.setAttribute('opacity', 0);

        // Append the transparent rectangle to the SVG container
        svgContainer.appendChild(transparentRect);

        // Use getComputedStyle to get the computed style of the topmost image at the click position
        const topImageComputedStyle = getComputedStyle(transparentRect);

        // Check if the top image is nontransparent
        if (topImageComputedStyle.fill !== 'none' || topImageComputedStyle.opacity !== '0') {
            alert(`Clicked on a nontransparent section of image ${index + 1}`);
        }

        // Remove the transparent rectangle from the SVG container
        svgContainer.removeChild(transparentRect);
    });
});