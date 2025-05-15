//testing file for jwt and chat input

let jwt
async function login(){
    let username = "admin"
    let password = "1111"
    if(!username||!password){
        alert("Empty fields!")
    } else{
        let data = {
            username:username,
            password:password
        }
        let response = await fetch("http://localhost:3000/login/login",{
            method:'POST',
            headers:{
                'Content-type':'application/JSON'
            },
            body:JSON.stringify(data)
        })
        let token = await response.json()
        jwt = String(token.jwt)
        console.log("received token : " +jwt)
    }
}
async function test(input){
    console.log("chat token : "+jwt)
    let data =[
        {"role":"system","content": "You are a helpful chatbot."},
        {"role":"user","content":`${input}`}
    ]
    let request={
        messages:data,
        model:"llama3.2"
    }
    let response = await fetch('http://localhost:3000/chat/message',{
        method:'POST',
        headers:{
            'Content-type':'application/json',
            'Authorization':`Bearer ${jwt}`,
        },
        body:JSON.stringify(request)
    })
    if(response.ok){
        let message = await response.json()
        console.log(message.choices[0].message.content)
        
    }else{
        console.log(response.status)
    }
}
async function run(){
    await login()
    await test("what's 9+10?")
}

run()