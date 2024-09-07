export type ValueAndLabel<T> = { value: T, label: String };

export type CourseOptions = Map<string, Map<string, string[]>>;

export type CourseOptionsRaw = {
    subjects: {
		subject: string,
		courses: {
			code: string,
			components: string[]
		}[]
	}[]
};

export type EnrollmentChartState = {
    chartSubjectSelected: string,
    setChartSubjectSelected: React.Dispatch<React.SetStateAction<string>>,
    chartCodeSelected: string,
    setChartCodeSelected: React.Dispatch<React.SetStateAction<string>>,
    chartComponentSelected: string,
    setChartComponentSelected: React.Dispatch<React.SetStateAction<string>>,
	chartDisplayBySections: boolean,
	setChartDisplayBySections: React.Dispatch<React.SetStateAction<boolean>>,
    courseOptions: CourseOptions,
	chartRef: React.MutableRefObject<null>
};
