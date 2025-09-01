import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import pg from "pg";

const app = express();
const port = 4000;

app.use(bodyParser.json());
dotenv.config();

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

db.connect();

// SELECT books from db
app.get("/api/getbooks", async (req, res) => {
    try {
        let sort = req.query.sort;
        let result;
        if (sort === 'title') {
            result = await db.query("SELECT books.id, bname, author, isbn, rdate, rating, rtext FROM books JOIN ratings ON books.id = ratings.bookid ORDER BY bname;");
        } else if (sort === 'newest') {
            result = await db.query("SELECT books.id, bname, author, isbn, rdate, rating, rtext FROM books JOIN ratings ON books.id = ratings.bookid ORDER BY rdate DESC;");
        } else if (sort === 'best') {
            result = await db.query("SELECT books.id, bname, author, isbn, rdate, rating, rtext FROM books JOIN ratings ON books.id = ratings.bookid ORDER BY rating DESC;");
        } else {
            result = await db.query("SELECT books.id, bname, author, isbn, rdate, rating, rtext FROM books JOIN ratings ON books.id = ratings.bookid ORDER BY rating DESC, rdate DESC;");
        }
        // create new array with objects from both tables(books, ratings) with formatted date and outsider object(book cover)
        const booksWithCovers = result.rows.map((book) => {
            let rdate = book.rdate;
            if (rdate instanceof Date) {
                rdate = rdate.toISOString().slice(0, 10);
            }
            return {...book, rdate, coverUrl: `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`};
    });
    res.status(200).json(booksWithCovers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts"});
    }
});

// SELECT specific book from array by ID
app.get("/api/getbooks/:id", async (req, res) => {
    try {
        const Id = req.params.id;
        const result = await db.query("SELECT books.id, bname, author, isbn, rdate, rating, rtext FROM books JOIN ratings ON books.id = ratings.bookid WHERE books.id = $1;", [Id]);
        if (!result.rows[0]) { // if book not found return error
            return res.status(404).json({ error: 'Book not found'});
        }
        let book = result.rows[0];
        let rdate = book.rdate;
        if (rdate instanceof Date) { // format date if not a string(likely instance of date)
            rdate = rdate.toISOString().slice(0, 10);
        }
        book = { ...book, rdate, coverUrl: `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg` }; // object spread syntax(...) to add(coverUrl) and overwrite properties of book(formatted date)
        res.status(200).json(book);
    } catch (error) { // internal server error
        res.status(500).json({ message: "Error fetching specific book"});
    }
});

// CREATE book 
app.post("/api/add", async (req, res) => {
    const bname = req.body.bookname;
    const author = req.body.bookauthor;
    const isbn = req.body.isbn;
    const rdate = req.body.bookdate;
    const rating = req.body.bookrating;
    const rtxt = req.body.ratingtxt;

    try {
        const result = await db.query("INSERT INTO books (bname, author, isbn, rdate) VALUES ($1, $2, $3, $4) RETURNING id;", [bname, author, isbn, rdate]);
        const id = result.rows[0].id;
        await db.query("INSERT INTO ratings (bookid, rating, rtext) VALUES ($1, $2, $3);", [id, rating, rtxt]);
        res.status(200).json("New book added successfully");
    } catch (error) {
        console.log(error);
    }
});

// UPDATE book
app.put("/api/edit/:id", async (req, res) => {
    try {
        const bookName = req.body.bookname;
        const author = req.body.bookauthor;
        const bookDate = req.body.bookdate;
        const rating = req.body.bookrating;
        const bookTxt = req.body.ratingtxt;
        const bookId = req.params.id;
        await db.query("UPDATE books SET bname = $1, author = $2, rdate = $3 WHERE books.id = $4;", [bookName, author, bookDate, bookId]);
        await db.query("UPDATE ratings SET rating = $1, rtext = $2 WHERE ratings.bookid = $3;", [rating, bookTxt, bookId]);
        res.status(200).json("Book updated successfully");
    } catch (error) {
        console.log("Error when editing book: ", error);
    }
});

// DELETE book
app.delete("/api/delete/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM ratings WHERE ratings.bookid = $1;", [req.params.id]);
        await db.query("DELETE FROM books WHERE books.id = $1;", [req.params.id]);
        res.status(200).json("Book deleted successfully");
    } catch (error) {
        console.log("Error deleting book: ", error);
    }
});

app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`)
});