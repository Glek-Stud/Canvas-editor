const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: false,
            zoomFactor: 0.8 
        },
    });

    win.maximize();
    win.loadFile('Amain_menu.html');
}

app.whenReady().then(() => {
    createWindow();

    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New file',
                    click() {
                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        if (focusedWindow) {
                            focusedWindow.webContents.send('new-file');
                        }
                    }
                },
                {
                    label: 'Open file',
                    async click() {
                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        if (focusedWindow) {
                            const { canceled, filePaths } = await dialog.showOpenDialog(focusedWindow, {
                                title: 'Open Image File',
                                filters: [
                                    { name: 'file', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }
                                ],
                                properties: ['openFile']
                            });

                            if (!canceled && filePaths.length > 0) {
                                focusedWindow.webContents.send('open-file', filePaths[0]);
                            }
                        }
                    }
                },
                {
                    label: 'Save as',
                    async click() {
                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        if (focusedWindow) {
                            const { canceled, filePath } = await dialog.showSaveDialog(focusedWindow, {
                                title: 'Save Canvas',
                                defaultPath: 'canvas.png',
                                filters: [
                                    { name: 'png', extensions: ['png'] },
                                    { name: 'jpg', extensions: ['jpg', 'jpeg'] },
                                    { name: 'bmp', extensions: ['bmp'] }
                                ]
                            });

                            if (!canceled && filePath) {
                                focusedWindow.webContents.send('save-file', filePath);
                            }
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    role: 'quit'
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
