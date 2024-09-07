require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const staticData = require('./consts.json');
import { createPGClient, formatSQL, log } from './utility';
import refreshData from './refreshData';

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(port, () => {
    log(`App listening on port ${port}`);
});

const axios = require('axios');
setInterval(async () => {
    try {
        await axios.get(process.env.SERVER_PINGER_URL);
        log(`pinged ${process.env.SERVER_PINGER_URL}`);
    } catch(error) {
        console.log(error);
    }
}, 600000);

//<----------------------------------- ENDPOINTS --------------------------------------------------->

app.get('/api/check', (req, res) => {
    log(`GET ${req.path}`);
    res.send('Hello');
});

[
    {
        path: '/api/info',
        callback: rows => rows[0]
    },
    { path: '/api/courses' },
    { path: '/api/sections' },
    { path: '/api/course_changes' },
    { path: '/api/section_changes' },
    {
        path: '/api/chart1',
        defaultParams: {
            subjects: [],
            components: [],
            week: staticData.defaultWeek
        },
        toSQLParams: params => {return {
            subjects: params.subjects.length > 0 ? `AND course_subject IN (${params.subjects.map(s => `'${s}'`).join(', ')})` : '',
            components: params.components.length > 0 ? `AND LEFT(component, 3) IN (${params.components.map(s => `'${s}'`).join(', ')})` : '',
            week: `${params.week.slice(0,10)}`
        }},
        callback: rows => rows.map(row => row.time_frame)
    },
    {
        path: '/api/chart2',
        defaultParams: {
            subject: staticData.defaultSubjectSelected,
            code: staticData.defaultCodeSelected
        },
        toSQLParams: params => params
    },
    {
        path: '/api/chart3',
        defaultParams: {
            subject: staticData.defaultSubjectSelected,
            code: staticData.defaultCodeSelected,
            component: staticData.defaultComponentSelected
        },
        toSQLParams: params => params
    }
].forEach(route => {
    app.get(route.path, async (req, res) => {
        try {
            log(`GET ${req.path} ${JSON.stringify(req.query.params ?? {})}`);
            let SQLParams: string[] = [];
            if(route.defaultParams) {
                const reqParams = { ...route.defaultParams, ...JSON.parse(req.query.params ?? "{}") };
                SQLParams = Object.values(route.toSQLParams(reqParams));
            }
            const pgClient = createPGClient();
            await pgClient.connect();
            const dbRes = await pgClient.query(formatSQL(`./postgres${route.path}.sql`, ...SQLParams));
            res.json((route.callback ?? (rows => rows))(dbRes.rows));
            await pgClient.end();
        } catch(error) {
            log(error);
        }
    });
});

//<------------------------------------------------------------------------------------------------->

refreshData();

// https://ucalendar.uwaterloo.ca/2425/COURSE/course-${subject}.html
