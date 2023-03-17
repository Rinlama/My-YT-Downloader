require("dotenv").config();
const express = require("express");
const app = express();
const yt = require("yt-converter");
const fs = require("fs");
const path = require("path");

//onst router = require("./routes/route");

const cors = require("cors");

// open ai

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("client/dist"));
// route
app.use(cors({ origin: true, credentials: true }));
//app.use(router);

app.get("/info", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.status(500).send({
      message: "URL not provided",
      error: true,
    });
    return;
  }
  try {
    const info = await yt.getInfo(url);
    res.send(info);
  } catch (error) {
    res.status(500).send({
      message: "Id not found",
      error: true,
    });
  }
});

app.get("/getmp3", async (req, res) => {
  const url = req.query.url;
  const title = req.query.title;
  if (!url || !title) {
    res.status(500).send({
      message: "URL or Title not provided",
      error: true,
    });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // countdown(res, 1, 20);

  try {
    const tempTitle = title + "_" + Date.now();
    const data = yt.convertAudio(
      {
        url: url,
        itag: 140,
        directoryDownload: __dirname + "/mp3",
        title: tempTitle,
      },
      (data) => {
        const bufferArray = {
          progress: JSON.stringify(data),
          complete: false,
          filename: "",
        };
        res.write(JSON.stringify(bufferArray));
      },
      (close) => {
        const bufferArray = {
          progress: 100,
          complete: true,
          filename: tempTitle,
        };
        res.write(JSON.stringify(bufferArray));
        res.end();
      }
    );
  } catch (error) {
    res.status(500).send({
      message: JSON.stringify(error),
      error: true,
    });
  }
});

app.get("/download", function (request, res) {
  var filename = request.query.filename;

  if (!filename) {
    res.status(500).send({
      message: "filename not provided",
      error: true,
    });
    return;
  }

  var filePath = path.join("", `mp3/${filename}.mp3`);

  fs.stat(filePath, function (error, stats) {
    if (error) {
      res.send(error);
    } else {
      res.download(filePath, `${filename}.mp3`, function (err) {
        if (err) {
          console.log(err); // Check error if you want
        }
        fs.unlink(filePath, function () {
          console.log("File was deleted"); // Callback
          res.write("File removed.");
        });
      });
    }
  });
});

app.listen(3001, () => {
  console.log("Server is running " + 3001);
});
