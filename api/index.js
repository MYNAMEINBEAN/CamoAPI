import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");
        return res.status(204).end();
    }

    let { url } = req.query;
    if (!url) return res.status(400).send("Missing `url` query parameter.");

    try {
        url = decodeURIComponent(url);
        console.log(`Proxying: ${url}`);

        const agent = new https.Agent({ rejectUnauthorized: false });

        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
        const isBinary = /\.(woff2?|ttf|eot|otf|ico)$/i.test(url);
        const isJson = /\.json$/i.test(url);
        const isJs = /\.js$/i.test(url);

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: isImage || isBinary ? 'arraybuffer' : 'text',
            timeout: 30000,
            headers: {
                'User-Agent': req.headers['user-agent'] || '',
                'Accept': '*/*',
            },
        });

        const contentType = response.headers['content-type'] || 'application/octet-stream';
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", contentType);

        if (isImage || isBinary) {
            return res.status(response.status).send(Buffer.from(response.data));
        }

        if (isJson) {
            return res.status(response.status).json(response.data);
        }

        let data = response.data;

        // Only rewrite if it's HTML and not a JS file
        if (!isJs && contentType.includes('text/html')) {
            const baseUrl = new URL(url);

            // Rewrite src/href links
            data = data.replace(/(src|href|srcset|poster)=["']([^"']+)["']/gi, (match, attr, link, source, video, a) => {
                try {
                    if (link.startsWith('data:') || link.startsWith('mailto:') || link.startsWith('javascript:')) {
                        return match;
                    }

                    const absoluteUrl = new URL(link, baseUrl).toString();
                    const proxied = `/API/index.js?url=${encodeURIComponent(absoluteUrl)}`;
                    return `${attr}="${proxied}"`;
                } catch (e) {
                    return match;
                }
            });

            // Rewrite window.location.href
            data = data.replace(/window\.location\.href\s*=\s*["']([^"']+)["']/g, (_, link) => {
                const target = new URL(link, baseUrl).toString();
                return `window.location.href = "/API/index.js?url=${encodeURIComponent(target)}"`;
            });

            // Rewrite window.open
            data = data.replace(/window\.open\s*\(\s*["']([^"']+)["']\s*\)/g, (_, link) => {
                const target = new URL(link, baseUrl).toString();
                return `window.open("/API/index.js?url=${encodeURIComponent(target)}")`;
            });

            data = data.replace('loading="lazy"', 'loading="eager"');

            data = data.replace(/srcset="[^"]*"/g, '');

            data = data.replace(`<img`, `<img style="background-size: cover;"`);

            // Inject Eruda for debugging
            data = data.replace(/<\/body>/i, `
                <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
                <script>eruda.init();</script>
            </body>`);
        }

            function loadCAC {
            function makeGUI() {
    const GUI = document.createElement('div');
    document.body.appendChild(GUI);
    GUI.innerHTML = `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
    .cac-gui {
        width: 90vw;
        height: 90vh;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 20, 0.8);
        backdrop-filter: blur(8px);
        border-radius: 12px;
        border: 10px solid rgba(126, 126, 126, 0.722);
        display: flex;
        flex-direction: row;
        overflow: hidden;
        z-index: 10000000000;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }
    .cac-list {
        width: 200px;
        background: rgba(255, 255, 255, 0.03);
        padding: 20px;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        box-sizing: border-box;
    }
    .cac-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .cac-list li {
        padding: 10px 15px;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.05);
        color: #ccc;
        font-size: 1em;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s ease;
        user-select: none;
    }
    .cac-list li:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    #cac-name {
        background: none;
        cursor: default;
    }
    #scripts ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    #scripts li {
        padding: 10px 15px;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.05);
        color: #ccc;
        font-size: 1em;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s ease;
        user-select: none;
    }
    #scripts li:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    .cac-content {
        flex: 1;
        padding: 25px;
        color: #ddd;
        background: rgba(255, 255, 255, 0.02);
        overflow-y: auto;
    }
    .cac-gui a {
        color: darkblue;
    }
    #web-browser iframe {
        border: none;
        border-radius: 2vh;
        width: 35vw;
        height: 45vh;
    }
    #cac-browser-button {
        padding: 10px 15px;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.05);
        color: #ccc;
        font-size: 1em;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s ease;
        user-select: none;
        border: none;
    }
    #cac-browser-button:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    #cac-browser-input {
        padding: 10px 15px;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.05);
        color: #ccc;
        font-size: 1em;
        border-radius: 6px;
        cursor: text;
        transition: background 0.2s ease;
        user-select: none;
        border: none;
        outline: none;
    }
    #cac-browser-input:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    .cac-browser-container {
        width: 35vw;
        height: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
    }
    #cac-browser-fullscreen {
        padding: 10px 15px;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.05);
        color: #ccc;
        font-size: 1em;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s ease;
        user-select: none;
        border: none;
    }
    #cac-browser-fullscreen:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    </style>
    <div class="cac-gui">
    <div class="cac-list">
        <ul>
            <li id="cac-name">CarAxleClient<br>Re-Gen</li>
            <li id="homePage">Home</li>
            <li id="developersPage">Developers</li>
            <li id="webBrowserPage">Web Browser</li>
            <li id="scriptsPage">Scripts</li>
            <li id="gamesPage">Games</li>
            <li id="cac-name">Toggle GUI: \ (backslash)</li>
        </ul>
    </div>
    <div class="cac-content">
        <div id="home" class="page">
            <h2>CarAxleClient Re-Gen</h2>
            <p>A Re-Build of <a href="https://github.com/penguinify/car-axle-client">CarAxleClient</a>.</p>
        </div>
        <div id="developers" class="page">
            <h2>Developers</h2>
            <p>Developed by <a href="https://discord.gg/camouflage">Camouflage</a> at Camouflage Network</p>
        </div>
        <div id="web-browser" class="page">
            <h2>Browser</h2>
            <iframe src='data:text/html, 
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Web Browser Placeholder</title>
                <style>
                    html, body {
                        background: black;
                        color: white;
                        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        height: 100%;
                        user-select: none;
                    }
                </style>
            </head>
            <body>
                <h1>Type into the bar below and press the <b style="color: green;">GO</b> button!</h1>
            </body>
            </html>
            '></iframe>
            <br>
            <div class="cac-browser-container">
                <input id="cac-browser-input" placeholder="Search..." />
                <button id="cac-browser-button">GO</button>
                <button id="cac-browser-fullscreen"><i class="fa-solid fa-expand"></i></button>
            </div>
        </div>
        <div id="scripts" class="page">
            <h2>Scripts</h2>
            <ul>
                <li id="ixlHacks">IXL Hacks, 1st place on IXL leaderboards every time! </li>
                <li id="wordwallPremium">Wordwall Free Premium (Patched, Fixing soon), Free paid stuff </li>
                <li id="lanschoolBlocker">Lanschool Blocker, makes lanschool unable to redirect your tab!</li>
                <li id="killSecurlyzekc">Kill Securly (Patched on 119+) by ZEK-C, kills securly silly</li>
                <li id="gimkitHacks">Gimkit Hacks (Broken, fixing soon)</li>
                <li id="passwordLooker">Password Looker, uncovers ur passwords silly!</li>
                <li id="forcedarkmode">Force Dark Mode, makes everything dark</li>
            </ul>
        </div>
        <div id="games" class="page">
            <h2>Games</h2>
            <div class="cac-games-container">
                <p>Coming Soon!</p>
            </div>
        </div>
    </div>
    </div>
    `;

    let minimized = false;

    document.addEventListener("keydown", (event) => {
        if (event.key === "\\") {
            const gui = document.querySelector(".cac-gui");

            if (minimized) {
                gui.style.display = "flex";
                minimized = false;
            } else {
                gui.style.display = "none";
                minimized = true;
            }
        }
    });
}

function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    pages.forEach(page => {
        page.style.display = "none";
    });

    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.style.display = "block";
    }
}

function wordwallPremium() {
    if (window.location.href.includes("wordwall.net")) {
        function showNotification(message) {
            let notification = document.createElement('div');
            notification.textContent = message;
            Object.assign(notification.style, {
                position: 'fixed',
                top: '-50px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#333',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '5px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                transition: 'top 0.5s ease-in-out',
                zIndex: '9999'
            });

            document.body.appendChild(notification);
            setTimeout(() => notification.style.top = '10px', 100);
            setTimeout(() => {
                notification.style.top = '-50px';
                setTimeout(() => notification.remove(), 500);
            }, 2000);
        }

        document.querySelectorAll('.js-paid-required.options-login-required').forEach(el => el.remove());
        showNotification("Premium Settings Enabled");
    } else {
        alert('You must be on WORDWALL.NET!');
    }
}

function ixlhacks() {
            if (window.location.href.includes("ixl.com")) {
                (function() {
            const popup = window.open(window.location.href, '_blank', 'width=1000,height=800');

            const runSolver = function() {
                (function keepSolving() {
                    let lastAttempt = Date.now();

                    function solveProblem() {
                        const problemBox = document.querySelector('.old-space-indent');
                        if (!problemBox) return;

                        let equationText = problemBox.textContent
                            .replace(/–/g, '-')
                            .replace(/−/g, '-')
                            .trim();
                        equationText = equationText.replace(/[^\d+\-*/(). ]/g, '').trim();

                        const inputBox = problemBox.querySelector('input.fillIn');
                        if (!inputBox) return;

                        const scoreElement = document.querySelector('.current-smartscore');
                        let smartScore = scoreElement ? parseInt(scoreElement.textContent, 10) : 0;

                        try {
                            if (smartScore > 90) {
                                alert("Got a question wrong. Reloading...");
                                location.reload();
                                return;
                            }

                            let answer = eval(equationText);

                            if (smartScore >= 80) {
                                answer = 10000000;
                            }

                            inputBox.value = answer;
                            inputBox.dispatchEvent(new Event('input', { bubbles: true }));
                            inputBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

                            setTimeout(() => {
                                const nextProblemDiv = document.querySelector('.next-problem');
                                if (nextProblemDiv) {
                                    const gotItButton = nextProblemDiv.querySelector('button.crisp-button');
                                    if (gotItButton) {
                                        gotItButton.click();
                                    }
                                }
                            }, 500);
                        } catch (e) {
                            console.error('Error solving the problem:', e);
                        }
                    }

                    function loop() {
                        const now = Date.now();
                        if (now - lastAttempt >= 500) {
                            solveProblem();
                            lastAttempt = now;
                        }
                        requestAnimationFrame(loop);
                    }

                    loop();
                })();
            };

            popup.onload = function() {
                popup.eval(`(${runSolver.toString()})();`);
            };
        })();
    } else {
        alert('You must be on IXL.COM!');
    }
}

function lanschoolBlocker() {
    alert('Lanschool Blocking Activated');
    window.addEventListener('beforeunload', function (event) {
        event.returnValue = alert('Lanschool Blocked');
        return message;
    });
}

function killsecurlyzekc() {
    if (window.location.href.includes("securly.com")) {
        const e = document.querySelectorAll("div.head-top, div.wonderbar");
        e.forEach(function(t) {
            t.remove()
        });
        const a = document.querySelectorAll("button.slick-prev.slick-arrow.slick-disabled, button.slick-next.slick-arrow.slick, button.slick-prev.slick-arrow, button.slick-next.slick-arrow.slick-disabled"),
            i = document.createElement("iframe");
        i.style.position = "fixed", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.border = "none", i.style.backgroundColor = "white", document.body.appendChild(i);
        const b = document.createElement("button");
        b.style.position = "fixed", b.style.top = "50%", b.style.left = "50%", b.style.transform = "translate(-50%, -50%)", b.style.width = "800px", b.style.height = "200px", b.style.borderRadius = "100px", b.style.backgroundColor = "red", b.style.color = "white", b.style.fontSize = "100px", b.style.fontWeight = "bold", b.style.cursor = "pointer", b.textContent = "OFF", b.addEventListener("click", function() {
            if ("OFF" === this.textContent) {
                this.style.backgroundColor = "blue", this.textContent = "ON";
                let t = new Date(2e14).toUTCString(),
                    o = location.hostname.split(".").slice(-2).join(".");
                for (let l = 0; l < 99; l++) document.cookie = `cd${l}=${encodeURIComponent(btoa(String.fromCharCode.apply(0,crypto.getRandomValues(new Uint8Array(3168))))).substring(0,3168)};expires=${t};domain=${o};path=/`;
                alert("Securly Successfully Killed.")
            } else {
                let s = new Date(2e14).toUTCString(),
                    n = location.hostname.split(".").slice(-2).join(".");
                for (let r = 0; r < 99; r++) document.cookie = `cd${r}=${encodeURIComponent(btoa(String.fromCharCode.apply(0,crypto.getRandomValues(new Uint8Array(32))))).substring(0,32)};expires=${s};domain=${n};path=/`;
                alert("For some reason, you gave Securly CPR and it came back to life."), this.style.backgroundColor = "red", this.textContent = "OFF"
            }
        }), i.contentDocument.body.appendChild(b);
    } else {
        alert('you must be on SECURLY.COM!');
    }
}

function gimkitHacks() {
    if (window.location.href.includes('gimkit.com')) {
        const GIMKITHACKS = document.createElement('script');
        GIMKITHACKS.src = 'https://cdn.jsdelivr.net/gh/TheLazySquid/GimkitCheat@a19d802eca25893e6f262b9d6e74f1278dbebd2f/build/bundle.js';
        document.body.appendChild(GIMKITHACKS);
    } else {
        alert('Must be on GIMKIT.COM!')
    }
}

function passwordLooker() {
  alert('Turned all password boxes into NORMAL TEXT!');

  const passwordFields = Array.from(document.querySelectorAll("input[type='password']"));

  passwordFields.forEach(function(el) {
    el.setAttribute('type', 'text');
  });

}

function forcedarkmode() {
  alert('Dark Mode Forced!');
  (function() {
    function invert(o, t) {
      var r = o.split("("),
          n = r[1].split(")")[0].split(",");
      n.forEach(function(o, r) {
        if (r < 3) {
          n[r] = t == "color" && 255 - parseInt(o) < 50 ? 120 : 255 - parseInt(o);
        }
      });
      n = n.join(",");
      return r[0] + "(" + n + ")";
    }

    document.querySelectorAll("*:not([invTouch])").forEach(function(o) {
      var t = window.getComputedStyle(o);
      o.style.backgroundColor = invert(t.backgroundColor, "back");
      o.style.color = invert(t.color, "color");
      o.setAttribute("invTouch", "true");
    });
  })();
}

function addListeners() {
    document.getElementById("homePage").addEventListener("click", () => showPage("home"));
    document.getElementById("developersPage").addEventListener("click", () => showPage("developers"));
    document.getElementById("webBrowserPage").addEventListener("click", () => showPage("web-browser"));
    document.getElementById("scriptsPage").addEventListener("click", () => showPage("scripts"));
    document.getElementById("gamesPage").addEventListener("click", () => showPage("games"));

    document.getElementById("ixlHacks").addEventListener("click", ixlhacks);
    document.getElementById("wordwallPremium").addEventListener("click", wordwallPremium);
    document.getElementById("lanschoolBlocker").addEventListener("click", lanschoolBlocker);
    document.getElementById("killSecurlyzekc").addEventListener("click", killsecurlyzekc);
    document.getElementById("gimkitHacks").addEventListener("click", gimkitHacks);
    document.getElementById("passwordLooker").addEventListener("click", passwordLooker);
    document.getElementById("forcedarkmode").addEventListener("click", forcedarkmode);

    const browserButton = document.getElementById("cac-browser-button");
    const browserInput = document.getElementById("cac-browser-input");
    const browserFrame = document.querySelector("#web-browser iframe");

    browserButton.addEventListener("click", () => {
        let url = browserInput.value.trim();
        if (!url) { 
          alert("No URL! Please put in a URL!"); 
        } else {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          if (url.includes("google.com")) {
            url = "https://www.google.com/webhp?igu=1";
          } else if (url.includes("youtube.com/watch?v=")) {
            const videoId = new URL(url).searchParams.get("v");
            url = `https://www.youtube-nocookie.com/embed/${videoId}`;
          } else {
            url = "https://google.com/search?q=" + url + "&igu=1&source=hp";
          }
        }
        browserFrame.src = url;
    }}); 

    const fullscreenButton = document.getElementById("cac-browser-fullscreen");
    fullscreenButton.addEventListener("click", () => {
        if (browserFrame.requestFullscreen) {
            browserFrame.requestFullscreen();
        } else if (browserFrame.webkitRequestFullscreen) {
            browserFrame.webkitRequestFullscreen();
        } else if (browserFrame.msRequestFullscreen) {
            browserFrame.msRequestFullscreen();
        }
    });
}

makeGUI();
addListeners();
showPage("home");
            }
        const cacBtn = document.createElement('div');
        cacBtn.style.background = 'black';
        cacBtn.style.color = 'white';
        cacBtn.style.fontFamily = `"Segoe UI", Arial, sans-serif;`;
        document.body.appendChild(cacBtn);
        const cacTxt = document.createElement('h2');
        cacTxt.innerText = 'CAC';
        cacBtn.appendChild(cacTxt);
        cacBtn.style.position = 'absolute';
        cacBtn.style.top = '10px';
        cacBtn.style.left = '10px';
        cacBtn.style.width = '5rem';
        cacBtn.style.height = '5rem';
        cacBtn.addEventListener('click', loadCAC);
        cacBtn.style.zIndex = '999999';

data = data.replace(/%20/g, ' ')
           .replace(/%21/g, '!')
           .replace(/%22/g, '"')
           .replace(/%23/g, '#')
           .replace(/%24/g, '$')
           .replace(/%25/g, '%')
           .replace(/%26/g, '&')
           .replace(/%27/g, "'")
           .replace(/%28/g, '(')
           .replace(/%29/g, ')')
           .replace(/%2A/g, '*')
           .replace(/%2B/g, '+')
           .replace(/%2C/g, ',')
           .replace(/%2D/g, '-')
           .replace(/%2E/g, '.')
           .replace(/%2F/g, '/')
           .replace(/%30/g, '0')
           .replace(/%31/g, '1')
           .replace(/%32/g, '2')
           .replace(/%33/g, '3')
           .replace(/%34/g, '4')
           .replace(/%35/g, '5')
           .replace(/%36/g, '6')
           .replace(/%37/g, '7')
           .replace(/%38/g, '8')
           .replace(/%39/g, '9')
           .replace(/%3A/g, ':')
           .replace(/%3B/g, ';')
           .replace(/%3C/g, '<')
           .replace(/%3D/g, '=')
           .replace(/%3E/g, '>')
           .replace(/%3F/g, '?')
           .replace(/%40/g, '@')
           .replace(/%41/g, 'A')
           .replace(/%42/g, 'B')
           .replace(/%43/g, 'C')
           .replace(/%44/g, 'D')
           .replace(/%45/g, 'E')
           .replace(/%46/g, 'F')
           .replace(/%47/g, 'G')
           .replace(/%48/g, 'H')
           .replace(/%49/g, 'I')
           .replace(/%4A/g, 'J')
           .replace(/%4B/g, 'K')
           .replace(/%4C/g, 'L')
           .replace(/%4D/g, 'M')
           .replace(/%4E/g, 'N')
           .replace(/%4F/g, 'O')
           .replace(/%50/g, 'P')
           .replace(/%51/g, 'Q')
           .replace(/%52/g, 'R')
           .replace(/%53/g, 'S')
           .replace(/%54/g, 'T')
           .replace(/%55/g, 'U')
           .replace(/%56/g, 'V')
           .replace(/%57/g, 'W')
           .replace(/%58/g, 'X')
           .replace(/%59/g, 'Y')
           .replace(/%5A/g, 'Z')
           .replace(/%5B/g, '[')
           .replace(/%5C/g, '\\')
           .replace(/%5D/g, ']')
           .replace(/%5E/g, '^')
           .replace(/%5F/g, '_')
           .replace(/%60/g, '`')
           .replace(/%61/g, 'a')
           .replace(/%62/g, 'b')
           .replace(/%63/g, 'c')
           .replace(/%64/g, 'd')
           .replace(/%65/g, 'e')
           .replace(/%66/g, 'f')
           .replace(/%67/g, 'g')
           .replace(/%68/g, 'h')
           .replace(/%69/g, 'i')
           .replace(/%6A/g, 'j')
           .replace(/%6B/g, 'k')
           .replace(/%6C/g, 'l')
           .replace(/%6D/g, 'm')
           .replace(/%6E/g, 'n')
           .replace(/%6F/g, 'o')
           .replace(/%70/g, 'p')
           .replace(/%71/g, 'q')
           .replace(/%72/g, 'r')
           .replace(/%73/g, 's')
           .replace(/%74/g, 't')
           .replace(/%75/g, 'u')
           .replace(/%76/g, 'v')
           .replace(/%77/g, 'w')
           .replace(/%78/g, 'x')
           .replace(/%79/g, 'y')
           .replace(/%7A/g, 'z')
           .replace(/%7B/g, '{')
           .replace(/%7C/g, '|')
           .replace(/%7D/g, '}')
           .replace(/%7E/g, '~');

            // This code processes the content="" attribute, extracts URLs inside, bases them using the provided base URL, and updates the content.
data = data.replace(/content="([^"]+)"/g, (match, jsonContent) => {
    try {
        let jsonData = JSON.parse(decodeURIComponent(jsonContent));

        if (jsonData.assets) {
            if (jsonData.assets.video) {
                for (let size in jsonData.assets.video) {
                    for (let format in jsonData.assets.video[size]) {
                        const relativeUrl = jsonData.assets.video[size][format];
                        if (!relativeUrl.startsWith('data:') && !relativeUrl.startsWith('http')) {
                            jsonData.assets.video[size][format] = new URL(relativeUrl, baseUrl).toString();
                        }
                    }
                }
            }

            if (jsonData.assets.poster) {
                for (let size in jsonData.assets.poster) {
                    const relativeUrl = jsonData.assets.poster[size];
                    if (!relativeUrl.startsWith('data:') && !relativeUrl.startsWith('http')) {
                        jsonData.assets.poster[size] = new URL(relativeUrl, baseUrl).toString();
                    }
                }
            }

            if (jsonData.assets.image) {
                for (let size in jsonData.assets.image) {
                    const relativeUrl = jsonData.assets.image[size].src;
                    if (!relativeUrl.startsWith('data:') && !relativeUrl.startsWith('http')) {
                        jsonData.assets.image[size].src = new URL(relativeUrl, baseUrl).toString();
                    }
                }
            }
        }

        const updatedContent = JSON.stringify(jsonData);
        return `content="${encodeURIComponent(updatedContent)}"`;

    } catch (e) {
        console.error("Error processing content:", e);
        return match;
    }
});
        return res.status(response.status).send(data);

    } catch (err) {
        console.error(`Proxy Error: ${err.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
    }
}
