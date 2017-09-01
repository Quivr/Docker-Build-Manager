#!/usr/bin/env node

var spawn = require('cross-spawn')

var argv = require('minimist')(process.argv.slice(2))
var fs = require('fs');

var getObject = function(path, cb){
    if (fs.existsSync(path)) {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }
    cb();
}

var getImageConfig = function(mapName, cb){
    return getObject(`${mapName}/dbm.json`, cb);;
}

var config = getObject('./dbm-global.json', () => {
    console.error(`Can't find file dbm-global.json.`);
    quit(1);
});

var dbmCommandInfo = {
    "cmdImage": () => {
        var imageName = argv._[1];
        var imageInfo = config.images[imageName];
        if(imageInfo){
            var mapName = imageInfo.dir;
            var imageConfig = getImageConfig(mapName, () => invalidDirectory(mapName));
            return {imageName, mapName, imageConfig}
        }
        invalidImageName(imageName);
    }
}

var spawnCommand = function(program, attrs){
    spawn(program, attrs, {stdio: 'inherit'})
    .on('exit', function (exitCode) {
        process.exit(exitCode)
    })
}

var invalidCommand = () => { 
    console.error(`Invalid command ${argv._[0]}`);
    quit(1);
}
var invalidImageName = (imageName) => { 
    console.error(`No image named ${imageName} defined in config`);
    quit(1);
}
var invalidDirectory = (directory) => { 
    console.error(`Invalid directory ${directory}`);
    quit(1);
}
var quit = (code) => { process.exit(code); }

var dbmCommands = {
    "build": () => {
        var info = dbmCommandInfo.cmdImage();
        var attrs = ['build', info.mapName, `-t`, `${config.registry_name}/${info.imageName}:${info.imageConfig.version}`];
        spawnCommand('docker', attrs);
    },
    "push": () => {
        var info = dbmCommandInfo.cmdImage();
        var attrs = ['push', `${config.registry_name}/${info.imageName}:${info.imageConfig.version}`];
        spawnCommand('docker', attrs);
    }
}

var dbmCommand = argv._[0];

(dbmCommands[dbmCommand] || invalidCommand)();