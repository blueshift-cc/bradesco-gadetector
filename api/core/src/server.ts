import express, { Response, Request } from "express";
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from "node-fetch";

const allowedOrigins = ['http://localhost:3000', 'http://localhost:81', 'https://gadetector.bohr.io', 'https://gadetector.blueshift.cc'];

const options: cors.CorsOptions = {
  origin: allowedOrigins
};

var app = express();
app.use(cors(options));
app.use(bodyParser.json({ limit: "100mb" }))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }))

async function isGA3(data: any) {
  const regexTag = /(['"]UA-[a-zA-Z0-9-]*['"])/m;
  let m;

  const tag = data.match(regexTag);

  if (tag?.length > 0) {
    return tag[0];
  }
  return null;
}

async function isGA4(data: any) {
  const regexTag = /(['"]GTM-[a-zA-Z0-9]*['"])/m;
  let m;

  const tag = data.match(regexTag);

  if (tag?.length > 0) {
    return tag[0];
  }
  return null;
}

app.get("/", function (req: Request, res: Response) {
  res.send("Hello world");
});

app.post("/process", async function (req: Request, res: Response) {
  // console.log(req);
  // res.send("ok");
  // return;
  const urls = req.body?.urlTextArea.split(";");
  var responseData = [];
  for (let i = 0; i < urls.length; i++) {
    const servers = await fetch(urls[i]);
    const data = await servers.text();
    const is_ga3 = await isGA3(data);
    const is_ga4 = await isGA4(data);

    if (is_ga3 != null) {
      responseData.push({ "url": urls[i], "version": 3, tag: is_ga3 });
    }
    if (is_ga4 != null) {
      responseData.push({ "url": urls[i], "version": 4, tag: is_ga4 });
    }
    if (is_ga3 == null && is_ga4 == null) {
      responseData.push({ "url": urls[i], "version": 0, tag: 'sem_tag' });
    }
  }
  res.json(responseData);
});

if (!module.parent) {
  app.listen(3000);
  console.log("Express started on port 3000");
}

export default app;
