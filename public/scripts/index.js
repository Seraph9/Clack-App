document.addEventListener("DOMContentLoaded", async (event) => {

    //uses a fetch on '/' to grab dynamic port that heroku provides
    //then connects socket to that port
    const port = await fetch('/');
    const { url } = port;
    const socket = io.connect(`${url}`);

    //Grabs userid & fullName from local storage
    const userId = localStorage.getItem("CLACK_CURRENT_USER_ID");
    const name = localStorage.getItem("CLACK_CURRENT_USER_FULLNAME");

    //Grabs all elements for chat container
    const chatWin = document.querySelector(".chatWin");
    const input = document.getElementById("messages");
    const broadcast = document.querySelector(".broadcast");

    //Grabs bold button from icon bar to test emoji toggling
    const boldTag = document.getElementById("bold");


    try {

        //Checks to see if current user is authorized (logged in)
        const user = await fetch(`https://clackbackend.herokuapp.com/users/${userId}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('CLACK_ACCESS_TOKEN')}`
            }
        });

        // If user is not authorized, redirects them to login page
        if (user.status === 404) {
            window.location.href = '/log-in';
            return;
        }

        if (user.status === 401) {
            window.location.href = '/log-in';
            return;
        }

        //If user is authorized, grabs all messages from database for main channel
        const allMessages = await fetch(`https://clackbackend.herokuapp.com/channels/1/messages`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('CLACK_ACCESS_TOKEN')}`
            }
        })

        const { Messages } = await allMessages.json();
        const messagesContainer = document.querySelector(".messageDisplay");

        //Creates an array of HTML divs containing messages from database
        //Each div contains the original message and the emoji translated message in span tags,
        //Div will only show one span and hide the other, depending on toggle
        const messagesHTML = Messages.map(
            ({ message, User: { fullName }, createdAt }) => {
                let div = document.createElement("div");
                div.style.paddingLeft = "10px";
                div.style.paddingBottom = "10px";
                div.innerHTML = `<div class="message-text"><strong>${fullName}</strong> : <span class="message">${message}</span><span class="emojiMessage hidden">${emojiTranslate(message)}</span>    (${new Date(createdAt).getHours()}:${new Date(createdAt).getMinutes()}:${new Date(createdAt).getSeconds()})</div>`;
                return div;
            })
        messagesHTML.forEach(message => {
            chatWin.appendChild(message);
            message.scrollIntoView(false);
        });

        //Old implementation to get messages from database onto screen
        // `
        // <div class="message">
        // 	<span class="message-author">
        // 		<strong>${fullName}</strong> : 
        // 	</span>
        // 	<span class="message-body">
        // 	<span class="message-text"> ${message}</span>
        //     </span>
        //     <span class="timestamp">
        //          (${new Date(createdAt).getHours()}:${new Date(createdAt).getMinutes()}:${new Date(createdAt).getSeconds()})
        //     </span>
        // </div>
        // `
        //messagesContainer.innerHTML += messagesHTML.join("");


    }
    catch (e) {
        console.error(e);
    }

    //const messageDisplay = document.querySelector(".messageDisplay");


    //Wait for user to press the 'enter' to make a post request for new messages
    input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {

            try {
                const message = await fetch(`https://clackbackend.herokuapp.com/channels/1/messages`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem('CLACK_ACCESS_TOKEN')}`
                    },
                    body: JSON.stringify({
                        userId,
                        message: input.value,
                    })
                })
            }
            catch (e) {
                console.error(e);
            }

            //Emits socket signal for chat
            socket.emit("chat", { message: input.value, sender: name });
            input.value = "";
        }
    });

    //When user types, emits socket signal for typing
    input.addEventListener("keypress", event => {
        socket.emit("typing", "test");
    });

    //When a signal for chat is received, displays the new message into the chat window
    socket.on("chat", data => {
        broadcast.innerHTML = "";
        let chatTimeStamp = `(${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()})`;
        let div = document.createElement("div");
        div.style.paddingLeft = "10px";
        div.style.paddingBottom = "10px";

        //Changes display view of messages to show either emoji or original:
        if (boldTag.classList.contains("emojiView")) {
            div.innerHTML = `<div class="message-text"><strong>${data.sender}</strong> : <span class="message hidden">${data.message}</span><span class="emojiMessage">${emojiTranslate(data.message)}</span>   ${chatTimeStamp}</div>`;
        } else {
            div.innerHTML = `<div class="message-text"><strong>${data.sender}</strong> : <span class="message">${data.message}</span><span class="emojiMessage hidden">${emojiTranslate(data.message)}</span>   ${chatTimeStamp}</div>`;
        }

        chatWin.appendChild(div); // slack puts the texts on the bottom and it stacks underneath pushing old one higher up
        div.scrollIntoView(false); // .scrollIntoView() = .scrollIntoView(true) - all work the same in the case with appendChild() vs prepend()
        // messageDisplay.innerHTML += `<div><strong>${data.sender}</strong> : ${data.message}    ${chatTimeStamp}</div>`;
    });

    //When a signal for typing is received, displays a message showing that someone is typing
    socket.on("typing", data => {
        broadcast.innerHTML = `<div><em>${data} is typing a message...</em</div>`;
    });

    //-----------------------------------------------------------------------------------
    // Function that takes in a message, translate it into emoji letters, and returns that new message
    function emojiTranslate(message) {
        const alphabet = {
            a: ["🅰️"],
            b: ["🅱️"],
            c: ["©️"],
            d: ["↩️"],
            e: ["📧"],
            f: ["🎏"],
            g: ["ⓖ"],
            h: ["♓"],
            i: ["ℹ️"],
            j: ["ʝ"],
            k: ["ⓚ"],
            l: ["👢"],
            m: ["Ⓜ️"],
            n: ["ⓝ"],
            o: ["🅾️"],
            p: ["🅿️"],
            q: ["🔍"],
            r: ["®️"],
            s: ["💲"],
            t: ["✝️"],
            u: ["⛎"],
            v: ["♈"],
            w: ["〰️"],
            x: ["❌"],
            y: ["✌🏻"],
            z: ["💤"],
            1: ["1️⃣"],
            2: ["2️⃣"],
            3: ["3️⃣"],
            4: ["4️⃣"],
            5: ["5️⃣"],
            6: ["6️⃣"],
            7: ["7️⃣"],
            8: ["8️⃣"],
            9: ["9️⃣"],
            0: ["0️⃣"],
            "?": ["❓"],
            "!": ["❗️"],
            " ": [""],
            ".": ["❀"]
        };
        return message.toLowerCase().split('').map(char => {
            if (char in alphabet) {
                return alphabet[char];
            } else {
                return char;
            }
        }).join('')
    }

    //When a user clicks on the emoji view button, toggles the classlists for message
    //spans and the button itself
    boldTag.addEventListener('click', e => {
        boldTag.classList.toggle("emojiView")//this is how socket knows if emojiView is on or not

        const allEmojiMessageSpans = document.querySelectorAll(".emojiMessage");
        const allMessageSpans = document.querySelectorAll('.message');

        allMessageSpans.forEach(messageSpan => {
            messageSpan.classList.toggle("hidden");
        });

        allEmojiMessageSpans.forEach(emojiMessageSpan => {
            emojiMessageSpan.classList.toggle("hidden");
        });
    })

})



