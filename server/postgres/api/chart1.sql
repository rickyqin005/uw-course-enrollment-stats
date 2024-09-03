SELECT
	json_object('name': to_char(times, 'HH24:MI'))::jsonb ||
	json_object_agg(day_of_week, COALESCE((
		SELECT SUM(enroll_total)
	    FROM sections
		INNER JOIN enrollment
		ON sections.section_id = enrollment.section_id AND enrollment.check_time = date_trunc('day', NOW())
		INNER JOIN timeslots
		ON timeslots.section_id = sections.section_id
		WHERE
			(start_time IS NULL OR
				GREATEST(('1899-12-31 ' || start_time::varchar)::timestamp, times) <
				LEAST(times + '30 min'::interval, ('1899-12-31 ' || end_time::varchar)::timestamp))
			AND days_of_week & pow = pow
			AND (start_date IS NULL OR
				GREATEST(start_date, '%SQL3'::timestamp) <= LEAST('%SQL3'::timestamp + '7 days'::interval, end_date))
			%SQL1 %SQL2
	), 0))::jsonb AS time_frame
FROM generate_series('1899-12-31 08:30'::timestamp, '1899-12-31 21:30'::timestamp, '30 min'::interval) AS f1(times)
CROSS JOIN (VALUES (1, 'Monday'), (2, 'Tuesday'), (4, 'Wednesday'), (8, 'Thursday'), (16, 'Friday')) f2(pow, day_of_week)
GROUP BY times;
