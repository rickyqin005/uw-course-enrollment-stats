import React from "react";
import "./App.css";

import FrequencyChart from "./components/FrequencyChart.jsx";
import ChartOption from "./components/ChartOption.jsx";
const staticData = require('./data.json');

function App() {
  const [chartSubjectsSelected, setChartSubjectsSelected] = React.useState([]);
  const [chartComponentsSelected, setChartComponentsSelected] = React.useState([]);

  return (
    <div className="App">
      <div className="App-body">
        <div className="chart-options">
          <ChartOption
            name="Subject:"
            options={staticData.subjects.map(subject => { return { value: subject, label: subject }})}
            onChange={subjects => setChartSubjectsSelected(subjects.map(subject => subject.value))}/>
          <ChartOption
            name="Component:"
            options={staticData.courseComponents.map(component => { return { value: component, label: component }})}
            onChange={components => setChartComponentsSelected(components.map(component => component.value))}/>
        </div>
        <FrequencyChart subjectsSelected={chartSubjectsSelected} componentsSelected={chartComponentsSelected}/>
      </div>
    </div>
  );
}

export default App;