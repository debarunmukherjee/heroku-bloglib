const pool = require("../../config/database");
const {VIEWER, SUPER_ADMIN, ADMIN} = require('../../constants/role');

module.exports = {
	createNewUser: (data, callBack) => {
		pool.query(
			`insert into users(fullname, email, password, role, dob)
                values(?,?,?,?,?)`,
			[
				data.fullname,
				data.email,
				data.password,
				VIEWER,
				data.dob
			],
			(error, results) => {
				if (error) {
					callBack(error);
					return;
				}
				callBack(null, results);
			}
		);
	},
	getUserByUserEmail: (email, callBack) => {
		pool.query(
			`select * from users where email = ?`,
			[email],
			(error, results) => {
				if (error) {
					callBack(error);
					return;
				}
				callBack(null, results[0]);
			}
		);
	},
	getUserById: async (userId) => {
		try {
			const [rows] = await pool.promise().query(`select * from users where id = ?`, [userId]);
			return rows[0];
		} catch (e) {
			console.log(e);
			return false;
		}
	},
	checkEmailIsInUse: async (email) => {
		try {
			const [rows] = await pool.promise().query(`select *from users where email = ?`, [email]);
			return !!rows[0];
		} catch (e) {
			console.log(e);
			return false;
		}
	},
	updateUserRole: async (email, role) => {
		try {
			const res = await pool.promise().query(
				'update users set role = ? where email = ?',
				[role, email]
			);
			return Number(res[0].affectedRows) > 0;
		} catch (e) {
			console.log(e);
			return false;
		}
	},
	getSuperadminDetails: async () => {
		try {
			const [rows] = await pool.promise().query(
				'select id, email, fullname, role from users where role = ?',
				[SUPER_ADMIN]
			);
			return rows[0];
		} catch (e) {
			console.log(e);
			return false;
		}
	},
	getAllAdminUsers: async () => {
		try {
			const [rows] = await pool.promise().query(
				'select fullname, email from users where role = ?',
				[ADMIN]
			);
			return rows;
		} catch (e) {
			console.log(e);
			return false;
		}
	}
};
