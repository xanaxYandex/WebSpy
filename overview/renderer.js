const electron = require('electron');
const {ipcRenderer} = electron;
const axios = require('axios');
const Chart = require('chart.js');
const ctx = document.getElementById('my-chart');
let myChart = null;


function setOrPush(target, val) {
    let result = val;
    if (target) {
        result = [target];
        result.push(val);
    }
    return result;
}

function getFormResults(formElement) {
    let formElements = formElement.elements;
    let formParams = {};
    let i = 0;
    let elem = null;
    for (i = 0; i < formElements.length; i += 1) {
        elem = formElements[i];
        switch (elem.type) {
            case 'submit':
                break;
            case 'radio':
                if (elem.checked) {
                    formParams[elem.name] = elem.value;
                }
                break;
            case 'checkbox':
                if (elem.checked) {
                    formParams[elem.name] = setOrPush(formParams[elem.name], elem.value);
                }
                break;
            default:
                formParams[elem.name] = setOrPush(formParams[elem.name], elem.value);
        }
    }
    return formParams;
}

const paramsForm = document.getElementById('params');
const submitButton = document.getElementById('subm');
const info = document.getElementById('info');
submitButton.addEventListener('click', async e => {
    e.preventDefault();
    const params = getFormResults(paramsForm);
    if (params.deviceId === '' || params.interval === '') {
        alert("No required data provided");
        return false;
    }
    let logs = await axios.get('http://localhost:3000/logs', {params});
    logs = logs.data.map(item => {
        return {
            url: item.url,
            keys: item.keys,
            timeSpent: item.timeSpent,
            date: item.dateAsStr
        };
    });
    console.log(logs);
    createChart(normilizeData(logs));
    info.innerHTML = '';
    let htmlText = '';
    htmlText +=
        `<div class="info-table" ">
            <div class="titles">
               <div class="url"><span>URL</span></div>
               <div class="keys"><span>Keys</span></div>
               <div class="date"><span>Date</span></div>
            </div>
        `;
    logs.forEach(item => {
        htmlText +=
            `
            <div class="content-row">
                <div class="row-1"><span>${item.url}</span></div>
                <div class="row-2"><span>${item.keys}</span></div>
                <div class="row-3"><span>${item.date}</span></div>
            </div>
            `;
    });
    htmlText +=
        `</div>`;
    info.innerHTML = htmlText;
    return false;
});

function normilizeData(data) {
    const times = data.map(item => item.timeSpent);
    const sites = data.map(item => /\/\/(.*?)\//.exec(item.url)[1]);

    const dataset = {};
    Array.from(new Set(sites)).forEach(item => {
        dataset[item] = 0;
    });

    for (let i = 0; i < sites.length; i++) {
        dataset[sites[i]] += times[i];
    }

    for(let item of Object.keys(dataset)) {
        dataset[item] = +dataset[item].toFixed(2);
    }

    return dataset;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function createChart(dataset) {
    document.querySelector('div.chart').style.display = 'block';

    const colors = Object.keys(dataset).map(() => {
        return getRandomColor();
    });
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dataset),
            datasets: [
                {
                    label: "Spending time",
                    backgroundColor: colors,
                    data: Object.values(dataset)
                }
            ]
        },
        options: {
            title: {
                display: true,
                text: 'Time tracker'
            }
        }
    });
}




