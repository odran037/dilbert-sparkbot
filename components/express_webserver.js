var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var debug = require('debug')('botkit:webserver');
var nunjucks = require('nunjucks');
var axios = require('axios');
var cheerio = require('cheerio');

module.exports = function(controller, bot) {

    var webserver = express();
    webserver.use(bodyParser.json());
    webserver.use(bodyParser.urlencoded({ extended: true }));
  
    nunjucks.configure('views', {
        autoescape: true,
        express: webserver
    });

    // import express middlewares that are present in /components/express_middleware
    var normalizedPath = require("path").join(__dirname, "express_middleware");
    require("fs").readdirSync(normalizedPath).forEach(function(file) {
        require("./express_middleware/" + file)(webserver, controller);
    });
  
    webserver.get('/', function(req, res) {
        var today = new Date();
        var year = today.getFullYear();
        var month = today.getMonth() + 1
        month = month < 10 ? `0${month}`: month;
        var day = today.getDate();
        day = day < 10 ? `0${day}`: day;
        var date = `${year}-${month}-${day}`;
        var url = `http://dilbert.com/strip/${date}`
        axios.get(url).then(function(response) {
          var $ = cheerio.load(response.data);
          var comicUrl = $('.img-comic').attr('src');
          res.render('index.html', {width: '100%', comicUrl: comicUrl});
        }).catch(function() {
          console.log('Axios error', arguments);
          res.render('index.html', {width: '50%', comicUrl: 'https://i.pinimg.com/736x/7a/8f/08/7a8f086911815b2d7b5c0383e61f25be.jpg'});
        });
    });
  
    webserver.get('/random', function(req, res) {      
        function randomDate(start, end) {
          var options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          };

          var d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
          var year = d.getFullYear()
          var month = d.getMonth();
          month = month < 10 ? `0${month}`: month;
          var day = d.getDate();
          day = day < 10 ? `0${day}`: day;
          return `${year}-${month}-${day}`;
        }

        var date = randomDate(new Date(1989, 3, 16), new Date());
        var url = `http://dilbert.com/strip/${date}`
        axios.get(url).then(function(response) {
          var $ = cheerio.load(response.data);
          var comicUrl = $('.img-comic').attr('src');
          res.render('index.html', {width: '100%', comicUrl: comicUrl});
        }).catch(function() {
          console.log('Axios error', arguments);
          res.render('index.html', {width: '50%', comicUrl: 'https://i.pinimg.com/736x/7a/8f/08/7a8f086911815b2d7b5c0383e61f25be.jpg'});
        });

    });

    webserver.use(express.static('public'));

    webserver.listen(process.env.PORT || 3000, null, function() {
        debug('Express webserver configured and listening at http://localhost:' + process.env.PORT || 3000);
    });

    // import all the pre-defined routes that are present in /components/routes
    var normalizedPath = require("path").join(__dirname, "routes");
    require("fs").readdirSync(normalizedPath).forEach(function(file) {
      require("./routes/" + file)(webserver, controller);
    });

    controller.webserver = webserver;

    return webserver;

}
