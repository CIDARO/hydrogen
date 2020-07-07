<div align="center">
  <br/>
  <img src="./hydrogen.png" width="200" />
  <br/>
  <br/>
  <p>
    Open Source web framework for Deno.
  </p>
  <p>
    version 0.1.0
  </p>
  <br/>
  <p>
    <a href="#status"><strong>Status</strong></a> ·
    <a href="#description"><strong>Description</strong></a> ·
    <a href="#usage"><strong>Usage</strong></a> ·
    <a href="#contributing"><strong>Contributing</strong></a>
  </p>
</div>

---

## Status

**Hydrogen** is currently in **0.1.0**.

---

## Description

**Hydrogen** is an Open Source web framework for Deno inspired by the following repositories:
- <a href="https://github.com/expressjs/express" target="_blank">ExpressJS</a>;
- <a href="https://github.com/NMathar/deno-express" target="_blank">deno-express</a>;
- <a href="https://github.com/jinjor/deno-playground/tree/master/expressive" target="_blank">expressive</a>.

---

## Usage

### Import Hydrogen

In order to import Hydrogen in your Deno code you must import it at the top:

```typescript
import { Hydrogen } from "https://raw.githubusercontent.com/CIDARO/hydrogen/master/mod.ts";
```

### Create new app

After you've imported Hydrogen, initialize it with the following code:

```typescript
const app = Hydrogen();
```

### Add routes

When you create a new Hydrogen instance, you can add routes to the application in the following way: 

```typescript
app.get('/', async (req, res) => console.log('Hello World!')); // GET method route
app.post('/post', async (req, res) => console.log('This is a POST request!')); // POST method route
app.put('/put', async (req, res) => console.log('PUT request...')); // PUT method route
app.delete('/delete', async (req, res) => console.log('DELETE something!')); // DELETE method route
app.patch('/patch', async (req, res) => console.log('PATCH this!')); // PATCH method route
app.all('/all', async (req, res) => console.log('Accepts GET, POST, PUT, DELETE and PATCH!')); // ALL methods route
```

You can also chain routes together:

```typescript
app.get('/', async (req, res) => /* do something */).post('/test', async (req, res) => /* do something */)
```

### Add middlewares

Like express apps, Hydrogen apps too support middlewares. You can use the default middlewares or create your own:

```typescript
app.enableCors({origin: '*', methods: 'GET,POST,PUT,DELETE,PATCH', preflight: true, successStatus: 204}); // Enables cors middleware
app.enableLog(true); // Enables log middleware with emojis
app.enableLog() // Enables log middleware without emojis
```

If you want to create your own middleware you can do it in the following way:

```typescript
const middleware: Middleware = async (req: Request, res: Response, next: Next): Promise<void> => {
    /* Do something in your middleware */
    next(); // or await next();
}

app.use(middleware);
```

### Body parsers

If you want to enable body parsers you have the following options: `application/json` and `application/x-www-form-urlencoded`.

```typescript
app.parseJson(); // parses application/json bodies
app.parseUrlencoded(); // parses application/x-www-form-urlencoded bodies
```

### Start the application

After you've done with your application setup you can start listening for requests:

```typescript
app.listen(PORT, HOSTNAME); // without TLS
app.listenTLS(PORT, HOSTNAME, CERT_FILE, KEY_FILE); // with TLS (CERT_FILE and KEY_FILE are paths for the respective cert and key file)
```

The `listen` function returns an object `{port: PORT, close: Function}`:
- The `port` where the app is listening to;
- The `close` function to stop the application.

### Events

A Hydrogen application emits some events that you can subscribe to by using its emitter:

```typescript
const { emitter } = app;

emitter.on('start', (obj: {port: number, hostname: string}) => /* emitted when the app starts */);
emitter.on('request', (request: Request) => /* emitted when a new request is received */);
emitter.on('middleware', (middleware: Middleware) => /* emitted when a middleware is executed */);
emitter.on('response', (response: Response) => /* emitted when a response is created */);
emitter.on('stop', (res: boolean) => /* emitted when the app stops */);
```

---

## Contributing

We welcome community contributions!

Please check out our <a href="https://github.com/CIDARO/hydrogen/issues">open issues</a> to get started.

If you discover something that could potentially impact security, please notify us immediately by sending an e-mail at <a href="mailto:support@cidaro.com">support@cidaro.com</a>. We'll get in touch with you as fast as we can!
