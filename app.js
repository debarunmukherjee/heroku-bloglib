require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require('cors');

const userRouter = require("./api/users/user.router");
const articleRouter = require("./api/article/article.router");
const path = require("path");

const app = express();

app.use(cors({
	origin: process.env.CLIENT_URI,
	credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/article", articleRouter);

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', (req, res) => {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
	console.log("Server up and running on PORT :", port);
});
