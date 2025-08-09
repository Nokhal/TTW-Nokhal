const http = require('http');
const https = require('https');
const fs = require('fs');
const decompress = require("decompress");


logger = require('./logger.js').logger;

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


exports.downloadAFile = downloadAFile;
exports.downloadAFileAndExtract = downloadAFileAndExtract;