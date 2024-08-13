SELECT *
FROM courses
CROSS JOIN LATERAL(
    SELECT SUM(enroll_total) as course_enroll_total
    FROM sections
    -- get latest enrollment number
    CROSS JOIN LATERAL(
        SELECT enroll_total
        FROM enrollment
        WHERE enrollment.section_id = sections.section_id
        ORDER BY check_time DESC
        LIMIT 1
    )
    WHERE sections.course_subject = subject AND sections.course_code = code
    -- group by component type and take max group as course enrollment total
    GROUP BY LEFT(component, 3)
    ORDER BY course_enroll_total DESC
    LIMIT 1
)
ORDER BY subject, code;
