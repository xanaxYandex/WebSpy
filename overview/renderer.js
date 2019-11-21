const electron = require('electron');
const {ipcRenderer} = electron;
const axios = require('axios');
const Chart = require('chart.js');
const ctx = document.getElementById('my-chart')
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
    if (params.deviceId == "" || params.interval == '') {
        alert("No required data provided");
        return false;
    }
    let logs = await axios.get('http://localhost:3000/logs', {params});
    logs = logs.data.map(item => {
        return {
            url: item.url,
            keys: item.keys,
            date: item.dateAsStr
        };
    });

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
    //info.innerText = JSON.stringify(logs).replace(/}/g,"}\n\n");

    return false;
});

function normilizeData(data) {
    const dates = data.map(item => item.date);
    const times = [];
    for (let i in dates) {
        if (dates.hasOwnProperty(i)) {
            if (i > 0) {
                const time = new Date(dates[i]) - new Date(dates[i - 1]);
                const normalTime = time.toString().length > 5
                    ? new Date(time).getMinutes()
                    : 1;
                times.push(normalTime);
            }
        }
    }
    const sites = data.map(item => /\/\/(.*?)\//.exec(item.url)[1]);
    sites.pop();
    const dataset = {};
    // console.log(times);
    // for (let i = 0; i < sites.length; i++) {
    //     dataset[sites[i]] = times[i];
    // }
    // console.log(dataset);
    // return {sites, times};
}


function createChart(dataset) {
    document.querySelector('div.chart').style.display = 'block';

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ["Africa", "Asia", "Europe", "Latin America", "North America"],
            datasets: [
                {
                    label: "Population (millions)",
                    backgroundColor: ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850"],
                    data: [2478, 5267, 734, 784, 433]
                }
            ]
        },
        options: {
            title: {
                display: true,
                text: 'Predicted world population (millions) in 2050'
            }
        }
    });
}




