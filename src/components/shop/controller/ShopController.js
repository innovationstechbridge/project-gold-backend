import ShopModel from "../model/ShopModel.js";
import ShopMetaModel from "../model/ShopMetaModel.js";
import db from "../../../config/db.js";

const fetchShops = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let perPage = parseInt(req.query.perPage) || 10;

    let sort = req.query.sort || "asc";

    let offset = (page - 1) * perPage;
    let data = await ShopModel.findAll({
      include: [{ model: ShopMetaModel, as: "meta" }],
      order: [["id", sort.toUpperCase()]],
      limit: perPage,
      offset: offset,
    });

    let totalCount = await ShopModel.count({
      include: [
        {
          model: ShopMetaModel,
          as: "meta",
        },
      ],
    });

    let totalPages = Math.ceil(totalCount / perPage);
    let pagination = {
      currentPage: page,
      totalPages: totalPages,
      perPage: perPage,
      totalCount: totalCount,
    };
    return res.status(200).json({
      status: 200,
      data: data,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: `Server error : ${error}`,
    });
  }
};

const addShop = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    let { shop_name, shop_address, shop_contact, shop_reg_no, meta } = req.body;

    let shop = await ShopModel.create(
      {
        shop_name,
        shop_address,
        shop_contact,
        shop_reg_no,
      },
      {
        transaction: t,
      }
    );

    const metaData = meta.map((m) => ({
      shop_id: shop.id,
      meta_key: m.meta_key,
      meta_value: m.meta_value,
    }));

    const shopMeta = await ShopMetaModel.bulkCreate(metaData, {
      transaction: t,
    });

    await t.commit();

    return res.status(201).json({
      status: 201,
      data: { shop, shopMeta },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: `Server error : ${error}`,
    });
  }
};

const deleteShop = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { shopId } = req.query;

    // Delete associated metadata
    await ShopMetaModel.destroy({
      where: { shop_id: shopId },
      transaction: t,
    });

    // Delete the shop itself
    await ShopModel.destroy({
      where: { id: shopId },
      transaction: t,
    });

    await t.commit();

    return res.status(200).json({
      status: 200,
      message: "Shop and associated metadata deleted successfully.",
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      status: 500,
      error: `Server error: ${error.message}`,
    });
  }
};

const updateShop = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { shopId } = req.query;
    const { shop_name, shop_address, shop_contact, shop_reg_no, meta } =
      req.body;

    // Update shop details
    const shop = await ShopModel.update(
      {
        shop_name,
        shop_address,
        shop_contact,
        shop_reg_no,
      },
      {
        where: { id: shopId },
        transaction: t,
      }
    );

    if (!shop[0]) {
      await t.rollback();
      return res.status(404).json({
        status: 404,
        message: "Shop not found",
      });
    }

    // Update shop metadata
    if (meta && meta.length) {
      // Delete existing metadata
      await ShopMetaModel.destroy({
        where: { shop_id: shopId },
        transaction: t,
      });

      // Add new metadata
      const metaData = meta.map((m) => ({
        shop_id: shopId,
        meta_key: m.meta_key,
        meta_value: m.meta_value,
      }));

      await ShopMetaModel.bulkCreate(metaData, {
        transaction: t,
      });
    }

    await t.commit();

    return res.status(200).json({
      status: 200,
      message: "Shop and associated metadata updated successfully.",
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      status: 500,
      error: `Server error: ${error.message}`,
    });
  }
};

export default { fetchShops, addShop, deleteShop, updateShop };
