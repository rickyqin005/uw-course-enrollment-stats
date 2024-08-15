SELECT check_time as name,
    MAX(course_enroll_total) AS enrollment
FROM (
    SELECT check_time,
        SUM(enroll_total)::integer AS course_enroll_total
    FROM enrollment
    INNER JOIN sections
    ON sections.section_id = enrollment.section_id
    WHERE course_subject = '%SQL1' AND course_code = '%SQL2'
    GROUP BY check_time, LEFT(component, 3)
    ORDER BY check_time
)
WHERE EXTRACT(hour from check_time) = 18
GROUP BY check_time;
