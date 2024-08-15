import React from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import ChartOption from './ChartOption.tsx';

const staticData = require('../data.json');
const moment = require('moment');

interface TimeFrame {
    name: string,
    enrollment: number
}

export default function EnrollmentChart() {
    const [chartData, setChartData] = React.useState<TimeFrame[]>([]);
    const [chartSubject, setChartSubject] = React.useState<String>('MATH');
    const [chartCode, setChartCode] = React.useState<String>('135');


    React.useEffect(() => {
        console.log(`chart2 options: ${chartSubject}|${chartCode}`);
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/chart2`, {
            method: "POST",
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subject: chartSubject,
                code: chartCode
            })
        })
        .then(res => res.json())
        .then(data => {
            setChartData(data.map(row => { return { Enrollment: row.enrollment, name: moment(row.name).format('MMM D') };}));
        })
        .catch(error => console.log(error));
      }, [chartSubject, chartCode]);

    return <div className="chart-region">
        <h2>How does course enrollment change over time?</h2>
        <div className="chart-options">
        <ChartOption
              name="Subject:"
              options={staticData.subjects.map(subject => { return { value: subject, label: subject }})}
              isMultiSelect={false}
              defaultValue={{ value: 'MATH', label: 'MATH' }}
              onChange={subject => setChartSubject(subject.value)}/>
        <ChartOption
              name="Code:"
              options={['99', '100', '105', '135', '137'].map(code => { return { value: code, label: code }})}
              isMultiSelect={false}
              defaultValue={{ value: '135', label: '135' }}
              onChange={code => setChartCode(code.value)}/>
        </div>
        <div className="chart-container" style={{width: 'min(60vw, 1200px)'}}>
            <ResponsiveContainer aspect={2}>
                <LineChart data={chartData}
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
