import Fastify from "fastify";
import { loadConfig } from "./utils";
import { imageRoute } from "./routes";
import fastifyCors from "@fastify/cors";


const app = Fastify({
   logger: true 
  }); 

  // Register CORS plugin
app.register(fastifyCors, {
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
});

app.register(imageRoute, {prefix: '/api/image'})

app.get('/', async (req, res) => {
  res.send({ message: 'Hello World' });
});

async function start() {
  try {
    
    loadConfig();
    await app.listen({ port: 8080 });
    console.log('Server running on http://localhost:8080');
    app.log.info('Server running on http://localhost:8080');


  } catch (error) {

    app.log.error(error);
    process.exit(1); 
    
  }
}

start();