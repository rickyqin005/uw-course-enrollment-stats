import React from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import ChartOption from './ChartOption.tsx';
const moment = require('moment');

interface TimeFrame {
    name: string,
    enrollment: number
}

export default function EnrollmentChart({ courseCodes }) {
    const [chartData, setChartData] = React.useState<TimeFrame[]>([]);
    const [chartDataLoading, setChartDataLoading] = React.useState(false);
    const [chartSubjectSelected, setChartSubjectSelected] = React.useState<String>('MTHEL');
    const [chartCodeSelected, setChartCodeSelected] = React.useState<String>('99');

    React.useEffect(() => {
        console.log(`chart2 options: ${chartSubjectSelected}|${chartCodeSelected}`);
        setChartDataLoading(true);
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
            setChartData(data.map(row => { return {
                Enrollment: row.enrollment,
                name: moment(row.name).subtract(moment().utcOffset(), 'minutes').format('MMM D')
            };}));
            setChartDataLoading(false);
        })
        .catch(error => console.log(error));
      }, [chartSubjectSelected, chartCodeSelected]);

    return <div className="chart-region">
        <h2>How does course enrollment change over time?</h2>
        <div className="chart-options">
        <ChartOption
              name="Subject:"
              options={Array.from(courseCodes.keys()).map(subject => { return { value: subject, label: subject }})}
              isMultiSelect={false}
              defaultValue={{ value: 'MTHEL', label: 'MTHEL' }}
              onChange={subject => setChartSubjectSelected(subject.value)}/>
        <ChartOption
              name="Code:"
              options={(courseCodes.get(chartSubjectSelected) ?? []).map(code => { return { value: code, label: code }})}
              isMultiSelect={false}
              defaultValue={{ value: '99', label: '99' }}
              onChange={code => setChartCodeSelected(code.value)}/>
        </div>
        <div className="chart-container" style={{width: 'min(50vw, 1200px)'}}>
            {chartDataLoading ? <div className="chart-loading">Loading...</div> : ''}
            <ResponsiveContainer aspect={2}>
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
