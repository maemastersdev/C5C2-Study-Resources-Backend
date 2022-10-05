CREATE TYPE tags_type AS ENUM ('React', 'TypeScript', 'SQL', 'Node.js', 'CSS', 'Testing', 'Other');

CREATE TABLE tags (
    resource_id INT REFERENCES resources(resource_id),
    tag tags_type DEFAULT 'Other'
)