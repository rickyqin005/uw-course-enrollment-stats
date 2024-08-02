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

const daysOfWeekAbbre = ['M', 'T', 'W', 'Th', 'F', 'S', 'U'];

app.get("/api", (req, res) => {
    axios.get('https://classes.uwaterloo.ca/cgi-bin/cgiwrap/infocour/salook.pl?level=under&sess=1249&subject=MATH&cournum=%3F')
    .then((webpage) => {
        //console.log(web.data);
        const $ = cheerio.load(webpage.data);
        courseCodes = $('body > main > p > table > tbody > tr > td:nth-child(2):not(:last-child)')
        .map((i, element) => $(element).text()).toArray();

        courseNames = $('body > main > p > table > tbody > tr > td:nth-child(4)')
        .map((i, element) => $(element).text()).toArray();

        courseDetails = $('body > main > p > table > tbody > tr > td:nth-child(2):last-child > table > tbody > tr:not(:first-child) > td:nth-child(11)');
        sections = courseDetails.map((idx, element) => {
            txt = $(element).text();
            // skip online or cancelled sections
            if(txt == '' || !('0' <= txt.charAt(0) && txt.charAt(0) <= '9')) return;
            // skip TST sections
            if('0' <= txt.charAt(txt.length-1) && txt.charAt(txt.length-1) <= '9') return;
            
            startTime = new Date(2000, 0, 1, txt.slice(0,2), txt.slice(3,5));
            endTime = new Date(2000, 0, 1, txt.slice(6,8), txt.slice(9,11));
            if(startTime.getHours() < 8 || (startTime.getHours() == 8 || startTime.getMinutes() < 30)) {
                startTime.setHours(startTime.getHours()+12);
                endTime.setHours(endTime.getHours()+12);
            }

            daysOfWeek = [];
            for(let j = 11, k = 0; k < daysOfWeekAbbre.length && j < txt.length; k++) {
                if(txt.slice(j,j+daysOfWeekAbbre[k].length) == daysOfWeekAbbre[k]) {
                    daysOfWeek.push(daysOfWeekAbbre[k]);
                    j += daysOfWeekAbbre[k].length;
                }
            }
            section = {
                startTime: startTime,
                endTime: endTime,
                daysOfWeek: daysOfWeek
            };
            console.log(`${txt}   ${section.startTime} ${section.endTime} ${section.daysOfWeek}`);
            return section;
        }).toArray();
        
        // console.log(coursecodes);
        // console.log(coursenames);
        res.json({ courseCodes: courseCodes, courseNames: courseNames, sections: sections})
    });
});

console.log("Hello world!");

function parseClassTime(str) {
    if(str == '') return [];
}