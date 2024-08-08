import React from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
const staticData = require('../data.json');
const daysOfWeekAbbrev = staticData.daysOfWeekAbbrev;
const daysOfWeekFullName = staticData.daysOfWeekFullName;

export default function FrequencyChart({ subjectsSelected, componentsSelected }) {
    const [chartData, setChartData] = React.useState([]);
    React.useEffect(() => {
        console.log(`${subjectsSelected}|${componentsSelected}`);
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/sections`, {
            method: "POST",
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subjects: subjectsSelected,
                components: componentsSelected
            })
        })
        .then((res) => res.json())
        .then((data) => setChartData(calculateChartData(data)));

      }, [subjectsSelected, componentsSelected]);
    
    return <div className="chart-container" >
        <ResponsiveContainer aspect={2}>
            <LineChart data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2" />
                <XAxis label={{ value: "Time", position: "insideBottomRight", offset: -15}} dataKey="name" />
                <YAxis label={{ value: "# of Students", angle: -90, position: "insideLeft"}} tickCount={7} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Monday" stroke="blue" />
                <Line type="monotone" dataKey="Tuesday" stroke="red" />
                <Line type="monotone" dataKey="Wednesday" stroke="DarkOrange" />
                <Line type="monotone" dataKey="Thursday" stroke="green" />
                <Line type="monotone" dataKey="Friday" stroke="purple" />
            </LineChart>
        </ResponsiveContainer>
    </div>
}

function calculateChartData(data) {
    const currWeek = new Date(Date.UTC(0, 8, 9));
    const nextWeek = new Date(Date.UTC(0, 8, 15));

    const chartData = [];

    let currTime = new Date(Date.UTC(0, 0, 0, 8, 30));
    // 30 min timeslots from 8:30am to 10pm
    for(let i = 0; i < 27; i++) {
        let nextHours = currTime.getUTCHours();
        let nextMinutes = currTime.getUTCMinutes()+30;
        if(nextMinutes >= 60) {
            nextHours++;
            nextMinutes -= 60;
        }
        const nextTime = new Date(Date.UTC(0, 0, 0, nextHours, nextMinutes));
        const timeFrameName = `${currTime.getUTCHours()}:${currTime.getUTCMinutes().toString().padStart(2,'0')}`;
        let timeFrame = {name: timeFrameName};
        for(let j = 0; j < daysOfWeekAbbrev.length; j++) {
            let enrollCapSum = 0;
            let enrollTotalSum = 0;
            data.forEach((section) => {
                section.times.forEach((time) => {
                    if(time.startTime == null || time.endTime == null) return;
                    if(Math.max(new Date(time.startTime), currTime) < Math.min(new Date(time.endTime), nextTime) &&
                        time.daysOfWeek.includes(daysOfWeekAbbrev[j]) &&
                        ((time.startDate == null && time.endDate == null) ||
                        (Math.max(new Date(time.startDate), currWeek) <= Math.min(new Date(time.endDate), nextWeek)))) {
                        enrollTotalSum += section.enrollTotal;
                        enrollCapSum += section.enrollCap;
                    }
                })
            });
            timeFrame[daysOfWeekFullName[j]] = enrollTotalSum;
        }
        chartData.push(timeFrame);
        currTime = nextTime;
    }
    return chartData;
}