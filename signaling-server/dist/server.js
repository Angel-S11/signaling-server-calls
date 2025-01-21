"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Gestión de eventos de conexión
io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);
    // Evento: Unir al usuario a su sala única (basada en su ID)
    socket.on('join-user', (userId) => {
        if (!userId) {
            console.error('Error: ID de usuario no proporcionado.');
            return;
        }
        socket.join(userId); // Unir al usuario a una sala basada en su ID único
        console.log(`Usuario ${socket.id} unido a su sala personal: ${userId}`);
    });
    // Evento: Enviar oferta
    socket.on('offer', ({ target, offer, sender, }) => {
        console.log(`Oferta recibida de ${sender.id} (${sender.name}) para ${target}`);
        // Emitir la oferta directamente al usuario objetivo
        socket.to(target).emit('offer', { offer, sender });
    });
    // Evento: Enviar respuesta
    socket.on('answer', ({ target, answer }) => {
        console.log(`Respuesta recibida para ${target}`);
        // Emitir la respuesta directamente al usuario objetivo
        socket.to(target).emit('answer', { answer });
    });
    // Evento: Recibir candidato ICE
    socket.on('ice-candidate', ({ target, candidate }) => {
        console.log(`Candidato ICE recibido de ${socket.id} para ${target}`);
        // Emitir el candidato ICE directamente al usuario objetivo
        socket.to(target).emit('ice-candidate', { candidate });
    });
    // Evento: Terminar llamada
    socket.on('end-call', (target) => {
        console.log(`Llamada terminada para el usuario: ${target}`);
        // Emitir el evento de finalización de llamada directamente al usuario objetivo
        socket.to(target).emit('end-call');
    });
    // Evento: Desconexión del usuario
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
    });
});
// Ruta base para probar el servidor
app.get('/', (req, res) => {
    res.send('Servidor de señalización ejecutándose correctamente.');
});
// Manejo de errores globales
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada sin manejar:', reason);
});
// Iniciar el servidor
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Servidor de señalización ejecutándose en el puerto ${PORT}`);
});
