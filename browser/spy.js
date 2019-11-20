const electron = require('electron');
const {ipcRenderer} = electron;

document.addEventListener("keyup",e=>{
    ipcRenderer.send("key", e.key);
});
