import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useAPI from '../hooks/useAPI.ts';

type TimeFrame = {
    name: string,
    count: number
};

export default function SectionSizeChart() {

    const { data, dataIsLoaded } = useAPI<TimeFrame[]>('/api/chart4', {}, [], data => data, []);

    return <div className="chart-region">
        <h2>Class Section Size Distribution</h2>
        <div className="chart-container" style={{ width: 'max(min(70vw, 1200px), 700px)' }}>
            {!dataIsLoaded ? <div className="chart-loading">Loading...</div> : ''}
            <ResponsiveContainer aspect={2}>
                <BarChart data={data}
                    style={{ opacity: (!dataIsLoaded ? 0.25 : 1) }}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "# of Sections", angle: -90, position: "left" }}
                        tickFormatter={val => val.toLocaleString()} />
                    <Tooltip
                        formatter={val => val.toLocaleString()} />
                    <Legend />
                    <Bar name="Count" dataKey="count" fill="#0099ff" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
}
