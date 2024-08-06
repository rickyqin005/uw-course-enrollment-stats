import React from "react";
import Select from 'react-select';
import "./App.css";

import FrequencyChart from "./components/FrequencyChart.jsx";
import ChartOption from "./components/ChartOption.jsx";
const staticData = require('./data.json');

function App() {
  const [courses, setCourses] = React.useState([]);
  const [sections, setSections] = React.useState([]);
  const [chart1SubjectsSelected, setChart1SubjectsSelected] = React.useState([]);
  const [chart1ComponentsSelected, setChart1ComponentsSelected] = React.useState([]);

  React.useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.courses);
        setSections(data.sections);
      });
  }, []);

  return (
    <div className="App">
      <div className="App-body">
        <div className="chart-options">
          <ChartOption
            name="Subject:"
            options={staticData.subjects.map(subject => { return { value: subject, label: subject }})}
            onChange={subjects => setChart1SubjectsSelected(subjects.map(subject => subject.value))}/>
          <ChartOption
            name="Component:"
            options={staticData.courseComponents.map(component => { return { value: component, label: component }})}
            onChange={components => setChart1ComponentsSelected(components.map(component => component.value))}/>
        </div>
        <FrequencyChart sections={sections} subjectsSelected={chart1SubjectsSelected} componentsSelected={chart1ComponentsSelected}/>
      </div>
    </div>
  );
}

export default App;