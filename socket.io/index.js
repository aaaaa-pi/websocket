// 客户端
let socket = io();
socket.on('connect', () => {
    console.log('连接成功~');
    // 向服务器发getHistory来拿消息
    socket.emit('getHistory');
})

// 客户端发送消息
let input = document.getElementById('input'),
    list = document.getElementById('list'),
    sendBtn = document.getElementById('sendBtn');

function send() {
    let value = input.value
    if (value) {
        socket.emit('message', value)
        input.value = ''
        console.log('已发送内容给服务端~');
    } else {
        alert('不能发送空的内容!')
    }
}
// 发送键发送消息
sendBtn.onclick = send;

// 回车键发送消息
function enterSend(event) {
    let code = event.keyCode
    if (code === 13) send()
}

input.onkeydown = function (event) {
    enterSend(event)
}

// 将@用户名这样的格式设置在了输入框中
function privateChat(event) {
    let target = event.target
    let user = target.innerHTML
    if (target.className === 'user') {
        input.value = `@${user}`
    }
}
// 点击进行私聊
list.onclick = function (event) {
    privateChat(event);
}

// 进入房间
function join(room) {
    socket.emit('join', room)
}
// 监听是否进入房间
socket.on('joined', room => {
    document.getElementById(`join-${room}`).style.display = 'none';
    document.getElementById(`leave-${room}`).style.display = 'inline-block';
})
// 离开房间的方法
function leave(room) {
    socket.emit('leave', room)
}
// 监听是否离开房间
socket.on('leaved', room => {
    document.getElementById(`leave-${room}`).style.display = 'none';
    document.getElementById(`join-${room}`).style.display = 'inline-block';
})

// 监听message事件来接收服务端发来的消息
socket.on('message', data => {
    let li = document.createElement('li')
    li.className = 'list-group-item'
    li.innerHTML = `
    <p style="color: #ccc;">
        <span class="user" style="color:${data.color}">${data.user}</span>
        ${data.createAt}
    </p>
    <p class="content" style="background:${data.color}">${data.content}</p>
    `;
    list.appendChild(li)
    list.scrollTop = list.scrollHeight
})

// 接收历史消息
socket.on('history', history => {
    let html = history.map(data => {
        return `<li class="list-group-item">
            <p style="color: #ccc">
                <span class="user" style="color:${data.color}">${data.user}</span>
                ${data.createAt}
            </p>
            <p class="content" style="background-color:${data.color}">${data.content}</p>
        </li>`
    }).join('');
    list.innerHTML = html + '<li style="margin: 16px 0;text-align: center">以上是历史消息</li>'
    list.scrollTop = list.scrollHeight
})