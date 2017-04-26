var fs = require('fs');
var os = require('os');
var pem = require('pem');
var exec = require('child_process').exec;

if (os.platform() === 'win32') {
	module.exports = {
		add   : certAddWin32,
		remove: certRemoveWin32
	};
}
else {
	module.exports = {
		add   : certAddUnix,
		remove: certRemoveUnix
	};
}

function certAddWin32 (store, filePath, callback) {
	// certutil.exe -f -user -addstore "Root" hyperProxy-root.crt
	exec('certutil.exe -f -user -addstore "' + (store || 'Root') + '" ' + filePath, callback);
}

function certRemoveWin32 (store, filePath, callback) {
	// certutil.exe -f -user -delstore "Root" "hyperProxy SSL CA"
	fs.readFile(filePath, function (err, data) {
		if (err) {
			return callback(err);
		}

		pem.readCertificateInfo(data, function (err, info) {
			if (err) {
				return callback(err);
			}

			exec('certutil.exe -f -user -delstore "' + (store || 'Root') + '" "' + info.commonName + '"', callback);
		});
	});
}

function certAddUnix (/* store, filePath, callback*/) {
	throw new Error('Not implemented yet');
}

function certRemoveUnix (/* store, filePath, callback*/) {
	throw new Error('Not implemented yet');
}
