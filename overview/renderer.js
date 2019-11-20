const electron = require('electron');
const {ipcRenderer} = electron;
const axios = require('axios');

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
submitButton.addEventListener('click',async e=>{
    e.preventDefault();
    const params = getFormResults(paramsForm);
    if(params.deviceId == "" || params.interval == ''){
        alert("No required data provided");
        return false;
    }
    let logs = await axios.get('http://localhost:3000/logs',{params});
    logs = logs.data.map(item => {
        return {
            url: item.url,
            keys: item.keys,
            date: item.dateAsStr
        };
    });
    info.innerText = JSON.stringify(logs).replace(/}/g,"}\n\n");

    return false;
});




