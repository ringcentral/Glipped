'use strict';

var chai = require('chai'),
    expect = require('chai').expect,
    app = require('../app').app,
    chaiHttp = require('chai-http'),
    server = require('../app'),
    should = chai.should(),
    SDK = require("../node_modules/ringcentral/src/SDK"),
    request = require('supertest').agent(app.listen()),
    supertest = require('supertest'),
    sinon = require('sinon'),
    ejs = require('ejs'),
    handlebars = require('handlebars'),
    superagent = require('superagent');



describe('/GET Home Page', function() {

    it('it should render the home page', function() {

        var fields, html;

        beforeEach(function() {
            this.fields = { first: "123" };
            this.html = "{{#ifequal first last}}true{{else}}false{{/ifequal}}";
        });

        it('will return false when the values are not equal', function() {
            var template =  Handlebars.compile(this.html);
            this.fields['last'] = 123;
            var result = template(this.fields);
            expect(result).toEqual("false");
        });

        it('will return true when the values are equal', function() {
            var template =  Handlebars.compile(this.html)
            this.fields['last'] = "123";
            var result = template(this.fields)
            expect(result).toEqual("true");
        });

    });

});


describe('RingCentral', function() {

    function test(suite, server, done) {

        suite.timeout(10000); // Per SLA should be 3 seconds
        var sdk = new SDK({server: server, appKey: '', appSecret: ''});

        return sdk.platform().get('', null, {skipAuthCheck: true}).then(function(response) {
            expect(response.json().uri).to.equal(server + '/restapi/v1.0');
            sdk.cache().clean();
        });
    }

    it('connects to sandbox', function() {
        return test(this, SDK.server.sandbox);
    });

    it('connects to production', function() {
        return test(this, SDK.server.production);
    });



});


describe('homepage', function(){
    it('should respond to GET',function(){
        superagent
            .get('http://localhost:'+app.port)
            .end(function(res){
                expect(res.status).to.equal(200);
                done()
            })
    });
});