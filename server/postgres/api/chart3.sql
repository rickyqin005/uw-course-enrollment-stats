SELECT check_time as name,
	json_agg(json_object('component': component, 'enroll_total': enroll_total::real/enroll_cap)) AS series
FROM(
	SELECT * FROM enrollment
	INNER JOIN sections
	ON sections.section_id = enrollment.section_id
	WHERE course_subject = '%SQL1' AND course_code = '%SQL2' AND LEFT(component, 3) = '%SQL3'
	ORDER BY check_time, LEFT(component, 3) = 'TST', component
)
GROUP BY check_time;
