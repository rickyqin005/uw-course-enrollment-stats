import React from "react";
import "./App.css";
import FrequencyChart from "./components/FrequencyChart.tsx";
import CoursesTable from "./components/CoursesTable.tsx";
import EnrollmentChart from "./components/EnrollmentChart.tsx";
import EnrollmentChart2 from "./components/EnrollmentChart2.tsx";
import { CourseOptions, CourseOptionsRaw } from "./components/types.ts";

const consts = require('./const.json');

export default function App() {
	const [courseOptions, setCourseOptions] = React.useState<CourseOptions>
		(parseCourseOptions(consts.defaultOptions));
	const [components, setComponents] = React.useState<string[]>([]);

	React.useEffect(() => {
		fetch(`${process.env.REACT_APP_SERVER_URL}/api/info`, {
			method: "GET", mode: 'cors',
			headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
		}).then(res => res.json())
		.then(data => {
			setCourseOptions(parseCourseOptions(data));
			setComponents(data.components);
		}).catch(error => console.log(error));
	}, []);

	return (
		<div className="App">
		<div className="App-body">
			<h1>UW Course Enrollment Stats</h1>
			<FrequencyChart courseOptions={courseOptions} components={components} />
			<EnrollmentChart courseOptions={courseOptions} />
			<EnrollmentChart2 courseOptions={courseOptions} />
			<CoursesTable />
		</div>
		</div>
	);
}

function parseCourseOptions(options: CourseOptionsRaw): CourseOptions {
	return new Map(options.subjects.filter(subject => subject.courses.length > 0)
	.map(subject => [
		subject.subject, new Map(subject.courses.map(course => [course.code, course.components]))
	]))
}
