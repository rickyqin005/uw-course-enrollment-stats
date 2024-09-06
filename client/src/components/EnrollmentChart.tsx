import React from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import ChartOption from './ChartOption.tsx';
import { CourseOptions } from './types.ts';
import useAPI from '../hooks/useAPI.ts';
const moment = require('moment');

const consts = require('../consts.json');

interface TimeFrame {
    name: string,
    enrollment: number
}

export default function EnrollmentChart({ courseOptions }: { courseOptions: CourseOptions }) {
    const [chartSubjectSelected, setChartSubjectSelected] = React.useState<string>(consts.defaultSubjectSelected);
    const [chartCodeSelected, setChartCodeSelected] = React.useState<string>(consts.defaultCodeSelected);

    const { data, dataIsLoaded } = useAPI<TimeFrame[]>('/api/chart2', { subject: chartSubjectSelected, code: chartCodeSelected },
    [], data => {
        if(data.length > 0) {
            let currDay = moment(data[data.length-1].name).add(1, 'days');
            const lastDay = moment("2024-09-30T04:00:00.000Z");
            while(currDay.isSameOrBefore(lastDay)) {
                data.push({ name: currDay.toISOString() });
                currDay.add(1, 'days');
            }
        }
        return data;
    }, [chartSubjectSelected, chartCodeSelected]);

    const subjectOptions = React.useMemo(() =>
        Array.from(courseOptions.keys()).map(subject => { return { value: subject, label: subject }})
    , [courseOptions]);
    const codeOptions = React.useMemo(() =>
        Array.from((courseOptions.get(chartSubjectSelected) ?? new Map()).keys())
            .map(course => { return { value: course, label: course }})
    , [courseOptions, chartSubjectSelected]);

    return <div className="chart-region">
        <h2>How does course enrollment change over time?</h2>
        <div className="chart-options">
            <ChartOption
                name="Subject:"
                value={{ value: chartSubjectSelected, label: chartSubjectSelected }}
                options={subjectOptions}
                isMultiSelect={false}
                onChange={subject => {
                    setChartSubjectSelected(subject.value);
                    const map = courseOptions.get(subject.value) ?? new Map();
                    if(!map.get(chartCodeSelected)) setChartCodeSelected(map.entries().next().value[0]);
                }}/>
            <ChartOption
                name="Code:"
                value={{ value: chartCodeSelected, label: chartCodeSelected }}
                options={codeOptions}
                isMultiSelect={false}
                onChange={code => setChartCodeSelected(code.value)}/>
        </div>
        <div className="chart-container" style={{ width: 'max(min(75vw, 1300px), 700px)' }}>
            {!dataIsLoaded ? <div className="chart-loading">Loading...</div> : ''}
            <ResponsiveContainer aspect={2}>
                <LineChart data={data}
                    style={{ opacity: (!dataIsLoaded ? 0.25 : 1) }}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2" />
                    <XAxis type='category' dataKey="name"
                        tickFormatter={val => toDateString(val)}/>
                    <YAxis type='number' label={{ value: "# of Students", angle: -90, position: "left" }}
                        domain={['auto', 'auto']}
                        allowDecimals={false}
                        tickFormatter={val => val.toLocaleString()} />
                    <Tooltip 
                        formatter={val => val.toLocaleString()}
                        labelFormatter={val => toDateString(val)} />
                    <Legend />
                    <Line type="monotone"
                        name={`${chartSubjectSelected} ${chartCodeSelected}`}
                        dataKey="enrollment"
                        stroke="Black"
                        strokeWidth={2}/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
}

function toDateString(val): string {
    return moment(val).subtract(moment().utcOffset(), 'minutes').format('MMM D');
}
