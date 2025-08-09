var express = require('express');
var router = express.Router();
logger = require('./logger.js').logger;

let filedownloader = require('./filedownloader.js')


router.get('/chk', function (req, res) {
    let oki = {};
    oki.message = "OK";
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(oki));
});

router.get('/', function (req, res) {
    var options = {};

    res.render('home', {
			page : 'home',
			options: options,
		});
});


router.get('/startdownload/', function (req, res) {

    var options = {};

    res.render('home', {
			page : 'home',
			options: options,
		});
});

router.get('/startdownload/VCRedist', function (req, res) {

    filedownloader.downloadAFileAndExtract("https://ttwnok.s3.eu-west-2.amazonaws.com/Visual-C-Runtimes-All-in-One-Jul-2025.zip", "Visual-C-Runtimes-All-in-One-Jul-2025.zip");
    res.redirect("/");
});


// ======= EXPORT THE ROUTER =========================
module.exports = router;



