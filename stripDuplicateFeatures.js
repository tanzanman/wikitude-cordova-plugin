#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const features = [
    'camera', 'sensor.compass',
];

// Helper script for repairing https://github.com/don/cordova-plugin-ble-central/issues/925
module.exports = function (context) {
    const { projectRoot } = context.opts;
    const platformPath = path.resolve(projectRoot, 'platforms/android');
    const manifestPath = path.resolve(platformPath, 'app/src/main/AndroidManifest.xml');
    if (!fs.existsSync(manifestPath)) {
        throw "Can't find AndroidManifest.xml in platforms/Android";
    }

    let androidManifest = fs.readFileSync(manifestPath).toString();
    const duplicates = [];
    for (const feature of features) {
        const matcher = usesFeaturesRegex(feature);
        const matches = matchAll(matcher, androidManifest);
        // Skip the first match, only want duplicates
        duplicates.push(...matches.slice(1));
    }

    if (duplicates.length > 0) {
        // Sort last to first by index to avoid needing to recompute offsets during remove
        duplicates.sort((a, b) => b.index - a.index);
        for (const match of duplicates) {
            console.log('Deleting duplicate entry: ' + match[0].trim());
            androidManifest = remove(androidManifest, match.index, match[0].length);
        }
        fs.writeFileSync(manifestPath, androidManifest);
    }
};

function usesFeaturesRegex(feature) {
    return new RegExp(
        '\\n\\s*?<uses-feature.*? android:name="android\\.hardware\\.' + feature + '".*?\\/>',
        'gm'
    );
}

function matchAll(regex, value) {
    let capture = [];
    const all = [];
    while ((capture = regex.exec(value)) !== null) all.push(capture);
    return all;
}

// Source: https://stackoverflow.com/a/52044338/156169
function remove(string, from, length) {
    return string.substring(0, from) + string.substring(from + length);
}