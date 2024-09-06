import React from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import Switch from 'react-switch';
import ChartOption from './ChartOption.tsx';
import { CourseOptions } from './types.ts';
import useAPI from '../hooks/useAPI.ts';
const moment = require('moment');

const consts = require('../consts.json');

interface TimeFrame {
    name: string
    // series1 name: series1 value
    // series2 name: series2 value
    // ...
};

const sectionLineColors = ['Red', 'Blue', 'Green', 'DarkOrange', 'BlueViolet', 'Maroon', 'Olive', 'Magenta', 'Teal', 'MidnightBlue'];

export default function EnrollmentChart({ courseOptions }: { courseOptions: CourseOptions }) {
    const [chartSubjectSelected, setChartSubjectSelected] = React.useState<string>(consts.defaultSubjectSelected);
    const [chartCodeSelected, setChartCodeSelected] = React.useState<string>(consts.defaultCodeSelected);
    const [chartComponentSelected, setChartComponentSelected] = React.useState<string>(consts.defaultComponentSelected);
    const [chartDisplayBySections, setChartDisplayBySections] = React.useState(false);

    const { data, dataIsLoaded } = useAPI<TimeFrame[]>(
        chartDisplayBySections ? '/api/chart3' : '/api/chart2', {
            subject: chartSubjectSelected,
            code: chartCodeSelected,
            component: (chartDisplayBySections ? chartComponentSelected : undefined)
        },
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
        }, [chartDisplayBySections, chartSubjectSelected, chartCodeSelected, chartComponentSelected]);

    const subjectOptions = React.useMemo(() =>
        Array.from(courseOptions.keys()).map(subject => { return { value: subject, label: subject }})
    , [courseOptions]);
    const codeOptions = React.useMemo(() =>
        Array.from((courseOptions.get(chartSubjectSelected) ?? new Map()).keys())
            .map(course => { return { value: course, label: course }})
    , [courseOptions, chartSubjectSelected]);
    const componentOptions = React.useMemo(() =>
        (courseOptions.get(chartSubjectSelected)?.get(chartCodeSelected) ?? [])
            .map(component => { return { value: component, label: component }})
    , [courseOptions, chartSubjectSelected, chartCodeSelected])

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
            {!chartDisplayBySections ? '' :
            <ChartOption
                name="Component:"
                value={{ value: chartComponentSelected, label: chartComponentSelected }}
                options={componentOptions}
                isMultiSelect={false}
                onChange={component => setChartComponentSelected(component.value)}/>}
            <div style={{marginLeft: '50px', display: 'flex', alignItems: 'center'}}>
                <span style={{paddingRight: '10px'}}>Display by sections?</span>
                <Switch onChange={checked => setChartDisplayBySections(checked)} checked={chartDisplayBySections}/>
            </div>
        </div>
        {!chartDisplayBySections ?
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
        :
        <div className="chart-container" style={{ width: 'max(min(75vw, 1300px), 700px)' }}>
            {!dataIsLoaded ? <div className="chart-loading">Loading...</div> : ''}
            <ResponsiveContainer aspect={2}>
                <LineChart data={data}
                    style={{ opacity: (!dataIsLoaded ? 0.25 : 1) }}
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
                    {data.length > 0 ? 
                        Object.keys(data[0]).slice(1).map((series, idx) =>
                            <Line type="monotone" name={series} dataKey={series}
                                stroke={idx < sectionLineColors.length ? sectionLineColors[idx] :
                                    `#${Math.floor(Math.random()*256*256*256).toString(16).padStart(6,'0')}`}
                                strokeWidth={2} />
                        ) : ''}
                </LineChart>
            </ResponsiveContainer>
        </div>}
    </div>
}

function toDateString(val): string {
    return moment(val).subtract(moment().utcOffset(), 'minutes').format('MMM D');
}

function toPercentString(val): string {
    return `${Math.round(val*1000)/10}%`;
}
