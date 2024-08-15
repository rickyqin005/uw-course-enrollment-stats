INSERT INTO courses VALUES %SQL1
ON CONFLICT(subject, code) DO UPDATE SET
    units = excluded.units,
    title = excluded.title;

INSERT INTO sections VALUES %SQL2
ON CONFLICT(section_id) DO UPDATE SET
    course_subject = excluded.course_subject,
    course_code = excluded.course_code,
    component = excluded.component,
    location = excluded.location,
    enroll_cap = excluded.enroll_cap;

INSERT INTO enrollment VALUES %SQL3
ON CONFLICT(section_id, check_time) DO UPDATE SET
    enroll_total = excluded.enroll_total;

DELETE FROM timeslots;
INSERT INTO timeslots VALUES %SQL4;

REFRESH MATERIALIZED VIEW course_changes;
