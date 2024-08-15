SELECT
	section_id, course_subject, course_code,
	latest_enroll_total, prev_enroll_total,
	latest_enroll_total - prev_enroll_total AS change
FROM sections
CROSS JOIN LATERAL(
    SELECT enroll_total AS prev_enroll_total
	FROM enrollment
    WHERE enrollment.section_id = sections.section_id
	ORDER BY check_time DESC
	LIMIT 1 OFFSET 1
)
CROSS JOIN LATERAL(
    SELECT enroll_total AS latest_enroll_total
	FROM enrollment
    WHERE enrollment.section_id = sections.section_id
	ORDER BY check_time DESC
	LIMIT 1
)
WHERE latest_enroll_total != prev_enroll_total
ORDER BY ABS(latest_enroll_total - prev_enroll_total) DESC,
	course_subject, course_code, LEFT(component, 3) = 'TST', component;