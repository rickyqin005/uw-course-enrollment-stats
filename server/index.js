const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require("cheerio");
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})

const staticData = require('./data.json');
const subjects = staticData.subjects;
//['AE', 'BE', 'BME', 'CHE', 'ECE', 'ENVE', 'GEOE', 'ME', 'MGMT', 'MSE', 'MTE', 'NE', 'SE', 'SYDE', 'TRON']
const daysOfWeekAbbrev = staticData.daysOfWeekAbbrev;

let apiObject = null;

//<----------------------------------- ENDPOINTS --------------------------------------------------->

app.get("/api/courses", (req, res) => {
    res.json(apiObject.courses);
});

app.post("/api/sections", (req, res) => {
    console.log(req.body);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(apiObject.sections.filter((section) =>
        (req.body.subjects == undefined || req.body.subjects.length == 0 || req.body.subjects.includes(section.subject)) &&
        (req.body.components == undefined || req.body.components.length == 0 || req.body.components.includes(section.component.split(' ')[0]))
    ));
});

//<------------------------------------------------------------------------------------------------->


function refreshAPI() {
    const requests = subjects.map((subject) =>
        axios.get(`https://classes.uwaterloo.ca/cgi-bin/cgiwrap/infocour/salook.pl?level=under&sess=1249&subject=${subject}&cournum=%3F`));
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
                    // get course sections

                    $(element).find('table > tbody > tr:not(:first-child)')
                    .each((idx, element) => {
                        code = parseInt($(element).children(':first-child').text());

                        dateArr = $(element).children(':nth-last-child(2)').html().split('<br>');
                        timeStr = (/^\d{2}:\d{2}-\d{2}:\d{2}\D+$/.test(dateArr[0]) ? dateArr[0] : '');
                        dateStr = (/^\d{2}\/\d{2}-\d{2}\/\d{2}$/.test(dateArr[1]) ? dateArr[1] : '');
                        
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

        apiObject = {courses: courses, sections: sections};
    });
}
refreshAPI();
setInterval(refreshAPI, 60000);