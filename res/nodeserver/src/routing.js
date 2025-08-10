var express = require('express');
var router = express.Router();
logger = require('./logger.js').logger;
let child_process = require('child_process');
let filedownloader = require('./filedownloader.js');
const fs = require("fs");
const path = require('path');
const modlist = require('./modlist.js');


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

loadRemanence();

// ======================== Route specific stuff


let ttwInstallExec = async function(){

    //Start bydownloading the extra stuff we neeed

    //NVSE xNVSE
    await filedownloader.downloadAFileFromNexus(remanence.nexusapikey, "newvegas", "67883", "1000154821", "New Vegas Script Extender 6-4-1.7z", true);;

    //4Gb patcher
    await filedownloader.downloadAFileFromNexus(remanence.nexusapikey, "newvegas", "62552", "1000075100", "4gb patcher 1-5.7z", true);;
    

    //Move and Extract the third party downloads

    let bigzipname = "Tale of Two Wastelands 3.4-133-3.4.0-2025.05.17-[mod.pub].7z";
    let smallzipname = "YUPTTW 13.4-133-13.4.0-2025.07.03-[mod.pub].7z";
    let hotfixname = "Mr House Final Battle Dialogue Hotfix-133-3.41.0-2025.08.01-[mod.pub].7z";

    let oldpath = "" + remanence.nvpath.substring(0,3) + "/TTW/";
    let newpath =  '../downloads/downloaded/';

    if (fs.existsSync(oldpath + bigzipname)) {
        fs.renameSync(oldpath + bigzipname, newpath + bigzipname, function (err) {
            if (err) throw err
            logger.info('Successfully moved ' + bigzipname);
        })
    }

    if (fs.existsSync(oldpath + smallzipname)) {
        fs.renameSync(oldpath + smallzipname, newpath + smallzipname, function (err) {
            if (err) throw err
            logger.info('Successfully moved ' + smallzipname);
        })
    }

    if (fs.existsSync(oldpath + hotfixname)) {
        fs.renameSync(oldpath + hotfixname, newpath + hotfixname, function (err) {
            if (err) throw err
            logger.info('Successfully moved ' + hotfixname);
        })
    }

    //Extracting the mods

    await  filedownloader.extractAFileExt(bigzipname, "TalesOfTwoWasteland340");
    await  filedownloader.extractAFileExt(smallzipname, "YUPTTW 134");
    await  filedownloader.extractAFileExt(hotfixname, "HouseDialogHotfixTTW");


    //Making a new separator
    let newMO2TTWModSeparator = "" + remanence.mopath + "/mods/TTW Core_separator";

    if (!fs.existsSync(newMO2TTWModSeparator)){

        logger.info("Creating new separator TTW Core_separator" );
        fs.mkdirSync(newMO2TTWModSeparator);
        fs.writeFile("" + newMO2TTWModSeparator + "/meta.ini", metainiSeparator, 'utf8', (err) => {
            if (err) {
                logger.error('Error writing to file', err);
            } else {
                logger.info('Data written to file ' + "" + newMO2TTWModSeparator + "/meta.ini");
            }
        });

    }

    //Making a new separator
    newMO2TTWModSeparator = "" + remanence.mopath + "/mods/Utilities_separator";

    if (!fs.existsSync(newMO2TTWModSeparator)){

        logger.info("Creating new separator Utilities" );
        fs.mkdirSync(newMO2TTWModSeparator);
        fs.writeFile("" + newMO2TTWModSeparator + "/meta.ini", metainiSeparator, 'utf8', (err) => {
            if (err) {
                logger.error('Error writing to file', err);
            } else {
                logger.info('Data written to file ' + "" + newMO2TTWModSeparator + "/meta.ini");
            }
        });

    }

    //Making the new TTW core Mod path
    let newMO2TTWModPath = "" + remanence.mopath + "/mods/Tale of Two Wastelands";

    if (!fs.existsSync(newMO2TTWModPath)){
        fs.mkdirSync(newMO2TTWModPath);
    }

    //Making the new YUPTTW path
    {
        let ModInstallName = "YUPTTW 13.4";
        let ModFilename = "YUPTTW 134";
        let Modpath = "" + remanence.mopath + "/mods/" + ModInstallName;
        let ModContent =  '../downloads/extracted/' + path.parse(ModFilename).name;

        if (!fs.existsSync(Modpath)){
            fs.mkdirSync(Modpath);

            //Copying the data
            fs.cpSync(ModContent, Modpath, {recursive: true});

            logger.info("Installed " + ModInstallName);
        }
        fs.rmSync(ModContent, { recursive: true, force: true });
        logger.info("Deleted Extracted content from " + ModFilename);
    }

    
    //Installing the new HOUSE FIX mod
    {
        let ModInstallName = "Mr House Final Battle Hotfix";
        let ModFilename = "HouseDialogHotfixTTW";
        let Modpath = "" + remanence.mopath + "/mods/" + ModInstallName;
        let ModContent =  '../downloads/extracted/' + path.parse(ModFilename).name;

        if (!fs.existsSync(Modpath)){
            fs.mkdirSync(Modpath);

            //Copying the data
            fs.cpSync(ModContent, Modpath, {recursive: true});

            logger.info("Installed " + ModInstallName);
        }
        fs.rmSync(ModContent, { recursive: true, force: true });
        logger.info("Deleted Extracted content from " + ModFilename);
    }

    await modlist.downloadAndInstallCoreMods(remanence);

    //Waiting for all DL to be over and patching the game
    while(!filedownloader.downloadsFinished()){
        await delay(500);
    }

    await ttwnvsAnd4gbPatcherInstall();

}

let ttwnvsAnd4gbPatcherInstall = async function(){

    //Moving all the content from nvse to new vegas root
    {
        let ModInstallName = "New Vegas Script Extender 6-4-1";
        let ModFilename = "New Vegas Script Extender 6-4-1";
        let Modpath = "" +  remanence.nvpath;
        let ModContent =  '../downloads/extracted/' + "New Vegas Script Extender 6-4-1";


        //Copying the data
        fs.cpSync(ModContent, Modpath, {recursive: true});
        logger.info("Installed " + ModInstallName);
        fs.rmSync(ModContent, { recursive: true, force: true });
        logger.info("Deleted Extracted content from " + ModFilename);
    }

        
    //Moving all the content of 4gb patcher from nvse to new vegas root
    {
        let ModInstallName = "4gb patcher 1-5";
        let ModFilename = "4gb patcher 1-5";
        let Modpath = "" +  remanence.nvpath;
        let ModContent =  '../downloads/extracted/' + "4gb patcher 1-5";


        //Copying the data
        fs.cpSync(ModContent, Modpath, {recursive: true});
        logger.info("Installed " + ModInstallName);
        fs.rmSync(ModContent, { recursive: true, force: true });
        logger.info("Deleted Extracted content from " + ModFilename);
    }

    logger.info("Applying 4gb patch...");
    child_process.exec('cd "' + remanence.nvpath +'" && "FNVpatch.exe"', (err, stdout, stderr) => {
        if(err){
            console.log(err);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log("4gb patch applied!");
    })

    

}


const delay = millis => new Promise((resolve, reject) => {
  setTimeout(_ => resolve(), millis)
});

const metainiSeparator = `[General]
modid=0
version=
newestVersion=
category=0
installationFile=

[installedFiles]
size=0
`;