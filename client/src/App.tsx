import React from "react";
import "./App.css";
import FrequencyChart from "./components/FrequencyChart.tsx";
import CoursesTable from "./components/CoursesTable.tsx";
import EnrollmentChart from "./components/EnrollmentChart.tsx";
import { CourseOptions, CourseOptionsRaw, EnrollmentChartState } from "./components/types.ts";
import useAPI from "./hooks/useAPI.ts";

const consts = require('./consts.json');
const components = consts.components;

export default function App() {
	const [chartSubjectSelected, setChartSubjectSelected] = React.useState<string>(consts.defaultSubjectSelected);
    const [chartCodeSelected, setChartCodeSelected] = React.useState<string>(consts.defaultCodeSelected);
    const [chartComponentSelected, setChartComponentSelected] = React.useState<string>(consts.defaultComponentSelected);
    const [chartDisplayBySections, setChartDisplayBySections] = React.useState(false);
	const enrollmentChartRef = React.useRef(null);

	const { data } = useAPI<CourseOptions>
		('/api/info', {}, parseCourseOptions(consts.defaultCourseOptions), parseCourseOptions, []);

	const enrollmentChartState: EnrollmentChartState = {
		chartSubjectSelected, setChartSubjectSelected,
		chartCodeSelected, setChartCodeSelected,
		chartComponentSelected, setChartComponentSelected,
		chartDisplayBySections, setChartDisplayBySections,
		courseOptions: data,
		chartRef: enrollmentChartRef
	};

	return (
		<div className="App">
			<div className="App-body">
				<h1>UW Course Enrollment Stats</h1>
				<EnrollmentChart state={enrollmentChartState} />
				<CoursesTable enrollmentChartState={enrollmentChartState} />
				<FrequencyChart courseOptions={data} components={components} />
			</div>
			<div className="App-footer">
				Made by Ricky Qin, check out my other projects <a href="https://github.com/rickyqin005">here</a>!
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
