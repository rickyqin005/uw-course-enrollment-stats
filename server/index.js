require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require("cheerio");
const pg = require('pg');
const fs = require('fs');
const path = require("path");

const app = express();
const port = 3000;
const pgClient = new pg.Client({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: fs.readFileSync(path.resolve(__dirname, './pathto/rds-ca-cert.pem')).toString()
    }
});
pgClient.connect()
.then(async () => {
    const res = await pgClient.query('SELECT NOW()');
    console.log(`connected to DB at ${res.rows[0].now}`);
    await pgClient.end();
});


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

let apiObject = {
    courses: [],
    sections: []
};

//<----------------------------------- ENDPOINTS --------------------------------------------------->

app.get('/api/courses', (req, res) => {
    res.json(apiObject.courses);
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
});

//<------------------------------------------------------------------------------------------------->


function refreshAPI() {
    try {
        const requests = subjects.map((subject) =>
            axios.get(`https://classes.uwaterloo.ca/cgi-bin/cgiwrap/infocour/salook.pl?level=under&sess=1249&subject=${subject}`));
        Promise.all(requests).then((webpages) => {
            const courses = [];
            const sections = [];
            for(let i = 0; i < webpages.length; i++) {
                const $ = cheerio.load(webpages[i].data);

                $('body > main > p > table > tbody > tr')
                .filter((idx, element) => element.children.length == 8 || element.children.length == 2)
                .each((idx, element) => {
                    
                    // course general info
                    if(element.children.length == 8) {
                        courses.push({
                            subject: $(element).children(':nth-child(1)').text().trim(),
                            code: parseInt($(element).children(':nth-child(2)').text()),
                            units: Number($(element).children(':nth-child(3)').text()),
                            title: $(element).children(':nth-child(4)').text().trim(),
                            sections: []
                        });
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
                            let daysOfWeek = [];
                            if(timeStr != '') {
                                startTime = new Date(Date.UTC(0, 0, 0, timeStr.slice(0,2), timeStr.slice(3,5)));
                                endTime = new Date(Date.UTC(0, 0, 0, timeStr.slice(6,8), timeStr.slice(9,11)));
                                if(startTime.getUTCHours() < 8 || (startTime.getUTCHours() == 8 && startTime.getUTCMinutes() < 30)) {
                                    startTime.setUTCHours(startTime.getUTCHours()+12);
                                    endTime.setUTCHours(endTime.getUTCHours()+12);
                                }

                                // loop from monday to sunday, check for edge case 'T' and 'Th'
                                for(let j = 11, k = 0; k < daysOfWeekAbbrev.length && j < timeStr.length; k++) {
                                    if(timeStr.slice(j,j+daysOfWeekAbbrev[k].length) == daysOfWeekAbbrev[k] && 
                                        (daysOfWeekAbbrev[k] != 'T' || !(j+1 < timeStr.length && timeStr.charAt(j+1) == 'h'))) {
                                        daysOfWeek.push(daysOfWeekAbbrev[k]);
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
                                sections.push({
                                    code: code,
                                    subject: courses[courses.length-1].subject,
                                    courseCode: courses[courses.length-1].code,
                                    component: $(element).children(':nth-child(2)').text().trim(),
                                    location: $(element).children(':nth-child(3)').text().trim().replace(/[\s]+/, ' '),
                                    times: [],
                                    enrollCap: parseInt($(element).children(':nth-child(7)').text()) || 0,
                                    enrollTotal: parseInt($(element).children(':nth-child(8)').text()) || 0
                                });
                                courses[courses.length-1].sections.push(code);
                            }
                            
                            if(timeStr != '') {
                                sections[sections.length-1].times.push({
                                    startTime: startTime,
                                    endTime: endTime,
                                    daysOfWeek: daysOfWeek,
                                    startDate: startDate,
                                    endDate: endDate
                                });
                            }
                        });
                    }
                });
            }

            apiObject.courses = courses;
            apiObject.sections = sections;
            console.log('refreshed data');
            setTimeout(refreshAPI, 120000);
        });
    } catch(error) {
        console.log(error);
        setTimeout(refreshAPI, 120000);
    }
}
refreshAPI();
