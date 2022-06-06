const router = require("express").Router();
const { authorized, unAuthorized, twoFAStepAuthorization, superAdminAuthorized} = require("../../middlewares/auth");
const {check} = require('express-validator');
const { createUser, login, logout, getUserDetails, checkIfUserCanProceedTo2FA, grantAdminRole, getSuperadminData, revokeAdminRole } = require("./user.controller");
const {checkEmailIsInUse, getSuperadminDetails} = require("./user.service");

router.post(
	"/register",
	[
		unAuthorized,
		check('fullname').not().isEmpty().withMessage('Full name cannot be empty'),
		check('email')
			.not().isEmpty().withMessage('Email cannot be empty')
			.isEmail().withMessage('Invalid email provided')
			.custom(value => {
				return checkEmailIsInUse(value).then(res => {
					if (res) {
						return Promise.reject('E-mail already in use');
					}
				})
			}),
		check('password')
			.not().isEmpty().withMessage('Password field cannot be empty')
			.custom((value, {req}) => {
				if (value !== req.body.confirmPassword) {
					throw new Error("Passwords don't match");
				} else {
					return value;
				}
			}),
		check('dob').not().isEmpty().withMessage('Date of birth cannot be empty')
	],
	createUser
);

router.post(
"/login",
	[
		unAuthorized,
		check("email")
			.not().isEmpty().withMessage('Email cannot be empty')
			.isEmail().withMessage('Invalid email provided'),
		check('password')
			.not().isEmpty().withMessage('Password field cannot be empty')
	],
	checkIfUserCanProceedTo2FA
);

router.post(
	"/login-2fa",
	[
		twoFAStepAuthorization,
		check("email")
			.not().isEmpty().withMessage('Email cannot be empty')
			.isEmail().withMessage('Invalid email provided'),
		check('password')
			.not().isEmpty().withMessage('Password field cannot be empty'),
		check('dob').not().isEmpty().withMessage('Date of birth cannot be empty')
	],
	login
);

router.post("/logout", authorized, logout);

router.get("/user-details", authorized, getUserDetails);

router.post(
	"/grant-admin-access",
	[
		authorized,
		superAdminAuthorized,
		check('email')
			.not().isEmpty().withMessage('Email cannot be empty')
			.isEmail().withMessage('Invalid email provided')
			.custom(value => {
				return checkEmailIsInUse(value).then(res => {
					if (!res) {
						return Promise.reject('E-mail not registered');
					}
				})
			})
			.custom(value => {
				return getSuperadminDetails().then(res => {
					if (res.email === value) {
						return Promise.reject('Super admin role cannot be changed');
					}
				})
			}),
	],
	grantAdminRole
)

router.post(
	"/revoke-admin-access",
	[
		authorized,
		superAdminAuthorized,
		check('email')
			.not().isEmpty().withMessage('Email cannot be empty')
			.isEmail().withMessage('Invalid email provided')
			.custom(value => {
				return checkEmailIsInUse(value).then(res => {
					if (!res) {
						return Promise.reject('E-mail not registered');
					}
				})
			})
			.custom(value => {
				return getSuperadminDetails().then(res => {
					if (res.email === value) {
						return Promise.reject('Super admin role cannot be changed');
					}
				})
			}),
	],
	revokeAdminRole
)

router.get(
	'/get-superadmin-data',
	[
		authorized,
		superAdminAuthorized
	],
	getSuperadminData
)

module.exports = router;
