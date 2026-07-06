/*
# Drop old seed_sample_data() overload (no args)

The original seed_sample_data() had no parameters and used current_date.
A new version with p_end_date parameter was added. Drop the old overload
to avoid ambiguity and ensure the frontend always calls the timezone-aware version.
*/

DROP FUNCTION IF EXISTS seed_sample_data();
