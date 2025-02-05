// Vérifier si les variables sont définies
const profileData = window.profileData || {};

// Mettre à jour les informations
if (profileData.name) {
    document.getElementById("title").textContent = `Profil de ${profileData.name}`;
    document.getElementById("name").textContent = profileData.name;
}
if (profileData.profileImg) {
    document.getElementById("profile-img").src = profileData.profileImg;
}

const buttonsContainer = document.getElementById("buttons-container");

function addButton(text, url, className) {
    if (url) {
        const button = document.createElement("a");
        button.href = url;
        button.className = `btn ${className}`;
        button.textContent = text;
        button.target = "_blank";
        buttonsContainer.appendChild(button);
    }
}

// Ajouter les boutons uniquement si les liens existent
addButton("Twitch", profileData.twitch, "btn-twitch");
addButton("Donation", profileData.donation, "btn-donation");
addButton("Instagram", profileData.instagram, "btn-instagram");
addButton("Discord", profileData.discord, "btn-discord");
addButton("YouTube", profileData.youtube, "btn-youtube");
