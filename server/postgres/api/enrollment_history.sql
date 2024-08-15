SELECT check_time, MAX(course_enroll_total) AS course_enroll_total
FROM (
    SELECT check_time,
        SUM(enroll_total)::integer AS course_enroll_total
    FROM enrollment
    INNER JOIN sections
    ON sections.section_id = enrollment.section_id
    WHERE course_subject = 'MTHEL' AND course_code = '99'
    GROUP BY check_time, LEFT(component, 3)
    ORDER BY check_time
)
GROUP BY check_time;
