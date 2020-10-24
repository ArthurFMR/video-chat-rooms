
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const webCamButton = document.getElementById('web-cam-button');
const webCamButtonText = document.getElementById('web-cam-button-text');
const webCamOn = document.getElementById('web-cam-on');
const webCamOnText = document.getElementById('web-cam-on-text');
const content = document.getElementById('content')


const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '3000'
})

const peers = {}

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const socket = io();



// When connect to the peer server return a id and execute this function
myPeer.on('open', id => {
    // join room
    socket.emit('join-room', ({ id, username, room }));
})



// Get room and users
socket.on('room-users', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users)

    // Get the user that has stream on and put it a icons
    users.forEach(user => {
        if (user.cam === true) {
            addWebcamIcon(user.id)

        }
    })

})


// Message from server
socket.on('message', message => {
    outputMessage(message);

    // Scroll Down
    chatMessages.scrollTop = chatMessages.scrollHeight;
})


// Message from users
chatForm.addEventListener('submit', e => {
    e.preventDefault();

    // Get message text
    let msg = e.target.elements.msg.value;
    msg = msg.trim();

    if (!msg) {
        return false;
    }

    // Emite message to server
    socket.emit('user-message', msg);

    // clean input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus()
})


// Output Message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');

    const usernameP = document.createElement('p');
    usernameP.classList.add('meta');
    usernameP.innerText = message.username;
    usernameP.innerHTML += `<span> ${message.time}</span>`;

    div.appendChild(usernameP)

    const messageTextP = document.createElement('p');
    messageTextP.classList.add('text')
    messageTextP.innerText = message.text;

    div.appendChild(messageTextP);

    document.querySelector('.chat-messages').appendChild(div)
}

// Add Room name to DOM
function outputRoomName(room) {
    roomName.innerText = room
}

// Add Users to DOM
function outputUsers(users) {
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li')
        li.innerText = user.username;
        li.id = user.id;
        li.classList.add('mb-1')
        li.style.fontWeight = "bold"
        userList.appendChild(li);
    });
}


// Video call System --------------------

const myVideo = document.createElement('video');
myVideo.muted = true;

webCamButton.addEventListener('click', () => {
    turnOnCam()
    socket.emit('webcam-on')
})

// Create the video stream when user turn on his/her cam
async function turnOnCam() {

    let hasCam;
    let hasMicro;

    // ---Checking if has medias connected
    await navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            hasCam = devices.find(device => {
                return device.kind === "videoinput";
            });

            hasMicro = devices.find(device => {
                return device.kind === "audioinput";
            })

            if (hasCam) {
                hasCam = true;
            } else { hasCam = false }

            if (hasMicro) {
                hasMicro = true;
            } else { hasMicro = false }
        })
    //----------------------

    navigator.mediaDevices.getUserMedia({
        video: hasCam,
        audio: hasMicro
    }).then(stream => {
        addMyVideoStream(myVideo, stream)

        myPeer.on('call', call => {
            call.answer(stream)
        })


    }).catch(() => {
        alert("You must have at least one of audio or video")
    })
    webCamButton.disabled = true;
    webCamButton.style.cursor = "";
    webCamButton.setAttribute("src", "img/icons8-webcam-on.png");
    webCamButtonText.innerText = "Your cam is ON!";


};

// Turn off cam
function turnOffCam() {

    webCamButton.disabled = false;
    webCamButton.style.cursor = "pointer";
    webCamButton.setAttribute("src", "img/icons8-webcam-96.png");
    webCamButtonText.innerText = "Click it to Turn On Your Cam";

}


function makeResizableDraggable(videoContainer) {
    videoContainer.style.userSelect = 'none';
    videoContainer.style.touchAction = "none";
    videoContainer.style.position = 'absolute';
    videoContainer.style.boxSizing = "border-box";

    interact(videoContainer)
        .resizable({
            // resize from right and bottom edges and down right corner
            edges: { right: true, bottom: true },

            listeners: {
                move(event) {
                    let target = event.target
                    let x = parseFloat(target.getAttribute('data-x')) || 0;
                    let y = parseFloat(target.getAttribute('data-y')) || 0;

                    // update the element's style
                    target.style.width = event.rect.width + 'px';
                    target.style.height = event.rect.height + 'px';

                    // translate when resizing from top or left edges
                    x += event.deltaRect.left;
                    y += event.deltaRect.top;


                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);

                }
            },

        })

        .draggable({
            onmove: function (event) {
                const target = event.target;

                const dataX = target.getAttribute('data-x');
                const dataY = target.getAttribute('data-y');
                const initialX = parseFloat(dataX) || 0;
                const initialY = parseFloat(dataY) || 0;

                const deltaX = event.dx;
                const deltaY = event.dy;

                const newX = initialX + deltaX;
                const newY = initialY + deltaY;

                target
                    .style
                    .transform = `translate(${newX}px, ${newY}px)`;

                target.setAttribute('data-x', newX);
                target.setAttribute('data-y', newY);
            },

            listeners: { move: window.dragMoveListener },
           
        })
}

function addMyVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    createVideoContainer()
    let myVideoContainer = document.getElementById('my-video-container')
    myVideoContainer.append(video)

}

// Create video container
function createVideoContainer(userId = 'my-video-container') {
    let div = document.createElement('div')
    div.classList.add('video-container', 'shadow-sm', 'rounded')

    let videoId = userId + '-video'

    if (userId != 'my-video-container') {
        div.setAttribute("id", videoId)
    } else {
        div.setAttribute("id", userId)
    }


    let span = document.createElement('span')
    span.style.width = "20px"
    span.style.height = "20px"
    div.appendChild(span)

    let closeIcon = document.createElement('i')
    span.appendChild(closeIcon)
    closeIcon.style.color = "white"
    closeIcon.classList.add('fas', 'fa-times-circle')
    closeIcon.setAttribute('id', 'close-icon');

    span.style.cursor = "pointer"
    span.style.position = 'absolute'
    span.style.zIndex = '1'

    content.appendChild(div)
    makeResizableDraggable(div)

    span.addEventListener('click', () => {
        let closeIcon = document.getElementById('close-icon')

        closeIcon.remove();

        if (userId === 'my-video-container') {
            var videoContainer = document.getElementById(userId)
            videoContainer.remove();
            turnOffCam()
            socket.emit('webcam-off')
        } else {

            var videoContainer = document.getElementById(videoId)
            videoContainer.remove();
            if (peers[userId]) peers[userId].close()


        }


        videoContainer.remove();
        const liUser = getLiUser(userId);
        if (liUser) liUser.style.pointerEvents = ""



    })
}


// Get the li element of a specific user
function getLiUser(id) {
    const liUsersObj = userList.childNodes;

    for (i = 0; i < liUsersObj.length; i++) {
        if (liUsersObj[i].id === id) {
            return liUsersObj[i]
        }
    }

}

// function for add the cam icon to the li of a specific user
function addWebcamIcon(userId) {
    const liUser = getLiUser(userId);
    if (liUser) liUser.style.pointerEvents = ""

    const camIcon = document.createElement('i');
    camIcon.classList.add('fas', 'fa-video', 'ml-2')
    camIcon.style.color = 'red'


    liUser.appendChild(camIcon)
    liUser.style.cursor = 'pointer'
    liUser.addEventListener('click', () => {
        callUser(userId)

    })
}

// listen to event for add the cam icon to the li of a specific user
socket.on('add-webcam-icon', userId => {
    addWebcamIcon(userId)

})

// remove cam icon, video container called
socket.on('remove-webcam-icon-stream-called', userId => {
    const liUser = getLiUser(userId);

    let camIcon = liUser.getElementsByClassName("fa-video")[0];
    if (camIcon) {
        camIcon.remove();
    }

    liUser.style.cursor = '';
    const liUserClone = liUser.cloneNode(true); // clone the element without eventListeners to replace the old element

    liUser.parentNode.replaceChild(liUserClone, liUser);// Now the Li is without eventListeners

    removeVideoContainerCalled(userId);
})

// function to remove video container called
function removeVideoContainerCalled(userId) {
    let videoContainer = document.getElementById(userId + '-video')
    if (videoContainer) {
        videoContainer.remove()
        //if (peers[userId]) peers[userId].close()
    }
}


function callUser(userId) {
    let liUser = getLiUser(userId);
    liUser.style.pointerEvents = "none"
    const emptyStream = createEmptyMediaStream()
    const call = myPeer.call(userId, emptyStream)

    const video = document.createElement('video')
    call.on('stream', userVideoStream => {

        addVideoStreamCalled(video, userVideoStream, userId)

    })

    call.on('close', () => {
        removeVideoContainerCalled(userId)
    })

    peers[userId] = call // Link user id with the call it make
}

function addVideoStreamCalled(video, stream, userId) {
    createVideoContainer(userId)
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    let videoId = userId + '-video'
    let videoCalledContainer = document.getElementById(videoId)
    videoCalledContainer.append(video)

}


// Create empty media stream
function createEmptyMediaStream() {
    return new MediaStream([createEmptyAudioTrack(), createEmptyVideoTrack({ width: 0, height: 0 })]);
}

const createEmptyAudioTrack = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    const track = dst.stream.getAudioTracks()[0];
    return Object.assign(track, { enabled: false });
}

const createEmptyVideoTrack = ({ width, height }) => {
    const canvas = Object.assign(document.createElement('canvas'), { width, height });

    canvas.getContext('2d').fillRect(0, 0, width, height);

    const stream = canvas.captureStream();
    const track = stream.getVideoTracks()[0];

    return Object.assign(track, { enabled: false });
};