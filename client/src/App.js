import React from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import "./App.css";

function App() {
  const [courses, setCourses] = React.useState([]);
  const [chartData1, setChartData1] = React.useState('');
  const [chartData2, setChartData2] = React.useState('');
  React.useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.courses.map((course => [course.subject, course.code, course.title])));
        setChartData1(JSON.stringify(data.chartData1));
        setChartData2(JSON.stringify(data.chartData2));
      });
  }, []);

  const table1 = courses.map(course =>
    <tr>
      <td>{`${course[0]} ${course[1]}`}</td>
      <td>{course[2]}</td>
    </tr>
  );

  let chart1 = null;
  if(chartData1 != '') {
    chart1 = <ResponsiveContainer width="80%" height={500}>
      <LineChart data={JSON.parse(chartData1)}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Monday" stroke="blue" />
        <Line type="monotone" dataKey="Tuesday" stroke="red" />
        <Line type="monotone" dataKey="Wednesday" stroke="DarkOrange" />
        <Line type="monotone" dataKey="Thursday" stroke="green" />
        <Line type="monotone" dataKey="Friday" stroke="purple" />
      </LineChart>
    </ResponsiveContainer>
  }

  let chart2 = null;
  if(chartData2 != '') {
    chart2 = <ResponsiveContainer width="80%" height={500}>
      <LineChart data={JSON.parse(chartData2)}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Monday" stroke="blue" />
        <Line type="monotone" dataKey="Tuesday" stroke="red" />
        <Line type="monotone" dataKey="Wednesday" stroke="DarkOrange" />
        <Line type="monotone" dataKey="Thursday" stroke="green" />
        <Line type="monotone" dataKey="Friday" stroke="purple" />
      </LineChart>
    </ResponsiveContainer>
  }

  return (
    <div className="App">
      <header className="App-header">
        <div height={100}></div><br></br>
        {chart1}
        {chart2}
        <table>
          <tbody>
            {table1}
          </tbody>
        </table>
      </header>
    </div>
  );
}


export default App;