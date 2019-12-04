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
let lastDate = new Date().toISOString()
let lastUrl = 'http://www.google.com/';
let deviceId = rel + platform + cpu + homedir.replace(/\s/g, '');
const bufferText = Buffer.from(deviceId, 'utf8');
deviceId = bufferText.toString('hex');

function normilizeTime(time) {
    console.log(time);
    time = (time / 100000).toFixed(2);
    if (time >= 0.6) {
        time = (time / 0.6).toFixed(2);
    }
    console.log(time);
    return time;
}

const addLog = async (url = '', isEnd = false) => {
    return await axios.post('http://localhost:3000/addLog', {
        deviceId,
        url,
        timeSpent: normilizeTime(Date.now() - new Date(lastDate)),
        keys: keylogs.join(','),
        date: lastDate,
        sessionEnd: isEnd,
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

    //  mainWindow.on('closed', async function () {
    //      try {
    //          await addLog(lastUrl);
    //          keylogs = [];
    //          mainWindow = null
    //      } catch (e) {
    //          console.log('TUTA', e);
    //      }
    // });
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

ipcMain.on("req", async (e, url, isEnd = false) => {
    await addLog(lastUrl, isEnd);
    lastUrl = url;
    keylogs = [];
    lastDate = new Date().toISOString()
});

ipcMain.on("key", (e, data) => {
    keylogs.push(data);
});

ipcMain.on("getId", (e) => {
    e.reply("getId", deviceId)
});
