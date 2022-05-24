import { resolve } from "path";
import Progressbar from "progress";
import axios from "axios";
import { Readable, Writable } from "stream";
import https from "https";

import * as Lib from "../src";
import { createWriteStream, existsSync, mkdirSync } from "fs";

export interface ThreadifyOptions<T> extends Lib.ThreadifyOptions<T> {
  progress?: boolean;
}

const threadify = async <T, K>(
  fn: (data: T) => Promise<K>,
  threads: number,
  data: T[],
  options: ThreadifyOptions<T> = {},
): Promise<K[]> => {
  const progress = options.progress
    ? new Progressbar("%s [:bar] :percent :etas", {
        complete: "=",
        incomplete: " ",
        total: data.length,
        width: 80,
      })
    : undefined;

  return Lib.threadify(fn, threads, data, {
    ...options,
    onResolve: () => {
      progress?.tick();
    },
  });
};

const downloadFile = async (url: string, stream: Writable) => {
  const req = await axios({
    method: "get",
    url,
    responseType: "stream",
    httpsAgent: new https.Agent({ keepAlive: true }),
  });

  const totalBytes = parseInt(req.headers["content-length"]);

  const readable = req.data as Readable;
  readable.pipe(stream);

  return new Promise<number>((resolve, reject) => {
    stream.on("close", () => {
      resolve(totalBytes);
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
};

export const downloadExample = async (threads = 4) => {
  interface Item {
    url: string;
    filename: string;
  }

  const items: Item[] = [
    {
      url: "http://ipv4.download.thinkbroadband.com/5MB.zip",
      filename: "a-5mb.zip",
    },
    {
      url: "http://ipv4.download.thinkbroadband.com/10MB.zip",
      filename: "b-10mb.zip",
    },
    {
      url: "http://ipv4.download.thinkbroadband.com/5MB.zip",
      filename: "c-5mb.zip",
    },
    {
      url: "http://ipv4.download.thinkbroadband.com/5MB.zip",
      filename: "d-5mb.zip",
    },
    {
      url: "http://ipv4.download.thinkbroadband.com/5MB.zip",
      filename: "e-5mb.zip",
    },
    {
      url: "http://ipv4.download.thinkbroadband.com/5MB.zip",
      filename: "f-5mb.zip",
    },
    {
      url: "http://ipv4.download.thinkbroadband.com/5MB.zip",
      filename: "g-5mb.zip",
    },
  ];

  const dirPath = resolve(".downloads");

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  const saveFile = async ({ filename, url }: Item) => {
    const path = resolve(dirPath, filename);
    const stream = createWriteStream(path);
    const size = await downloadFile(url, stream);
    return { url, path, size };
  };

  const res = await threadify(saveFile, threads, items, {
    progress: true,
  });

  console.log(res);
};
