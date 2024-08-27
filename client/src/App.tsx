import React from "react";
import "./App.css";
import FrequencyChart from "./components/FrequencyChart.tsx";
import CoursesTable from "./components/CoursesTable.tsx";
import EnrollmentChart from "./components/EnrollmentChart.tsx";
import EnrollmentChart2 from "./components/EnrollmentChart2.tsx";

export default function App() {
	const [courseCodes, setCourseCodes] = React.useState<Map<String, String[]>>(new Map([['MTHEL', ['99']]]));
	const [components, setComponents] = React.useState<String[]>([]);

	React.useEffect(() => {
		fetch(`${process.env.REACT_APP_SERVER_URL}/api/info`, {
			method: "GET", mode: 'cors',
			headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
		}).then(res => res.json())
		.then(data => {
			const map = new Map();
			data.subjects.filter(subject => subject.course_codes.length > 0)
			.forEach(subject => map.set(subject.subject, subject.course_codes));
			setCourseCodes(map);
			setComponents(data.components);
		}).catch(error => console.log(error));
	}, []);

	return (
		<div className="App">
		<div className="App-body">
			<h1>UW Course Enrollment Stats</h1>
			<FrequencyChart courseCodes={courseCodes} components={components} />
			<EnrollmentChart courseCodes={courseCodes} />
			<EnrollmentChart2 courseCodes={courseCodes} components={components} />
			<CoursesTable />
		</div>
		</div>
	);
}
