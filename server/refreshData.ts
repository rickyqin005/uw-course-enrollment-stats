

const axios = require('axios');
const cheerio = require("cheerio");
const fs = require('fs');
const path = require('path');

const staticData = require('./data.json');
const subjects: string[] = staticData.subjects;
const daysOfWeekAbbrev: string[] = staticData.daysOfWeekAbbrev;
import { createPGClient, arrsFormat, formatSQL, log } from './utility';

// refresh info every 15 minutes
export default async function refreshData() {
    const requests: Promise<any>[] = subjects.map(subject =>
        axios.get(`https://classes.uwaterloo.ca/cgi-bin/cgiwrap/infocour/salook.pl?level=under&sess=1249&subject=${subject}`));
    const webpages = await Promise.all(requests);
    log('fetched data');
    
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

                    let startTime: Date | null = null;
                    let endTime: Date | null = null;
                    let daysOfWeek = 0;
                    if(timeStr != '') {
                        startTime = new Date(Date.UTC(0, 0, 0, parseInt(timeStr.slice(0,2)), parseInt(timeStr.slice(3,5))));
                        endTime = new Date(Date.UTC(0, 0, 0, parseInt(timeStr.slice(6,8)), parseInt(timeStr.slice(9,11))));
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
                    let startDate: Date | null = null;
                    let endDate: Date | null = null;
                    if(dateStr != '') {
                        startDate = new Date(Date.UTC(0, parseInt(dateStr.slice(0,2))-1, parseInt(dateStr.slice(3,5))));
                        endDate = new Date(Date.UTC(0, parseInt(dateStr.slice(6,8))-1, parseInt(dateStr.slice(9,11))));
                    }

                    const currDate = new Date(Date.now());
                    currDate.setUTCMinutes(0);
                    currDate.setUTCSeconds(0);
                    currDate.setUTCMilliseconds(0);
                    if(!isNaN(code)) {
                        console.assert(element.children.length == 12);
                        enrollment.push([
                            code,                                                                       // section_id
                            currDate.toISOString(),                                                     // check_time
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
    log('processed data');

    const sql = formatSQL('./postgres/refresh.sql',
        arrsFormat(courses), arrsFormat(sections), arrsFormat(enrollment), arrsFormat(timeslots));
    fs.writeFile(path.resolve(__dirname, "./sql.sql"), sql, () => {});
    const pgClient = createPGClient();
    await pgClient.connect();
    await pgClient.query(sql);
    await pgClient.end();
    log('updated db');
}
