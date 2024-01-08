const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const csv = require('fast-csv');
const fs = require('fs');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const { connect } = require('http2');

const app = express();
app.use(bodyParser.json())
app.use(cors());

const pool = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'Timmoh_77',
    database: 'csvfetcher'
})

let storage = multer.diskStorage({
    destination:(req,file,callback) => {
        callback(null, "./uploads/")
    },
    filename:(req,file,callback) => {
        callback(null,file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})

let upload = multer({storage:storage})

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

app.post('/import-csv', upload.single('csv'),(req, res) => {
    uploadCsv(__dirname + "/uploads/" + req.file.filename);
})

function uploadCsv(path) {
    let stream = fs.createReadStream(path);
    let csvDataCol = [];
    let fileStream = csv
    .parse()
    .on('data', function(data){
        csvDataCol.push(data)
    })
    .on('end', function() {
        csvDataCol.shift()
        pool.connect((error, connection) => {
            if (error) {
                console.log(error);
            } else {
                let query = "INSERT INTO users (firstname,lastname,age,country) VALUES ?"
                connection.query(query, [csvDataCol], (error))
            }
        })
    })
    stream.pipe(fileStream)
}

app.get('/users', (req, res) => {
    pool.connect((error, connection) => {
        if (error) {
            console.log(error);
        } else {
            let query = "SELECT * FROM users;"
            connection.query(query);
        }
    })
})

const PORT = 3005;

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
})
