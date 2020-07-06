import * as path from "https://deno.land/std/path/mod.ts";
import * as http from "https://deno.land/std/http/server.ts";
import {bodyReader} from "https://deno.land/x/std/http/_io.ts";
import { lookup } from "https://deno.land/x/media_types/mod.ts";

export { path, http, bodyReader, lookup };