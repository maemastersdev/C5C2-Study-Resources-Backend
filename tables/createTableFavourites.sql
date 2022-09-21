CREATE TABLE favourites (
    user_id INT REFERENCES users(user_id),
    resource_id INT REFERENCES resources(resource_id);
)