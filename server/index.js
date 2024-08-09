require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require("cheerio");
const pg = require('pg');

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
    console.log(`App listening on port ${port}`);
})

const staticData = require('./data.json');
const subjects = staticData.subjects;
//['AE', 'BE', 'BME', 'CHE', 'ECE', 'ENVE', 'GEOE', 'ME', 'MGMT', 'MSE', 'MTE', 'NE', 'SE', 'SYDE', 'TRON']
const daysOfWeekAbbrev = staticData.daysOfWeekAbbrev;

//<----------------------------------- ENDPOINTS --------------------------------------------------->

app.get('/api/courses', async (req, res) => {
    const pgClient = new pg.Client({
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        ssl: {
            rejectUnauthorized: false,
        }
    });
    await pgClient.connect();
    const dbRes = await pgClient.query('SELECT * FROM courses');
    console.log(dbRes);
    res.json(dbRes.rows);
    await pgClient.end();
});

app.get('/api/sections', (req, res) => {
    res.json(apiObject.sections);
    
});

app.post('/api/sections', (req, res) => {
    console.log(req.body);
    res.json(apiObject.sections.filter((section) =>
        (req.body.subjects == undefined || req.body.subjects.length == 0 || req.body.subjects.includes(section.subject)) &&
        (req.body.components == undefined || req.body.components.length == 0 || req.body.components.includes(section.component.split(' ')[0]))
    ));
    // const pgClient = new pg.Client({
        //     user: process.env.PGUSER,
        //     password: process.env.PGPASSWORD,
        //     host: process.env.PGHOST,
        //     port: process.env.PGPORT,
        //     ssl: {
        //         rejectUnauthorized: false,
        //     }
        // });
        // await pgClient.connect();
        // await pgClient.query(sql);
        // await pgClient.end();
});

//<------------------------------------------------------------------------------------------------->

// refresh info every 15 minutes
async function refreshAPI() {
    try {
        const requests = subjects.map((subject) =>
            axios.get(`https://classes.uwaterloo.ca/cgi-bin/cgiwrap/infocour/salook.pl?level=under&sess=1249&subject=${subject}`));
        const webpages = await Promise.all(requests);
        console.log('fetched data');
        const courses = [];
        const sections = [];
        const timeslots = [];
        for(let i = 0; i < webpages.length; i++) {
            const $ = cheerio.load(webpages[i].data);

            $('body > main > p > table > tbody > tr')
            .filter((idx, element) => element.children.length == 8 || element.children.length == 2)
            .each((idx, element) => {
                
                // course general info
                if(element.children.length == 8) {
                    courses.push([
                        courses.length+1,// course_id
                        $(element).children(':nth-child(1)').text().trim(),// subject
                        $(element).children(':nth-child(2)').text().trim(),// code
                        Number($(element).children(':nth-child(3)').text()),// units
                        $(element).children(':nth-child(4)').text().trim(),// title
                    ]);
                } else {
                    // course sections
                    $(element).find('table > tbody > tr:not(:first-child)')
                    .each((idx, element) => {

                        // skip cancelled sections
                        if($(element).children(':last-child').text() == 'Cancelled Section') {
                            sections.pop(); return;
                        }

                        let code = parseInt($(element).children(':first-child').text());
                        let dateArr = $(element).children(':nth-last-child(2)').html().split('<br>');
                        let timeStr = (/^\d{2}:\d{2}-\d{2}:\d{2}\D+$/.test(dateArr[0]) ? dateArr[0] : '');
                        let dateStr = (/^\d{2}\/\d{2}-\d{2}\/\d{2}$/.test(dateArr[1]) ? dateArr[1] : '');

                        let startTime = endTime = null;
                        let daysOfWeek = 0;
                        if(timeStr != '') {
                            startTime = new Date(Date.UTC(0, 0, 0, timeStr.slice(0,2), timeStr.slice(3,5)));
                            endTime = new Date(Date.UTC(0, 0, 0, timeStr.slice(6,8), timeStr.slice(9,11)));
                            if(startTime.getUTCHours() < 8 || (startTime.getUTCHours() == 8 && startTime.getUTCMinutes() < 30)) {
                                startTime.setUTCHours(startTime.getUTCHours()+12);
                                endTime.setUTCHours(endTime.getUTCHours()+12);
                            }
                            if(startTime.getUTCHours()*60+startTime.getUTCMinutes() >= endTime.getUTCHours()*60+endTime.getUTCMinutes()) {
                                endTime.setUTCHours(endTime.getUTCHours()+12);
                            }

                            // loop from monday to sunday, check for edge case 'T' and 'Th'
                            for(let j = 11, k = 0, pow = 1; k < daysOfWeekAbbrev.length && j < timeStr.length; k++, pow *= 2) {
                                if(timeStr.slice(j,j+daysOfWeekAbbrev[k].length) == daysOfWeekAbbrev[k] && 
                                    (daysOfWeekAbbrev[k] != 'T' || !(j+1 < timeStr.length && timeStr.charAt(j+1) == 'h'))) {
                                    daysOfWeek += pow;
                                    j += daysOfWeekAbbrev[k].length;
                                }
                            }
                        }
                        let startDate = endDate = null;
                        if(dateStr != '') {
                            startDate = new Date(Date.UTC(0, dateStr.slice(0,2)-1, dateStr.slice(3,5)));
                            endDate = new Date(Date.UTC(0, dateStr.slice(6,8)-1, dateStr.slice(9,11)));
                        }

                        if(!isNaN(code)) {
                            console.assert(element.children.length == 12);
                            sections.push([
                                code,                                                                       // section_id
                                courses[courses.length-1][0],                                               // course_id
                                $(element).children(':nth-child(2)').text().trim(),                         // component
                                $(element).children(':nth-child(3)').text().trim().replace(/[\s]+/, ' '),   // location
                                parseInt($(element).children(':nth-child(7)').text()) || 0,                 // enroll_cap
                                parseInt($(element).children(':nth-child(8)').text()) || 0                  // enroll_total
                            ]);
                        }
                        
                        if(timeStr != '') {
                            timeslots.push([
                                sections[sections.length-1][0],// section_id
                                startTime,// start_time
                                endTime,// end_time
                                daysOfWeek,// days_of_week
                                startDate,// start_date
                                endDate// end_date
                            ]);
                        }
                    });
                }
            });
        }
        console.log('processed data');

        const sql =
            'DELETE FROM timeslots;\n' +
            'DELETE FROM sections;\n' +
            'DELETE FROM courses;\n' +
            `INSERT INTO courses VALUES ${arrsFormat(courses)};\n` +
            `INSERT INTO sections VALUES ${arrsFormat(sections)};\n`+
            `INSERT INTO timeslots VALUES ${arrsFormat(timeslots)};`;

        const fs = require('fs');
        const path = require('path');
        fs.writeFile(path.resolve(__dirname, "./sql.sql"), sql, (err) => {});

        const pgClient = new pg.Client({
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            host: process.env.PGHOST,
            port: process.env.PGPORT,
            ssl: {
                rejectUnauthorized: false,
            }
        });
        await pgClient.connect();
        await pgClient.query(sql);
        await pgClient.end();
        console.log('updated db');

        setTimeout(refreshAPI, 900000);
    } catch(error) {
        console.log(error);
        setTimeout(refreshAPI, 900000);
    }
}
refreshAPI();

function arrsFormat(arrs) {
    return arrs.map(arr =>
        `(${arr.map(element => {
            if(element == null || element == undefined) return 'NULL';
            if(typeof element === 'string' || element instanceof String) return `'${element.replace('\'', '\'\'')}'`;
            if(element instanceof Date) return `'${element.toISOString()}'`;
            return element.toString().replace('\'', '\'\'');
        }).join(', ')})`
    ).join(',\n');
}