import React from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import ChartOption from "./ChartOption.tsx";
import { CourseOptions, ValueAndLabel } from "./types.ts";
import useAPI from "../hooks/useAPI.ts";
const moment = require('moment');

const { firstWeek, lastWeek } = require('../consts.json');
let currWeek = moment(firstWeek);
const weeksList: ValueAndLabel<string>[] = [];
while(currWeek.isSameOrBefore(moment(lastWeek))) {
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

export default function FrequencyChart({ courseOptions, components }: { courseOptions: CourseOptions, components: string[] }) {
    const [chartSubjectsSelected, setChartSubjectsSelected] = React.useState<string[]>([]);
    const [chartComponentsSelected, setChartComponentsSelected] = React.useState<string[]>([]);
    const [chartWeekSelected, setChartWeekSelected] = React.useState<ValueAndLabel<string>>(weeksList[1]);

    const { data, dataIsLoaded } = useAPI<TimeFrame[]>('/api/chart1', {
        subjects: chartSubjectsSelected,
        components: chartComponentsSelected,
        week: chartWeekSelected.value
    }, [], data => data,
    [chartSubjectsSelected, chartComponentsSelected, chartWeekSelected]);

    const subjectOptions = React.useMemo(() =>
        Array.from(courseOptions.keys()).map(subject => { return { value: subject, label: subject }})
    , [courseOptions]);
    const componentOptions = React.useMemo(() =>
        components.map(component => { return { value: component, label: component }})
    , [components]);
    
    return <div className="chart-region">
        <h2>When do people usually have classes?</h2>
        <div className="chart-options">
        <ChartOption
            name="Subject:"
            value={undefined}
            options={subjectOptions}
            isMultiSelect={true}
            onChange={subjects => setChartSubjectsSelected(subjects.map(subject => subject.value))}/>
        <ChartOption
            name="Component:"
            value={undefined}
            options={componentOptions}
            isMultiSelect={true}
            onChange={components => setChartComponentsSelected(components.map(component => component.value))}/>
        <ChartOption
            name="Week of:"
            value={chartWeekSelected}
            options={weeksList}
            isMultiSelect={false}
            onChange={week => setChartWeekSelected(week)}/>
        </div>
        <div className="chart-container" style={{ width: 'max(min(70vw, 1200px), 700px)' }}>
            {!dataIsLoaded ? <div className="chart-loading">Loading...</div> : ''}
            <ResponsiveContainer aspect={2}>
                <LineChart data={data}
                    style={{ opacity: (!dataIsLoaded ? 0.25 : 1) }}
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
