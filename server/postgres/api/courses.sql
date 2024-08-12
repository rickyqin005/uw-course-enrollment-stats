SELECT
    subject,
    code,
    units,
    title,
	ARRAY(
        SELECT section_id
        FROM sections
        WHERE sections.course_subject = subject AND sections.course_code = code
    ) AS "sections"
FROM courses
ORDER BY subject, code
