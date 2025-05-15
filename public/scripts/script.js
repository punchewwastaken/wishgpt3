var jwt = document.cookie.split("; ").find((row) => row.startsWith("jwt="))?.split("=")[1]
let responseContainer = document.getElementById("response-container")
let chatHistoryContainer = document.getElementById("chat-history-container")
let characterMenu = document.getElementById("character-container")
let inputMessage = document.getElementById("chat-input")
let CCmenu = document.getElementById("character-creation-menu")
let CCmenycontainer = document.getElementById("character-creation-container")
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
        imagepath:'public/images/example.PNG',
        character_id:"0"
    },
]
let characterPrompt
let currentCharacterName
let currentCharacterId
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

window.onload=async function LoadDatafromDB(){
    await loadMessages()
    //characters
    let characters = await fetch('/characters',{
        method:'GET',
        headers:{
            'Authorization':`Bearer ${jwt}`
        },
    })
    if(characters.status==403){
        window.location.replace("../403.html")
    }
    characters = await characters.json()
    characters = JSON.stringify(characters)
    characters = JSON.parse(characters)
    characterList.push(...characters)
        //add character from db to localstorage
        for(let item of characterList){
            if(item.character_id==="0"){
            }else{
            //push to char list
            let p = document.createElement("p")
            p.innerHTML = item.character_name
            let charaObj = document.createElement("div")
            charaObj.className = "character-object"
            charaObj.id = item.character_id
            charaObj.setAttribute("onclick", `loadCharacter("${item.character_id}")`)
            let img = new Image()
            img.src = item.imagepath
            img.className = "character-obj-img"
            charaObj.appendChild(p)
            charaObj.innerHTML+=`<i onclick="deleteCharacter('${item.character_id}')" class="fa-solid fa-trash"></i>`
            charaObj.appendChild(img)
            characterMenu.appendChild(charaObj)
        }
    }
}

async function loadMessages() {
    let chats = await fetch('/chat/retrieve', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${jwt}`,
        },
    });

    if (chats.status == 403) {
        window.location.replace("../403.html");
    }

    chats = await chats.json();
    console.log(Array.isArray(chats));
    console.log(chats)
    if (chats) {
        // Group messages by conversation_id while also collecting character_id
        let groupedMessages = chats.reduce((acc, msg) => {
            if (!acc[msg.conversation_id]) {
                acc[msg.conversation_id] = { messages: [], character_id: msg.character_id, topic:msg.topic};
            }
            acc[msg.conversation_id].messages.push({
                content: msg.message,
                role: msg.sender_type,
            });
            return acc;
        }, {});
        console.log(groupedMessages)
        // Convert grouped messages into an array format
        const conversationsArray = Object.entries(groupedMessages).map(([conversationId, data]) => ({
            conversation_id: conversationId,
            topic: data.topic,
            character_id: data.character_id,  // Attach character_id
            messages: data.messages,
        }));
        for (const item of conversationsArray) {
            console.log(item.topic);
            let conversation_id = item.conversation_id;
            // Check if conversation already exists in chatHistoryList
            if (!chatHistoryList.some(chat => chat.conversation_id === conversation_id)) {
                // Also check if the HTML element already exists
                if (!document.getElementById(conversation_id)) {
                    let p = document.createElement("p");
                    let object = document.createElement("div");
                    object.className = "chat-history-object";
                    object.innerHTML = `<i onclick="" class="fa-solid fa-cloud-arrow-down"></i><i onclick="deleteChat('${conversation_id}')" class="fa-solid fa-trash"></i>`;
                    
                    let chatName = item.topic || item.conversation_id;
                    object.id = conversation_id;
                    p.innerHTML = `${chatName}`;
                    object.appendChild(p);
                    object.setAttribute("onclick", `loadChat('${conversation_id}')`);
                    chatHistoryContainer.appendChild(object);
                }
                chatHistoryList.push(item);  // Push with character_id attached
            }
        }
    } else {
        console.log("No messages found");
    }
}


async function deleteCharacter(input){
    print("deleting a charavyer")
    let character_id=input
    let response = await fetch('/characters/delete',{
        method:'POST',
        headers:{
            'Authorization':`Bearer ${jwt}`,
            'character_id':`${character_id}`
        }
    })
    if(response.status==403){
        window.location.replace("../403.html")
    }
    if(response.ok){
        print("character deleted")
        window.location.reload()
    }else{
        print("character not deleted lmfao")
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
    if(!charaDesc||!charaName||!fileInput){
        alert("Name, file or description is empty! They cannot be empty!")
    }else{
    let file = fileInput.files[0]; // Get actual file
    let form = new FormData()
    form.append("file", file)
    let character = {
        character_name : charaName,
        description : charaDesc,
        imagepath : charaImg,
        character_id:0,
    }
    console.log(character)
    form.append("data", JSON.stringify(character))
    let response = await fetch("/characters/create", {
        method: "POST",
            headers:{
            "Authorization":`Bearer ${jwt}`,
        },
        body: form
    })
    if(response.status==403){
        window.location.replace("../403.html")
    }
    if(!response.ok){
        alert("Failed to upload")
    }else{
            window.location.reload()
        }
    }
}   

//quick chatgpt function to actually handle select/deselect and not just changing between characters. Also resets conversation_id so that's cool
async function loadCharacter(input) {
    await loadMessages();

    let selectedCharacter = characterList.find(item => item.character_id == input);
    
    if (!selectedCharacter) return; // Character not found

    let charaObj = document.getElementById(selectedCharacter.character_id);

    // Check if the character is already selected
    if (currentcharacter.some(item => Number(item.character_id) === Number(input))) {
        // Deselect the character
        charaObj.style.backgroundColor = "rgb(108, 213, 216)"; // Default color
        currentcharacter = currentcharacter.filter(item => Number(item.character_id) !== Number(input)); // Remove from list
        characterPrompt = ""; // Reset prompt
        currentCharacterName = "";
        currentCharacterId = "";
        conversation_id = ""; // Reset conversation_id
        temporaryChatHistory = [];
        responseContainer.replaceChildren();
        console.log("Character deselected: " + selectedCharacter.character_name);
    } else {
        // Reset color of the previously selected character
        if (currentcharacter.length > 0) {
            let previousCharacter = currentcharacter[0]; // Assuming only one character can be active
            let previousCharaObj = document.getElementById(previousCharacter.character_id);
            if (previousCharaObj) {
                previousCharaObj.style.backgroundColor = "rgb(108, 213, 216)"; // Default color
            }
            currentcharacter = []; // Clear previous selection
        }

        // Select the new character
        charaObj.style.backgroundColor = "#3b8a99"; // Selected color
        currentcharacter.push(selectedCharacter);
        
        // Update temp variables
        characterPrompt = selectedCharacter.description;
        currentCharacterName = selectedCharacter.character_name;
        currentCharacterId = selectedCharacter.character_id;
        conversation_id = ""; // Reset conversation_id when switching
        temporaryChatHistory = [];
        responseContainer.replaceChildren();
        console.log("Character selected: " + selectedCharacter.character_name);
    }
}



//Load chat history
function loadChat(inputValue){
    responseContainer.replaceChildren()
    for (let chat of chatHistoryList){
        let user
        let bot
        if (chat.conversation_id == inputValue){
            conversation_id=chat.conversation_id
            console.log("chat conversation id is : "+conversation_id)
            for(item of chat.messages) {
                temporaryChatHistory.push(item)
                if (item.role === "user") {
                    user = item.content;
                } else if (item.role === "assistant") {
                    bot = item.content;
                }
                makeChatObjects(user, bot)
            };
        }
    }try{
            responseContainer.removeChild(responseContainer.firstChild)
            print(responseContainer)
        } catch (error){
            console.log("no first child found.")
        }
}
//delete saved chat history
async function deleteChat(inputValue){
    for (const [index, item] of chatHistoryList.entries()){
        if (item.conversation_id == inputValue){
            let chatObject = document.getElementById(`${item.conversation_id}`)
            chatHistoryList.splice(index, 1)
            chatObject.remove()
        }
    }
    let response = await fetch('/chat/delete',{
        method:'POST',
        headers:{
            'Authorization':`Bearer ${jwt}`,
            'conversation-id':`${inputValue}`
        },
    })
    if(response.status==403){
        window.location.replace("../403.html")
    }
    if(response.ok){
        print("all good, its gone deleted yeeted")
    }else{
        print("not good we are cooked")
    }
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
    if(!conversation_id){
        let now = new Date()
        conversation_id = `${now}`
        print("Speaking chat id :"+conversation_id)
    } else if (conversation_id){
        conversation_id = conversation_id
        print("current convo id: "+ conversation_id)
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
                "conversation-id":`${conversation_id}`,
                "character-id":`${currentCharacterId}`
            },
            body: JSON.stringify(request)
        })
        if(response.status==403){
        window.location.replace("../403.html")
        }
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
    let bot = await generateText(user)
    inputMessage.value=''
    makeChatObjects(user, bot)
    loadingIcon.style.display='none'
    }
}
