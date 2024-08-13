require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const staticData = require('./data.json');
import { createPGClient, formatSQL, log } from './utility';
import refreshAPI from './refreshData';

const pgClient = createPGClient();
pgClient.connect();

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

//<----------------------------------- ENDPOINTS --------------------------------------------------->

[
    { path: '/api/courses' },
    { path: '/api/sections' },
    { path: '/api/subjects' },
    { path: '/api/changes' },
    {
        path: '/api/chart1',
        sqlParams: ['','',`'${staticData.defaultWeek.slice(0,10)}'`],
        callback: rows => rows.map(row => row.time_frame)
    }
].forEach(route => {
    try {
        app.get(route.path, async (req, res) => {
            const dbRes = await pgClient.query(formatSQL(`./postgres${route.path}.sql`, ...(route.sqlParams ?? [])));
            res.json((route.callback ?? (rows => rows))(dbRes.rows));
        });
    } catch (error) {
        log(error);
    }
});

app.post('/api/chart1', async (req, res) => {
    try {
    const dbRes = await pgClient.query(formatSQL('./postgres/api/chart1.sql',
        (req.body.subjects != undefined && req.body.subjects.length > 0) ? `AND course_subject IN (${req.body.subjects.map(s => `'${s}'`).join(', ')})` : '',
        (req.body.components != undefined && req.body.components.length > 0) ? `AND LEFT(component, 3) IN (${req.body.components.map(s => `'${s}'`).join(', ')})` : '',
        `'${req.body.week.slice(0,10)}'`));
    res.json(dbRes.rows.map(time_frame => time_frame.time_frame));
    } catch(error) {log(error)};
});

//<------------------------------------------------------------------------------------------------->

refreshAPI();
setInterval(() => {
    refreshAPI()
    .catch(error => log(error));
}, 600000);

// https://ucalendar.uwaterloo.ca/2425/COURSE/course-${subject}.html
