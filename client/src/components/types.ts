export type CourseOptions = Map<string, Map<string, string[]>>;

export type CourseOptionsRaw = {
    subjects: {
		subject: string,
		courses: {
			code: string,
			components: string[]
		}[]
	}[],
	components: string[]
};
