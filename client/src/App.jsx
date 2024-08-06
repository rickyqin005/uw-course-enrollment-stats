import React from "react";
import Select from 'react-select';
import "./App.css";

import FrequencyChart from "./components/FrequencyChart.jsx";
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
        <div className="option-container">
          <h4>Subject</h4>
          <Select
            defaultValue={[]}
            isMulti
            name="subjects"
            options={staticData.subjects.map(subject => { return { value: subject, label: subject }})}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={subjects => {
              setChart1SubjectsSelected(subjects.map(subject => subject.value));
            }}
          />
        </div>
        <Select
          defaultValue={[]}
          isMulti
          name="components"
          options={staticData.courseComponents.map(component => { return { value: component, label: component }})}
          className="basic-multi-select"
          classNamePrefix="select"
          onChange={components => {
            setChart1ComponentsSelected(components.map(component => component.value));
          }}
        />
        
        <FrequencyChart sections={sections} subjectsSelected={chart1SubjectsSelected} componentsSelected={chart1ComponentsSelected}/>
      </div>
    </div>
  );
}

export default App;