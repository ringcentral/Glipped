require('dotenv').config();
var express = require('express');
var path = require('path');
var cons = require('consolidate');

var port = 8080;
var app = express();
var swig = require('swig');

// Configure View and Handlebars
app.use(express.static(path.join(__dirname)));
app.engine('.html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');


// Create body parsers for application/json and application/x-www-form-urlencoded
var bodyParser = require('body-parser')
app.use(bodyParser.json())
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var server = app.listen(port);
console.log("Application started. Listening on port:" + port);

// console.log('Node listening on port %s', port);

var ringcentral = require('ringcentral');

var rcsdk = new ringcentral({
    server: process.env.RC_APP_SERVER_URL,
    appKey: process.env.RC_APP_KEY,
    appSecret: process.env.RC_APP_SECRET
});

    // Route for the home page
    app.get('/', function (req, res) {
        var badge = swig.renderFile(path.join(__dirname, '/views/badge.svg'));
        res.writeHead(200, {"Content-Type": "image/svg+xml"})
        res.write(badge);
        res.send();
    });
    // Route for the inviteDemo
    app.get('/inviteDemo', function (req, res) {
        res.render('index');
        rcsdk.platform()
            .login({
                username: process.env.RC_USERNAME,
                extension: process.env.RC_EXTENSION || null,
                password: process.env.RC_PASSWORD
            })
            .then(function(response) {
                console.log('Logged in to platform');
            })
            .catch(function(e) {
                console.log('ERR_CALLBACK ' + e.message  || 'Server cannot authorize user');
                res.send('Error');
            });
    });

 // Route for the invite user
    app.post('/inviteUser', urlencodedParser, function (req, res, next) {
        var userInvite = [ req.body.userInvite || '' ];
        rcsdk.platform().loggedIn()
            .then(function(status) {
                return rcsdk.platform()
                	.post('/glip/groups/' + process.env.GLIP_GROUP_ID + '/bulk-assign',{
                			"addedPersonEmails": userInvite
                		})
                	.then(function(response) {
                		console.log('The response is :', response.json());
                        res.send(response.json());
                	})
                    .catch(function(e) {
                        console.log('INVITE USER DID NOT WORK');
                        console.log(e);
                    });
            })
            .catch(function(e) {
                res.send("E_NOT_LOGGED_IN");
            });
    });



module.exports = {
    server : server,
    app : app
};
