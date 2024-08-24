import express from "express";
import multer from "multer";

import SignInController from "../controller/SignInController.js";
import SignUpController from "../controller/SignUpController.js";
import ipMiddleware from "../helper/IPHelper.js";

const aRoute = express.Router();
const upload = multer();

aRoute.use(ipMiddleware);

aRoute.post("/sign-in", upload.none(), SignInController.signInUser);
aRoute.post("/sign-up", upload.none(), SignUpController.signUpUser);

export default aRoute;
