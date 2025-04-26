let jwt = document.cookie.split("; ").find((row) => row.startsWith("jwt="))?.split("=")[1];
let responseContainer = document.getElementById("response-container")
let chatHistoryContainer = document.getElementById("chat-history-container")
let characterMenu = document.getElementById("character-container")
let inputMessage = document.getElementById("chat-input")
let CCmenu = document.getElementById("character-creation-menu")
let CCmenycontainer = document.getElementById("character-creation-container")
let emailInput = document.getElementById("input-mail")
let temporaryChatHistory = []
let chatHistoryList = []
let mobileCharMenu = false
let mobileHistMenu = false
let mobileNavMenu = false
let mobileBurgerMenu = document.getElementById("index-hamburger-menu")
let charMenu = document.querySelector(".grid-chara")
let historyMenu = document.querySelector(".grid-chat-hist")
let characterList = [
    {
        name:'Mabel',
        description:"Mabel is a fellow classmate at school, she gets confused easily and often. But that only adds to her charm. She loves games and playing games in general, which is the reason for her crippling school grades. She's also reserved and quiet around people she doesn't know, but really open with her friends.",
        image:'public/images/example.PNG'
    },
]
let characterPrompt
let currentCharacterName
let currentcharacter = []
let currentTimestamp
let conversation_id

//listening for Enter key
document.addEventListener('keydown', function(e){
    if (e.key == 'Enter'){
        goChat()
    }
})

//listens for resize back to desktop size
window.addEventListener('resize', () => {
    if (window.innerWidth<=800){
        charMenu.style.display="none"
        charMenu.style.zIndex=-1
        historyMenu.style.display="none"
        historyMenu.style.zIndex=-1
        mobileCharMenu=false
        mobileHistMenu=false
    } else if (window.innerWidth>800){
        charMenu.style.display="block"
        charMenu.style.zIndex=0
        historyMenu.style.display="block"
        historyMenu.style.zIndex=0
        mobileNavMenu = false
        mobileBurgerMenu.style.display="none"
    }
})

//self explaining

function logout(){
    document.cookie = "jwt=; max-age=0; path=/"
    window.location.replace("index.html")
}

//get messages from DB

async function getMessagesFromDB(){
    let response = await fetch('/chat/retrieve',{
        method: 'GET',
        headers: {
            'Authorization':`Bearer ${jwt}`,
        },
    })
    let chats = response.json()
    if(chats){
        chats.forEach(element=>{
            let conversation_id = element.conversation_id
            let chatName = element.topic||""
        })
        object.innerHTML=`<i onclick="" class="fa-solid fa-cloud-arrow-down"></i><i onclick="deleteChat('${date}')" class="fa-solid fa-trash"></i>`
        p.innerHTML=`${chtNa}`
        object.appendChild(p)
        object.setAttribute("onclick", `loadChat('${date}')`)
        chatHistoryContainer.appendChild(object)
        chat.date = date
        chat.content = chatObject
        chatHistoryList.push(chat)
    }
    
}

//get characters for this user
async function getCharactersFromDB(){
    let response = await fetch('/character',{
        method:'GET',
        headers:{
            'Authorization':`Bearer ${jwt}`
        }
    })
    let characterlist = response.json()
    characterlist.forEach(element=>{

    })
}
//shorthand function for console.log
function print(input){
    console.log(input)
}
//load image preview in character creation menu
function loadImage(input){
    let imageDisplay = document.getElementById("cc-upload-preview")
    if (input.files && input.files[0]){
        let reader = new FileReader()
        reader.onload = function(e){
            imageDisplay.src = e.target.result
            imageDisplay.style.alt="Uploaded Image"
        }
        reader.readAsDataURL(input.files[0])
    }
}
//open character creation menu
function openCCMenu(){
    CCmenu.style.display = "block"
    CCmenycontainer.style.zIndex = "1"
} 
//close character creation menu
function closeCCMenu(){
    CCmenu.style.display = "none"
    CCmenycontainer.style.zIndex = "-1"
}
//Add a new character
async function createCharacter(){
    let charaDesc = document.getElementById("character-description").value
    let charaName = document.getElementById("character-name").value
    let charaImg = document.getElementById("cc-upload-preview").src
    let form = new FormData()
    form.append("file", charaImg)
    let character = {
        user_id:jwt,
        character_name : charaName,
        description : charaDesc,
    }
    try{
        await fetch("/character/create", {
            method: "POST",
            headers:{
                "Content-type":"Application/JSON"
            },
            body: JSON.stringify(character)
        })
    } catch(err){
        console.log(err)
    }

    for (let item of characterList){ //if character already exists, return null
        if (item.name == charaName){
            alert("The character already exists!")
            return
        }
    }
    let p = document.createElement("p")
    p.innerHTML = charaName
    let charaObj = document.createElement("div")
    charaObj.className = "character-object"
    charaObj.id = charaName
    charaObj.setAttribute("onclick", `loadCharacter("${charaName}")`)
    let img = new Image()
    img.src = charaImg
    img.className = "character-obj-img"
    charaObj.appendChild(p)
    charaObj.appendChild(img)
    characterMenu.appendChild(charaObj)
    characterList.push(character)
    let imageDisplay = document.getElementById("cc-upload-preview")
    imageDisplay.src="/public/images/placeholder.jpg"
    imageDisplay.alt="Placeholder Image"
    charaDesc.value=""
    charaName.value=""
}   
//Load character
async function loadCharacter(input){
    try{
        let data ={
            username : user
        }
        let response = await fetch('/characters',{
            method:'POST',
            header:{
                'Content-type':'Application/json'
            },
            body: JSON.stringify(data)
        })
    }catch(err){

    }
    for (let item of characterList){
        if (item.name == input){
            let charaObj = document.getElementById(item.name)
            charaObj.style.backgroundColor="#3b8a99"
            currentcharacter.push(item)
            characterPrompt = item.description
            currentCharacterName = item.name
        }
        if(currentcharacter.length>=2){
            let char = document.getElementById(`${currentcharacter[0].name}`)
            char.style.backgroundColor = "rgb(108, 213, 216)"
            currentcharacter.shift()
        }
    }
}
//Load chat history
function loadChat(inputValue){
    responseContainer.replaceChildren()
    for (let item of chatHistoryList){
        let user
        let bot
        if (item.date == inputValue){
            item.content.forEach(item => {
                temporaryChatHistory.push(item)
                if (item.role === "user") {
                    user = item.content;
                } else if (item.role === "assistant") {
                    bot = item.content;
                }
                makeChatObjects(user, bot)
            });
        } 
        try{
            responseContainer.removeChild(responseContainer.firstElementChild)
        } catch (error){
            console.log("no first child found.")
        }
        
    }
}
//delete saved chat history
function deleteChat(inputValue){
    for (const [index, item] of chatHistoryList.entries()){
        if (item.date == inputValue){
            let chatObject = document.getElementById(`${item.date}`)
            chatHistoryList.splice(index, 1)
            chatObject.remove()
        }
    }
}
//save current chat history to new object
async function saveChatHistory(){
    let icon = document.getElementById("save-loading-icon")
    icon.style.display="block"
    let chatObject = Array.from(temporaryChatHistory)
    let arr = []
    //format conversation for AI to conclude
    chatObject.forEach(item =>{ 
        let val = `Role: ${item.role}, Message: ${item.content}`
        arr.push(val)
    })
    let chatName = await generateText(JSON.stringify(arr), true) //create chat history name based on topic/content
    let chat = {
        date : null,
        content : null,
    }
    let date = new Date().toISOString()
    let object = document.createElement("div")
    let p = document.createElement("p")
    object.id=`${date}`
    object.className="chat-history-object"
    object.innerHTML=`<i onclick="" class="fa-solid fa-cloud-arrow-down"></i><i onclick="deleteChat('${date}')" class="fa-solid fa-trash"></i>`
    if (chatObject == undefined){
        p.innerHTML=`${date}`
    } else {
        p.innerHTML=`${chatName}`
    }
    object.appendChild(p)
    object.setAttribute("onclick", `loadChat('${date}')`)
    chatHistoryContainer.appendChild(object)
    chat.date = date
    chat.content = chatObject
    chatHistoryList.push(chat)
    try{
        let stats = await fetch('/savemessage')
    } catch {

    }
    clearChatHistory()
    responseContainer.replaceChildren()
    icon.style.display="none"
}
//write to current chat history
function writeToChatHistory(user, model){
    let userChat = {"role": "user", "content":`${user}`}
    let modelChat = {"role": "assistant", "content":`${model}`}
    temporaryChatHistory.push(userChat)
    temporaryChatHistory.push(modelChat)
}
//clear the current chat history
function clearChatHistory(){
    temporaryChatHistory.length = 0
}
//Generate response
async function generateText(input, summarize){
    let msg
    if(!summarize){
    let history = temporaryChatHistory
    let botPrompt = {"role": "system", "content":`${characterPrompt}.\nThis is a roleplay between User and ${currentCharacterName}, continue the conversation, write a single short reply as ${currentCharacterName}\n`}
    let userPrompt = {"role": "user", "content": `${input}`}
    let arr = [botPrompt, userPrompt]
    msg = history.concat(arr)
    } else if (summarize){
        let prompt = [{'role': 'system', 'content':`Summarize the following conversation between user and ${currentCharacterName}(also known as bot) into a topic header:`},
            {'role': 'user', 'content': `${input}`}
        ]
        msg=prompt

    }
    const URL = "/chat/message"
    request = {
        messages : msg,
        temperature:0.7,
        mode:"instruct",
        model:"llama3.2",
    }
    try {
        
        let user = document.getElementById("user-name").value||""
        let response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-type": "application/json",
                "user-name": `${user}`,
                "Authorization":`${jwt}`,
                "coversation-id":"1"
            },
            body: JSON.stringify(request)
        })
        if (!response.ok){
            throw new Error("Something went wrong!" + response.status)
        }
        let data = await response.json()
        let output = data.choices[0].message.content
        writeToChatHistory(input, output)
        try{
            let data = {
                user: input,
                bot: output
            }
            await fetch('/savemessages', {
                method: "POST",
                headers:{
                    "Content-type":"application/json"
                },
                body: JSON.stringify(data)
            })
        } catch (error){
            console.log("JSON no sendy worky :(")
        }
        inputMessage.innerHTML = ""
        output = marked.parse(output)
        return output
    } catch (error){
        console.error("Error:", error)
        let errorMessage = "An error was encountered. Please check your internet connection."
        return errorMessage
    } 
}
function makeChatObjects(user, bot){
    if (user&&!bot){
        let question = document.createElement("p")
        question.className = "message question"
        question.innerHTML = user
        responseContainer.appendChild(question)
    } else if (bot&&!user){
        let response = document.createElement("p")
        response.className = "message response"
        response.innerHTML = bot
        responseContainer.appendChild(response)
    } else {
        let question = document.createElement("p")
        question.className = "message question"
        question.innerHTML = user
        responseContainer.appendChild(question)
        let response = document.createElement("p")
        response.className = "message response"
        response.innerHTML = bot
        responseContainer.appendChild(response)
    }
}
//function to invoke chat generation response and create response elements
let goChat = async function() {
    if (!characterPrompt){
        alert("No character card loaded!")
        return
    } else {
    let user = inputMessage.value
    let loadingIcon = document.getElementById("chat-loading-icon")
    loadingIcon.style.display='block'
    let bot = await generateText(inputMessage.value)
    inputMessage.value=''
    makeChatObjects(user, bot)
    loadingIcon.style.display='none'
    }
}
