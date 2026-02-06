function loadHTML(id, file, callback) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
            if (callback) callback();
        })
        .catch(error => console.log("Error loading file:", file));
}

// Load theme persistence script
function loadThemeScript() {
    const script = document.createElement('script');
    script.src = 'theme-persistence/theme.js';
    script.onload = () => console.log('Theme persistence loaded');
    document.head.appendChild(script);
}

// Load theme script immediately
loadThemeScript();

loadHTML("navbar", "navbar.html", () => {
    document.dispatchEvent(new Event("navbarLoaded"));
});

loadHTML("footer", "footer.html");
