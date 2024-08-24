import express from 'express';

const app = express();

app.get("/", (req, res) => {
    return res.status(200).json({
        status: 200,
        message: "server is up"
    })
});

app.listen(3000, () => {
    console.log("Server is working");
});