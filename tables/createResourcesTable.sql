CREATE TYPE content_types AS ENUM ('video', 'article', 'ebook', 'podcast', 'exercises', 'software tool', 'course', 'diagram', 'cheat-sheet', 'reference', 'resource list', 'youtube channel', 'organisation', 'other');


CREATE TABLE resources (
    resource_id SERIAL PRIMARY KEY,
    resource_name VARCHAR(255) NOT NULL,
    author_name VARCHAR(255),
    url VARCHAR(255) UNIQUE NOT NULL,
    content_type content_types DEFAULT 'Other',
    learning_stage INT DEFAULT 'Any',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id REFERENCES users(user_id);
    review VARCHAR(255)
);