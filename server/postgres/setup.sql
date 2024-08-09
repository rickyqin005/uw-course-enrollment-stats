-- code to setup the db structure
-- should only be run once

DROP TABLE timeslots;
DROP TABLE sections;
DROP TABLE courses;

CREATE TABLE courses (
    course_id   INT             PRIMARY KEY,
    subject     VARCHAR(6)      NOT NULL CHECK(subject ~ '[A-Z]+'),
    code        VARCHAR(5)      NOT NULL CHECK(code ~ '[0-9][A-Z]*'),
    units       REAL            NOT NULL CHECK(units BETWEEN 0 AND 3),
    title       VARCHAR(255)    NOT NULL
);

CREATE TABLE sections (
    section_id      INT             PRIMARY KEY,
    course_id       INT             NOT NULL REFERENCES courses(course_id),
    component       CHAR(7)         NOT NULL CHECK(component ~ '[A-Z]{3} [0-9]{3}'),
    location        VARCHAR(20)     NOT NULL CHECK(location ~ '[A-Z]+ [A-Z]+'),
    enroll_cap      INT             NOT NULL CHECK(enroll_cap >= 1),
    enroll_total    INT             NOT NULL CHECK(enroll_total >= 0)
);
	
CREATE TABLE timeslots (
    section_id      INT         NOT NULL REFERENCES sections(section_id),
    start_time      TIMESTAMP   CHECK(TIMESTAMP '1899-12-31 08:30' <= start_time),
    end_time        TIMESTAMP   CHECK(end_time <= TIMESTAMP '1899-12-31 22:00' AND start_time < end_time),
    -- encodes which days of the week a timeslot runs as bits: 1 Mon, 2 Tue, 4 Wed, 8 Thu, ...
    days_of_week    INT         NOT NULL CHECK(days_of_week BETWEEN 0 AND 127),
    start_date      DATE,
    end_date        DATE        CHECK(start_date <= end_date)
);
