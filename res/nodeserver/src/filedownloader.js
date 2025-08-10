const http = require('http');
const https = require('https');
const fs = require('fs');
const decompress = require("decompress");
const _7z = require('7zip-min');
const path = require('path');


logger = require('./logger.js').logger;

let nexusDownloadQueue = [];
let currentQueueIndex = 0;
let nexusCurrentDL = 0;
let currentExtract = 0;
let nexusMaxConcurrentDL = 1;


let downloadsFinished = function (){
    logger.info("nexusCurrentDL: " + nexusCurrentDL + " currentExtract:" + currentExtract);
    return (nexusCurrentDL == 0 && currentExtract == 0);
}

let doTheDownloadAFile = async function (fileUrl, filename, shouldextract){

    if(shouldextract){
        currentExtract = currentExtract +1;
    }
    nexusCurrentDL = nexusCurrentDL + 1; // Race condition but not really cause node is single thread

    const destination = '../downloads/tmp/' + filename;

    const file = fs.createWriteStream(destination);

    https.get(fileUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close(async () =>  {
                await moveADownloadedFile(filename);
                if(shouldextract){
                    await extractAFile(filename);
                    nexusCurrentDL = nexusCurrentDL - 1;  
                } else {
                    nexusCurrentDL = nexusCurrentDL - 1;   // Race condition but not really cause node is single thread
                }
               
            });
        });
    }).on('error', (err) => {
        fs.unlink(destination, () => {
            logger.error('Error downloading file:', err);
        });
    });
}

let downloadAFile = async function (fileUrl, filename, shouldExtract){

    let newpath =  '../downloads/downloaded/' + filename;
    if (fs.existsSync(newpath)) {
        logger.info('Already downloaded ' + filename);
        if(shouldExtract){
            await extractAFileExt(filename);
        }
    } else {
        await doTheDownloadAFile(fileUrl, filename, shouldExtract);
    }
}

let downloadAFileAndExtract = async function (fileUrl, filename){
    await downloadAFile(fileUrl, filename, true);
}

let moveADownloadedFile = async function (filename){

    let oldpath = '../downloads/tmp/' + filename;
    let newpath =  '../downloads/downloaded/' + filename;

    fs.renameSync(oldpath, newpath);
}

let downloadAFileFromNexusDo = async function (apikey, game_domain_name, mod_id, id, filename, shouldExtract){

    let newpath =  '../downloads/downloaded/' + filename;
    if (fs.existsSync(newpath)) {
        logger.info('Already downloaded ' + filename);
        if(shouldExtract){

            let parsedFilename = path.parse(filename);
            //Only extracting if not already extracted
            extractpath = '../downloads/extracted/' + parsedFilename.name;
           
            if (!fs.existsSync(extractpath)){
                currentExtract = currentExtract +1;
                await extractAFile(filename);
            }  else {
                 logger.info('Already extracted ' + filename + " to " + parsedFilename.name);
            }          
        }

        await processNextNexusQueue();
        return;
    }

    logger.info("Fetching download link from nexus for " + filename);
    let downloadLink = "";
    const options = {
        hostname: 'api.nexusmods.com',
        port: 443,
        path: "/v1/games/" + game_domain_name + "/mods/" + mod_id + "/files/" + id + "/download_link.json?key=" + encodeURIComponent(apikey),
        method: 'GET',
        headers: {
            'User-Agent': 'ttwnokhalinstaller',
            'accept': 'application/json',
            'apikey': apikey
            }
    };

    https.get(options, res => {
    let data = [];
    res.on('data', chunk => {
        data.push(chunk);
    });

    res.on('end', async () => {
        //console.log('Response ended: ');
        const jsonedanswer = JSON.parse(Buffer.concat(data).toString());
        //console.log(jsonedanswer);
        downloadLink = jsonedanswer[0].URI;
        if(downloadLink != ""){
            logger.info("Downloading from nexus link of " + filename);
            await doTheDownloadAFile(downloadLink, filename, shouldExtract);
            logger.info("Processing next nexus download after " + filename);
            await processNextNexusQueue();
        }
    }); 
    }).on('error', err => {
        console.log('Error: ', err.message);
    });


}


let processNextNexusQueue = async function(){
    let numbeInQ = nexusDownloadQueue.length - currentQueueIndex;
    logger.info("Nexus download queue size: " + numbeInQ);

    if(nexusCurrentDL >= nexusMaxConcurrentDL || currentQueueIndex >= nexusDownloadQueue.length){
        return;
    }

    let o = nexusDownloadQueue[currentQueueIndex];

    currentQueueIndex = currentQueueIndex + 1;

    logger.info("Processing the download of the next nexus file: " + o.filename);
    await downloadAFileFromNexusDo(
        o.apikey,
        o.game_domain_name,
        o.mod_id,
        o.id,
        o.filename,
        o.extract
    );

}

let downloadAFileFromNexus = async function (apikey, game_domain_name, mod_id, id, filename, extract){
    let queueObj = {
        apikey:apikey,
        game_domain_name:game_domain_name,
        mod_id:mod_id,
        id:id,
        filename:filename,
        extract: extract
    }

    nexusDownloadQueue.push(queueObj);

    //console.log(nexusDownloadQueue)

    logger.info("Queuing a new file to download from nexus: " + filename);
    await processNextNexusQueue();
}

let extractAFileExt = async function (filename, destOverrideName){
    currentExtract = currentExtract +1;
    await extractAFile(filename, destOverrideName);
}

let extractAFile = async function (filename, destOverrideName){

    //logger.info("About to extract the content of " + filename);
    
    let newpath =  '../downloads/downloaded/' + filename;

    if (!fs.existsSync(newpath)) {
        logger.error('No file to extract found: ' + filename);
        return;
    }

    let extractpath = "";

    let parsedFilename = path.parse(filename);

    if(destOverrideName == "" || destOverrideName == null){
        extractpath = '../downloads/extracted/' + parsedFilename.name;
    } else {
        extractpath = '../downloads/extracted/' + destOverrideName;
    }
    
    if (!fs.existsSync(extractpath)){
        logger.info("Creating extract folder at " + extractpath);
        fs.mkdirSync(extractpath);
    }

    if(parsedFilename.ext == ".zip"){
        logger.info("Decompressing (zip) " + filename);

        await decompress(newpath, extractpath)
            .then((files) => {
            //logger.info(files);
            })
            .catch((error) => {
            // logger.info(error);
            });
        logger.info("Decompressed " + filename);
        currentExtract = currentExtract - 1;
    } else  if(parsedFilename.ext  == ".7z"){
        logger.info("Decompressing (7zip) " + filename);
        await _7z.unpack(newpath, extractpath);
        logger.info("Decompressed " + filename);
        currentExtract = currentExtract - 1;
    }
   

}

exports.downloadAFile = downloadAFile;
exports.downloadAFileAndExtract = downloadAFileAndExtract;
exports.downloadAFileFromNexus = downloadAFileFromNexus;
exports.extractAFileExt = extractAFileExt;
exports.downloadsFinished = downloadsFinished;


const delay = millis => new Promise((resolve, reject) => {
  setTimeout(_ => resolve(), millis)
});