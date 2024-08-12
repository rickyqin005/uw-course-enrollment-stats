SELECT course_subject, course_code, min_enroll, max_enroll
FROM sections,
LATERAL(
    SELECT section_id,
        MIN(enroll_total) AS min_enroll,
        MAX(enroll_total) AS max_enroll
        FROM enrollment
    GROUP BY section_id
    HAVING enrollment.section_id = sections.section_id AND MIN(enroll_total) != MAX(enroll_total)
)
ORDER BY max_enroll - min_enroll DESC
