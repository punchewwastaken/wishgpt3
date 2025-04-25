// Import modules
const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const multer = require('multer');
const bodyParser = require('body-parser')
const jose = require('jose') //library jose for jwt
const { jwtVerify } = require("jose");
const hash = require('js-sha256');//lib for hash
const { verify } = require('crypto');
const app = express()
//configuration
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(express.static('public'))
// Configure storage
const storage = multer.diskStorage({
    destination: path.join(__dirname, './files/'), // Save files in the 'files' folder
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Store with original filename
    }
});
const upload = multer({ storage: storage });
//pwhashing
function hashString(salt, input){
    let hashedString = hash.hmac(salt, input)
    return hashedString
  }
//secret
let secret_word = "aborre"
//jwt buffer
const secret = Buffer.from(secret_word)
// Create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'wishgpt',
  });
//create jwt
async function createToken(payload) {
    return await new jose.SignJWT({user: payload})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);
}

//function to verify jwt
async function verifyToken(req, res, next) {
    try {
        let authHeader = req.headers["authorization"]
        if (!authHeader) return res.status(401).json({ error: "No token provided" })
        let token = authHeader.split(" ")[1]; // Extract JWT from "Bearer <token>"
        let { payload } = await jwtVerify(token, secret);
        req.user = payload.user; // Attach decoded user data to request
        let username = req.user
        console.log("JWT username: "+req.user)
        let sql = `SELECT user_id FROM user WHERE user_id =?`
        connection.execute(sql,[username],(err,results)=>{
            if(err){
                console.error("Database error:", err)
            }
            if (!results || results.length === 0) {
                console.log("user not found")
                return res.status(404).json({ error: "User not found" });
            }
            req.user = results[0].user; // Attach user data to request
            next(); // Proceed to next middleware or route
        })
    } catch (error) {
        console.log(error)
        res.status(403).json({ error: "Invalid token" })
    }
}

//routes

app.get('/',(req,res)=>{
    res.status(200).sendFile(path.join(__dirname+"/public/index.html"))
})

app.get('/login',(req,res)=>{
    res.status(200).sendFile(path.join(__dirname+"/public/login.html"))
})

app.post('/login/login',(req,res)=>{
    let username = req.body.username
    let password = req.body.password
    hashpwd = hashString(username, password)
    let sql = `SELECT user FROM user WHERE user = ? AND password = ?`
    connection.execute(sql, [username, hashpwd], (err, results, fields) => {
      if (err) {
          console.log(err)
          return res.status(500).send('Error occurred')
      }
      if (results.length > 0) {
        console.log(results);
        createToken(results[0].user_id).then(jwt => {
            console.log(jwt); 
            res.status(200).json({ jwt: jwt, message: 'Login successful'})
        });
      } else {
          res.status(401).send('Invalid credentials')
      }
    })
})

app.post('/login/signup',(req, res)=>{
    let username = req.body.username
    let password = req.body.password
    let hashpw = hashString(username, password)
    let sql = `INSERT INTO user (user, password) VALUES (?,?)`
    connection.execute(sql, [username, hashpw],(err, results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Unable to create account!")
        }else{
            console.log("account created "+ username +" " + password)
            res.status(200)
        }
    })
})

app.get('/chat',(req,res)=>{
    res.status(200).sendFile(path.join(__dirname+"/public/chat.html"))
})

app.get('/chat/retrieve',verifyToken,(req,res)=>{
    let user_id = req.user
    let sql=`SELECT * FROM messages WHERE user_id=? ORDER BY timestamp ASC`
    connection.execute(sql,[user_id],(err, results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Internal server error: "+ err)
        }
        res.status(200).send(results)
    })
})

app.post('/chat/message',verifyToken,(req,res)=>{
    let URL = "http://localhost:11434/v1/chat/completions"
    try{
        let response = await fetch(URL,{
            method:'POST',
            headers:{
                'Content-type':'application/json'
            },
            body:JSON.stringify(req.body)
        })
    }
})

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});