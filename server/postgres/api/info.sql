
SELECT array_agg(c) OVER () AS "subjects", "components"
FROM(
    SELECT json_object(
        'subject': subjects.subject,
        'faculty': subjects.faculty,
        'course_codes': ARRAY(
            SELECT code
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
