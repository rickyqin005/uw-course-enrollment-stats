SELECT array_agg(c) OVER () AS "subjects", "components"
FROM(
    SELECT json_object(
        'subject': subjects.subject,
        'faculty': subjects.faculty,
		'courses': ARRAY(
			SELECT json_object(
				'code': code,
				'components': ARRAY(
					SELECT component_type
					FROM (
						SELECT DISTINCT LEFT(component, 3) AS component_type
						FROM sections
						WHERE sections.course_subject = subjects.subject AND sections.course_code = code
					)
					ORDER BY component_type = 'TST', component_type
				)
			)
			FROM courses
			WHERE courses.subject = subjects.subject
		)
    ) FROM subjects
) AS f(c)
INNER JOIN(
    SELECT array_agg(d) AS "components" FROM (SELECT * FROM components) AS g(d)
)
ON 1 = 1
LIMIT 1;
