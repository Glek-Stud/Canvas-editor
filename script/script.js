const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');


const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');
const toggleButton = document.getElementById('toggle-sidebar');

toggleButton.addEventListener('click', function () {
    sidebar.classList.toggle('hidden');
    mainContent.classList.toggle('expanded');
    toggleButton.classList.toggle('hidden');
});


document.addEventListener('DOMContentLoaded', () => {
    const canvasContainer = document.getElementById('canvas-container');
    const sidebar = document.getElementById('sidebar');
    let activeCanvas = null;
    let canvases = [];
    let canvasCount = 0;


    function getRandomBrightColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 100;
        const lightness = 50;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }


    function createCanvas(id) {
        const canvas = document.createElement('canvas');
        canvas.id = `canvas_${id}`;
        canvas.classList.add('canvas');
        canvas.width = 2000;
        canvas.height = 1200;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return {canvas, ctx};
    }

    function activateCanvas(canvasObj) {
        if (activeCanvas) {
            activeCanvas.canvas.style.display = 'none';
        }
        canvasObj.canvas.style.display = 'block';
        activeCanvas = canvasObj;
    }


    function addNewCanvas() {
        const newCanvasId = ++canvasCount;
        const newCanvasObj = createCanvas(newCanvasId);
        canvasContainer.appendChild(newCanvasObj.canvas);
        canvases.push(newCanvasObj);
        activateCanvas(newCanvasObj);
        addSidebarButton(`Canvas ${newCanvasId}`, newCanvasObj);
    }

    //<ul id="canvas-list">
    //    <li className="card" style="--clr:#ff0810;"><a href="Amain_menu.html">Home page</a</li>
    //</ul>

    function addSidebarButton(name, canvasObj) {
        const newButton = document.createElement('li');
        const randomColor = getRandomBrightColor();
        newButton.classList.add('card');
        newButton.style.setProperty('--clr', randomColor);
        newButton.innerHTML = `<a href="#">${name}</a>`;

        newButton.addEventListener('mousemove', (e) => {
            const rect = newButton.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            newButton.style.setProperty('--x', `${x}px`);
            newButton.style.setProperty('--y', `${y}px`);
        });

        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            activateCanvas(canvasObj);
        });

        sidebar.querySelector('ul').appendChild(newButton);
    }

    ipcRenderer.on('new-file', addNewCanvas);

    addNewCanvas();


    ipcRenderer.on('save-file', (event, filePath) => {
        if (!activeCanvas) {
            alert("No canvas");
            return;
        }
        saveCanvasAsPNG(filePath);
    });

    function saveCanvasAsPNG(filePath) {
        const dataURL = activeCanvas.canvas.toDataURL('image/png');
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
        fs.writeFile(filePath, base64Data, 'base64', (err) => {
            if (err) {
                console.error('Failed:', err);
            } else {
                console.log('Good');
            }
        });
    }

    ipcRenderer.on('open-file', (event, filePath) => {
        loadImageToCanvas(filePath);
    });

    function loadImageToCanvas(filePath) {
        const img = new Image();
        img.src = filePath;
        const fileName = path.basename(filePath, path.extname(filePath));

        img.onload = () => {
            const canvasObj = createCanvas(canvases.length + 1);
            canvasObj.ctx.drawImage(img, 0, 0, canvasObj.canvas.width, canvasObj.canvas.height);
            canvasContainer.appendChild(canvasObj.canvas);
            canvases.push(canvasObj);
            activateCanvas(canvasObj);
            addSidebarButton(fileName, canvasObj);
        };

        img.onerror = (err) => {
            console.error("Failed to load image:", err);
        };
    }

    let isPainting = false;
    let brushActive = false;
    let brushSize = parseInt(document.getElementById('brushSize').value);
    let brushColor = document.getElementById('brushColor').value;
    let lastX = 0;
    let lastY = 0;

    const brushSizeInput = document.getElementById('brushSize');
    const brushColorInput = document.getElementById('brushColor');
    const brushButton = document.getElementById('brushButton');

    brushSizeInput.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
    });

    brushColorInput.addEventListener('input', (e) => {
        brushColor = e.target.value;
    });

    brushButton.addEventListener('click', () => {
        brushActive = !brushActive;

        if (brushActive) {
            brushButton.classList.add('active');
            activeCanvas.canvas.addEventListener('mousedown', startPainting);
            activeCanvas.canvas.addEventListener('mouseup', stopPainting);
            activeCanvas.canvas.addEventListener('mousemove', paint);
            activeCanvas.canvas.addEventListener('mouseleave', stopPainting);
        } else {
            brushButton.classList.remove('active');
            activeCanvas.canvas.removeEventListener('mousedown', startPainting);
            activeCanvas.canvas.removeEventListener('mouseup', stopPainting);
            activeCanvas.canvas.removeEventListener('mousemove', paint);
            activeCanvas.canvas.removeEventListener('mouseleave', stopPainting);
        }
    });

    function startPainting(e) {
        isPainting = true;
        [lastX, lastY] = getMousePos(e, activeCanvas.canvas);
        paint(e);
    }

    function stopPainting() {
        isPainting = false;
        activeCanvas.ctx.beginPath();
    }

    function paint(e) {
        if (!isPainting) return;
        const [x, y] = getMousePos(e, activeCanvas.canvas);
        activeCanvas.ctx.strokeStyle = brushColor;
        activeCanvas.ctx.lineWidth = brushSize;
        activeCanvas.ctx.lineCap = 'round';
        activeCanvas.ctx.beginPath();
        activeCanvas.ctx.moveTo(lastX, lastY);
        activeCanvas.ctx.lineTo(x, y);
        activeCanvas.ctx.stroke();
        [lastX, lastY] = [x, y];
    }

    function getMousePos(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return [x, y];
    }
});
