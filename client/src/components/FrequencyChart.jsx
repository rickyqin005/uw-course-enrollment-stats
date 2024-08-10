import React from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';

export default function FrequencyChart({ subjectsSelected, componentsSelected }) {
    const [chartData, setChartData] = React.useState([]);
    const [chartDataLoading, setChartDataLoading] = React.useState(false);
    React.useEffect(() => {
        console.log(`${subjectsSelected}|${componentsSelected}`);
        setChartDataLoading(true);
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/chart1`, {
            method: "POST",
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subjects: subjectsSelected,
                components: componentsSelected
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            setChartData(data);
            setChartDataLoading(false);
        })
        .catch((error) => console.log(error));

      }, [subjectsSelected, componentsSelected]);
    
    return <div className="chart-container" >
        {chartDataLoading ? <div className="chart-loading">Loading...</div> : ''}
        <ResponsiveContainer aspect={2}>
            <LineChart data={chartData} style={{opacity: (chartDataLoading ? 0.25 : 1)}}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2" />
                <XAxis label={{ value: "Time", position: "insideBottomRight", offset: -15}} dataKey="name" />
                <YAxis label={{ value: "# of Students", angle: -90, position: "insideLeft"}} tickCount={6} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Monday" stroke="blue" />
                <Line type="monotone" dataKey="Tuesday" stroke="red" />
                <Line type="monotone" dataKey="Wednesday" stroke="DarkOrange" />
                <Line type="monotone" dataKey="Thursday" stroke="green" />
                <Line type="monotone" dataKey="Friday" stroke="purple" />
            </LineChart>
        </ResponsiveContainer>
    </div>
}
