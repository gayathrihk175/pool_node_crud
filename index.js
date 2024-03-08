const express = require("express");
const app = express();
const Pool = require("pg").Pool;
// Pool is a key component class of pg library.
//pg is used for interaction between node and postgresql
const path = require("path");
const ejs = require("ejs");
const PORT = 8000;
require("dotenv").config(); //for importing env variables

const pool = new Pool({
  user: process.env.USER_NAME,
  host: process.env.HOST_NAME,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  dialect: process.env.DB_DIALECT,
  port: process.env.PORT_NUMBER,
});
// create a new instance of connection pool for postgresql

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error in connection");
  }
  client.query("SELECT NOW()", (err, result) => {
    release();
    if (err) {
      return console.error("Error executing query");
    }
    console.log("Connected to database");
  });
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use("/static", express.static("static"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", async (req, res) => {
    const data = await pool.query(`SELECT * FROM todo ORDER BY date`)
  res.render("index",{data:data.rows});
}); 

app.post("/filter", async (req, res) => {
  const searchDate = req.body.date;
  const data = await pool.query(`SELECT * FROM todo WHERE date =${searchDate}`)
  res.render("filter",{data:data.rows});
});

//Add ToDo endpoint
app.post("/addTodo", async (req, res) => {
  const { todo, date } = req.body;
  try {
    const result = await pool.query(
      `insert into todo (todo,date) values ($1,$2) returning *`,
      [todo, date]
    );
    console.log(result);
    res.redirect("/");
  } catch (error) {
    console.log("Error in adding todo");
    res.status(500).json({error:"Internal Server Error"})
  }
});

// UPDATE
app.get('/edit/:id', async (req, res)=>{
    const id = req.params.id;
    const data = await pool.query('SELECT * FROM todo WHERE id = $1', [id])
    res.render('edit', {data: data.rows})
})

app.post('/update/:id', async (req, res)=>{
    const id = req.params.id;
    const { todo,date } = req.body;

    try{
        await pool.query(`UPDATE todo SET todo = $1, date=$2 WHERE id=$3`, [todo,date, id])
        res.redirect('/')
    }
    catch(error){
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// DELETE
app.get('/delete/:id', async (req, res)=>{
    const id = req.params.id
    await pool.query('DELETE FROM todo WHERE id = $1', [id])
    res.redirect('/')
}) 

app.listen(PORT, () => {
  console.log(`PORT started running at port ${PORT}`);
});
