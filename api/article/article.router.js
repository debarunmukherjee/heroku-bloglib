const router = require("express").Router();
const {check,query} = require('express-validator');
const {
	authorized,
	superAdminAuthorized,
	articleCreateAuthorized,
	articleDetailsViewAuthorized,
	articleExists,
	articleEditAuthorized,
	articleEditOrSuperadminAuthorized
} = require("../../middlewares/auth");
const {
	createArticle,
	getArticlesForCurrentUser,
	getArticleDetails,
	updateArticleDetails,
	deleteOldArticle,
	getPublicArticles,
	updateArticleState,
	getArticleHistory
} = require('./article.controller');

router.post(
	'/create',
	[
		authorized,
		articleCreateAuthorized,
		check('body').not().isEmpty().withMessage('Article body cannot be empty'),
		check('title').not().isEmpty().withMessage('Title cannot be empty')
	],
	createArticle
);

router.get(
	'/get/mine',
	[
		authorized,
	],
	getArticlesForCurrentUser
);

router.get(
	'/get/public',
	[
		authorized,
	],
	getPublicArticles
);

router.get(
	'/get-details',
	[
		authorized,
		query('id')
			.not().isEmpty().withMessage('Article id cannot be empty')
			.isInt().withMessage('Article id must be an integer'),
		articleExists,
		articleDetailsViewAuthorized,
	],
	getArticleDetails
);

router.put(
	'/update/details',
	[
		authorized,
		check('body').not().isEmpty().withMessage('Article body cannot be empty'),
		check('title').not().isEmpty().withMessage('Title cannot be empty'),
		check('id')
			.not().isEmpty().withMessage('Article id cannot be empty')
			.isInt().withMessage('Article id must be an integer'),
		articleExists,
		articleEditAuthorized
	],
	updateArticleDetails
);

router.delete(
	'/delete',
	[
		authorized,
		check('id')
			.not().isEmpty().withMessage('Article id cannot be empty')
			.isInt().withMessage('Article id must be an integer'),
		articleExists,
		articleEditAuthorized
	],
	deleteOldArticle
);

router.post(
	'/update-status',
	[
		authorized,
		superAdminAuthorized,
		check('id')
			.not().isEmpty().withMessage('Article id cannot be empty')
			.isInt().withMessage('Article id must be an integer'),
		check('status')
			.not().isEmpty().withMessage('Status cannot be empty')
			.isInt().withMessage('Status must be an integer')
			.isIn([0, 1]).withMessage('Status can be either 0 or 1'),
		articleExists
	],
	updateArticleState
);

router.get(
	'/get-history',
	[
		authorized,
		articleEditOrSuperadminAuthorized,
		query('id')
			.not().isEmpty().withMessage('Article id cannot be empty')
			.isInt().withMessage('Article id must be an integer'),
		articleExists,
	],
	getArticleHistory
)

module.exports = router;
