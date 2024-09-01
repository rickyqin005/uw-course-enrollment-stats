

const axios = require('axios');
const cheerio = require("cheerio");
const fs = require('fs');
const path = require('path');

const staticData = require('./consts.json');
const subjects: string[] = staticData.subjects;
const daysOfWeekAbbrev = ['M', 'T', 'W', 'Th', 'F', 'S', 'U'];
import { createPGClient, arrsFormat, formatSQL } from './utility';

export default async function refreshData() {
    try {
        console.time("fetchData");
        const requests: Promise<any>[] = subjects.map(subject =>
            axios.get(`https://classes.uwaterloo.ca/cgi-bin/cgiwrap/infocour/salook.pl?level=under&sess=1249&subject=${subject}`));
        const webpages = await Promise.all(requests);
        console.timeEnd("fetchData");
        
        console.time("processData");
        const courses: any[][] = [];
        const sections: any[][] = [];
        const enrollment: any[][] = [];
        const timeslots: any[][] = [];
        for(let i = 0; i < webpages.length; i++) {
            const $ = cheerio.load(webpages[i].data);

            $('body > main > p > table > tbody > tr')
            .filter((idx, element) => element.children.length == 8 || element.children.length == 2)
            .each((idx, element) => {
                
                // course general info
                if(element.children.length == 8) {
                    courses.push([
                        $(element).children(':nth-child(1)').text().trim(),// subject
                        $(element).children(':nth-child(2)').text().trim(),// code
                        Number($(element).children(':nth-child(3)').text()),// units
                        $(element).children(':nth-child(4)').text().trim()// title
                    ]);
                } else {
                    // course sections
                    $(element).find('table > tbody > tr:not(:first-child)')
                    .each((idx, element) => {

                        // skip cancelled sections
                        if($(element).children(':last-child').text() == 'Cancelled Section') {
                            enrollment.pop();
                            sections.pop(); return;
                        }

                        let code = parseInt($(element).children(':first-child').text());
                        let dateArr: string[] = $(element).children(':nth-last-child(2)').html().split('<br>');
                        let timeStr = (/^\d{2}:\d{2}-\d{2}:\d{2}\D+$/.test(dateArr[0]) ? dateArr[0] : '');
                        let dateStr = (/^\d{2}\/\d{2}-\d{2}\/\d{2}$/.test(dateArr[1]) ? dateArr[1] : '');

                        let startTimeHours = 0, startTimeMinutes = 0;
                        let endTimeHours = 0, endTimeMinutes = 0;
                        let startTimeStr: string | undefined, endTimeStr: string | undefined;
                        let daysOfWeek = 0;
                        if(timeStr != '') {
                            startTimeHours = parseInt(timeStr.slice(0,2));
                            startTimeMinutes = parseInt(timeStr.slice(3,5));
                            endTimeHours = parseInt(timeStr.slice(6,8));
                            endTimeMinutes = parseInt(timeStr.slice(9,11));
                            if(startTimeHours < 8 || (startTimeHours == 8 && startTimeMinutes < 30)) {
                                startTimeHours += 12;
                                endTimeHours += 12;
                            }
                            if(startTimeHours*60+startTimeMinutes >= endTimeHours*60+endTimeMinutes) {
                                endTimeHours += 12;
                            }
                            startTimeStr = `${startTimeHours}:${startTimeMinutes.toString().padStart(2, '0')}`;
                            endTimeStr = `${endTimeHours}:${endTimeMinutes.toString().padStart(2, '0')}`;

                            // loop from monday to sunday, check for edge case 'T' and 'Th'
                            for(let j = 11, k = 0, pow = 1; k < daysOfWeekAbbrev.length && j < timeStr.length; k++, pow *= 2) {
                                if(timeStr.slice(j,j+daysOfWeekAbbrev[k].length) == daysOfWeekAbbrev[k] && 
                                    (daysOfWeekAbbrev[k] != 'T' || !(j+1 < timeStr.length && timeStr.charAt(j+1) == 'h'))) {
                                    daysOfWeek += pow;
                                    j += daysOfWeekAbbrev[k].length;
                                }
                            }
                        }
                        let startDate: Date | null = null;
                        let endDate: Date | null = null;
                        if(dateStr != '') {
                            startDate = new Date(Date.UTC(0, parseInt(dateStr.slice(0,2))-1, parseInt(dateStr.slice(3,5))));
                            endDate = new Date(Date.UTC(0, parseInt(dateStr.slice(6,8))-1, parseInt(dateStr.slice(9,11))));
                        }

                        if(!isNaN(code)) {
                            console.assert(element.children.length == 12);
                            enrollment.push([
                                code,                                                                       // section_id
                                parseInt($(element).children(':nth-child(8)').text()) || 0                  // enroll_total
                            ])
                            sections.push([
                                code,                                                                       // section_id
                                courses[courses.length-1][0],                                               // course_subject
                                courses[courses.length-1][1],                                               // course_code
                                $(element).children(':nth-child(2)').text().trim(),                         // component
                                $(element).children(':nth-child(3)').text().trim().replace(/[\s]+/, ' '),   // location
                                parseInt($(element).children(':nth-child(7)').text()) || 0,                 // enroll_cap
                            ]);
                        }
                        
                        if(timeStr != '') {
                            timeslots.push([
                                sections[sections.length-1][0],// section_id
                                startTimeStr,// start_time
                                endTimeStr,// end_time
                                daysOfWeek,// days_of_week
                                startDate?.toISOString().slice(0,10),// start_date
                                endDate?.toISOString().slice(0,10)// end_date
                            ]);
                        }
                    });
                }
            });
        }
        console.timeEnd("processData");

        const sql = formatSQL('./postgres/refresh.sql',
            arrsFormat(courses), arrsFormat(sections), arrsFormat(enrollment), arrsFormat(timeslots));
        fs.writeFile(path.resolve(__dirname, "./sql.sql"), sql, () => {});

        console.time("updateDB");
        const pgClient = createPGClient();
        await pgClient.connect();
        await pgClient.query(sql);
        await pgClient.end();
        console.timeEnd("updateDB");
    } catch(error) {
        console.log(error);
    }
}
