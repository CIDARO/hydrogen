import { Hydrogen } from './mod.ts';

const app = Hydrogen();

app.cors();

app.get('/', async (req, res) => {
    console.log(req);
    console.log(res);
})

app.listen(3000, "127.0.0.1");