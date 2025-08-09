let express = require('express');
let app = express();
logger = require('./src/logger.js').logger;

const bodyParser = require('body-parser');

logger.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
};


app.use(require("morgan")("combined", {
        "stream": logger.stream
    }));

let path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


var routes = require('./src/routing');
app.use('/', routes);

app.set('port', process.env.PORT || 2258);


var http = require('http');
logger.info("server.js: Starting Server");
http.createServer(app).listen( process.env.PORT || 2258);

