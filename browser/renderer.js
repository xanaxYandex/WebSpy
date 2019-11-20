const electron = require('electron');
const {ipcRenderer} = electron;

const ById = function (id) {
    return document.getElementById(id);
};
const jsonfile = require('jsonfile');
const favicon = require('favicon-getter').default;
const path = require('path');
const uuid = require('uuid');
const bookmarks = path.join(__dirname, 'bookmarks.json');

const webView = document.createElement('webview');
webView.className = 'page';
webView.src = 'http://www.google.com/';
webView.setAttribute('autosize', 'on');
webView.setAttribute('preload', 'spy.js');
webView.style.display = 'flex';

const viewsBlock = document.getElementById('views');

let views = ['8800555'];

let back = ById('back'),
    forward = ById('forward'),
    refresh = ById('refresh'),
    omni = ById('url'),
    dev = ById('console'),
    fave = ById('fave'),
    list = ById('list'),
    popup = ById('fave-popup'),
    view = ById('8800555'),
    tabList = ById('tab-list'),
    selectTab = ById('select-tab'),
    addNewTab = ById('add-tab'),
    keys = [],
    close = ById('close-btn'),
    minBtn = ById('min-btn'),
    maxBtn = ById('max-btn'),
    url;

function reloadView() {
    view.reload();
}

function backView() {
    view.goBack();
}

function forwardView() {
    view.goForward();
}

function updateURL(event) {
    if (event.keyCode === 13) {
        omni.blur();
        let val = omni.value;
        let https = val.slice(0, 8).toLowerCase();
        let http = val.slice(0, 7).toLowerCase();
        if (https === 'https://') {
            view.loadURL(val);
        } else if (http === 'http://') {
            view.loadURL(val);
        } else {
            val = 'http://' + val;
        }
        view.loadURL(val);
    }
}

const Bookmark = function (id, url, faviconUrl, title) {
    this.id = id;
    this.url = url;
    this.icon = faviconUrl;
    this.title = title;
};

Bookmark.prototype.ELEMENT = function () {
    const a_tag = document.createElement('a');
    a_tag.href = this.url;
    a_tag.className = 'link';
    a_tag.textContent = this.title;
    const favimage = document.createElement('img');
    favimage.src = this.icon;
    favimage.className = 'favicon';
    a_tag.insertBefore(favimage, a_tag.childNodes[0]);
    return a_tag;
};

function addBookmark() {
    let url = view.src;
    let title = view.getTitle();
    favicon(url).then(function (fav) {
        let book = new Bookmark(uuid.v1(), url, fav, title);
        jsonfile.readFile(bookmarks, function (err, curr) {
            curr.push(book);
            jsonfile.writeFile(bookmarks, curr, function (err) {
            })
        })
    })
}

function openPopUp(event) {
    let state = popup.getAttribute('data-state');
    if (state === 'closed') {
        popup.innerHTML = '';
        jsonfile.readFile(bookmarks, function (err, obj) {
            if (obj.length !== 0) {
                for (let i = 0; i < obj.length; i++) {
                    let url = obj[i].url;
                    let icon = obj[i].icon;
                    let id = obj[i].id;
                    let title = obj[i].title;
                    let bookmark = new Bookmark(id, url, icon, title);
                    let el = bookmark.ELEMENT();
                    popup.appendChild(el);
                }
            }
            popup.style.display = 'block';
            popup.setAttribute('data-state', 'open');
        });
    } else {
        popup.style.display = 'none';
        popup.setAttribute('data-state', 'closed');
    }
}

function handleUrl(event) {
    if (event.target.className === 'link') {
        event.preventDefault();
        view.loadURL(event.target.href);
    } else if (event.target.className === 'favicon') {
        event.preventDefault();
        view.loadURL(event.target.parentElement.href);
    }
}

function handleDevtools() {
    if (view.isDevToolsOpened()) {
        view.closeDevTools();
    } else {
        view.openDevTools();
    }
}

function updateNav(event) {
    omni.value = view.src;
    ipcRenderer.send("req", view.getURL())
}

function closeWindow() {
    const window = electron.remote.getCurrentWindow();
    window.close();
}

function restoreWindow() {
    const window = electron.remote.getCurrentWindow();
    if (window.isMaximized()) {
        window.setSize(1600, 768);
    } else {
        window.maximize();
    }
}

function minimizeWindow() {
    const window = electron.remote.getCurrentWindow();
    window.minimize();
}


function addTab() {
    const newTab = document.createElement('div');
    newTab.className = 'tab';
    newTab.id = 'select-tab';
    const newWebView = webView;
    const newId = (Math.random() * 10000).toFixed(0).toString();
    newWebView.id = newId;
    views.push(newId);
    viewsBlock.appendChild(newWebView);
    newTab.setAttribute('data-view-id', newId);
    newTab.innerHTML = `
            <span>Google</span>
            <span class="close-tab"><i class="fa fa-times" id="close-icon"></i></span>
        `;
    newTab.addEventListener('click', e => {
        if (e.target.id === 'close-icon') {
            console.log('gamno')
        } else {
            toggleTab(e.currentTarget.getAttribute('data-view-id'));
        }
    });
    tabList.append(newTab);
}

function toggleTab(id) {
    console.log(viewsBlock.childNodes)
}


selectTab.addEventListener('click', e => {
    if (e.target.id === 'close-icon') {
        console.log('gamno')
    } else {
        toggleTab(e.currentTarget.getAttribute('data-view-id'));
    }
});
addNewTab.addEventListener('click', addTab);
close.addEventListener('click', closeWindow);
minBtn.addEventListener('click', minimizeWindow);
maxBtn.addEventListener('click', restoreWindow);
refresh.addEventListener('click', reloadView);
back.addEventListener('click', backView);
forward.addEventListener('click', forwardView);
omni.addEventListener('keydown', updateURL);
fave.addEventListener('click', addBookmark);
list.addEventListener('click', openPopUp);
popup.addEventListener('click', handleUrl);
dev.addEventListener('click', handleDevtools);
view.addEventListener('did-finish-load', updateNav);
document.addEventListener("DOMContentLoaded", getVersion);
document.body.addEventListener("keyup", e => {
    keys.push(e.key);
});

// setInterval(()=>{
//     if(keys.length !== 0) {
//         ipcRenderer.send("keys", `inputs ${new Date()} : ${keys.join(',')} on URL: ${url}`);
//         keys = [];
//     }
// },2000);

function getVersion() {
    ipcRenderer.send('getId')
}

ipcRenderer.on("getId", (e, data) => {
    console.log(data)
});


