const {verify} = require('jsonwebtoken');
const {getArticleById} = require('../api/article/article.service');
const {SUPER_ADMIN, VIEWER, ADMIN} = require("../constants/role");
const {ARTICLE_APPROVED_STATUS} = require('../constants/blogStatus');

module.exports = {
	authorized: (req, res, next) => {
		const token = req.cookies ? req.cookies.access_token : false;
		if (!token) {
			return res.sendStatus(403);
		}
		try {
			const data = verify(token, process.env.JWT_SECRET);
			req.userData = data.userData;
			return next();
		} catch {
			return res.sendStatus(403);
		}
	},
	unAuthorized: (req, res, next) => {
		const token = req.cookies ? req.cookies.access_token : false;
		if (token) {
			return res.sendStatus(403);
		}
		return next();
	},
	twoFAStepAuthorization: (req, res, next) => {
		const twoFAToken = req.cookies ? req.cookies.two_fa_token : false;
		if (!twoFAToken) {
			return res.sendStatus(403);
		}
		return next();
	},
	superAdminAuthorized: (req, res, next) => {
		if (req.userData.role === SUPER_ADMIN) {
			return next();
		}
		return res.sendStatus(403);
	},
	articleCreateAuthorized: (req, res, next) => {
		if (req.userData.role === VIEWER) {
			return res.sendStatus(403);
		}
		return next();
	},
	articleExists: async (req, res, next) => {
		const articleId = req.body.id || req.query.id || 0;
		const article = await getArticleById(articleId);
		if (article === null) {
			return res.sendStatus(404);
		}
		return next();
	},
	articleEditAuthorized: async (req, res, next) => {
		const articleId = req.body.id || req.query.id || 0;
		const userId = req.userData.id;
		const article = await getArticleById(articleId);
		if (article && Number(article.authorId) === Number(userId)) {
			return next();
		}
		return res.sendStatus(403);
	},
	articleEditOrSuperadminAuthorized: async (req, res, next) => {
		const articleId = req.body.id || req.query.id || 0;
		const userId = req.userData.id;
		const article = await getArticleById(articleId);
		if (article && ((Number(article.authorId) === Number(userId) && req.userData.role === ADMIN) || req.userData.role === SUPER_ADMIN)) {
			return next();
		}
		return res.sendStatus(403);
	},
	articleDetailsViewAuthorized: async (req, res, next) => {
		const articleId = req.body.id || req.query.id || 0;
		const userId = req.userData.id;
		const userRole = req.userData.role;
		const article = await getArticleById(articleId);
		if (article.status === ARTICLE_APPROVED_STATUS) {
			return next();
		}
		if (article.authorId === userId || userRole === SUPER_ADMIN) {
			return next();
		}
		return res.sendStatus(403);
	}
}
