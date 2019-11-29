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

const viewsBlock = document.getElementById('views');

let views = ['8800555'];
let previousView = '8800555';

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

function updateNav() {
    try {
        return new Promise(() => {
            omni.value = view.src;
            document.querySelector(`[data-view-id="${view.id}"] span.title`).innerText = view.getTitle();
            console.log(view.getURL());
            if (view.getURL() !== '') {
                ipcRenderer.send("req", view.getURL())
            }
        });
    } catch (e) {
        console.log('Tuta', e);
    }

}

async function closeWindow() {
    if (view.getURL() !== '') {
        ipcRenderer.send("req", view.getURL())
    }
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

function createWebview() {
    const webView = document.createElement('webview');
    webView.className = 'page';
    webView.src = 'http://www.google.com/';
    webView.setAttribute('autosize', 'on');
    webView.setAttribute('preload', 'spy.js');
    webView.style.display = 'flex';
    return webView;
}

function generateNotExistingViewId() {
    let newId = '';
    while (true) {
        const randId = (Math.random() * 10000).toFixed(0).toString();
        if (!views.some(id => id === newId)) {
            newId = randId;
            break;
        }
    }
    return newId;
}

function addTab() {
    const newWebView = createWebview();
    const newId = generateNotExistingViewId();
    const newTab = document.createElement('div');
    newWebView.id = newId;
    newTab.className = 'tab';
    newTab.id = 'select-tab';
    newTab.setAttribute('data-view-id', newId);

    newTab.innerHTML = `<span class="title">Google</span>
                        <span class="close-tab"><i class="fa fa-times" id="close-icon"></i></span>`;

    newTab.addEventListener('click', e => {
        if (e.target.id === 'close-icon') {
            closeTab(e.currentTarget.getAttribute('data-view-id'));
        } else {
            toggleTab(e.currentTarget.getAttribute('data-view-id'));
        }
    });

    viewsBlock.appendChild(newWebView);
    tabList.append(newTab);
    views.push(newId);
    const to = setTimeout(() => {
        toggleTab(newId);
    }, 100);
}

function toggleTab(id) {
    if (id !== view.id) {
        changeViewId(id);
        updateNav();
        for (let node of viewsBlock.childNodes) {
            if (node.id === id) {
                node.style.display = 'flex';
                document.querySelector(`[data-view-id="${node.id}"]`).style.background = '#383c3e';
            } else {
                node.style.display = 'none';
                document.querySelector(`[data-view-id="${node.id}"]`)
                    .style
                    .background = 'linear-gradient(180deg, #696e70, #383c3e) ';
            }
        }
    }
}

function changeViewId(viewId) {
    view = ById(viewId);
    view.addEventListener('did-finish-load', updateNav, );
}

function closeTab(id) {
    viewsBlock.removeChild(document.getElementById(id));
    tabList.removeChild(document.querySelector(`[data-view-id="${id}"]`));
    toggleTab(views[views.indexOf(id) - 1]);
    views = views.filter(viewId => viewId !== id);
}

selectTab.addEventListener('click', e => {
    if (e.target.id === 'close-icon') {
        closeTab(e.currentTarget.getAttribute('data-view-id'));
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


