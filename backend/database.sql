/* Database Structure */

CREATE TABLE books (
    id SERIAL PRIMARY KEY NOT NULL,
    bname VARCHAR(100) UNIQUE NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(13) UNIQUE CHECK(char_length(isbn) IN (10, 13)),
    rdate DATE NOT NULL
);

CREATE TABLE ratings (
    id SERIAL PRIMARY KEY NOT NULL,
    bookid NOT NULL REFERENCES books(id),
    rating smallint NOT NULL CHECK(rating >= 0 AND ratings <= 10),
    rtext VARCHAR(1000) NOT NULL
);