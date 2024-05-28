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
  //g3 trackbradesco ou ga_event, ga.custom_event, qualquer label (exemplo "eventLabel:")
  const regexTag = /([=]GTM-[a-zA-Z0-9-]*['"])/gmi;
  const regexTracking = /trackbradesco\(.*\)|ga_event|ga.custom_event|eventLabel/gmi;
  let m;
  const tag = data.match(regexTag);
  const tracking = data.match(regexTracking);

  if (tag?.length > 0 && tracking?.length > 0) {
    return [tag[0], tracking];
  }

  return null;
}

async function isGA4(data: any) {
  //ga4 trackportal ou Event_Data
  const regexTag = /(['"]GTM-[a-zA-Z0-9]*['"])/gmi;
  const regexTracking = /trackportal\(.*\)|Event_Data/gmi;
  let m;

  const tag = data.match(regexTag);
  const tracking = data.match(regexTracking);

  if (tag?.length > 0 && tracking?.length > 0) {
    return [tag[0], tracking];
  }
  return null;
}

async function isGlobalJS(data: any) {
  const regexTag = /GlobalJS.js/gm;
  let m;

  const tag = data.match(regexTag);

  if (tag?.length > 0) {
    return tag[0];
  }
  return null;
}

async function isScriptBI(data: any) {
  const regexTag = /script_bi.js/gm;
  let m;

  const tag = data.match(regexTag);

  if (tag?.length > 0) {
    return tag[0];
  }
  return null;
}

async function isRedirect(data: any) {
  const regexTag = /Redirecionando,/gm;
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
        const is_ga3gtm: any = await isGA3GTM(data);
        const is_ga4: any = await isGA4(data);
        const is_globaljs = await isGlobalJS(data);
        const is_globalBI = await isScriptBI(data);
        const is_redirect = await isRedirect(data);

        if ((is_ga3 != null || is_ga3gtm != null) && is_ga4 == null) {
          let tags_ = [...new Set([is_ga3?.slice(1, -1), is_ga3gtm[0]?.slice(1, -1)].filter(n => n))];

          if (is_globaljs != null) {
            tags_ = [...new Set([is_ga3?.slice(1, -1), is_ga3gtm[0]?.slice(1, -1), "GTM-T9F3WZN"].filter(n => n))];
          }
          if (is_globalBI != null) {
            tags_ = [...new Set([is_ga3?.slice(1, -1), is_ga3gtm[0]?.slice(1, -1), "GTM-P5GGXJ8"].filter(n => n))];
          }

          const tag_ver = is_ga3 != null || (is_ga3gtm[1] != null) ? "3, 3" : "3";
          //const tag_ver = tags_.toString().indexOf('UA-') > -1 && tags_.length > 1 ? "3, 4" : tags_.length > 1 ? "4, 4" : "4";

          responseData.push({ "url": urlsDeDuplicated[i], "version": tag_ver, tag: tags_.toString(), tracking3: is_ga3gtm[1]?.toString(), tracking4: null, globalJS: is_globaljs, globalBI: is_globalBI });
        }
        else if ((is_ga3 != null || is_ga3gtm != null) && is_ga4 != null) {
          let tags_ = [...new Set([is_ga3?.slice(1, -1), is_ga3gtm[0]?.slice(1, -1), is_ga4[0]?.slice(1, -1)].filter(n => n))];

          if (is_globaljs != null) {
            tags_ = [...new Set([is_ga3?.slice(1, -1), is_ga3gtm[0]?.slice(1, -1), is_ga4[0]?.slice(1, -1), "GTM-T9F3WZN"].filter(n => n))];
          }
          if (is_globalBI != null) {
            tags_ = [...new Set([is_ga3?.slice(1, -1), is_ga3gtm[0]?.slice(1, -1), is_ga4[0]?.slice(1, -1), "GTM-P5GGXJ8"].filter(n => n))];
          }

          const tag_ver = is_ga3 != null || (is_ga3gtm[1] != null && is_ga4[1] != null) ? "3, 4" : "4";
          //const tag_ver = tags_.toString().indexOf('UA-') > -1 && tags_.length > 1 ? "3, 4" : tags_.length > 1 ? "4, 4" : "4";

          responseData.push({ "url": urlsDeDuplicated[i], "version": tag_ver, tag: tags_.toString(), tracking3: is_ga3gtm[1]?.toString(), tracking4: is_ga4[1]?.toString(), globalJS: is_globaljs, globalBI: is_globalBI });
        }
        else {
          if (is_ga3 != null) {
            responseData.push({ "url": urlsDeDuplicated[i], "version": 3, tag: is_ga3.slice(1, -1), tracking3: null, tracking4: null, globalJS: is_globaljs, globalBI: is_globalBI });
          }
          else if (is_ga3gtm != null) {
            responseData.push({ "url": urlsDeDuplicated[i], "version": 4, tag: is_ga3gtm[0].slice(1, -1), tracking3: is_ga3gtm[1]?.toString(), tracking4: null, globalJS: is_globaljs, globalBI: is_globalBI });
          }
          else if (is_ga4 != null) {
            responseData.push({ "url": urlsDeDuplicated[i], "version": 4, tag: is_ga4[0].slice(1, -1), tracking3: null, tracking4: is_ga4[1]?.toString(), globalJS: is_globaljs, globalBI: is_globalBI });
          }
          else if (is_globaljs != null) {
            responseData.push({ "url": urlsDeDuplicated[i], "version": 4, tag: "GTM-T9F3WZN", tracking3: null, tracking4: null, globalJS: is_globaljs, globalBI: is_globalBI });
          }
        }

        if (is_redirect != null) {
          responseData.push({ "url": urlsDeDuplicated[i], "version": 0, tag: 'redirect', globalJS: is_globaljs, globalBI: is_globalBI });
        }
        else if (is_ga3 == null && is_ga3gtm == null && is_ga4 == null && is_globaljs == null) {
          responseData.push({ "url": urlsDeDuplicated[i], "version": 0, tag: 'sem_tag', globalJS: is_globaljs, globalBI: is_globalBI });
        }
      }).catch((e: any) => {
        console.log(e);
        responseData.push({ "url": urlsDeDuplicated[i], "version": 0, tag: 'offline', globalJS: 'offline' });
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
