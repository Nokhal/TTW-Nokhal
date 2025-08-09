let express = require('express');
let app = express();
logger = require('./src/logger.js').logger;

app.set('port', process.env.PORT || 2258);

logger.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
};

var server = app.listen(app.get('port'), function () {
            logger.info('server.js: Express server listening on port ' + app.get('port'));
        });
