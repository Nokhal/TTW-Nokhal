const http = require('http');
const https = require('https');
const fs = require('fs');
const decompress = require("decompress");


logger = require('./logger.js').logger;

let nexusDownloadQueue = [];
let currentQueueIndex = 0;
let nexusCurrentDL = 0;
let nexusMaxConcurrentDL = 1;

let doTheDownloadAFile = async function (fileUrl, filename){

    const destination = '../downloads/tmp/' + filename;

    const file = fs.createWriteStream(destination);

    https.get(fileUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                //logger.info('File downloaded successfully');
            });
        });
    }).on('error', (err) => {
        fs.unlink(destination, () => {
            logger.error('Error downloading file:', err);
        });
    });
}

let moveADownloadedFile = async function (filename){

    let oldpath = '../downloads/tmp/' + filename;
    let newpath =  '../downloads/downloaded/' + filename;

    fs.rename(oldpath, newpath, function (err) {
        if (err) throw err
        logger.info('Successfully downloaded ' + filename);
    })


}

let downloadAFile = async function (fileUrl, filename){

    let newpath =  '../downloads/downloaded/' + filename;
    if (fs.existsSync(newpath)) {
        logger.info('Already downloaded ' + filename);
    } else {
        await doTheDownloadAFile(fileUrl, filename);
        await moveADownloadedFile(filename);
    }

}

let downloadAFileAndExtract = async function (fileUrl, filename){
    await downloadAFile(fileUrl, filename);

    let newpath =  '../downloads/downloaded/' + filename;
    let extractpath =  '../downloads/extracted/' + filename.substring(0, filename.length -4);

    logger.info("Decompressing " + filename);
    if (!fs.existsSync(extractpath)){
        fs.mkdirSync(extractpath);
    }
    await decompress(newpath, extractpath)
        .then((files) => {
           //logger.info(files);
        })
        .catch((error) => {
          // logger.info(error);
        });
    logger.info("Decompressed " + filename);
}

let downloadAFileFromNexusDo = async function (apikey, game_domain_name, mod_id, id, filename){

    nexusCurrentDL = nexusCurrentDL + 1; // Race condition but not really cause node is single thread

    let newpath =  '../downloads/downloaded/' + filename;
     if (fs.existsSync(newpath)) {
        logger.info('Already downloaded ' + filename);
        await processNextNexusQueue();
        return;
    }
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
            await doTheDownloadAFile(downloadLink, filename);
            await moveADownloadedFile(filename);
            nexusCurrentDL = nexusCurrentDL - 1;   // Race condition but not really cause node is single thread
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

    await downloadAFileFromNexusDo(
        o.apikey,
        o.game_domain_name,
        o.mod_id,
        o.id,
        o.filename
    );

}

let downloadAFileFromNexus = async function (apikey, game_domain_name, mod_id, id, filename){
    let queueObj = {
        apikey:apikey,
        game_domain_name:game_domain_name,
        mod_id:mod_id,
        id:id,
        filename:filename
    }

    nexusDownloadQueue.push(queueObj);

    //console.log(nexusDownloadQueue)

    logger.info()
    await processNextNexusQueue();
}


exports.downloadAFile = downloadAFile;
exports.downloadAFileAndExtract = downloadAFileAndExtract;
exports.downloadAFileFromNexus = downloadAFileFromNexus;