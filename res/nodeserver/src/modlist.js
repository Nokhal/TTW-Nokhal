logger = require('./logger.js').logger;
let child_process = require('child_process');
let filedownloader = require('./filedownloader.js');
const fs = require("fs");
const path = require('path');



let downloadAndInstallCoreMods = async function (remanence){
    //First we dump all the mods in the download list, and we want them all extracted too
    for(let i =0; i < coreMods.length; i++){
        filedownloader.downloadAFileFromNexus(remanence.nexusapikey, coreMods[i].game_domain_name, coreMods[i].mod_id, coreMods[i].file_id, coreMods[i].modFilename, true);
    }

    //Lets also add the few mods outside of nexus

    //then we wait for all of them to be downloaded
    //Waiting for all DL to be over and patching the game
    while(!filedownloader.downloadsFinished()){
        await delay(1000);
    }

    //Then we install them
    for(let i =0; i < coreMods.length; i++){
        if(coreMods[i].customInstall == false){
            let parsedPath = path.parse(coreMods[i].modFilename);

            let ModInstallName = coreMods[i].modName;
            let ModFilename = parsedPath.name;
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

    }

}


exports.downloadAndInstallCoreMods = downloadAndInstallCoreMods;

const delay = millis => new Promise((resolve, reject) => {
  setTimeout(_ => resolve(), millis)
});

let coreMods = [
    {
        modName: "ROOGNVSE",
        modFilename: "ROOGNVSE-3-3-3b.7z",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "77415",
        file_id: "1000145043"
    },
    {
        modName: "JIP LN NVSE Plugin",
        modFilename: "JIP LN NVSE Plugin.7z",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "58277",
        file_id: "1000132314"
    },
    {
        modName: "JIP LN NVSE Plugin INI",
        modFilename: "JIP LN NVSE Plugin INI.7z",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "58277",
        file_id: "1000114298"
    },
    {
        modName: "JohnnyGuitar NVSE",
        modFilename: "JohnnyGuitar NVSE.zip",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "66927",
        file_id: "1000150355"
    },
    {
        modName: "JohnnyGuitar NVSE - INI preset",
        modFilename: "JohnnyGuitar NVSE-INI-All Tweaks.7z",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "86200",
        file_id: "1000128535"
    },    
    {
        modName: "ShowOff xNVSE",
        modFilename: "ShowOff xNVSE.zip",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "72541",
        file_id: "1000129880"
    },    
    {
        modName: "ShowOff xNVSE INI",
        modFilename: "ShowOff INI.7z",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "72541",
        file_id: "1000129880"
    },
    {
        modName: "NVTF - New Vegas Tick Fix",
        modFilename: "NVTF - New Vegas Tick Fix.7z",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "66537",
        file_id: "1000154097"
    },
    {
        modName: "NVTF - INI",
        modFilename: "NVTF - INI.7z",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "66537",
        file_id: "1000154098"
    },
    {
        modName: "lStewieAl's Tweaks and Engine Fixes",
        modFilename: "Stewie Tweaks.zip",
        customInstall: false,
        game_domain_name: "newvegas",
        mod_id: "66347",
        file_id: "1000152489"
    },
];