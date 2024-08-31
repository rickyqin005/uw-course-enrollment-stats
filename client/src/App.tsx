import React from "react";
import "./App.css";
import FrequencyChart from "./components/FrequencyChart.tsx";
import CoursesTable from "./components/CoursesTable.tsx";
import EnrollmentChart from "./components/EnrollmentChart.tsx";
import EnrollmentChart2 from "./components/EnrollmentChart2.tsx";
import { CourseOptions, CourseOptionsRaw } from "./components/types.ts";
import useAPI from "./hooks/useAPI.ts";

const consts = require('./consts.json');
const components = consts.components;

export default function App() {
	const { data } = useAPI<CourseOptions>
		('/api/info', {}, parseCourseOptions(consts.defaultCourseOptions), parseCourseOptions, []);

	return (
		<div className="App">
		<div className="App-body">
			<h1>UW Course Enrollment Stats</h1>
			<FrequencyChart courseOptions={data} components={components} />
			<EnrollmentChart courseOptions={data} />
			<EnrollmentChart2 courseOptions={data} />
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
