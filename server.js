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
const { connect } = require('http2');
const app = express()
//configuration
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(express.static('public'))
//URL endpoint
let URL = "http://localhost:11434/v1/chat/completions"
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
        console.log(payload)
        req.user_id = payload.user; // Attach decoded user data to request
        let user_id = req.user_id
        let sql = `SELECT user_id,user FROM user WHERE user_id =?`
        connection.execute(sql,[user_id,],(err,results)=>{
            if(err){
                console.error("Database error:", err)
            }
            if (!results || results.length === 0) {
                console.log("user not found")
                return res.status(404).json({ error: "User not found" });
            }
            req.user = results[0].user
            console.log(`user: ${req.user} id: ${req.user_id}`)
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
    let sql = `SELECT user_id FROM user WHERE user = ? AND password = ?`
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
    let user_id = req.user_id
    console.log("Retrieving chats from: "+user_id+" : "+req.user)
    // Validate user_id
    if (!user_id) {
        return res.status(400).send("Invalid or missing user ID");
    }
    let sql=`SELECT * FROM messages WHERE user_id=? 
    ORDER BY timestamp ASC`
    connection.execute(sql,[user_id],(err, results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Internal server error: "+ err)
        }
        console.log(results)
        res.status(200).send(results)
    })
})

app.post('/chat/message',verifyToken,async (req,res)=>{
    let conversation_id = req.headers["conversation-id"]
    console.log(conversation_id)
    if(!conversation_id){
        let now = new Date()
        conversation_id = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        console.log(conversation_id)
    }
    let user_id = req.user
    let roleplay_name = req.headers["roleplay-name"]
    if(!roleplay_name){
        roleplay_name=req.user
    }
    try {
        console.log(req.body)
      const response = await fetch(URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body)
      });
      const data = await response.json()
      let processedReq = req
      //console.log("request: "+JSON.stringify(req.body.messages[1].content))
      let userMessage = processedReq.body.messages[processedReq.body.messages.length-1].content
      let debug ={
        conversation_id,
        user_id,
        roleplay_name,
        userMessage
      }
      console.log(debug)
      let sql=`INSERT INTO messages (timestamp,conversation_id,user_id,roleplay_name,sender_type,message) VALUE (?,?,?,?,?,?)`
      connection.execute(sql,["NOW()",conversation_id,user_id,roleplay_name,"user",userMessage],(err,results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Database error")
        }
      })
      let botMessage = data.choices[0].message.content
      let sql2=`INSERT INTO messages (timestamp,conversation_id,user_id,roleplay_name,sender_type,message) VALUE (?,?,?,?,?,?)`
      connection.execute(sql2,["NOW()",conversation_id,user_id,roleplay_name,"bot",botMessage],(err,results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Database error")
        }
      })
      res.status(200).send(data)
  } catch (error) {
      console.error('Error routing request to provider:', error);
      res.status(500).send({ error: 'Failed to fetch response from provider' });
  }
})
/*    let now = new Date()
    let conversation_id = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    */

app.post('/chat/message/topic',verifyToken,async(req,res)=>{
    let user_id=req.user_id
    let conversation_id=req.headers["conversation-id"]
    let content =req.body.data
    let data =[
        {"role":"system","content":"Summarize the content of the chat below into a short sentence that marks the topic"},
        {"role":"user", "content":`${CompositionEvent}`}
    ]
    let request={
        messages:data,
        model:"llama3.2"
    }
    let response = await fetch(URL,{
        method:'POST',
        headers:{
            'Content-type':'application/json'
        },
        body:request
    })
    let summaryresponse = response.json()
    let summary = summaryresponse.choices[0].message.content
    let sql=`UPDATE messages SET topic=? WHERE user_id=?,conversation_id=?`
    connection.execute(sql,[summary, user_id,conversation_id],(err,results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Unable to generate topic marker")
        }
        res.status(200)
    })
})

app.post('/chat/delete',verifyToken,(req,res)=>{
    let user_id = req.user
    let conversation_id = req.headers["conversation-id"]
    let sql=`DELETE FROM messages WHERE conversation_id=?, user_id=?`
    connection.execute(sql, [conversation_id,user_id], (err,results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Internal database error")
        }
        res.status(200).send("Chat deleted succesfully")
    })
})

app.get('/characters',verifyToken,(req,res)=>{
    let user_id = req.user
    let sql=`SELECT * FROM characters WHERE user_id=?`
    connection.execute(sql,[user_id],(err,results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Unable to retrieve characters")
        }
        console.log(results)
        res.status(200).send(results)
    })
})

app.post('/character/create',verifyToken,upload.single("file"),(req,res)=>{
    let filename=req.file.originalname
    let user_id = req.user
})

app.post('/character/delete',verifyToken,(req,res)=>{
    let user_id=req.user_id
    let character_id=req.body.character_id
})

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});