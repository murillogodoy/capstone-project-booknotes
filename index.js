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
    // Receber valor do front identificando a ordem de filtragem escolhida e utilizar ifs para cada order by 
    try {
        const result = await db.query("SELECT books.id, bname, author, isbn, rdate, rating, rtext FROM books JOIN ratings ON books.id = ratings.bookid;");
    
        const booksWithCovers = result.rows.map((book) => {
            let rdate = book.rdate;
            if (rdate instanceof Date) {
                rdate = rdate.toISOString().slice(0, 10);
            }
            return {...book, rdate, coverUrl: `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`};
    });
    return booksWithCovers;
    } catch (error) {
        console.log(error);
    }
};

/* Where book info is shown */
app.get("/", async (req, res) => {
    try {
        const result = await getBooks();
        console.log(result);
        res.render("index.ejs", {
            books: result,
    });
    } catch (error) {
        console.log(error);
    }
});

/* Where user adds/edits books */
app.get("/bookform", async (req, res) => {
    try {
        const bookId = req.query.id;
        const books = await getBooks();
        const bookToEdit = books.find((book) => bookId == book.id);
        res.render("form.ejs", {
            title: bookId ? "Change book details" : "What book to add?",
            book: bookToEdit,
    });
    } catch (error) {
        console.log(error);
    }
});

app.get("/editbook", (req, res) => {
    res.redirect("/");
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

app.patch("/editbook", async (req, res) => {
    try {
        const {bookname, bookauthor, bookdate, bookrating, ratingtxt, bookId} = req.body;
        await db.query("UPDATE books SET bname = $1, author = $2, rdate = $3 WHERE books.id = $4;", [bookname, bookauthor, bookdate, bookId]);
        await db.query("UPDATE ratings SET rating = $1, rtext = $2 WHERE ratings.bookid = $3;", [bookrating, ratingtxt, bookId]);
        console.log("Dados atualizados com sucesso");
    } catch (error) {
        console.log("Erro ao editar livro: ", error);
    }
        
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});