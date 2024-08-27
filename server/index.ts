require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const staticData = require('./data.json');
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
    {
        path: '/api/course_changes',
        sqlParams: ['courses.subject, courses.code']
    },
    { path: '/api/section_changes' },
    {
        path: '/api/chart1',
        sqlParams: ['', '', `'${staticData.defaultWeek.slice(0,10)}'`],
        callback: rows => rows.map(row => row.time_frame)
    },
    {
        path: '/api/chart2',
        sqlParams: ['MTHEL', '99']
    },
    { path: '/api/testing' }
].forEach(route => {
    app.get(route.path, async (req, res) => {
        try {
            const pgClient = createPGClient();
            await pgClient.connect();
            log(`GET ${req.path}`);
            const dbRes = await pgClient.query(formatSQL(`./postgres${route.path}.sql`, ...(route.sqlParams ?? [])));
            res.json((route.callback ?? (rows => rows))(dbRes.rows));
            await pgClient.end();
        } catch(error) {
            log(error);
        }
    });
});

[
    {
        path: '/api/chart1',
        sqlParams: [
            body => (body.subjects != undefined && body.subjects.length > 0) ? `AND course_subject IN (${body.subjects.map(s => `'${s}'`).join(', ')})` : '',
            body => (body.components != undefined && body.components.length > 0) ? `AND LEFT(component, 3) IN (${body.components.map(s => `'${s}'`).join(', ')})` : '',
            body => `'${body.week.slice(0,10)}'`
        ],
        callback: rows => rows.map(row => row.time_frame)
    },
    {
        path: '/api/chart2',
        sqlParams: [
            body => body.subject,
            body => body.code
        ]
    },
    {
        path: '/api/course_changes',
        sqlParams: [
            body => (body.order_by != undefined && body.order_by.length > 0) ?
                `${body.order_by.map(e => `${e.col}${e.order != undefined && !e.order ? ' DESC' : ''}`).join(', ')}` : 'subject, code'
        ]
    }
].forEach(route => {
    app.post(route.path, async (req, res) => {
        try {
            const pgClient = createPGClient();
            await pgClient.connect();
            log(`POST ${req.path}`);
            const sqlStrs = route.sqlParams.map(func => func(req.body));
            const dbRes = await pgClient.query(formatSQL(`./postgres${req.path}.sql`, ...sqlStrs));
            res.json((route.callback ?? (r => r))(dbRes.rows));
            await pgClient.end();
        } catch(error) {
            log(error);
        }
    });
});

//<------------------------------------------------------------------------------------------------->

// refresh every 15 minutes
refreshData();
setInterval(() => {
    refreshData()
    .catch(error => log(error));
}, 1800000);

// https://ucalendar.uwaterloo.ca/2425/COURSE/course-${subject}.html
