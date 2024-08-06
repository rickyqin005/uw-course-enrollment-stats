import React from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import "./App.css";

function App() {
  const [courses, setCourses] = React.useState([]);
  const [chart1Data, setChart1Data] = React.useState('');
  const [chart2Data, setChart2Data] = React.useState('');
  React.useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.courses.map((course => [course.subject, course.code, course.title])));
        calculateChartData(data, setChart1Data, setChart2Data);
        // setChartData1(JSON.stringify(data.chartData1));
        // setChartData2(JSON.stringify(data.chartData2));
      });
  }, []);

  const table1 = courses.map(course =>
    <tr>
      <td>{`${course[0]} ${course[1]}`}</td>
      <td>{course[2]}</td>
    </tr>
  );

  let chart1 = null;
  if(chart1Data !== '') {
    chart1 = <ResponsiveContainer height={600} width={1300}>
      <LineChart data={JSON.parse(chart1Data)}
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
  if(chart2Data !== '') {
    chart2 = <ResponsiveContainer height={600} width={1300}>
      <LineChart data={JSON.parse(chart2Data)}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        title="Title">
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
        {/*chart2*/}
        {/*<table>
          <tbody>
            {table1}
          </tbody>
        </table>*/}
      </header>
    </div>
  );
}

const staticData = require('./data.json');
const daysOfWeekAbbrev = staticData.daysOfWeekAbbrev;
const daysOfWeekFullName = staticData.daysOfWeekFullName;

function calculateChartData(data, setChart1Data, setChart2Data) {
  const currWeek = new Date(Date.UTC(0, 8, 9));
  const nextWeek = new Date(Date.UTC(0, 8, 15));

  const chart1Data = [];
  const chart2Data = [];

  let currTime = new Date(Date.UTC(0, 0, 0, 8, 30));
  // 30 min timeslots from 8:30am to 10pm
  for(let i = 0; i < 27; i++) {
      let nextHours = currTime.getUTCHours();
      let nextMinutes = currTime.getUTCMinutes()+30;
      if(nextMinutes >= 60) {
          nextHours++;
          nextMinutes -= 60;
      }
      const nextTime = new Date(Date.UTC(0, 0, 0, nextHours, nextMinutes));
      const timeFrameName = `${currTime.getUTCHours()}:${currTime.getUTCMinutes().toString().padStart(2,'0')}`;
      let timeFrame1 = {name: timeFrameName};
      let timeFrame2 = {name: timeFrameName};
      for(let j = 0; j < daysOfWeekAbbrev.length; j++) {
          let enrollCapSum = 0;
          let enrollTotalSum = 0;
          data.sections.forEach((section) => {
              section.times.forEach((time) => {
                  if(time.startTime == null || time.endTime == null) return;
                  if(Math.max(new Date(time.startTime), currTime) < Math.min(new Date(time.endTime), nextTime) &&
                      time.daysOfWeek.includes(daysOfWeekAbbrev[j]) &&
                      ((time.startDate == null && time.endDate == null) ||
                      (Math.max(new Date(time.startDate), currWeek) <= Math.min(new Date(time.endDate), nextWeek)))) {
                      enrollTotalSum += section.enrollTotal;
                      enrollCapSum += section.enrollCap;
                  }
              })
          });
          timeFrame1[daysOfWeekFullName[j]] = enrollTotalSum;
          timeFrame2[daysOfWeekFullName[j]] = (enrollCapSum === 0 ? 0 : enrollTotalSum/enrollCapSum);
      }
      chart1Data.push(timeFrame1);
      chart2Data.push(timeFrame2);
      currTime = nextTime;
  }
  console.log(chart1Data);
  console.log(chart2Data);
  setChart1Data(JSON.stringify(chart1Data));
  setChart2Data(JSON.stringify(chart2Data));
}

export default App;