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
    await axios.get(process.env.SERVER_PINGER_URL);
    log(`pinged ${process.env.SERVER_PINGER_URL}`);
}, 600000);

//<----------------------------------- ENDPOINTS --------------------------------------------------->

app.get('/api/check', (req, res) => {
    log(`GET ${req.path}`);
    res.send('Hello');
});

[
    { path: '/api/courses' },
    { path: '/api/sections' },
    { path: '/api/subjects' },
    {
        path: '/api/course_enrollment',
        sqlParams: ['', 'subject, code']
    },
    { path: '/api/enrollment_history' },
    { path: '/api/course_changes' },
    { path: '/api/section_changes' },
    {
        path: '/api/chart1',
        sqlParams: ['', '', `'${staticData.defaultWeek.slice(0,10)}'`],
        callback: rows => rows.map(row => row.time_frame)
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
        } catch (error) {
            log(error);
        }
    });
});

app.post('/api/chart1', async (req, res) => {
    try {
        const pgClient = createPGClient();
        await pgClient.connect();
        log(`POST ${req.path}`);
        const dbRes = await pgClient.query(formatSQL('./postgres/api/chart1.sql',
            (req.body.subjects != undefined && req.body.subjects.length > 0) ? `AND course_subject IN (${req.body.subjects.map(s => `'${s}'`).join(', ')})` : '',
            (req.body.components != undefined && req.body.components.length > 0) ? `AND LEFT(component, 3) IN (${req.body.components.map(s => `'${s}'`).join(', ')})` : '',
            `'${req.body.week.slice(0,10)}'`));
        res.json(dbRes.rows.map(time_frame => time_frame.time_frame));
        await pgClient.end();
    } catch(error) {
        log(error);
    };
});

app.post('/api/course_enrollment', async (req, res) => {
    try {
        const pgClient = createPGClient();
        await pgClient.connect();
        log(`POST ${req.path}`);
        const dbRes = await pgClient.query(formatSQL('./postgres/api/course_enrollment.sql',
            (req.body.order_by != undefined && req.body.order_by.length > 0) ?
                `${req.body.order_by.map(e => `${e.col}${e.order != undefined && !e.order ? ' DESC' : ''}`).join(', ')}` : 'subject, code',
            (req.body.limit != undefined) ? `LIMIT ${req.body.limit}` : ''));
        res.json(dbRes.rows);
        await pgClient.end();
    } catch(error) {
        log(error);
    };
});

//<------------------------------------------------------------------------------------------------->

// refresh every 15 minutes
refreshData();
setInterval(() => {
    refreshData()
    .catch(error => log(error));
}, 900000);

// https://ucalendar.uwaterloo.ca/2425/COURSE/course-${subject}.html
