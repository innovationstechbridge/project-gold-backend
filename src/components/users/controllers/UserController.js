import Joi from "joi";

import UserModel from "../model/UserModel.js";
import UserMetaModel from "../model/UserMetaModel.js";
import PasswordHelper from "../../authentication/helper/PasswordHelper.js";

import db from "../../../config/db.js";

const fetchUsers = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const perPage = parseInt(req.query.perPage) || 10; // Default to 10 users per page

    // Sorting parameters
    const sort = req.query.sort || "asc"; // Default to ascending order if not provided

    // Role parameter
    const role = req.query.role; // Role to filter users by

    // Calculate offset based on pagination
    const offset = (page - 1) * perPage;

    // Fetch users with pagination, including meta data, sorting, and role filtering
    let users = await UserModel.findAll({
      include: [
        {
          model: UserMetaModel,
          as: "meta",
          where: role ? { meta_key: "role", meta_value: role } : {}, // Filter by role if provided
        },
      ],
      order: [
        ["id", sort.toUpperCase()], // Sort by id in 'asc' or 'desc' order
      ],
      limit: perPage,
      offset: offset,
    });

    // Total count of users (for pagination info)
    const totalCount = await UserModel.count({
      include: [
        {
          model: UserMetaModel,
          as: "meta",
          where: role ? { meta_key: "role", meta_value: role } : {}, // Filter by role if provided
        },
      ],
    });

    // Format users data
    const formattedUsers = users.map((user) => ({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      meta: user.meta.map((meta) => ({
        meta_key: meta.meta_key,
        meta_value: meta.meta_value,
      })),
    }));

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / perPage);
    const pagination = {
      currentPage: page,
      totalPages: totalPages,
      perPage: perPage,
      totalCount: totalCount,
    };

    // Return response with formatted users and pagination metadata
    return res.status(200).json({
      status: 200,
      data: formattedUsers,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: error.message || "Internal Server Error",
    });
  }
};

const deleteUser = async (req, res) => {
  let userId = req.query.userId;
  const transaction = await db.sequelize.transaction();
  try {
    let user = await UserModel.findByPk(userId, { transaction });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    await UserMetaModel.destroy({
      where: { user_id: userId },
      transaction,
    });

    await user.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: "Users and associated records deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      error: err,
    });
  }
};

const passwordReset = async (req, res) => {
  try {
    const clientIp = req.clientIp;
    let email = req.query.email;

    let signInSchema = Joi.object({
      newPassword: Joi.string().min(8).required(),
      confirmPassword: Joi.string().min(8).required(),
    });

    const { error, value } = signInSchema.validate(req.body);

     // ----- Display error on the basis of schema
     if (error) {
      return res.status(400).json({
        status: 400,
        message: error.details[0].message,
      });
    }

    let { newPassword, confirmPassword  } = value;


    // check the password entered by user matched or not!
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 400,
        message: "Password did not matched",
      });
    }

    // search user existance of given email
    let user = await UserModel.findOne({
      where: {
        email,
      },
    });

    // check if we have data or not if null user does not exists
    if (user === null) {
      return res.status(400).json({
        status: 400,
        message: "User not found",
      });
    }

    // if user record is found, update his password
    newPassword = PasswordHelper.encryptPassword(newPassword);
    let updateValue = await UserModel.update(
      { password: newPassword },
      {
        where: {
          email,
        },
      }
    );

    if (updateValue[0] === 0) {
      return res.status(400).json({
        status: 400,
        message: "Use of same Password",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Password has been updated",
      clientIp
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: `Internal server error ${error}`,
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    let userEmail = req.body.email;

    await UserModel.update(
      {
        role: "admin",
      },
      {
        where: {
          email: userEmail,
        },
      }
    ).then(value);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: `Server error: ${error}`,
    });
  }
};

export default { fetchUsers, updateUserRole, passwordReset, deleteUser };
