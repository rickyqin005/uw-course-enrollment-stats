WITH interval(start_val, end_val) AS (
	SELECT *, start_val || '-' || end_val AS "name"
	FROM (
		SELECT GREATEST(val, 1) AS start_val, val+9 AS end_val
		FROM generate_series(0, 290, 10) AS f1(val)
	)
	UNION
	SELECT * FROM (VALUES (300, 10000, '300+'))
	ORDER BY start_val
)
SELECT name, (
	SELECT count(*)::integer
	FROM sections
	INNER JOIN enrollment
	ON enrollment.section_id = sections.section_id AND check_time = date_trunc('day', NOW())
	WHERE start_val <= enroll_total AND enroll_total <= end_val
)
FROM interval;
