import express from "express";
import FeebbackController from "../controller/FeebbackController.js";

const app = express.Router();

app.get("/", FeebbackController.fetchItems);

export default app;
