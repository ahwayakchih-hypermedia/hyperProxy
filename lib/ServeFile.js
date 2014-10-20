var path = require('path');
var fs = require('fs');

var MIME = require(path.join(path.dirname(module.filename), 'MIME.js'));

/**
 *	Prepare function to be used to serve static files.
 *
 *	Following options are supported:
 *	- `documentRoot`: files outside of root path will not be served, defaults to process' current working directory
 *	- `followSymbolicLinks`: if false (default), symbolic links will not be followed, i.e., they will not be served
 *
 *	@param {Object} options
 *	@return {Function}
 */
function createFileResponseHandler(options) {
	options                     = options                     || {};
	options.documentRoot        = options.documentRoot        || process.cwd();
	options.followSymbolicLinks = options.followSymbolicLinks || false;

	/**
	 *	Respond with 404 Not Found error.
	 *
	 *	@param {Object} res - HTTP(S) response
	 */
	var notFound = function(res) {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.end('404 Not Found\n');
	};

	/**
	 *  Serve specified file.
	 *
	 *  @param {Object} res - HTTP(S) response
	 *  @param {string} filePath
	 *  @param {Object} [reqHeaders] - headers from HTTP(S) request
	 *  @param {Object} [fileStats] - fs.Stats describing filePath
	 */
	return function serveFile(res, filePath, reqHeaders, fileStats) {
		'use strict';

		reqHeaders = reqHeaders || {};

		// If we did not get stats info, we have to get it first and then call ourselves again.
		if (!fileStats) {
			fs.realpath(filePath, function(err, realpath){
				if (err || realpath.indexOf(options.documentRoot) !== 0) {
					return notFound(res);
				}

				fs.lstat(realpath, function(err, stats){
					if (err || (!options.followSymbolicLinks && stats.isSymbolicLink()) || !stats.isFile()) {
						return notFound(res);
					}

					serveFile(res, realpath, reqHeaders, stats);
				});
			});

			return;
		}

		// Now we can serve the file
		if (reqHeaders['if-modified-since']) {
			if (fileStats.mtime >= new Date(reqHeaders['if-modified-since'])) {
				res.writeHead(304, {'Date': (new Date()).toUTCString()});
				return res.end();
			}
		}

		var start = 0;
		var end = fileStats.size - 1;

		if (reqHeaders.range) {
			start = reqHeaders.range.replace(/bytes=/, '').split('-');
			end = parseInt(start[1] || 0, 10) || fileStats.size - 1;
			start = parseInt(start[0] || 0, 10) || 0;
		}

		if (end < start) {
			end = start + 1;
		}

		var stream = fs.createReadStream(filePath, {
			start: start,
			end: end
		});

		if (!stream) {
			res.writeHead(500, {'Content-Type': 'text/plain'});
			return res.end('Interal Server Error: could not open the file\n');
		}

		var code = 200;
		var headers = {
			'Content-Type': MIME(filePath),
			'Content-Length': Math.min(fileStats.size, end - start + 1),
			'Date': (new Date()).toUTCString(),
			'Last-Modified': fileStats.mtime.toUTCString(),
			'Cache-Control': 'private, max-age=3600',
			'Expires': (new Date(Date.now() + (3600 * 1000))).toUTCString()
		};

		if (reqHeaders.range) {
			code = 206;
			headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + fileStats.size;
			headers['Accept-Ranges'] = 'bytes';
		}

		res.writeHead(code, headers);
		stream.pipe(res);
	};
}


/*
 *  Exports
 */
module.exports.createFileResponseHandler = createFileResponseHandler;