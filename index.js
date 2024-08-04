const express = require('express');
const axios = require('axios');
const cheerio = require("cheerio");
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})

const staticData = require('./data.json');
const subjects = staticData.subjects;// ['MATH', 'AFM', 'CS'];
const daysOfWeekAbbrev = staticData.daysOfWeekAbbrev;
const daysOfWeekFullName = staticData.daysOfWeekFullName;
const year = 2024;

let apiObject = null;

app.get("/api", (req, res) => {
    res.json(apiObject);
});

console.log("Hello world!");

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
                    // console.log($(element).text());
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
                    .filter((idx, element) => element.children.length == 12)
                    .each((idx, element) => {
                        code = parseInt($(element).children(':first-child').text());
                        // if(isNaN(code)) return;

                        // console.log(`${$(element).text()}`);
                        dateArr = $(element).children(':nth-child(11)').html().split('<br>');
                        timeStr = dateArr[0];
                        dateStr = dateArr[1] || '';
                        console.log(`${timeStr}|${dateStr}\n`);
                        // if(timeStr ==)
                        
                        let startTime = endTime = null;
                        let daysOfWeek = [];
                        if(timeStr != '') {
                            startTime = new Date(1970, 0, 1, timeStr.slice(0,2), timeStr.slice(3,5));
                            endTime = new Date(1970, 0, 1, timeStr.slice(6,8), timeStr.slice(9,11));
                            if(startTime.getHours() < 8 || (startTime.getHours() == 8 && startTime.getMinutes() < 30)) {
                                startTime.setHours(startTime.getHours()+12);
                                endTime.setHours(endTime.getHours()+12);
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
                            startDate = new Date(year, dateStr.slice(0,2)-1, dateStr.slice(3,5));
                            endDate = new Date(year, dateStr.slice(6,8)-1, dateStr.slice(9,11));
                        }

                        if(!isNaN(code)) {
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

        const chartData1 = [];
        const chartData2 = [];
        const currDate = new Date(year, 8, 11);
        let currTime = new Date(1970, 0, 1, 8, 30);
        // 30 min timeslots from 8:30am to 10pm
        for(let i = 0; i < 27; i++) {
            nextHours = currTime.getHours();
            nextMinutes = currTime.getMinutes()+30;
            if(nextMinutes >= 60) {
                nextHours++;
                nextMinutes -= 60;
            }
            let nextTime = new Date(1970, 0, 1, nextHours, nextMinutes);
            timeFrameName = `${currTime.getHours()}:${currTime.getMinutes().toString().padStart(2,'0')}`;
            let timeFrame1 = {name: timeFrameName};
            let timeFrame2 = {name: timeFrameName};
            for(let j = 0; j < daysOfWeekAbbrev.length; j++) {
                let enrollCapSum = 0;
                let enrollTotalSum = 0;
                sections.forEach((section) => {
                    section.times.forEach((time) => {
                        if(time.startTime == null || time.endTime == null) return;
                        if(Math.max(time.startTime, currTime) < Math.min(time.endTime, nextTime) &&
                            time.daysOfWeek.includes(daysOfWeekAbbrev[j]) &&
                            ((time.startDate == null && time.endDate == null) || (time.startDate <= currDate && currDate <= time.endDate))) {
                            enrollTotalSum += section.enrollTotal;
                            enrollCapSum += section.enrollCap;
                        }
                    })
                });
                timeFrame1[daysOfWeekFullName[j]] = enrollTotalSum;
                timeFrame2[daysOfWeekFullName[j]] = (enrollCapSum == 0 ? 0 : enrollTotalSum/enrollCapSum);
            }
            chartData1.push(timeFrame1);
            chartData2.push(timeFrame2);
            currTime = nextTime;
        }
        apiObject = {courses: courses, sections: sections, chartData1: chartData1, chartData2: chartData2};
    });
}
refreshAPI();
setInterval(refreshAPI, 600000);