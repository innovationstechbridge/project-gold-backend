import express from "express";

const app = express();

app.get("/api", (req, res) => {
  return res.status(200).json({
    status: 200,
    message: "server is up",
  });
});

let server = app.listen(3000, () => {
  console.log("Server is working");
});

process.on("unhandledRejection", (error, promise) => {
  console.log(`Logged Error ${error}`);
  server.close(() => process.exit(1));
});
