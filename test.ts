import { Hydrogen } from './mod.ts';
import { Request } from './lib/request.ts';
import { Response } from './lib/response.ts';
import { Middleware } from './lib/types.ts';

const app = Hydrogen();

app
.enableCors()
.enableLog(true)
.get('/', async (req, res) => {
    console.log('lil')
})
.get('/test', async (req, res) => {
    console.log('lol')
})

app.listen(3000, "127.0.0.1");