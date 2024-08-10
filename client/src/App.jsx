import React from "react";
import "./App.css";
import FrequencyChart from "./components/FrequencyChart.jsx";
import ChartOption from "./components/ChartOption.jsx";

const staticData = require('./data.json');
let currWeek = new Date(staticData.firstWeek);
const weeksList = [];
while(currWeek <= new Date(staticData.lastWeek)) {
  weeksList.push({
    value: currWeek.toISOString(),
    label: `${staticData.monthsShortName[currWeek.getUTCMonth()]} ${currWeek.getUTCDate()}`
  });
  currWeek.setUTCDate(currWeek.getUTCDate()+7);
}

function App() {
  const [chartSubjectsSelected, setChartSubjectsSelected] = React.useState([]);
  const [chartComponentsSelected, setChartComponentsSelected] = React.useState([]);
  const [chartWeekSelected, setChartWeekSelected] = React.useState(weeksList[1].value);

  return (
    <div className="App">
      <div className="App-body">
        <h1>UW Course Enrollment Stats</h1>
        <div className="chart-options">
          <ChartOption
            name="Subject:"
            options={staticData.subjects.map(subject => { return { value: subject, label: subject }})}
            isMultiSelect={true}
            defaultValue={[]}
            onChange={subjects => setChartSubjectsSelected(subjects.map(subject => subject.value))}/>
          <ChartOption
            name="Component:"
            options={staticData.courseComponents.map(component => { return { value: component, label: component }})}
            isMultiSelect={true}
            defaultValue={[]}
            onChange={components => setChartComponentsSelected(components.map(component => component.value))}/>
          <ChartOption
            name="Week of:"
            options={weeksList}
            isMultiSelect={false}
            defaultValue={weeksList[1]}
            onChange={week => setChartWeekSelected(week.value)}/>
        </div>
        <FrequencyChart
          subjectsSelected={chartSubjectsSelected}
          componentsSelected={chartComponentsSelected}
          weekSelected={chartWeekSelected}/>
      </div>
    </div>
  );
}

export default App;