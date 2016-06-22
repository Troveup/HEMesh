var path = require('path');

module.exports = {
    entry: './index.js',
    target: 'web',
    output: {
        path: path.resolve('dist'),
        library: 'HEMesh',
        filename: 'HEMesh.js'
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
        three: 'THREE'
    }
};
