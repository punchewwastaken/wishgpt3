//big function to create account
async function createAccount(){
    let username = document.getElementById("usr").value;
    let password = document.getElementById("pass").value;
    if(!username||!password){
        alert("Empty fields!")
    } else{
        let info = {
            username:username,
            password:password
        }
        let response = await fetch('/login/signup',{
            method:'POST',
            headers:{
                'Content-type':'application/JSON'
            },
            body:JSON.stringify(info)
        }).then(response => {
            if (response.status === 409) {
                console.log('User already exists!');
                alert("Username allready exists!")
            } else if (response.ok) {
                console.log('Account created successfully!');
                window.location.href = "../login.html";
            } else {
                console.log('An error occurred:', response.status);
            }
        })
        .catch(error => {
            console.error('Network error:', error);
        });
    }
}