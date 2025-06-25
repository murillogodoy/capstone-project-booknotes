import axios from "axios";
import pg from "pg";
import e from "express";
import bodyParser from "body-parser";

const app = e();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "booknotes",
    password: "2735819",
    port: 5432,
});

app.use(e.static("public"));
bodyParser.urlencoded({extended: true});

db.connect();

async function getBooks() {
    /* Receber valor do front identificando a ordem de filtragem escolhida e utilizar ifs para cada order by */
    const result = await db.query("SELECT (bname, author, isbn, rdate, rating, rtext) FROM books JOIN ratings ON books.id = ratings.bookid;");
    return result.rows;
};

let arrayBooks = [
    {id: 1, bname: "Metamorphosis", author: "Franz Kafka", isbn: "9786580210008", rdate: "2023-06-15"},
]

let arrayRatings = [
    {id: 1, bookid: 1, rating: 10, rtext: "A book about a man who turns into a insect. His family starts to fear and hate him little by little until he finally dies. They feel relieved. "}
]

/* Where book info is shown */
app.get("/", async (req, res) => {
    try {
        res.render("index.ejs", {
            bookDetails: arrayBooks,
            ratings: arrayRatings,
    });
    } catch (error) {
        console.log(error);
    }
});

/* Where user adds books */
app.get("/bookform", (req, res) => {
    res.render("form.ejs");
});

/* Where info user sent is added to tables */
app.post("/addbook", async (req, res) => {
    const bname = req.body.bookname;
    const author = req.body.bookauthor;
    const isbn = req.body.isbn;
    const rdate = req.body.bookdate;
    const rating = req.body.bookrating;
    const rtxt = req.body.ratingtxt;

    try {
        await db.query("INSERT INTO books VALUES ($1, $2, $3, $4);", [bname, author, isbn, rdate]);
        await db.query("INSERT INTO ratings VALUES ($1, $2);", [rating, rtxt]);
        res.redirect("/");
    } catch (error) {
        console.log(error);
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});