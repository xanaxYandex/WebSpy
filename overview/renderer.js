const electron = require('electron');
const {ipcRenderer} = electron;
const axios = require('axios');
const Chart = require('chart.js');
const ctx = document.getElementById('my-chart');
let myChart = null;
let logLength = 0;
let logs = [];


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
const updateButton = document.getElementById('updt');
const updateChartView = document.getElementById('chart-type');
const changeChart = document.getElementById('chart-change');
const info = document.getElementById('info');

updateButton.addEventListener('click', () => {
    validateInput();
});

updateChartView.addEventListener('click', (event) => {
    myChart.clear();
    if (myChart.config.type === 'doughnut') {
        if (myChart.options.scales !== undefined) {
            myChart.options.scales.xAxes[0].display = true;
            myChart.options.scales.yAxes[0].display = true;
        }
        myChart.config.type = 'bar';
        event.target.innerHTML = 'Update to doughnut';
    } else {
        myChart.options.scales.xAxes[0].display = false;
        myChart.options.scales.yAxes[0].display = false;
        myChart.config.type = 'doughnut';
        event.target.innerHTML = 'Update to bars';
    }
    myChart.update();
});

submitButton.addEventListener('click', async e => {
    e.preventDefault();
    const params = getFormResults(paramsForm);
    if (+params.interval !== 1) {
        document.getElementById('add-options').style.display = 'flex';
    } else {
        document.getElementById('add-options').style.display = 'none';
    }
    if (params.deviceId === '' || params.interval === '') {
        alert("No required data provided");
        return false;
    }
    changeChart.style.display = 'flex';
    logs = await axios.get('http://localhost:3000/logs', {params});
    logs = logs.data.map(item => {
        return {
            url: item.url,
            keys: item.keys,
            timeSpent: item.timeSpent,
            date: item.dateAsStr,
            sessionEnd: item.sessionEnd
        };
    });
    if (myChart === null) {
        createChart(normilizeData(logs));
    } else {
        createChart(normilizeData(logs), true);
    }

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
            <div class="content-row" style="${item.sessionEnd ? 'margin-bottom: 35px' : ''}">
                <div class="row-1"><span>${item.url}</span></div>
                <div class="row-2"><span>${item.keys}</span></div>
                <div class="row-3"><span>${item.date}</span></div>
            </div>
            `;
    });
    htmlText += `</div>`;
    info.innerHTML = htmlText;
    return false;
});

function validateInput() {
    let topValue = document.getElementById("top-value").value;
    if (isNaN(topValue) || +topValue < 1 || +topValue > logLength) {
        document.getElementById("demo").innerHTML = 'Input not valid';
    } else {
        document.getElementById("demo").innerHTML = 'Nice';
        normilizeData(logs, +topValue);
    }
}

let bubbleSort = (inputArr) => {
    let len = inputArr.length;
    let swapped;
    do {
        swapped = false;
        for (let i = 0; i < len; i++) {
            if (i === len - 1) {
                break;
            }
            if (inputArr[i][1] < inputArr[i + 1][1]) {
                let tmp = inputArr[i];
                inputArr[i] = inputArr[i + 1];
                inputArr[i + 1] = tmp;
                swapped = true;
            }
        }
    } while (swapped);
    return inputArr;
};

const sortByTime = dataset => bubbleSort(Object.entries(dataset));

function normilizeData(data, topValue = 0) {
    const times = data.map(item => item.timeSpent);
    const sites = data.map(item => /\/\/(.*?)\//.exec(item.url)[1]);
    let dataset = {};
    Array.from(new Set(sites)).forEach(item => dataset[item] = 0);
    for (let i = 0; i < sites.length; i++) {
        if (i > 0) if (!data[i - 1].sessionEnd) dataset[sites[i]] += times[i];
        else dataset[sites[i]] += times[i];
    }
    for (let item of Object.keys(dataset)) {
        dataset[item] = +dataset[item].toFixed(2);
    }
    logLength = Object.keys(dataset).length;
    if (topValue !== 0) {
        const sortedDataset = sortByTime(dataset);
        dataset = {};
        for (let i = 0; i < topValue; i++) {
            dataset[sortedDataset[i][0]] = sortedDataset[i][1];
        }
        myChart.data.labels = Object.keys(dataset);
        myChart.data.datasets[0].data = Object.values(dataset);
        myChart.update();
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

function createChart(dataset, isNewRequest = false) {
    document.querySelector('div.chart').style.display = 'block';
    const colors = Object.keys(dataset).map(() => {
        return getRandomColor();
    });

    if (isNewRequest) {
        myChart.destroy();
    }

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
            title: {display: true, text: 'Time tracker'}
        }
    });
}




