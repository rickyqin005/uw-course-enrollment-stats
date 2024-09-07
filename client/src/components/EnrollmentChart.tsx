import React from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import Switch from 'react-switch';
import ChartOption from './ChartOption.tsx';
import useAPI from '../hooks/useAPI.ts';
import { EnrollmentChartState } from './types.ts';
import updateOptionsSelected from './updateOptionsSelected.ts';
const moment = require('moment');

interface TimeFrame {
    name: string
    // series1 name: series1 value
    // series2 name: series2 value
    // ...
};

const sectionLineColors = ['Red', 'Blue', 'Green', 'DarkOrange', 'BlueViolet', 'Maroon', 'Olive', 'Magenta', 'Teal', 'MidnightBlue'];

export default function EnrollmentChart({ state }: { state: EnrollmentChartState }) {

    const { data, dataIsLoaded } = useAPI<TimeFrame[]>(
        state.chartDisplayBySections ? '/api/chart3' : '/api/chart2', {
            subject: state.chartSubjectSelected,
            code: state.chartCodeSelected,
            component: (state.chartDisplayBySections ? state.chartComponentSelected : undefined)
        },
        [], data => {
            if(data.length > 0) {
                const endOfMonth = moment().endOf('month').startOf('day');
                const lastDay = moment.min(endOfMonth, moment("2024-12-03T04:00:00.000Z"));
                let currDay = moment(data[data.length-1].name).add(1, 'days');
                while(currDay.isSameOrBefore(lastDay)) {
                    data.push({ name: currDay.toISOString() });
                    currDay.add(1, 'days');
                }
            }
            return data;
        }, [state.chartDisplayBySections, state.chartSubjectSelected, state.chartCodeSelected, state.chartComponentSelected]);

    const subjectOptions = React.useMemo(() =>
        Array.from(state.courseOptions.keys()).map(subject => { return { value: subject, label: subject }})
    , [state.courseOptions]);
    const codeOptions = React.useMemo(() =>
        Array.from((state.courseOptions.get(state.chartSubjectSelected) ?? new Map()).keys())
            .map(course => { return { value: course, label: course }})
    , [state.courseOptions, state.chartSubjectSelected]);
    const componentOptions = React.useMemo(() =>
        (state.courseOptions.get(state.chartSubjectSelected)?.get(state.chartCodeSelected) ?? [])
            .map(component => { return { value: component, label: component }})
    , [state.courseOptions, state.chartSubjectSelected, state.chartCodeSelected]);

    return <div className="chart-region" ref={state.chartRef}>
        <h2>How does course enrollment change over time?</h2>
        <div className="chart-options">
            <ChartOption
                name="Subject:"
                value={{ value: state.chartSubjectSelected, label: state.chartSubjectSelected }}
                options={subjectOptions}
                isMultiSelect={false}
                onChange={subject => updateOptionsSelected({ subject: subject.value }, state)}/>
            <ChartOption
                name="Code:"
                value={{ value: state.chartCodeSelected, label: state.chartCodeSelected }}
                options={codeOptions}
                isMultiSelect={false}
                onChange={code => updateOptionsSelected({ code: code.value }, state)}/>
            {!state.chartDisplayBySections ? '' :
            <ChartOption
                name="Component:"
                value={{ value: state.chartComponentSelected, label: state.chartComponentSelected }}
                options={componentOptions}
                isMultiSelect={false}
                onChange={component => updateOptionsSelected({ component: component.value }, state)}/>}
            <div style={{marginLeft: '50px', display: 'flex', alignItems: 'center'}}>
                <span style={{paddingRight: '10px'}}>Display by sections?</span>
                <Switch onChange={checked => state.setChartDisplayBySections(checked)} checked={state.chartDisplayBySections}/>
            </div>
        </div>
        {!state.chartDisplayBySections ?
        <div className="chart-container" style={{ width: 'max(min(70vw, 1200px), 700px)' }}>
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
                        name={`${state.chartSubjectSelected} ${state.chartCodeSelected}`}
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
