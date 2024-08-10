SELECT
    section_id,
    subject,
    code,
    component,
    location,
    enroll_cap,
    enroll_total,
    ARRAY(
		SELECT json_object(
			'start_time': start_time::timestamp with time zone,
			'end_time': end_time::timestamp with time zone,
            'days_of_week': days_of_week,
            'start_date': start_date::timestamp with time zone,
            'end_date': end_date::timestamp with time zone
        )
		FROM timeslots
		WHERE timeslots.section_id = sections.section_id
	) AS times
FROM sections
INNER JOIN courses
ON courses.course_id = sections.course_id