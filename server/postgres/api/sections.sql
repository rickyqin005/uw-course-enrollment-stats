SELECT *,
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
CROSS JOIN LATERAL(
	SELECT enroll_total
	FROM enrollment
	WHERE enrollment.section_id = sections.section_id
	ORDER BY check_time DESC
	LIMIT 1
)
ORDER BY course_subject, course_code, LEFT(component, 3) = 'TST', component;
