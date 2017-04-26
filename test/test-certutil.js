/*
 *	Run this test with mocha:
 *	http://visionmedia.github.io/mocha/
 */

/* global describe, it, before, after */

var fs = require('fs');
var assert = require('assert');
var cert = require('../lib/CertUtil.js');
var spawn = require('child_process').spawn;

function createCertificate (keyPath, certPath, callback) {
	var params = [
		'req',
		'-nodes',
		'-x509',
		'-newkey',
		'rsa:2048',
		'-keyout',
		keyPath,
		'-out',
		certPath,
		'-days',
		'1',
		'-subj',
		'/O=hyperProxy/CN=hyperProxy SSL CA'
	];

	var code = -1;
	var openssl = spawn('openssl', params);
	var opensslDone = function () {
		if (callback) {
			callback(code);
			callback = null;
		}
	};

	openssl.on('exit', function (result) {
		code = result;
		opensslDone();
	});
	openssl.on('error', function (error) {
		code = error;
		opensslDone();
	});
	openssl.on('close', opensslDone);
}

var testKey = 'test-root.key';
var testCrt = 'test-root.crt';

describe('CertUtil', function () {
	it('should exist', function () {
		assert.ok(cert);
	});

	before(function (done) {
		createCertificate(testKey, testCrt, done);
	});

	after(function () {
		fs.unlinkSync(testKey);
		fs.unlinkSync(testCrt);
	});

	describe('add', function () {
		it('should exist', function () {
			assert.ok(cert.add);
		});

		it('should be a function', function () {
			assert.strictEqual(typeof (cert.add), 'function');
		});

		it('should call back without error', function (done) {
			this.timeout(0);
			cert.add('Root', testCrt, done);
		});
	});

	describe('remove', function () {
		it('should exist', function () {
			assert.ok(cert.remove);
		});

		it('should be a function', function () {
			assert.strictEqual(typeof (cert.remove), 'function');
		});

		it('should call back without error', function (done) {
			this.timeout(0);
			cert.remove('Root', testCrt, done);
		});
	});
});
