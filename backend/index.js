import axios from "axios";
import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";

app.use(express.static("./public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Where book info is shown 
app.get("/", async (req, res) => {
    try {
        const result = await axios.get(`${API_URL}/api/getbooks`);
        console.log(result.data);
        res.render("index.ejs", {
            books: result.data,
    });
    } catch (error) {
        console.log("Error communicating with API", error);    
        res.render("index.ejs", { books: [] });
    }
});

app.get("/filter", async (req, res) => {
    const sort = req.query.sort;
    let apiUrl = `${API_URL}/api/getbooks`;
    if (sort) {
        apiUrl += `?sort=${sort}`;
    }
    try {
        const result = await axios.get(apiUrl);
        res.render("index.ejs", {
            books: result.data,
        });
    } catch (error) {
        console.log("Error communicating with API (filter)", error);
        res.render("index.ejs", { books: [] });
    }
});

// form to add books
app.get("/addform", async (req, res) => {
        res.render("form.ejs", {
            title: "Add Book",
            heading: "What book to add?"
    });
});

// fetch book info from api and render on form.ejs to edit
app.get("/editform/:id", async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}/api/getbooks/${req.params.id}`);
        if (!response.data || response.data.error) {
            console.log("Book not found. Redirecting...");
            return res.redirect("/");
        }
        console.log(response.data);
        res.render("form.ejs", {
            title: "Edit Book",
            heading: "Change book details",
            book: response.data
        });
    } catch (error) {
        console.log("Error fetching book details for edit", error.response.data);
    }
});

// Book ID is sent to be DELETED
app.get("/deletebook/:id", async (req, res) => {
    try {
        const response = await axios.delete(`${API_URL}/api/delete/${req.params.id}`);
        console.log(response.data);
        res.redirect("/");
    } catch (error) {
        console.log("Error sending needed info to delete book: ", error);
    }
});

// Book info is sent to be CREATED
app.post("/addbook", async (req, res) => {
    try {
        const response = await axios.post(`${API_URL}/api/add`, req.body);
        console.log(response.data);
        res.redirect("/");
    } catch (error) {
        console.log("Error sending needed info to add book");
    }
});

// Changed book info is sent to be UPDATED
app.post("/editbook/:id", async (req, res) => {
    try {
        const result = await axios.put(`${API_URL}/api/edit/${req.params.id}`, req.body);
        console.log(result.data);
        res.redirect("/");
    } catch (error) {
        console.log("Error sending needed info to edit book details");
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});