import React from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import ChartOption from './ChartOption.tsx';
const moment = require('moment');

interface TimeFrame {
    name: string,
    enrollment: number
}

export default function EnrollmentChart() {
    const [chartData, setChartData] = React.useState<TimeFrame[]>([]);
    const [chartDataLoading, setChartDataLoading] = React.useState(false);
    const [chartSelectOptions, setChartSelectOptions] = React.useState<Map<String, String[]>>(new Map([['MATH', ['135']]]));
    const [chartSubjectSelected, setChartSubjectSelected] = React.useState<String>('MATH');
    const [chartCodeSelected, setChartCodeSelected] = React.useState<String>('135');

    React.useEffect(() => {
        console.log('fetching chart2 options...');
        setChartDataLoading(true);
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/subjects`, {
            method: "GET", mode: 'cors',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        }).then(res => res.json())
        .then(data => {
            const map = new Map();
            data.forEach(subject => map.set(subject.subject, subject.course_codes));
            setChartSelectOptions(map);
            setChartDataLoading(false);
            console.log('fetched chart2 options');
        });
    }, []);

    React.useEffect(() => {
        console.log(`chart2 options: ${chartSubjectSelected}|${chartCodeSelected}`);
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/chart2`, {
            method: "POST", mode: 'cors',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: chartSubjectSelected,
                code: chartCodeSelected
            })
        })
        .then(res => res.json())
        .then(data => {
            setChartData(data.map(row => { return { Enrollment: row.enrollment, name: moment(row.name).format('MMM D') };}));
        })
        .catch(error => console.log(error));
      }, [chartSubjectSelected, chartCodeSelected]);

    return <div className="chart-region">
        <h2>How does course enrollment change over time?</h2>
        <div className="chart-options">
        <ChartOption
              name="Subject:"
              options={Array.from(chartSelectOptions.keys()).map(subject => { return { value: subject, label: subject }})}
              isMultiSelect={false}
              defaultValue={{ value: 'MATH', label: 'MATH' }}
              onChange={subject => setChartSubjectSelected(subject.value)}/>
        <ChartOption
              name="Code:"
              options={(chartSelectOptions.get(chartSubjectSelected) ?? []).map(code => { return { value: code, label: code }})}
              isMultiSelect={false}
              defaultValue={{ value: '135', label: '135' }}
              onChange={code => setChartCodeSelected(code.value)}/>
        </div>
        <div className="chart-container" style={{width: 'min(50vw, 1200px)'}}>
            {chartDataLoading ? <div className="chart-loading">Loading...</div> : ''}
            <ResponsiveContainer aspect={1.5}>
                <LineChart data={chartData}
                    style={{opacity: (chartDataLoading ? 0.25 : 1)}}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "# of Students", angle: -90, position: "insideLeft"}} domain={['auto', 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Enrollment" stroke="Black" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
}
