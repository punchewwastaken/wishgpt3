//not used since no mobile compatiblity
let mobileNavMenu = false
let mobileBurgerMenu = document.getElementById("index-hamburger-menu")
function openMobileMenu(){
    if(!mobileNavMenu){
        mobileBurgerMenu.style.display="flex"
        mobileNavMenu=true
    } else if (mobileNavMenu){
        mobileBurgerMenu.style.display="none"
        mobileNavMenu=false
    }
}
window.addEventListener('resize', ()=>{
    if(window.innerWidth>=800){
        mobileBurgerMenu.style.display="none"
        mobileNavMenu=false
    }
})