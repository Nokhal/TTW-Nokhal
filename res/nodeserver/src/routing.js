var express = require('express');
var router = express.Router();
logger = require('./logger.js').logger;

let filedownloader = require('./filedownloader.js')


let remanence = {};

let semaphores = {};
semaphores.alreadyDownloadingVC = false;
semaphores.alreadyDownloadingMO = false;

router.get('/chk', function (req, res) {
    let oki = {};
    oki.message = "OK";
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(oki));
});

router.get('/', function (req, res) {
    var options = {};

    options.nvpath = remanence.nvpath;
    options.nexusapikey = remanence.nexusapikey;

    res.render('home', {
			page : 'home',
			options: options,
		});
});


router.get('/setnvpath', function (req, res) {
    //TODO : Sanitization
    remanence.nvpath = req.query.nvpath;
    res.redirect("/");
});


router.get('/setnexusapikey', function (req, res) {
    //TODO : Sanitization
    remanence.nexusapikey = req.query.nexusapikey;
    res.redirect("/");
});


router.get('/startdownload/VCRedist', function (req, res) {

    if(!semaphores.alreadyDownloadingVC){
        filedownloader.downloadAFileAndExtract("https://ttwnok.s3.eu-west-2.amazonaws.com/Visual-C-Runtimes-All-in-One-Jul-2025.zip", "Visual-C-Runtimes-All-in-One-Jul-2025.zip");
        semaphores.alreadyDownloadingVC = true;
    }

    res.redirect("/");
});

router.get('/startdownload/MO', function (req, res) {

    if(!semaphores.alreadyDownloadingMO){
        filedownloader.downloadAFileFromNexus(remanence.nexusapikey, "site", "874", "3833", "Mod Organizer 2.5.2-ML1.5.exe");
        semaphores.alreadyDownloadingMO = true;
    }

    res.redirect("/");
});

router.get('/startdownload/', function (req, res) {

    var options = {};
    options.nexusAPIKey = 

    res.render('home', {
			page : 'home',
			options: options,
		});
});


// ======= EXPORT THE ROUTER =========================
module.exports = router;



