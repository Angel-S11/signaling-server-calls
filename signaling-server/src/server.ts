import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Gestión de eventos de conexión
io.on('connection', (socket: Socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // Evento: Unir al usuario a su sala única (basada en su ID)
  socket.on('join-user', (userId: string) => {
    if (!userId) {
      console.error('Error: ID de usuario no proporcionado.');
      return;
    }
    socket.join(userId); // Unir al usuario a una sala basada en su ID único
    console.log(`Usuario ${socket.id} unido a su sala personal: ${userId}`);
  });

  // Evento: Enviar oferta
  socket.on(
    'offer',
    ({
      target,
      offer,
      sender,
    }: {
      target: string;
      offer: RTCSessionDescriptionInit;
      sender: { id: string; name: string; image: string };
    }) => {
      console.log(`Oferta recibida de ${sender.id} (${sender.name}) para ${target}`);
      // Emitir la oferta directamente al usuario objetivo
      socket.to(target).emit('offer', { offer, sender });
    }
  );

  // Evento: Enviar respuesta
  socket.on(
    'answer',
    ({ target, answer }: { target: string; answer: RTCSessionDescriptionInit }) => {
      console.log(`Respuesta recibida para ${target}`);
      // Emitir la respuesta directamente al usuario objetivo
      socket.to(target).emit('answer', { answer });
    }
  );

  // Evento: Recibir candidato ICE
  socket.on(
    'ice-candidate',
    ({ target, candidate }: { target: string; candidate: RTCIceCandidateInit }) => {
      console.log(`Candidato ICE recibido de ${socket.id} para ${target}: `, candidate);
      socket.to(target).emit('ice-candidate', { candidate });
    }
  );

  // Evento: Terminar llamada
  socket.on('end-call', (target: string) => {
    console.log(`Llamada terminada para el usuario: ${target}`);
    // Emitir el evento de finalización de llamada directamente al usuario objetivo
    socket.to(target).emit('end-call');
  });

  // Evento: Desconexión del usuario
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.id}`);
    io.emit('user-disconnected', socket.id);
  });
});

// Ruta base para probar el servidor
app.get('/', (req: Request, res: Response) => {
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