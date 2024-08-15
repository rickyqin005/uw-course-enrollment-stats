SELECT *,
ARRAY(
    SELECT code
    FROM courses
    WHERE courses.subject = subjects.subject
) AS course_codes
FROM subjects;
