module.exports.sqlite_escape = function (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r']/g, function (c) {
        switch (c) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "'":
                return "''";
        }
    });
};
