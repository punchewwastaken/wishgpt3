let jwt = document.cookie.split("; ").find((row) => row.startsWith("jwt="))?.split("=")[1]
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
//list of characters, "Mabel" is a default character
let characterList = [
    {
        character_name:'Mabel',
        description:"Mabel is a fellow classmate at school, she gets confused easily and often. But that only adds to her charm. She loves games and playing games in general, which is the reason for her crippling school grades. She's also reserved and quiet around people she doesn't know, but really open with her friends.",
        imagepath:'public/images/example.PNG'
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

window.onload=function(){
    console.log(jwt)
}
//self explaining logout function

function logout(){
    document.cookie = "jwt=; max-age=0; path=/"
    window.location.replace("index.html")
}

//get messages from DB

window.onload=async function getMessagesFromDB(){
    let response = await fetch('/chat/retrieve',{
        method: 'GET',
        headers: {
            'Authorization':`Bearer ${jwt}`,
        },
    })
    let chats = response.json()
    chats = JSON.stringify(chats)
    console.log(chats)
    /*if(chats){
        for(let element of chats){
            let chat={
                coonversation_id:null,
                content:null,
            }
            let p = document.createElement("p")
            let conversation_id = element.conversation_id
            let chatName = element.topic||"sample text"
            let object = document.createElement("div")
            object.innerHTML=`<i onclick="" class="fa-solid fa-cloud-arrow-down"></i><i onclick="deleteChat('${conversation_id}')" class="fa-solid fa-trash"></i>`
            p.innerHTML=`${chatName}`
            object.appendChild(p)
            object.setAttribute("onclick", `loadChat('${conversation_id}')`)
            chatHistoryContainer.appendChild(object)
            chat.conversation_id = conversation_id
            chat.content = chatObject
            chatHistoryList.push(chat)
        }
    }  */
}

//get characters for this user
window.onload=async function getCharactersFromDB(){
    let response = await fetch('/characters',{
        method:'GET',
        header:{
            'Content-type':'Application/json',
            'Authorization':`Bearer ${jwt}`
        },
    })
    if(!item){ //check if list is empty
        print("Empty character list")
    }else{
        //add character from db to localstorage
        response = json.stringify(response.json())
        for(let item of response){
            characterList.appent(item)
            //adding character icon to character menu
            let p = document.createElement("p")
            p.innerHTML = item.character_name
            let charaObj = document.createElement("div")
            charaObj.className = "character-object"
            charaObj.id = item.character_name
            charaObj.setAttribute("onclick", `loadCharacter("${charaName}")`)
            let img = new Image()
            img.src = item.imagepath
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
    }

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
    let fileInput = document.getElementById("cc-image");
    let file = fileInput.files[0]; // Get actual file
    let form = new FormData()
    form.append("file", file)
    let character = {
        character_name : charaName,
        description : charaDesc,
        imagepath : charaImg,
    }
    form.append("data", JSON.stringify(character))
    let response = await fetch("/characters/create", {
        method: "POST",
            headers:{
            "Content-type":"Application/JSON",
            "Authorization":`Bearer ${jwt}`,
        },
        body: form
    })
    if(!response.ok){
        alert("Failed to upload")
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
    for (let item of characterList){
        if (item.character_name == input){
            let charaObj = document.getElementById(item.character_name)
            charaObj.style.backgroundColor="#3b8a99"
            currentcharacter.push(item)
            characterPrompt = item.description
            currentCharacterName = item.character_name
            print("Current character is selected" + currentCharacterName)
        }
        if(currentcharacter.length>=2){
            let char = document.getElementById(`${currentcharacter[0].character_name}`)
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
async function generateText(input){
    let msg
    print(conversation_id)
    if(!conversation_id){
        let now = new Date()
        conversation_id = `${now}`
        print(conversation_id)
    } else if (conversation_id){
        conversation_id = conversation_id
    }
    let history = temporaryChatHistory
    let botPrompt = {"role": "system", "content":`${characterPrompt}.\nThis is a roleplay between User and ${currentCharacterName}, continue the conversation, write a single short reply as ${currentCharacterName}\n`}
    let userPrompt = {"role": "user", "content": `${input}`}
    let arr = [botPrompt, userPrompt]
    msg = history.concat(arr)
    const URL = "/chat/message"
    request = {
        messages : msg,
        temperature:0.7,
        mode:"instruct",
        model:"llama3.2",
    }

        let user = document.getElementById("roleplay-name").value||""
        let response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-type": "application/json",
                "user-name": `${user}`,
                "Authorization":`Bearer ${jwt}`,
                "conversation-id":`${conversation_id}`
            },
            body: JSON.stringify(request)
        })
        if (!response.ok){
            console.log("Error:", response.status)
            let errorMessage = "An error was encountered. Please check your internet connection. "
            return errorMessage
        }
        let data = await response.json()
        let output = data.choices[0].message.content
        writeToChatHistory(input, output)
        inputMessage.innerHTML = ""
        output = marked.parse(output)
        return output
        
    
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
