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

var getImagePath = function(mapName){
    return `${mapName}/dbm.json`;
}

var getImageConfig = function(mapName, cb){
    return getObject(getImagePath(mapName), cb);;
}

var setImageConfig = function(mapName, config){
    fs.writeFileSync(getImagePath(mapName), JSON.stringify(config, null, 4));
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

var spawnCommand = function(program, attrs, exitCb){
    spawn(program, attrs, {stdio: 'inherit'})
    .on('exit', function (exitCode) {
        if(!exitCb)
            process.exit(exitCode)
        else
            exitCb();
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

var getIncreasedVersion = function(version){
    // TODO also work for other versionformats
    var splitted = version.split('.');
    var last = parseInt(splitted[splitted.length - 1]) + 1;
    var newVersion = "";
    for(var i = 0; i < splitted.length - 1; i++){
        newVersion += `${splitted[i]}.`;
    }
    newVersion += last;
    return newVersion;
}

var dbmCommands = {
    "build": (exitCb) => {
        var info = dbmCommandInfo.cmdImage();
        var attrs = ['build', info.mapName, `-t`, `${config.registry_name}/${info.imageName}:${info.imageConfig.version}`];
        spawnCommand('docker', attrs, exitCb);
    },
    "push": (exitCb) => {
        var info = dbmCommandInfo.cmdImage();
        var attrs = ['push', `${config.registry_name}/${info.imageName}:${info.imageConfig.version}`];
        spawnCommand('docker', attrs, exitCb);
    },
    "update": () => {
        var info = dbmCommandInfo.cmdImage();        
        info.imageConfig.version = getIncreasedVersion(info.imageConfig.version);
        setImageConfig(info.mapName, info.imageConfig);
        console.log('Updated version in config');
    },
    "ub": () => {
        dbmCommands.update();
        dbmCommands.build();
    },
    "ubp": () => {
        dbmCommands.update();
        dbmCommands.bp();
    },
    "bp": () => {
        dbmCommands.build(() => dbmCommands.push());
    }
}

var dbmCommand = argv._[0];

(dbmCommands[dbmCommand] || invalidCommand)();