import ShopMetaModel from "./ShopMetaModel.js";
import ShopModel from "./ShopModel.js";

ShopModel.hasMany(ShopMetaModel, {
  foreignKey: "shop_id",
  as: "meta",
});

ShopMetaModel.belongsTo(ShopModel, {
  foreignKey: "shop_id",
  as: "shop",
});

export default { ShopModel, ShopMetaModel };
