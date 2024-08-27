import React from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import ChartOption from "./ChartOption.tsx";
const moment = require('moment');

const staticData = require('../const.json');
let currWeek = moment(staticData.firstWeek);
const weeksList: {value: string, label: string }[] = [];
while(currWeek.isSameOrBefore(moment(staticData.lastWeek))) {
    weeksList.push({
        value: currWeek.toISOString(),
        label: currWeek.format('MMM D')
    });
    currWeek.add(7, 'days');
}

interface TimeFrame {
    name: string,
    Monday: number,
    Tuesday: number,
    Wednesday: number,
    Thursday: number,
    Friday: number
}

export default function FrequencyChart({ courseCodes, components }) {
        
    const [chartData, setChartData] = React.useState<TimeFrame[]>([]);
    const [chartDataLoading, setChartDataLoading] = React.useState(false);
    const [chartSubjectsSelected, setChartSubjectsSelected] = React.useState<string[]>([]);
    const [chartComponentsSelected, setChartComponentsSelected] = React.useState<string[]>([]);
    const [chartWeekSelected, setChartWeekSelected] = React.useState<string>(weeksList[1].value);

    React.useEffect(() => {
        console.log(`chart1 options: ${chartSubjectsSelected}|${chartComponentsSelected}|${chartWeekSelected}`);
        setChartDataLoading(true);
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/chart1`, {
            method: "POST",
            mode: 'cors',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subjects: chartSubjectsSelected,
                components: chartComponentsSelected,
                week: chartWeekSelected
            })
        })
        .then(res => res.json())
        .then(data => {
            setChartData(data);
            setChartDataLoading(false);
        })
        .catch(error => console.log(error));
    }, [chartSubjectsSelected, chartComponentsSelected, chartWeekSelected]);
    
    return <div className="chart-region">
        <h2>When do people usually have classes?</h2>
        <div className="chart-options">
        <ChartOption
            name="Subject:"
            options={Array.from(courseCodes.keys()).map(subject => { return { value: subject, label: subject }})}
            isMultiSelect={true}
            defaultValue={[]}
            onChange={subjects => setChartSubjectsSelected(subjects.map(subject => subject.value))}/>
        <ChartOption
            name="Component:"
            options={components.map(component => { return { value: component, label: component }})}
            isMultiSelect={true}
            defaultValue={[]}
            onChange={components => setChartComponentsSelected(components.map(component => component.value))}/>
        <ChartOption
            name="Week of:"
            options={weeksList}
            isMultiSelect={false}
            defaultValue={weeksList[staticData.defaultWeekIndex]}
            onChange={week => setChartWeekSelected(week.value)}/>
        </div>
        <div className="chart-container" style={{ width: 'max(min(70vw, 1200px), 700px)' }}>
            {chartDataLoading ? <div className="chart-loading">Loading...</div> : ''}
            <ResponsiveContainer aspect={2}>
                <LineChart data={chartData}
                    style={{ opacity: (chartDataLoading ? 0.25 : 1) }}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "# of Students", angle: -90, position: "left" }}
                        tickCount={6}
                        tickFormatter={val => val.toLocaleString()} />
                    <Tooltip
                        formatter={val => val.toLocaleString()} />
                    <Legend />
                    <Line type="monotone" dataKey="Monday" stroke="blue" strokeWidth={2} />
                    <Line type="monotone" dataKey="Tuesday" stroke="red" strokeWidth={2} />
                    <Line type="monotone" dataKey="Wednesday" stroke="DarkOrange" strokeWidth={2} />
                    <Line type="monotone" dataKey="Thursday" stroke="green" strokeWidth={2} />
                    <Line type="monotone" dataKey="Friday" stroke="purple" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
}
