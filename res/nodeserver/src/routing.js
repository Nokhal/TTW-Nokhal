var express = require('express');
var router = express.Router();
logger = require('./logger.js').logger;
let child_process = require('child_process');
let filedownloader = require('./filedownloader.js');
const fs = require("fs");


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
    options.mopath = remanence.mopath;

    res.render('home', {
			page : 'home',
			options: options,
		});
});


router.get('/setnvpath', function (req, res) {
    //TODO : Sanitization
    remanence.nvpath = req.query.nvpath;
    writeRemanence();
    res.redirect("/");
});


router.get('/setnexusapikey', function (req, res) {
    //TODO : Sanitization
    remanence.nexusapikey = req.query.nexusapikey;
    writeRemanence();
    res.redirect("/");
});

router.get('/setmopath', function (req, res) {
    //TODO : Sanitization
    remanence.mopath = req.query.mopath;
    writeRemanence();
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

    res.redirect("/");

    if(!semaphores.alreadyDownloadingMO){
        filedownloader.downloadAFileFromNexus(remanence.nexusapikey, "site", "874", "3833", "Mod Organizer 2.5.2-ML1.5.7z", true);
        semaphores.alreadyDownloadingMO = true;
    }

});

router.get('/execute/MOInstall', function (req, res) {

    child_process.exec('cd ../downloads/extracted/"Mod Organizer 2.5.2-ML1.5" && "Mod Organizer 2.5.2-ML1.5.exe"', (err, stdout, stderr) => {
        if(err){
            console.log(err);
            return;
        }
        console.log(`stdout: ${stdout}`);
    })

    res.redirect("/");
});

router.get('/execute/TTWInstall', function (req, res) {

    ttwInstallExec();

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



// ================= HELPER FUNCTIONS =================

let writeRemanence = async function(){
    const jsonData = JSON.stringify(remanence, null, 2);

    fs.writeFile("remanence.json", jsonData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Data written to file');
        }
    });
}

let loadRemanence = function(){
    if(fs.existsSync("remanence.json")){
        const data = fs.readFileSync('./remanence.json');
        remanence = JSON.parse(data);
    }
}

let ttwInstallExec = async function(){

    let bigzipname = "Tale of Two Wastelands 3.4-133-3.4.0-2025.05.17-[mod.pub].7z";
    let smallzipname = "YUPTTW 13.4-133-13.4.0-2025.07.03-[mod.pub].7z";
    let hotfixname = "Mr House Final Battle Dialogue Hotfix-133-3.41.0-2025.08.01-[mod.pub].7z";

    let oldpath = "" + remanence.nvpath.substring(0,3) + "/TTW/";
    let newpath =  '../downloads/downloaded/';

    if (fs.existsSync(oldpath + bigzipname)) {
        fs.rename(oldpath + bigzipname, newpath + bigzipname, function (err) {
            if (err) throw err
            logger.info('Successfully moved ' + bigzipname);
        })
    }

    if (fs.existsSync(oldpath + smallzipname)) {
        fs.rename(oldpath + smallzipname, newpath + smallzipname, function (err) {
            if (err) throw err
            logger.info('Successfully moved ' + smallzipname);
        })
    }

    if (fs.existsSync(oldpath + hotfixname)) {
        fs.rename(oldpath + hotfixname, newpath + hotfixname, function (err) {
            if (err) throw err
            logger.info('Successfully moved ' + hotfixname);
        })
    }


}

loadRemanence();