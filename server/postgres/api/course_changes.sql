SELECT subject, code,
	prev_course_enroll_total, latest_course_enroll_total,
	latest_course_enroll_total - prev_course_enroll_total as change
FROM courses
CROSS JOIN LATERAL(
    SELECT SUM(enroll_total) as prev_course_enroll_total
    FROM sections
    CROSS JOIN LATERAL(
        SELECT enroll_total
        FROM enrollment
        WHERE enrollment.section_id = sections.section_id
        ORDER BY check_time DESC
        LIMIT 1 OFFSET 12
    )
	WHERE sections.course_subject = subject AND sections.course_code = code
    GROUP BY LEFT(component, 3)
	ORDER BY prev_course_enroll_total DESC
	LIMIT 1
)
CROSS JOIN LATERAL(
    SELECT SUM(enroll_total) as latest_course_enroll_total
    FROM sections
    CROSS JOIN LATERAL(
        SELECT enroll_total
        FROM enrollment
        WHERE enrollment.section_id = sections.section_id
        ORDER BY check_time DESC
        LIMIT 1
    )
	WHERE sections.course_subject = subject AND sections.course_code = code
    GROUP BY LEFT(component, 3)
	ORDER BY latest_course_enroll_total DESC
	LIMIT 1
)
WHERE latest_course_enroll_total != prev_course_enroll_total
ORDER BY ABS(latest_course_enroll_total - prev_course_enroll_total) DESC,
	subject, code;
