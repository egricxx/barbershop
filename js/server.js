#!/usr/bin/env node

const express = require("express");
const http = require("http");
const debug = require("debug")("your-app-name:server");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

app.use(cors()); // Включаем CORS
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Сервер работает!");
});

// Создаем HTTP-сервер
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:63342", // Укажите ваш фронтенд-URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Обработка соединений сокетов
io.on("connection", (socket) => {
  console.log("Новый пользователь подключен");

  socket.on("send", (message) => {
	console.log("Получено новое сообщение " + message)
    // Отправляем сообщение всем клиентам
    io.emit("receiveMessage", {
      id: socket.id,
      text: message,
      username: "Пользователь",
    });
  });

  socket.on("disconnect", () => {
    console.log("Пользователь отключился");
  });
});

// Запуск сервера
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

// Функция нормализации порта
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

// Обработка ошибок
function onError(error) {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " требует повышенных привилегий");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " уже используется");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Логирование при запуске
function onListening() {
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  debug("Слушаем на " + bind);
}
