// 服务端
const express = require('express')
const app = express()
app.use(express.static(__dirname))

// 基于http协议连接
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const SYSTEM = '系统'
// 用来保存对应的socket，就是记录对方的socket实例
let socketObj = {};
// 上来记录一个socket.id用来查找对应的用户
let mySocket = {};
// 创建一个数组用来保存最近的20条消息记录，真实项目中会存到数据库中
let msgHistory = [];
let userColor = ['#00a1f4', '#0cc', '#f44336', '#795548', '#e91e63', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ffc107', '#607d8b', '#ff9800', '#ff5722'];

// 打乱数组
function shuffle(arr) {
    let len = arr.length
    let random
    while (len !== 0) {
        // 右移位运算符向下取整
        random = (Math.random() * len--) >>> 0;
        // 解构赋值实现变量互换
        [arr[len], arr[random]] = [arr[random], arr[len]];
    }
    return arr;
}
// 服务端处理传过来的消息
io.on('connection', socket => {
    let username;
    let color;
    let rooms = [];
    mySocket[socket.id] = socket;
    socket.on('message', msg => {
        if (username) {
            // 正则判断消息是否为私聊专属
            let private = msg.match(/@([^ ]+) (.+)/);

            // 私聊消息
            if (private) {
                let toUser = private[1];
                let content = private[2];
                // 从socketObj中获取私聊用户的socket
                let toSocket = socketObj[toUser]

                if (toSocket) {
                    // 向私聊的用户发消息
                    toSocket.send({
                        user: username,
                        color,
                        content,
                        createAt: new Date().toLocaleString()
                    })
                }
            } else {
                // 如果rooms数组有值，就代表有用户进入了房间
                if (rooms.length) {
                    // 用来存储进入房间内的对应的socket.id
                    let socketJson = {};
                    rooms.forEach(room => {
                        socketJson = Array.from(io.sockets.adapter.rooms.get(room));
                        Object.keys(socketJson).forEach(socketId => {
                            // 进行一个去重，在socketJson中只有对应唯一的socketId
                            if (!socketJson[socketId]) {
                                socketJson[socketId] = 1;
                            }
                        })
                    })

                    // 遍历socketJson,在mySocket里找到对应的id，然后发送消息
                    socketJson.forEach(socketId => {
                        mySocket[socketId].emit('message', {
                            user: username,
                            color,
                            content: msg,
                            createAt: new Date().toLocaleString()
                        })
                    })
                } else { // 公聊消息
                    io.emit('message', {
                        user: username,
                        color,
                        content: msg,
                        createAt: new Date().toLocaleString()
                    })
                    msgHistory.push({
                        user: username,
                        color,
                        content: msg,
                        createAt: new Date().toLocaleString()
                    })
                }
            }
        } else { // 用户名不存在的情况
            username = msg;
            color = shuffle(userColor)[0];

            socket.broadcast.emit('message', {
                user: SYSTEM,
                color,
                content: `${username} 加入了聊天！`,
                createAt: new Date().toLocaleString()
            })
            // 把socketObj对象上对应的用户名赋一个socket
            socketObj[username] = socket;
        }
    })
    socket.on('join', room => {
        if (username && rooms.indexOf(room) === -1) {
            // socket.join表示进入某个房间
            socket.join(room);
            rooms.push(room);
            // 这里发送个joined事件，让前端监听后，控制房间按钮显隐
            socket.emit('joined', room);
            // 通知一下自己
            socket.send({
                user: SYSTEM,
                color,
                content: `你已加入频道${room}`,
                createAt: new Date().toLocaleString()
            })
        }
    })
    socket.on('leave', room => {
        if (rooms.indexOf(room) !== -1) {
            socket.leave(room);
            rooms.splice(rooms.indexOf(room), 1)
            socket.emit('leaved', room);
            // 通知一下自己
            socket.send({
                user: SYSTEM,
                color,
                content: `你已离开频道${room}`,
                createAt: new Date().toLocaleString()
            })
        }
    })
    socket.on('getHistory', () => {
        // 通过数组的slice方法截取最新的20条消息
        if (msgHistory.length) {
            let history = msgHistory.slice(msgHistory.length - 20);
            // 发送history事件并返回history消息数组给客户端
            socket.emit('history', history)
        }
    })
})

server.listen(4000)