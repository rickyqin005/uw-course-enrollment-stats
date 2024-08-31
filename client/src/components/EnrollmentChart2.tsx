import React from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import ChartOption from './ChartOption.tsx';
import { CourseOptions } from './types.ts';
const moment = require('moment');

const consts = require('../const.json');

interface TimeFrame {
    name: string,
    enrollment: number
}

const lineColors = ['Red', 'Blue', 'Green', 'DarkOrange', 'BlueViolet', 'Maroon', 'Olive', 'Magenta', 'Teal', 'MidnightBlue'];

export default function EnrollmentChart2({ courseOptions }: { courseOptions: CourseOptions }) {
    const [chartData, setChartData] = React.useState<TimeFrame[]>([]);
    const [chartDataLoading, setChartDataLoading] = React.useState(false);
    const [chartSubjectSelected, setChartSubjectSelected] = React.useState<string>(consts.defaultSubjectSelected);
    const [chartCodeSelected, setChartCodeSelected] = React.useState<string>(consts.defaultCodeSelected);
    const [chartComponentSelected, setChartComponentSelected] = React.useState<string>(consts.defaultComponentSelected);

    React.useEffect(() => {
        console.log(`chart3 options: ${chartSubjectSelected}|${chartCodeSelected}|${chartComponentSelected}`);
        setChartDataLoading(true);
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/chart3`, {
            method: "POST", mode: 'cors',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: chartSubjectSelected,
                code: chartCodeSelected,
                component: chartComponentSelected
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.length > 0) {
                let currDay = moment(data[data.length-1].name).add(1, 'days');
                const lastDay = moment("2024-09-30T04:00:00.000Z");
                while(currDay.isSameOrBefore(lastDay)) {
                    data.push({ name: currDay.toISOString() });
                    currDay.add(1, 'days');
                }
            }
            setChartData(data);
            setChartDataLoading(false);
        })
        .catch(error => console.log(error));
      }, [chartSubjectSelected, chartCodeSelected, chartComponentSelected]);

    return <div className="chart-region">
        <h2>Which sections are the most popular?</h2>
        <div className="chart-options">
        <ChartOption
            name="Subject:"
            value={{ value: chartSubjectSelected, label: chartSubjectSelected }}
            options={Array.from(courseOptions.keys()).map(subject => { return { value: subject, label: subject }})}
            isMultiSelect={false}
            onChange={subject => {
                setChartSubjectSelected(subject.value);
                const newCode = (courseOptions.get(subject.value) ?? new Map()).entries().next().value[0];
                const newComponent = ((courseOptions.get(subject.value) ?? new Map()).get(newCode) ?? new Map()).entries().next().value[1];
                setChartCodeSelected(newCode);
                setChartComponentSelected(newComponent);
            }}/>
        <ChartOption
            name="Code:"
            value={{ value: chartCodeSelected, label: chartCodeSelected }}
            options={Array.from((courseOptions.get(chartSubjectSelected) ?? new Map()).keys())
                .map(course => { return { value: course, label: course }})}
            isMultiSelect={false}
            onChange={code => {
                setChartCodeSelected(code.value);
                const newComponent = ((courseOptions.get(chartSubjectSelected) ?? new Map()).get(code.value) ?? new Map()).entries().next().value[1];
                setChartComponentSelected(newComponent);
            }}/>
        <ChartOption
            name="Component:"
            value={{ value: chartComponentSelected, label: chartComponentSelected }}
            options={(courseOptions.get(chartSubjectSelected)?.get(chartCodeSelected) ?? [])
                .map(component => { return { value: component, label: component }})}
            isMultiSelect={false}
            onChange={component => setChartComponentSelected(component.value)}/>
        </div>
        <div className="chart-container" style={{ width: 'max(min(75vw, 1300px), 700px)' }}>
            {chartDataLoading ? <div className="chart-loading">Loading...</div> : ''}
            <ResponsiveContainer aspect={2}>
                <LineChart data={chartData}
                    style={{ opacity: (chartDataLoading ? 0.25 : 1) }}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2" />
                    <XAxis type='category' dataKey="name"
                        tickFormatter={val => toDateString(val)}/>
                    <YAxis type='number' label={{ value: "% of Capacity", angle: -90, position: "left" }}
                        domain={([dataMin, dataMax]) => [Math.floor(dataMin*10)/10, Math.ceil(dataMax*10)/10]}
                        allowDecimals={true}
                        tickFormatter={val => toPercentString(val)} />
                    <Tooltip 
                        formatter={val => toPercentString(val)}
                        labelFormatter={val => toDateString(val)}
                        itemSorter={item => (item.value as number) * -1}/>
                    <Legend />
                    {chartData.length > 0 ? 
                        Object.keys(chartData[0]).slice(1).map((series, idx) =>
                            <Line type="monotone" name={series} dataKey={series}
                                stroke={idx < lineColors.length ? lineColors[idx] :
                                    `#${Math.floor(Math.random()*256*256*256).toString(16).padStart(6,'0')}`}
                                strokeWidth={2} />
                        ) : ''}
                    
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
}

function toDateString(val): string {
    return moment(val).subtract(moment().utcOffset(), 'minutes').format('MMM D');
}

function toPercentString(val): string {
    return `${Math.round(val*1000)/10}%`;
}
