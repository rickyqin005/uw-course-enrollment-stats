import React from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import ChartOption from './ChartOption.tsx';
const moment = require('moment');

interface TimeFrame {
    name: string,
    enrollment: number
}

const lineColors = ['Red', 'Blue', 'Green', 'DarkOrange', 'BlueViolet', 'Maroon', 'Olive', 'Magenta', 'Teal', 'MidnightBlue'];

export default function EnrollmentChart2({ courseCodes, components }) {
    const [chartData, setChartData] = React.useState<TimeFrame[]>([]);
    const [chartDataLoading, setChartDataLoading] = React.useState(false);
    const [chartSubjectSelected, setChartSubjectSelected] = React.useState<String>('MATH');
    const [chartCodeSelected, setChartCodeSelected] = React.useState<String>('137');
    const [chartComponentSelected, setChartComponentSelected] = React.useState<String>('LEC');

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
            options={Array.from(courseCodes.keys()).map(subject => { return { value: subject, label: subject }})}
            isMultiSelect={false}
            defaultValue={{ value: 'MATH', label: 'MATH' }}
            onChange={subject => setChartSubjectSelected(subject.value)}/>
        <ChartOption
            name="Code:"
            options={(courseCodes.get(chartSubjectSelected) ?? []).map(code => { return { value: code, label: code }})}
            isMultiSelect={false}
            defaultValue={{ value: '137', label: '137' }}
            onChange={code => setChartCodeSelected(code.value)}/>
        <ChartOption
            name="Component:"
            options={components.map(component => { return { value: component, label: component }})}
            isMultiSelect={false}
            defaultValue={[{ value: 'LEC', label: 'LEC' }]}
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
                    <YAxis type='number' label={{ value: "# of Students", angle: -90, position: "left" }}
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
                                stroke={idx < lineColors.length ? lineColors[idx] : `#${Math.floor(Math.random()*256*256*256).toString(16).padStart(6,'0')}`}
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
