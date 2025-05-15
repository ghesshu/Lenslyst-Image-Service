import Fastify from "fastify";
import { loadConfig } from "./utils";
import { imageRoute } from "./routes";


const app = Fastify({
  //  logger: true 
  }); 

app.register(imageRoute, {prefix: '/api/image'})

app.get('/', async (req, res) => {
  res.send({ message: 'Hello World' });
});

async function start() {
  try {
    
    loadConfig();
    await app.listen({ port: 4000 });
    console.log('Server running on http://localhost:4000');
    app.log.info('Server running on http://localhost:4000');


  } catch (error) {

    app.log.error(error);
    process.exit(1); 
    
  }
}

start();