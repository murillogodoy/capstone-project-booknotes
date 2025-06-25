import axios from "axios";
import pg from "pg";
import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "booknotes",
    password: "2735819",
    port: 5432,
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

db.connect();

async function getBooks() {
    /* Receber valor do front identificando a ordem de filtragem escolhida e utilizar ifs para cada order by */
    const result = await db.query("SELECT bname, author, isbn, rdate, rating, rtext FROM books JOIN ratings ON books.id = ratings.bookid;");
    console.log(result.rows);
    return result.rows; 
};

/* Where book info is shown */
app.get("/", async (req, res) => {
    try {
        const result = await getBooks();
        res.render("index.ejs", {
            books: result,
    });
    } catch (error) {
        console.log(error);
    }
});

/* Where user adds/edits books */
app.get("/bookform", (req, res) => {
    res.render("form.ejs", {
        title: "What book to add?",
    });
});

/* info user sent is added to tables */
app.post("/addbook", async (req, res) => {
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
        res.redirect("/");
    } catch (error) {
        console.log(error);
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});