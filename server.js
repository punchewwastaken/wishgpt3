// Import modules
const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const multer = require('multer');
const jose = require('jose') //library jose for jwt
const { jwtVerify } = require("jose");
const hash = require('js-sha256');//lib for hash
const app = express()
//configuration
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static('public'))
app.use(express.static("files"))
//URL endpoint for chatgpt clone
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
//buffer secret
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
        .setExpirationTime('8h')
        .sign(secret);
}

//function to verify jwt
async function verifyToken(req, res, next) {
    try {
        let authHeader = req.headers["authorization"]
        if (!authHeader){console.log("no token");console.log(authHeader); return res.status(401).redirect("http://localhost:3000/403.html")}
        let token = authHeader.split(" ")[1]; // Extract JWT from "Bearer <token>"
        let { payload } = await jwtVerify(token, secret);
        req.user_id = payload.user; // Attach decoded user data to request
        let user_id = req.user_id
        console.log(req.user_id)
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
        res.status(403).json({ error: "Invalid token" }).redirect(path.join(__dirname+'/public/403.html'))
    }
}

//check if is hash-like string for conversation_id verification
function isSHA256Hash(str) {
    return /^[a-f0-9]{64}$/i.test(str);
}

//routes

//sends index.html
app.get('/',(req,res)=>{
    res.status(200).sendFile(path.join(__dirname+"/public/index.html"))
})

//sends you to login.html, although not used since client does not support express.js redirect
app.get('/login',(req,res)=>{
    res.status(200).redirect("http://localhost:3000/login.html")
})

//login route, pretty self explanatory
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

//signup route, also very explanatory
app.post('/login/signup', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let hashpw = hashString(username, password);

    // First, check if the user already exists
    let checkSql = `SELECT * FROM user WHERE user = ?`;
    connection.execute(checkSql, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error checking existing users.");
        }
        if (results.length > 0) {
            // User already exists, return appropriate status
            return res.status(409).send("User already exists!"); // 409 Conflict
        }
        // If user doesn't exist, proceed with insertion
        let insertSql = `INSERT INTO user (user, password) VALUES (?, ?)`;
        connection.execute(insertSql, [username, hashpw], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Unable to create account!");
            }
            console.log(`Account created for ${username}`);
            res.status(201).send("Account successfully created!"); // 201 Created
        });
    });
});

//unused route since its client redirect, but good to have in casae someone goes directly to chat.html
app.get('/chat',(req,res)=>{
    res.status(200).sendFile(path.join(__dirname+"/public/chat.html"))
})

//retrieve and send all chats belonging to user or to admin account
app.get('/chat/retrieve',verifyToken,(req,res)=>{
    let user_id = req.user_id
    console.log("Retrieving chats from: "+req.user)
    // Validate user_id, check if user is admin or not
    if(user_id=="0"){ //if user is admin send all chats
        let sql=`SELECT * FROM messages ORDER BY timestamp ASC`
        connection.execute(sql,(err, results)=>{
            if(err){
                console.log(err)
                res.status(500).send("Internal server error: "+ err)
            }
            console.log(results)
            res.status(200).send(results)
        })
    }else{//normal user, send only chats that belong to user
        let sql=`SELECT * FROM messages WHERE user_id='?' ORDER BY timestamp ASC`
        connection.execute(sql,[user_id],(err, results)=>{
            if(err){
                console.log(err)
                res.status(500).send("Internal server error: "+ err)
            }
            res.status(200).send(results)
            
        })
    }
})

//big function to handle mesaging, chat storage and topic marker generation
app.post('/chat/message',verifyToken,async (req,res)=>{
    let character_name
    let conversation_id = req.headers["conversation-id"]
    let character_id = req.headers["character-id"]
    if(!conversation_id){
        let now = new Date()
        conversation_id = `${now}`
        console.log(conversation_id)
    }
    if(!isSHA256Hash(conversation_id)){
        console.log("isnothashed")
            conversation_id = hash.sha256(conversation_id)
    }else{
        conversation_id = conversation_id
    }
    let user_id = req.user_id
    let user = req.user
    let roleplay_name = req.headers["roleplay-name"]
    if(!roleplay_name){
        roleplay_name=req.user
    }
    try {
        const response = await fetch(URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body)
      });
      const data = await response.json()
      let processedReq = req
      let userMessage = processedReq.body.messages[processedReq.body.messages.length-1].content
      let debug ={
        conversation_id,
        user_id,
        roleplay_name,
        userMessage,
        character_id
      }
      console.log(debug)
      let sql=`INSERT INTO messages (timestamp,conversation_id,user_id,character_id,roleplay_name,sender_type,message) VALUE (?,?,?,?,?,?,?)`
      connection.execute(sql,[new Date(),conversation_id,user_id,character_id,roleplay_name,"user",userMessage],(err,results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Database error")
        }
      })
      setTimeout(function(){}, 1000)
      let botMessage = data.choices[0].message.content
      let sql2=`INSERT INTO messages (timestamp,conversation_id,user_id,character_id,roleplay_name,sender_type,message) VALUE (?,?,?,?,?,?,?)`
      connection.execute(sql2,[new Date(),conversation_id,user_id,character_id,roleplay_name,"assistant",botMessage],(err,results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Database error")
        }
      })
      let sqlchara=`SELECT character_name FROM characters WHERE character_id=?`
      connection.execute(sqlchara, [character_id],(err, results)=>{
        if(err){
            console.log(err)
        }
        console.log(results)
        if(results.length==0){
            character_name="Mabel"
        }else{
            character_name = results.character_name
        }
      })
      //check newest messages
      let sql3=`SELECT * FROM messages WHERE conversation_id=? ORDER BY timestamp ASC`
      connection.execute(sql3, [conversation_id],async (err, results)=>{
        if(err){
            console.log(err)
        }
        //check if topic marker is empty or if newest message is less or equal to 2, if so then create a topic marker
        if(results.length<=2){
            if(!results.topic){
                let content = new Array()
                    let object ={
                        message1: `${user}, "message": ${userMessage}`,
                        message2: `${character_name}, "message": ${botMessage}`
                    }
                    content.push(JSON.stringify(object))
                
                console.log("array: "+content)
                let data2 =[
                    {"role":"system","content":"Summarize the content of the chat below into a sentence that marks the topic, as well as between who the conversation is about"},
                    {"role":"user", "content":`${content}`}
                ]
                let request={
                        messages:data2,
                        model:"llama3.2"
                    }
                let response = await fetch(URL,{
                    method:'POST',
                    headers:{
                        'Content-type':'application/json'
                        },
                    body:JSON.stringify(request)
                    })
                let summaryresponse = await response.json()
                let summary = summaryresponse.choices[0].message.content
                console.log(summary)
                //update topic to be summary
                let sql=`UPDATE messages SET topic=? WHERE user_id=? AND conversation_id=?`
                connection.execute(sql,[summary,user_id,conversation_id],(err,results)=>{
                    if(err){
                        console.log(err)
                    }
                })
            }
        }
      })
      res.status(200).send(data)
  } catch (error) {
      console.error('Error routing request to provider:', error);
      res.status(500).send({ error: 'Failed to fetch response from provider' });
  }
})

//route to delete messages, pretty simple it just sends deletion with conversation_id
app.post('/chat/delete',verifyToken,(req,res)=>{
    let user_id = req.user_id
    let conversation_id = req.headers["conversation-id"]
    if(user_id=="0"){//checks if is admin
        let sql=`DELETE FROM messages WHERE conversation_id=?`
        connection.execute(sql, [conversation_id], (err,results)=>{
            if(err){
                console.log(err)
                res.status(500).send("Internal database error")
            }
            res.status(200).send("Chat deleted succesfully")
        })
    }else{//additional safety by checking if it is the correct user deleting the chat
        let sql=`DELETE FROM messages WHERE conversation_id=? AND user_id=?`
        connection.execute(sql, [conversation_id,user_id], (err,results)=>{
            if(err){
                console.log(err)
                res.status(500).send("Internal database error")
            }
            res.status(200).send("Chat deleted succesfully")
        })
    }
})

//route to load characters
app.get('/characters',verifyToken,(req,res)=>{
    console.log("getting characters")
    let user_id = req.user_id
    console.log(req.user_id)
    if (user_id=="0"){//load all if admin
        let sql=`SELECT * FROM characters`
        connection.execute(sql,[user_id],(err,results)=>{
            if(err){
                console.log(err)
                res.status(500).send("Unable to retrieve characters")
            }
            res.status(200).send(JSON.stringify(results))
        })
    }else{//load only belinging to user
        let sql=`SELECT * FROM characters WHERE user_id=?`
        connection.execute(sql,[user_id],(err,results)=>{
            if(err){
                console.log(err)
                res.status(500).send("Unable to retrieve characters")
            }
            res.status(200).send(JSON.stringify(results))
        })
    }
})

//create character route
app.post('/characters/create',verifyToken,upload.single("file"),(req,res)=>{
    console.log("Image has been received")
    let filename = req.file.originalname
    let parsedData = JSON.parse(req.body.data)
    let character_name = parsedData.character_name
    let description = parsedData.description
    let user_id = req.user_id
    let sql =`INSERT INTO characters (user_id, character_name, description, imagepath) values (?,?,?,?)`
    connection.execute(sql, [user_id, character_name, description, filename],(err, results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Unable to upload characters")
        }
        console.log("image succesfully uploaded")
    })
    let sql2=`SELECT character_id FROM characters WHERE user_id=? AND character_name=? AND description=?`
    connection.execute(sql2, [user_id, character_name, description], (err, results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Unable to retrieve character id string")
        }
        console.log(results)
        res.status(200).send(results)
    })
})

//delete character, forgot to add admin check but since the character loading code only sends characters beloning to user it shouldn't be needed anyway
app.post('/characters/delete',verifyToken,(req,res)=>{
    let user_id=req.user_id
    let character_id=req.headers['character_id']
    let sql = `DELETE FROM characters WHERE character_id=?`
    connection.execute(sql,[character_id],(err, results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Unable to delete character")
        }else{
        res.status(200).send("yep its deleted")
        }
    })
})

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});