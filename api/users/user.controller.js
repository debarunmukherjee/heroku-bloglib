const {validationResult} = require('express-validator');
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const { sign } = require("jsonwebtoken");
const {
	getUserByUserEmail,
	createNewUser,
	getUserById,
	updateUserRole,
	getAllAdminUsers
} = require("./user.service");
const {getArticlesToBeApproved} = require('../article/article.service');
const {ADMIN, VIEWER} = require('../../constants/role');

module.exports = {
	createUser: (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				success: false,
				message: "Invalid data",
				errors: errors.array()
			});
		}
		const body = req.body;
		const salt = genSaltSync(10);
		body.password = hashSync(body.password, salt);
		createNewUser(body, async (err, result) => {
			if (err) {
				console.log(err);
				return res.status(500).json({
					success: 0,
					message: "Some server error occurred"
				});
			}
			const newUserId = result.insertId;
			result = await getUserById(newUserId);
			result.password = undefined;
			result.dob = undefined;
			const token = sign(
				{userData: result},
				process.env.JWT_SECRET,
				{
					expiresIn: "1h"
				}
			);
			return res
				.cookie(
					"access_token",
					token,
					{
						httpOnly: true,
						maxAge: 60 * 60 * 1000,
					}
				)
				.status(200)
				.json({
					success: 1,
					message: "Registered successfully",
					data: result,
				});
		});
	},
	checkIfUserCanProceedTo2FA: (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				success: false,
				message: "Invalid data",
				errors: errors.array()
			});
		}
		const body = req.body;
		getUserByUserEmail(body.email, (err, result) => {
			if (err) {
				console.log(err);
				return res.status(500).json({
					success: 0,
					message: "Some server error occurred",
					data: undefined,
				});
			}
			if (!result) {
				return res.status(400).json({
					success: 0,
					message: "Invalid email or password",
					data: undefined,
				});
			}
			const pass_matched = compareSync(body.password, result.password);
			if (pass_matched) {
				const token = sign(
					{ userId: result.id },
					process.env.JWT_SECRET,
					{
						expiresIn: "1h"
					}
				);
				return res
					.cookie(
						"two_fa_token",
						token,
						{
							httpOnly: true,
							maxAge: 10 * 60 * 1000,
						}
					)
					.status(200)
					.json({
						success: 1,
						message: "Password matched successfully",
						data: undefined,
					});
			} else {
				return res.status(400).json({
					success: 0,
					message: "Invalid email or password",
					data: undefined,
				});
			}
		});
	},
	login: (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				success: false,
				message: "Invalid data",
				errors: errors.array()
			});
		}
		const body = req.body;
		getUserByUserEmail(body.email, (err, result) => {
			if (err) {
				console.log(err);
				return res.status(500).json({
					success: 0,
					message: "Some server error occurred"
				});
			}
			if (!result) {
				return res.status(400).json({
					success: 0,
					message: "Invalid credentials"
				});
			}
			const pass_matched = compareSync(body.password, result.password);
			if (pass_matched && result.dob === body.dob) {
				result.password = undefined;
				result.dob = undefined;
				const token = sign(
					{ userData: result },
					process.env.JWT_SECRET,
					{
						expiresIn: "1h"
					}
				);
				return res
					.cookie(
						"access_token",
						token,
						{
							httpOnly: true,
							maxAge: 60 * 60 * 1000,
						}
					)
					.clearCookie("two_fa_token")
					.status(200)
					.json({
						success: 1,
						message: "Logged in successfully",
						data: result,
					});
			} else {
				return res.status(400).json({
					success: 0,
					message: "Invalid credentials"
				});
			}
		});
	},
	logout: (req, res) => {
		return res
			.clearCookie("access_token")
			.clearCookie("two_fa_token")
			.status(200)
			.json({ success: 1, message: "Successfully logged out" });
	},
	getUserDetails: (req, res) => {
		res.status(200).json({
			success: 1,
			message: "Data fetched successfully",
			data: req.userData,
		});
	},
	grantAdminRole: async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				success: false,
				message: "Invalid data",
				errors: errors.array()
			});
		}
		const  result = await updateUserRole(req.body.email, ADMIN);
		if (result) {
			return res.status(200).json({
				success: 1,
				message: 'Role updated successfully',
				data: undefined
			});
		}
		return res.status(500).json({
			success: 0,
			message: 'Some server error occurred',
			data: undefined
		});
	},
	revokeAdminRole: async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				success: false,
				message: "Invalid data",
				errors: errors.array()
			});
		}
		const  result = await updateUserRole(req.body.email, VIEWER);
		if (result) {
			return res.status(200).json({
				success: 1,
				message: 'Role updated successfully',
				data: undefined
			});
		}
		return res.status(500).json({
			success: 0,
			message: 'Some server error occurred',
			data: undefined
		});
	},
	getSuperadminData: async (req, res) => {
		const articlesToBeApproved = await getArticlesToBeApproved();
		const adminUsers = await getAllAdminUsers();
		if (articlesToBeApproved === false || adminUsers === false) {
			return res.status(500).json({
				success: 0,
				message: 'Some server error occurred',
				data: undefined
			});
		}
		return res.status(200).json({
			success: 1,
			message: 'Admin data fetched successfully',
			data: {
				articlesToBeApproved,
				adminUsers
			}
		});
	}
};
