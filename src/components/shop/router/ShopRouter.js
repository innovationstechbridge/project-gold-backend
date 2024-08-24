import express from "express";
import ShopController from "../controller/ShopController.js";

import {
  authenticateToken,
} from "../../authentication/helper/AuthHelper.js";

const sRoute = express.Router();

sRoute.get("/", authenticateToken, ShopController.fetchShops);
sRoute.post("/", authenticateToken, ShopController.addShop);
sRoute.delete("/", authenticateToken, ShopController.deleteShop);

export default sRoute;
