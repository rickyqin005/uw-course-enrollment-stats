SELECT
    course_id,
    subject,
    code,
    units,
    title,
	ARRAY(SELECT section_id FROM sections WHERE sections.course_id = courses.course_id) AS "sections"
FROM courses