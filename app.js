require('dotenv').config();
var express = require('express');
var path = require('path');
var cons = require('consolidate');

var port = 8080;
var app = module.exports = express();
var swig = require('swig');

// handlebars initiation
var exphbs = require('express-handlebars');
var hbs = exphbs.create({});

// Configure View and Handlebars
app.use(express.static(path.join(__dirname)));
app.engine('handlebars', hbs.engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');



// Create body parsers for application/json and application/x-www-form-urlencoded
var bodyParser = require('body-parser')
app.use(bodyParser.json())
var urlencodedParser = bodyParser.urlencoded({ extended: false })

if(!module.parent){ app.listen(process.env.PORT || port); }

console.log("Application started. Listening on port:" + port);


var ringcentral = require('ringcentral');

var rcsdk = new ringcentral({
    server: process.env.RC_APP_SERVER_URL,
    appKey: process.env.RC_CLIENT_ID,
    appSecret: process.env.RC_CLIENT_SECRET
});

var groupMembers;
var userList = [];

    // Route for the home page
    app.get('/inviteDemo', function (req, res) {
        var badge = swig.renderFile(path.join(__dirname, '/views/badge.svg'));
        res.writeHead(200, {"Content-Type": "image/svg+xml"})
        res.write(badge);
        res.send();
    });
    // Route for the inviteDemo
    app.get('/', function (req, res) {

        console.log('Insdei');
        rcsdk.platform()
            .login({
                username: process.env.RC_USERNAME,
                extension: process.env.RC_EXTENSION || null,
                password: process.env.RC_PASSWORD
            })
            .then(function(response) {
                console.log('Logged in to platform');
                return rcsdk.platform()
                    .get('/glip/groups/' + process.env.GLIP_GROUP_ID)
                    .then(function(apiResponse) {
                        var response = apiResponse.json();
                        if(response.members){
                            groupMembers = response.members.length;
                            console.log(groupMembers);
                        }
                        res.render('index', {RC_Logo: process.env.APP_LOGO, RC_Community: process.env.GLIP_GROUP_NAME, RC_Total_members: groupMembers, RC_groupId: process.env.GLIP_GROUP_ID});
                    })
                    .catch(function(e) {
                        console.log('INVITE USER DID NOT WORK');
                        console.log(e);
                    });
            })
            .catch(function(e) {
                console.log('ERR_CALLBACK ' + e.message  || 'Server cannot authorize user');
                res.send('Error');
            });
    });

 // Route for the invite user
    app.post('/inviteUser', urlencodedParser, function (req, res, next) {
        var userInvite = [ req.body.userInvite || '' ];
        userList.push(userInvite);
        rcsdk.platform().loggedIn()
            .then(function(status) {
                return rcsdk.platform()
                	.post('/glip/groups/' + process.env.GLIP_GROUP_ID + '/bulk-assign',{
                			"addedPersonEmails": userInvite
                		})
                	.then(function(response) {
                		console.log('The response is :', response.json());
                        console.log('The total number of users invited to the grpup is :'+ userList.length);
                        console.log('The total number of users registered in the grpup is :'+response.json().members.length);
                        console.log("The type of data is :" + typeof userList.length);
                        res.send(userList.length.toString());
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
    app : app
};
