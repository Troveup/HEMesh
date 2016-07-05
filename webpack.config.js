var path = require('path');

module.exports = {
    entry: './index.js',
    target: 'web',
    output: {
        path: path.resolve('dist'),
        library: 'HELib',
        filename: 'HELib.js'
    },
    module: {
        loaders: [
            {
                test: /.js%/,
                loader: 'babel-loader'
            }
        ]
    },
    externals: {
        three: 'THREE',
        "three-bsp": 'ThreeBSP'
    }
};
