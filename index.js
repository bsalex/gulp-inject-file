var es = require('event-stream');
var fs = require('fs');
var _ = require('lodash');
var path = require('path')
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-inject-file';

function gulpInjectFile(opts) {
    const FILENAME_PATTERN = '\\s*([\\w\\-\\_\\.\\\\\\/]+)';
    const FILENAME_MARKER = '<filename>';

    function doInject(file, callback) {
        var isStream = file.contents && typeof file.contents.on === 'function' && typeof file.contents.pipe === 'function';
        var isBuffer = file.contents instanceof Buffer;

        if (isBuffer) {
            var content = file.contents.toString('utf8');
            var injectPattern = '^([\\t ]*)' + opts.pattern.replace(FILENAME_MARKER, FILENAME_PATTERN);
            var regex = new RegExp(injectPattern, 'm');
            var fileName, whitespace;

            while (currMatch = regex.exec(content)) {
                match = currMatch[0];
                whitespace = currMatch[1];
                fileName = currMatch[2];

                var injectContent = _(getFileContent(path.join(path.dirname(file.path), fileName)).split(/\r?\n/))
                    .map(function(line) {
                        return whitespace + line;
                    })
                    .value()
                    .join('\n');

                content = content.replace(match, injectContent);
            }

            file.contents = new Buffer(content);
            callback(null, file);
        }
        else if (isStream) {
            throw new PluginError(PLUGIN_NAME, 'Streams are not supported!');
        }
    }

    function getFileContent(path) {
        var content;
        try {
            content = fs.readFileSync(path, 'utf8');
        } catch (err) {
            content = '';
        }

        content = transformContent(content, path);

        return content;
    }

    function transformContent(content, path) {
      var transformedContent = content;

      if(typeof opts.transform === 'function') {
        transformedContent = opts.transform(content, path);
      }

      return transformedContent;
    }

    return es.map(doInject);
};

module.exports = gulpInjectFile;
