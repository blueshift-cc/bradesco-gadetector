import express, { Response, Request } from "express";
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from "node-fetch";

//const allowedOrigins = ['http://localhost:3000', 'http://localhost:80', 'https://gadetector.bohr.io', 'https://gadetector.blueshift.cc'];
const allowedOrigins = ['http://localhost:3000', 'http://localhost', 'http://localhost:81', 'https://gadetector.bohr.io', 'https://gadetector.blueshift.cc'];

const options: cors.CorsOptions = {
  origin: allowedOrigins
};

var app = express();
app.use(cors(options));
app.use(bodyParser.json({ limit: "100mb" }))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }))

function isValidHttpUrl(string: any) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

async function isGA3UA(data: any) {
  const regexTag = /(['"]UA-[a-zA-Z0-9-]*['"])/gm;
  let m;

  const tag = data.match(regexTag);

  if (tag?.length > 0) {
    return tag[0];
  }
  return null;
}

async function isGA3GTM(data: any) {
  const regexTag = /([=]GTM-[a-zA-Z0-9-]*['"])/gm;
  let m;

  const tag = data.match(regexTag);

  if (tag?.length > 0) {
    return tag[0];
  }
  return null;
}

async function isGA4(data: any) {
  const regexTag = /(['"]GTM-[a-zA-Z0-9]*['"])/gm;
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

  var responseData: any = [];

  try {
    const urTextArea: String = req.body?.urlTextArea;

    const urls: string[] = urTextArea.split(/[;\n ]/);

    const urlsDeDuplicated = [...new Set(urls)];

    for (let i = 0; i < urlsDeDuplicated.length; i++) {

      if (!isValidHttpUrl(urlsDeDuplicated[i])) {
        continue;
      }
      await fetch(urlsDeDuplicated[i]).then(async (response: any) => {
        const data = await response.text();
        const is_ga3 = await isGA3UA(data);
        const is_ga3gtm = await isGA3GTM(data);
        const is_ga4 = await isGA4(data);

        if ((is_ga3 != null || is_ga3gtm != null) && is_ga4 != null) {
          responseData.push({ "url": urlsDeDuplicated[i], "version": "3, 4", tag: [...new Set([is_ga3?.slice(1, -1), is_ga3gtm?.slice(1, -1), is_ga4?.slice(1, -1)].filter(n => n))].toString() });

        }
        else {
          if (is_ga3 != null) {
            responseData.push({ "url": urlsDeDuplicated[i], "version": 3, tag: is_ga3.slice(1, -1) });
          }
          if (is_ga3gtm != null) {
            responseData.push({ "url": urlsDeDuplicated[i], "version": 3, tag: is_ga3gtm.slice(1, -1) });
          }
          if (is_ga4 != null) {
            responseData.push({ "url": urlsDeDuplicated[i], "version": 4, tag: is_ga4.slice(1, -1) });
          }
        }

        if (is_ga3 == null && is_ga3gtm == null && is_ga4 == null) {
          responseData.push({ "url": urlsDeDuplicated[i], "version": 0, tag: 'sem_tag' });
        }
      }).catch((e: any) => {
        console.log(e);
        responseData.push({ "url": urlsDeDuplicated[i], "version": 0, tag: 'offline' });
      });
    }
    res.json(responseData);
  }
  catch (e) {
    res.status(500);
    res.send(JSON.stringify(e));
    return;
  }
});

if (!module.parent) {
  app.listen(3000);
  console.log("Express started on port 3000");
}

export default app;
