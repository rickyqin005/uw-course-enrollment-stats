import React from "react";
import "./App.css";
import FrequencyChart from "./components/FrequencyChart.tsx";
import CoursesTable from "./components/CoursesTable.tsx";
import EnrollmentChart from "./components/EnrollmentChart.tsx";

function App() {
  return (
    <div className="App">
      <div className="App-body">
        <h1>UW Course Enrollment Stats</h1>
        <FrequencyChart />
        <EnrollmentChart />
        <h2>Which courses are taken the most?</h2>
        <CoursesTable />
      </div>
    </div>
  );
}

export default App;