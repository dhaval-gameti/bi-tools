// चैट पॉप-अप को दिखाने और छिपाने के लिए JavaScript
document.addEventListener("DOMContentLoaded", function() {
        const chatBtn = document.getElementById("openChatBtn");
        const chatPopup = document.getElementById("chatPopup");
        const closeChatBtn = document.getElementById("closeChatBtn");
        
        chatBtn.addEventListener("click", function() {
                chatPopup.style.display = chatPopup.style.display === "flex" ? "none" : "flex";
        });
        
        closeChatBtn.addEventListener("click", function() {
                chatPopup.style.display = "none";
        });
});



