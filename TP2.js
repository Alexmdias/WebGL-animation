import * as THREE from './build/three.module.js';

import Stats from './jsm/libs/stats.module.js';

import {
    ColladaLoader
}
from './jsm/loaders/ColladaLoader.js';

import {
    OrbitControls
}
from './jsm/controls/OrbitControls.js'

//SPECIAL IMPORT
// THREEx.KeyboardState.js keep the current state of the keyboard.
// It is possible to query it at any time. No need of an event.
// This is particularly convenient in loop driven case, like in
// 3D demos or games.
//
// # Usage
//
// **Step 1**: Create the object
//
// ```var keyboard	= new THREEx.KeyboardState();```
//
// **Step 2**: Query the keyboard state
//
// This will return true if shift and A are pressed, false otherwise
//
// ```keyboard.pressed("shift+A")```
//
// **Step 3**: Stop listening to the keyboard
//
// ```keyboard.destroy()```
//
// NOTE: this library may be nice as standaline. independant from three.js
// - rename it keyboardForGame
//
// # Code
//

/** @namespace */
var THREEx = THREEx || {};

/**
 * - NOTE: it would be quite easy to push event-driven too
 *   - microevent.js for events handling
 *   - in this._onkeyChange, generate a string from the DOM event
 *   - use this as event name
 */
THREEx.KeyboardState = function (domElement) {
    this.domElement = domElement || document;
    // to store the current state
    this.keyCodes = {};
    this.modifiers = {};

    // create callback to bind/unbind keyboard events
    var _this = this;
    this._onKeyDown = function (event) {
        _this._onKeyChange(event)
    }
    this._onKeyUp = function (event) {
        _this._onKeyChange(event)
    }

    // bind keyEvents
    this.domElement.addEventListener("keydown", this._onKeyDown, false);
    this.domElement.addEventListener("keyup", this._onKeyUp, false);

    // create callback to bind/unbind window blur event
    this._onBlur = function () {
        for (var prop in _this.keyCodes)
            _this.keyCodes[prop] = false;
        for (var prop in _this.modifiers)
            _this.modifiers[prop] = false;
    }

    // bind window blur
    window.addEventListener("blur", this._onBlur, false);
}

/**
 * To stop listening of the keyboard events
 */
THREEx.KeyboardState.prototype.destroy = function () {
    // unbind keyEvents
    this.domElement.removeEventListener("keydown", this._onKeyDown, false);
    this.domElement.removeEventListener("keyup", this._onKeyUp, false);

    // unbind window blur event
    window.removeEventListener("blur", this._onBlur, false);
}

THREEx.KeyboardState.MODIFIERS = ['shift', 'ctrl', 'alt', 'meta'];
THREEx.KeyboardState.ALIAS = {
    'left': 37,
    'up': 38,
    'right': 39,
    'down': 40,
    'space': 32,
    'pageup': 33,
    'pagedown': 34,
    'tab': 9,
    'escape': 27
};

/**
 * to process the keyboard dom event
 */
THREEx.KeyboardState.prototype._onKeyChange = function (event) {
    // log to debug
    //console.log("onKeyChange", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)

    // update this.keyCodes
    var keyCode = event.keyCode
        var pressed = event.type === 'keydown' ? true : false
        this.keyCodes[keyCode] = pressed
        // update this.modifiers
        this.modifiers['shift'] = event.shiftKey
        this.modifiers['ctrl'] = event.ctrlKey
        this.modifiers['alt'] = event.altKey
        this.modifiers['meta'] = event.metaKey
}

/**
 * query keyboard state to know if a key is pressed of not
 *
 * @param {String} keyDesc the description of the key. format : modifiers+key e.g shift+A
 * @returns {Boolean} true if the key is pressed, false otherwise
 */
THREEx.KeyboardState.prototype.pressed = function (keyDesc) {
    var keys = keyDesc.split("+");
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
            var pressed = false
            if (THREEx.KeyboardState.MODIFIERS.indexOf(key) !== -1) {
                pressed = this.modifiers[key];
            } else if (Object.keys(THREEx.KeyboardState.ALIAS).indexOf(key) != -1) {
                pressed = this.keyCodes[THREEx.KeyboardState.ALIAS[key]];
            } else {
                pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)]
            }
            if (!pressed)
                return false;
    };
    return true;
}

/**
 * return true if an event match a keyDesc
 * @param  {KeyboardEvent} event   keyboard event
 * @param  {String} keyDesc string description of the key
 * @return {Boolean}         true if the event match keyDesc, false otherwise
 */
THREEx.KeyboardState.prototype.eventMatches = function (event, keyDesc) {
    var aliases = THREEx.KeyboardState.ALIAS
        var aliasKeys = Object.keys(aliases)
        var keys = keyDesc.split("+")
        // log to debug
        // console.log("eventMatches", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var pressed = false;
            if (key === 'shift') {
                pressed = (event.shiftKey ? true : false)
            } else if (key === 'ctrl') {
                pressed = (event.ctrlKey ? true : false)
            } else if (key === 'alt') {
                pressed = (event.altKey ? true : false)
            } else if (key === 'meta') {
                pressed = (event.metaKey ? true : false)
            } else if (aliasKeys.indexOf(key) !== -1) {
                pressed = (event.keyCode === aliases[key] ? true : false);
            } else if (event.keyCode === key.toUpperCase().charCodeAt(0)) {
                pressed = true;
            }
            if (!pressed)
                return false;
        }
        return true;
}

let container, stats, clock, controls;
let lights, camera, scene, renderer, human, humanGeometry, humanMaterial, humanMesh, robot;
let skinWeight, skinIndices, boneArray, realBones, boneDict, centerOfMass;

THREE.Cache.enabled = true;


THREE.Object3D.prototype.setMatrix = function (a) {
    this.matrix = a;
    this.matrix.decompose(this.position, this.quaternion, this.scale);
};


class Robot {
    constructor(h) {
this.spineLength = 0.65305 ;
		this.chestLength =0.46487;
		this.neckLength = 0.24523
		this.headLength = 0.39284;
		
		this.armLength = 0.72111;
		this.forearmLength = 0.61242;
		this.legLength = 1.16245;
		this.shinLength = 1.03432;
		
		this.armLeftRotation = realBones[4].rotation;
		this.forearmLeftRotation = realBones[5].rotation;
		this.armRightRotation  = realBones[6].rotation;
		this.forearmRightRotation = realBones[7].rotation;
		
		this.legLeftRotation = realBones[8].rotation;
		this.shinLeftRotation = realBones[9].rotation;
		this.legRightRotation = realBones[10].rotation;
		this.shinRightRotation = realBones[11].rotation;
		
		this.spineTranslation = realBones[0].position;
		this.chestTranslation = realBones[1].position;
		this.neckTranslation = realBones[2].position;
		this.headTranslation = realBones[3].position;
		this.armLeftTranslation = realBones[4].position;
		this.forearmLeftTranslation =  realBones[5].position;
		this.armRightTranslation  = realBones[6].position;
		this.forearmRightTranslation = realBones[7].position;
		
		this.legLeftTranslation =  realBones[8].position;
		this.shinLeftTranslation =  realBones[9].position;
		this.legRightTranslation=  realBones[10].position;
		this.shinRightTranslation =  realBones[11].position;

        this.bodyWidth = 0.2;
        this.bodyDepth = 0.2;
      
        this.neckRadius = 0.1;
        this.headRadius = 0.32;
        this.legRadius = 0.10;
        this.thighRadius = 0.1;
        this.footDepth = 0.4;
        this.footWidth = 0.25;
        this.armRadius = 0.10;
        this.handRadius = 0.1;

        // Material
        this.material = new THREE.MeshNormalMaterial();
        this.human = h;
        // Initial pose
        this.initialize()
        this.initHierarchy()
    }

    initialize() {
        // Spine geomerty
        var spineGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2,this.spineLength, 64);
        if (!this.hasOwnProperty("spine"))
            this.spine = new THREE.Mesh(spineGeometry, this.material);

        var chestGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2, this.chestLength, 64);
        if (!this.hasOwnProperty("chest"))
            this.chest = new THREE.Mesh(chestGeometry, this.material);

        // Neck geomerty
        var neckGeometry = new THREE.CylinderGeometry(0.5*this.neckRadius, this.neckRadius, this.neckLength, 64);
        if (!this.hasOwnProperty("neck"))
            this.neck = new THREE.Mesh(neckGeometry, this.material);

        // Head geomerty
        var headGeometry = new THREE.SphereGeometry(this.headLength/2, 64, 3);
        if (!this.hasOwnProperty("head"))
            this.head = new THREE.Mesh(headGeometry, this.material);

        // armLeft geometry
        var armLeftGeometry = new THREE.CylinderGeometry(this.armRadius / 2, this.armRadius, this.armLength, 64);
        if (!this.hasOwnProperty("armLeft"))
            this.armLeft = new THREE.Mesh(armLeftGeometry, this.material);

        // forearmLeft geometry
        var forearmLeftGeometry = new THREE.CylinderGeometry(this.armRadius / 2, this.armRadius, this.forearmLength, 64);
        if (!this.hasOwnProperty("forearmLeft"))
            this.forearmLeft = new THREE.Mesh(forearmLeftGeometry, this.material);

        // handLeft geometry
        var handLeftGeometry = new THREE.SphereGeometry(this.handRadius, 64, 3);
        if (!this.hasOwnProperty("handLeft"))
            this.handLeft = new THREE.Mesh(handLeftGeometry, this.material);

        // armRight geometry
        var armRightGeometry = new THREE.CylinderGeometry(this.armRadius / 2, this.armRadius, this.armLength, 64);
        if (!this.hasOwnProperty("armRight"))
            this.armRight = new THREE.Mesh(armRightGeometry, this.material);

        // forearmRight geometry
        var forearmRightGeometry = new THREE.CylinderGeometry(this.armRadius / 2, this.armRadius, this.forearmLength, 64);
        if (!this.hasOwnProperty("forearmRight"))
            this.forearmRight = new THREE.Mesh(forearmRightGeometry, this.material);

        // handRight geometry
        var handRightGeometry = new THREE.SphereGeometry(this.handRadius, 64, 3);
        if (!this.hasOwnProperty("handRight"))
            this.handRight = new THREE.Mesh(handRightGeometry, this.material);

        // legLeft geometry
        var legLeftGeometry = new THREE.CylinderGeometry(this.legRadius / 2, this.legRadius, this.legLength, 64);
        if (!this.hasOwnProperty("legLeft"))
            this.legLeft = new THREE.Mesh(legLeftGeometry, this.material);

        // shinLeft geometry
        var shinLeftGeometry = new THREE.CylinderGeometry(this.legRadius / 2, this.legRadius, this.legLength, 64);
        if (!this.hasOwnProperty("shinLeft"))
            this.shinLeft = new THREE.Mesh(shinLeftGeometry, this.material);

        // footLeft geometry
        var footLeftGeometry = new THREE.BoxGeometry(this.footWidth,this.footWidth/2,this.footDepth)
        if (!this.hasOwnProperty("footLeft"))
            this.footLeft = new THREE.Mesh(footLeftGeometry, this.material);

        // legRight geometry
        var legRightGeometry = new THREE.CylinderGeometry(this.legRadius / 2, this.legRadius, this.legLength, 64);
        if (!this.hasOwnProperty("legRight"))
            this.legRight = new THREE.Mesh(legRightGeometry, this.material);

        // shinRight geometry
        var shinRightGeometry = new THREE.CylinderGeometry(this.legRadius / 2, this.legRadius, this.legLength, 64);
        if (!this.hasOwnProperty("shinRight"))
            this.shinRight = new THREE.Mesh(shinRightGeometry, this.material);

        // footRight geometry
        var footRightGeometry = new THREE.BoxGeometry(this.footWidth,this.footWidth/2,this.footDepth)
        if (!this.hasOwnProperty("footRight"))
            this.footRight = new THREE.Mesh(footRightGeometry, this.material);

        var bullet1Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 64);
        if (!this.hasOwnProperty("bullet1"))
            this.bullet1 = new THREE.Mesh(bullet1Geometry, this.material);

        var bullet2Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 64);
        if (!this.hasOwnProperty("bullet2"))
            this.bullet2 = new THREE.Mesh(bullet2Geometry, this.material);

        var bullet3Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 64);
        if (!this.hasOwnProperty("bullet3"))
            this.bullet3 = new THREE.Mesh(bullet3Geometry, this.material);

        var bullet4Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 64);
        if (!this.hasOwnProperty("bullet4"))
            this.bullet4 = new THREE.Mesh(bullet4Geometry, this.material);

        var bullet5Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 64);
        if (!this.hasOwnProperty("bullet5"))
            this.bullet5 = new THREE.Mesh(bullet5Geometry, this.material);

        var bullet6Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 64);
        if (!this.hasOwnProperty("bullet6"))
            this.bullet6 = new THREE.Mesh(bullet6Geometry, this.material);

        // Spine matrix
        this.spineMatrix = new THREE.Matrix4().set(

            1, 0, 0, 0,
            0, 1, 0, this.spineTranslation.y+this.spineLength/2,
            0, 0, 1, 0,
            0, 0, 0, 1);
        this.chestMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.chestTranslation.y-this.spineLength/2+this.chestLength/2,
            0, 0, 1, 0,
            0, 0, 0, 1);

        // Neck matrix
        this.neckMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.neckTranslation.y-this.chestLength/2+this.neckLength/2,
            0, 0, 1, 0,
            0, 0, 0, 1);

        // Head matrix
        this.headMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.headTranslation.y-this.neckLength/2+this.headLength/2,
            0, 0, 1, 0,
            0, 0, 0, 1);


        // armLeft matrix
        this.armLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0,0,
            0, 1, 0, this.chestLength/2+this.armLength/2 - this.chestLength,
            0, 0, 1, 0,
            0, 0, 0, 1).multiply(
                translation(this.armLeftTranslation.x,this.armLeftTranslation.y,this.armLeftTranslation.z)).multiply(
                    translation(0,-this.armLength/2,0)).multiply(
                        rotateZYX(this.armLeftRotation.z,this.armLeftRotation.y,this.armLeftRotation.x)).multiply(
                            translation(0,this.armLength/2,0));


        // forearmLeft matrix
        this.forearmLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.armLength/2+this.forearmLength/2 - this.armLength,
            0, 0, 1, 0,
            0, 0, 0, 1).multiply(
            translation(this.forearmLeftTranslation.x,this.forearmLeftTranslation.y,this.forearmLeftTranslation.z)).multiply(
                translation(0,-this.forearmLength/2,0)).multiply(
                    rotateZYX(this.forearmLeftRotation.z,this.forearmLeftRotation.y,this.forearmLeftRotation.x)).multiply(
                        translation(0,this.forearmLength/2,0));

        // handLeft matrix
        this.handLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.forearmLength/2 + this.handRadius,
            0, 0, 1, 0,
            0, 0, 0, 1);

        // armRight matrix
        this.armRightMatrix = new THREE.Matrix4().set( // DONT FORGET THE OTHER ROTATIONS X AND Y
            1, 0, 0,0,
            0, 1, 0, this.chestLength/2+this.armLength/2 - this.chestLength,
            0, 0, 1, 0,
            0, 0, 0, 1).multiply(
            translation(this.armRightTranslation.x,this.armRightTranslation.y,this.armRightTranslation.z)).multiply(
            translation(0,-this.armLength/2,0)).multiply(
            rotateZYX(this.armRightRotation.z,this.armRightRotation.y,this.armRightRotation.x)).multiply(
            translation(0,this.armLength/2,0));

        // forearmRight matrix
        this.forearmRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.armLength/2+this.forearmLength/2 - this.armLength,
            0, 0, 1, 0,
            0, 0, 0, 1).multiply(
            translation(this.forearmRightTranslation.x,this.forearmRightTranslation.y,this.forearmRightTranslation.z)).multiply(
            translation(0,-this.forearmLength/2,0)).multiply(
            rotateZYX(this.forearmRightRotation.z,this.forearmRightRotation.y,this.forearmRightRotation.x)).multiply(
            translation(0,this.forearmLength/2,0));

        // handRight matrix
        this.handRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.forearmLength/2 + this.handRadius,
            0, 0, 1, 0,
            0, 0, 0, 1);

        // legLeft matrix
        this.legLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.spineLength/2+this.legLength/2 - this.spineLength,
            0, 0, 1, 0,
            0, 0, 0, 1).multiply(
            translation(this.legLeftTranslation.x,this.legLeftTranslation.y,this.legLeftTranslation.z)).multiply(
            translation(0,-this.legLength/2,0)).multiply(
            rotateZYX(this.legLeftRotation.z,this.legLeftRotation.y,-this.legLeftRotation.x)).multiply(
            translation(0,this.legLength/2,0));

        // shinLeft matrix
        this.shinLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.legLength/2+this.shinLength/2 - this.legLength,
            0, 0, 1, 0,
            0, 0, 0, 1).multiply(
            translation(this.shinLeftTranslation.x,this.shinLeftTranslation.y,this.shinLeftTranslation.z)).multiply(
            translation(0,-this.shinLength/2,0)).multiply(
            rotateZYX(this.shinLeftRotation.z,this.shinLeftRotation.y,this.shinLeftRotation.x)).multiply(
            translation(0,this.shinLength/2,0));

        // footLeft matrix5
        this.footLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.legLength/2,
            0, 0, 1, this.footDepth/6,
            0, 0, 0, 1);

        // legRight matrix
        this.legRightMatrix =new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.spineLength/2+this.legLength/2 - this.spineLength,
            0, 0, 1, 0,
            0, 0, 0, 1).multiply(
            translation(this.legRightTranslation.x,this.legRightTranslation.y,this.legRightTranslation.z)).multiply(
            translation(0,-this.legLength/2,0)).multiply(
            rotateZYX(this.legRightRotation.z,this.legRightRotation.y,-this.legRightRotation.x)).multiply(
            translation(0,this.legLength/2,0));

        // shinRight matrix
        this.shinRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.legLength/2+this.shinLength/2 - this.legLength,
            0, 0, 1, 0,
            0, 0, 0, 1).multiply(
            translation(this.shinRightTranslation.x,this.shinRightTranslation.y,this.shinRightTranslation.z)).multiply(
            translation(0,-this.shinLength/2,0)).multiply(
            rotateZYX(this.shinRightRotation.z,this.shinRightRotation.y,this.shinRightRotation.x)).multiply(
            translation(0,this.shinLength/2,0));

        // footRight matrix5
        this.footRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, this.legLength/2,
            0, 0, 1, this.footDepth/6,
            0, 0, 0, 1);

        // bullet matrix
        this.bullet1Matrix = new THREE.Matrix4().set(

            1, 0, 0, 0.3,
            0, 1, 0, 1.4,
            0, 0, 1, 25.0,
            0, 0, 0, 1);

        // bullet matrix
        this.bullet2Matrix = new THREE.Matrix4().set(

            1, 0, 0, -0.3,
            0, 1, 0, 1.0,
            0, 0, 1, 45.0,
            0, 0, 0, 1);

        // bullet matrix
        this.bullet3Matrix = new THREE.Matrix4().set(

            1, 0, 0, 0.1,
            0, 1, 0, 0.7,
            0, 0, 1, 60.0,
            0, 0, 0, 1);

        // bullet matrix
        this.bullet4Matrix = new THREE.Matrix4().set(

            1, 0, 0, 0.4,
            0, 1, 0, 0.2,
            0, 0, 1, 70.0,
            0, 0, 0, 1);

        // bullet matrix
        this.bullet5Matrix = new THREE.Matrix4().set(

            1, 0, 0, 0.1,
            0, 1, 0, 0.1,
            0, 0, 1, 75.0,
            0, 0, 0, 1);

        // bullet matrix
        this.bullet6Matrix = new THREE.Matrix4().set(

            1, 0, 0, -0.05,
            0, 1, 0, -0.1,
            0, 0, 1, 80.0,
            0, 0, 0, 1);

        //inverse des matrices initiales qu'on peut garder ici
        this.spineInverse = inverseOf(this.spineMatrix);
        this.chestInverse = inverseOf(this.chestMatrix);
        this.neckInverse = inverseOf(this.neckMatrix);
        this.headInverse = inverseOf(this.headMatrix);
        this.armLeftInverse = inverseOf(this.armLeftMatrix);
        this.forearmLeftInverse = inverseOf(this.forearmLeftMatrix);
        this.armRightInverse = inverseOf(this.armRightMatrix);
        this.forearmRightInverse = inverseOf(this.forearmRightMatrix);
        this.legLeftInverse = inverseOf(this.legLeftMatrix);
        this.shinLeftInverse = inverseOf(this.shinLeftMatrix);
        this.legRightInverse = inverseOf(this.legRightMatrix);
        this.shinRightInverse = inverseOf(this.shinRightMatrix);
    }
    initHierarchy() {
        var chestMatrix =  new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.chestMatrix);
        var neckMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.neckMatrix);
        var headMatrix = new THREE.Matrix4().multiplyMatrices(neckMatrix, this.headMatrix);
        var armLeftMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armLeftMatrix);
        var forearmLeftMatrix = new THREE.Matrix4().multiplyMatrices(armLeftMatrix, this.forearmLeftMatrix);
        var handLeftMatrix = new THREE.Matrix4().multiplyMatrices(forearmLeftMatrix, this.handLeftMatrix);
        var armRightMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armRightMatrix);
        var forearmRightMatrix = new THREE.Matrix4().multiplyMatrices(armRightMatrix, this.forearmRightMatrix);
        var handRightMatrix = new THREE.Matrix4().multiplyMatrices(forearmRightMatrix, this.handRightMatrix);
        var legLeftMatrix =  new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.legLeftMatrix);
        var shinLeftMatrix =  new THREE.Matrix4().multiplyMatrices(legLeftMatrix, this.shinLeftMatrix);
        var footLeftMatrix =  new THREE.Matrix4().multiplyMatrices(shinLeftMatrix, this.footLeftMatrix);
        var legRightMatrix =  new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.legRightMatrix);
        var shinRightMatrix =  new THREE.Matrix4().multiplyMatrices(legRightMatrix, this.shinRightMatrix);
        var footRightMatrix =  new THREE.Matrix4().multiplyMatrices(shinRightMatrix, this.footRightMatrix);

        // Apply transformation
        this.spine.setMatrix(this.spineMatrix);
        if (scene.getObjectById(this.spine.id) === undefined)
            scene.add(this.spine);

        this.chest.setMatrix(chestMatrix);
        if (scene.getObjectById(this.chest.id) === undefined)
            scene.add(this.chest);

        this.neck.setMatrix(neckMatrix);
        if (scene.getObjectById(this.neck.id) === undefined)
            scene.add(this.neck);

        this.head.setMatrix(headMatrix);
        if (scene.getObjectById(this.head.id) === undefined)
            scene.add(this.head);

        this.armLeft.setMatrix(armLeftMatrix);
        if (scene.getObjectById(this.armLeft.id) === undefined)
            scene.add(this.armLeft);

        this.forearmLeft.setMatrix(forearmLeftMatrix);
        if (scene.getObjectById(this.forearmLeft.id) === undefined)
            scene.add(this.forearmLeft);

        this.handLeft.setMatrix(handLeftMatrix);
        if (scene.getObjectById(this.handLeft.id) === undefined)
            scene.add(this.handLeft);

        this.armRight.setMatrix(armRightMatrix);
        if (scene.getObjectById(this.armRight.id) === undefined)
            scene.add(this.armRight);

        this.forearmRight.setMatrix(forearmRightMatrix);
        if (scene.getObjectById(this.forearmRight.id) === undefined)
            scene.add(this.forearmRight);

        this.handRight.setMatrix(handRightMatrix);
        if (scene.getObjectById(this.handRight.id) === undefined)
            scene.add(this.handRight);

        this.legLeft.setMatrix(legLeftMatrix);
        if (scene.getObjectById(this.legLeft.id) === undefined)
            scene.add(this.legLeft);

        this.shinLeft.setMatrix(shinLeftMatrix);
        if (scene.getObjectById(this.shinLeft.id) === undefined)
            scene.add(this.shinLeft);

        this.footLeft.setMatrix(footLeftMatrix);
        if (scene.getObjectById(this.footLeft.id) === undefined)
            scene.add(this.footLeft);

        this.legRight.setMatrix(legRightMatrix);
        if (scene.getObjectById(this.legRight.id) === undefined)
            scene.add(this.legRight);

        this.shinRight.setMatrix(shinRightMatrix);
        if (scene.getObjectById(this.shinRight.id) === undefined)
            scene.add(this.shinRight);

        this.footRight.setMatrix(footRightMatrix);
        if (scene.getObjectById(this.footRight.id) === undefined)
            scene.add(this.footRight);

        this.bullet1.setMatrix(this.bullet1Matrix);
        if (scene.getObjectById(this.bullet1.id) === undefined)
            scene.add(this.bullet1);
        this.bullet2.setMatrix(this.bullet2Matrix);
        if (scene.getObjectById(this.bullet2.id) === undefined)
            scene.add(this.bullet2);
        this.bullet3.setMatrix(this.bullet3Matrix);
        if (scene.getObjectById(this.bullet3.id) === undefined)
            scene.add(this.bullet3);
        this.bullet4.setMatrix(this.bullet4Matrix);
        if (scene.getObjectById(this.bullet4.id) === undefined)
            scene.add(this.bullet4);
        this.bullet5.setMatrix(this.bullet5Matrix);
        if (scene.getObjectById(this.bullet5.id) === undefined)
            scene.add(this.bullet5);
        this.bullet6.setMatrix(this.bullet6Matrix);
        if (scene.getObjectById(this.bullet6.id) === undefined)
            scene.add(this.bullet6);


        //Tj = matriceTransformé * inverse( matrice originale )
        boneDict['Spine'].matrix =  matMul(this.spineMatrix, this.spineInverse);
        boneDict['Chest'].matrix = matMul(chestMatrix, this.chestInverse);
        boneDict['Neck'].matrix = matMul(neckMatrix, this.neckInverse);
        boneDict['Head'].matrix = matMul(headMatrix,this.headInverse);
        boneDict['Arm_L'].matrix = matMul(armLeftMatrix, this.armLeftInverse);
        boneDict['Forearm_L'].matrix = matMul(forearmLeftMatrix,this.forearmLeftInverse);
        boneDict['Arm_R'].matrix = matMul(armRightMatrix, this.armRightInverse);
        boneDict['Forearm_R'].matrix = matMul(forearmRightMatrix, this.forearmRightInverse);
        boneDict['Leg_L'].matrix = matMul(legLeftMatrix, this.legLeftInverse);
        boneDict['Shin_L'].matrix = matMul(shinLeftMatrix, this.shinLeftInverse);
        boneDict['Leg_R'].matrix = matMul(legRightMatrix,this.legRightInverse);
        boneDict['Shin_R'].matrix = matMul(shinRightMatrix,this.shinRightInverse);
        buildShaderBoneMatrix();
    }
    hideRobot() {
        this.spine.visible = false;
        this.chest.visible = false;
        this.neck.visible = false;
        this.head.visible = false;
        this.armLeft.visible = false;
        this.forearmLeft.visible = false;
        this.handLeft.visible = false;
        this.armRight.visible = false;
        this.forearmRight.visible = false;
        this.handRight.visible = false;
        this.legLeft.visible = false;
        this.shinLeft.visible = false;
        this.legLeft.visible = false;
        this.footLeft.visible = false;
        this.legRight.visible = false;
        this.shinRight.visible = false;
        this.legRight.visible = false;
        this.footRight.visible = false;
    }
    hideHuman() {
        this.human.visible = false;
    }

    showRobot() {
        this.spine.visible = true;
        this.chest.visible = true;
        this.neck.visible = true;
        this.head.visible = true;
        this.armLeft.visible = true;
        this.forearmLeft.visible = true;
        this.handLeft.visible = true;
        this.armRight.visible = true;
        this.forearmRight.visible = true;
        this.handRight.visible = true;
        this.legLeft.visible = true;
        this.shinLeft.visible = true;
        this.legLeft.visible = true;
        this.footLeft.visible = true;
        this.legRight.visible = true;
        this.shinRight.visible = true;
        this.legRight.visible = true;
        this.footRight.visible = true;
    }
    showHuman() {
        this.human.visible = true;
    }
	
	pose1(){
        this.initialize();
        this.spine.setMatrix(this.spineMatrix.multiply(translation(0,0.5,0)));
        this.legLeft.setMatrix(this.legLeftMatrix.multiply(rotX(deg2rad(-45))));
        this.legLeft.setMatrix(this.legLeftMatrix.multiply(translation(0,0.2,-0.5)));
        this.shinLeft.setMatrix(this.shinLeftMatrix.multiply(rotX(deg2rad(-45))));
        this.shinLeft.setMatrix(this.shinLeftMatrix.multiply(translation(0,0.25,-0.35)));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(rotX(deg2rad(-45))));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(translation(0,0.25,-0.35)));
        this.armLeft.setMatrix(this.armLeftMatrix.multiply(rotX(deg2rad(-25))));
        this.armLeft.setMatrix(this.armLeftMatrix.multiply(translation(0,0,-0.15)));
        this.armRight.setMatrix(this.armRightMatrix.multiply(rotZ(deg2rad(-75))));
        this.armRight.setMatrix(this.armRightMatrix.multiply(translation(0.5,0.4,0)));
        this.forearmRight.setMatrix(this.forearmRightMatrix.multiply(rotX(deg2rad(25))));
        this.forearmRight.setMatrix(this.forearmRightMatrix.multiply(translation(0,0,0.15)));
        this.spine.setMatrix(this.spineMatrix.multiply(rotX(deg2rad(35))));
        this.chest.setMatrix(this.chestMatrix.multiply(rotX(deg2rad(-25))));
        this.chest.setMatrix(this.chestMatrix.multiply(translation(0,0,-0.1)));
        this.initHierarchy();
    }
	
	pose2(){
        this.initialize();
        this.armLeft.setMatrix(this.armLeftMatrix.multiply(translation(-0.5,-0.5,0.0)));
        this.armLeft.setMatrix(this.armLeftMatrix.multiply(rotZ(deg2rad(110))));
        this.armRight.setMatrix(this.armRightMatrix.multiply(translation(0.5,-0.5,0.0)));
        this.armRight.setMatrix(this.armRightMatrix.multiply(rotZ(deg2rad(-110))));
        this.legLeft.setMatrix(this.legLeftMatrix.multiply(rotZ(deg2rad(30))));
        this.legLeft.setMatrix(this.legLeftMatrix.multiply(translation(-0.4,0.1,0.0)));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(rotX(deg2rad(-45))));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(translation(0,0.25,-0.35)));
        this.spine.setMatrix(this.spineMatrix.multiply(rotZ(deg2rad(180))));
        this.spine.setMatrix(this.spineMatrix.multiply(translation(0,0.5,0)));
        this.initHierarchy();
	}

    pose3(){
        this.initialize();
        this.spine.setMatrix(this.spineMatrix.multiply(translation(0,-3.25,-15.25)));
        this.legLeft.setMatrix(this.legLeftMatrix.multiply(translation(-0.1,0.0,0.0)));
        this.legLeft.setMatrix(this.legLeftMatrix.multiply(rotZ(deg2rad(15))));
        this.shinLeft.setMatrix(this.shinLeftMatrix.multiply(translation(0,-0.8,-0.743)));
        this.shinLeft.setMatrix(this.shinLeftMatrix.multiply(rotX(deg2rad(-125))));
        this.legRight.setMatrix(this.legRightMatrix.multiply(translation(0.1,0.0,0.0)));
        this.legRight.setMatrix(this.legRightMatrix.multiply(rotZ(deg2rad(-15))));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(translation(0,-0.1,-0.543)));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(rotX(deg2rad(-52))));
        this.armRight.setMatrix(this.armRightMatrix.multiply(rotX(deg2rad(70))));
        this.armRight.setMatrix(this.armRightMatrix.multiply(translation(0.0,0.3,0.5)));
        this.armLeft.setMatrix(this.armLeftMatrix.multiply(rotX(deg2rad(70))));
        this.armLeft.setMatrix(this.armLeftMatrix.multiply(translation(0.0,0.3,0.5)));
        this.initHierarchy();
    }

    pose4(){
        this.initialize();
        this.initHierarchy();
    }

    animate(t) {
        //speed
        var speed = 10;
        this.initialize();
        this.legLeft.setMatrix(this.legLeftMatrix.multiply(rotX(deg2rad(sin(-t*speed)*50))));
        this.shinLeft.setMatrix(this.shinLeftMatrix.multiply(translation(0,0.05,-0.1)));
        this.shinLeft.setMatrix(this.shinLeftMatrix.multiply(rotX(deg2rad(sin(-t*speed)*22-10))));
        this.legRight.setMatrix(this.legRightMatrix.multiply(rotX(deg2rad(sin(-t*speed+10)*50))));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(translation(0,0.05,-0.1)));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(rotX(deg2rad(sin(-t*speed+10)*22-10))));
        this.armLeft.setMatrix(this.armLeftMatrix.multiply(rotX(deg2rad(sin(-t*speed+10)*50))));
        this.forearmLeft.setMatrix(this.forearmLeftMatrix.multiply(rotX(deg2rad(45))));
        this.forearmLeft.setMatrix(this.forearmLeftMatrix.multiply(translation(0,0.1,0.20)));
        this.armRight.setMatrix(this.armRightMatrix.multiply(rotX(deg2rad(sin(-t*speed)*50))));
        this.forearmRight.setMatrix(this.forearmRightMatrix.multiply(rotX(deg2rad(45))));
        this.forearmRight.setMatrix(this.forearmRightMatrix.multiply(translation(0,0.1,0.20)));
        this.spine.setMatrix(this.spineMatrix.multiply(rotZ(deg2rad(sin(-t*speed+10)*10))));
        this.spine.setMatrix(this.spineMatrix.multiply(rotX(deg2rad(15))));
        this.initHierarchy();
    }

    therealmatrix(t){
        //speed
        var speed = 5; // needs to be slow for real matrix movie effect, but feel free to see it to a faster motion!
        this.initialize();
        this.bullet1.setMatrix(this.bullet1Matrix.multiply(translation(0,0,-t*speed)));
        this.bullet1.setMatrix(this.bullet1Matrix.multiply(rotX(deg2rad(90))));
        this.bullet2.setMatrix(this.bullet2Matrix.multiply(translation(0,0,-t*speed)));
        this.bullet2.setMatrix(this.bullet2Matrix.multiply(rotX(deg2rad(90))));
        this.bullet3.setMatrix(this.bullet3Matrix.multiply(translation(0,0,-t*speed)));
        this.bullet3.setMatrix(this.bullet3Matrix.multiply(rotX(deg2rad(90))));
        this.bullet4.setMatrix(this.bullet4Matrix.multiply(translation(0,0,-t*speed)));
        this.bullet4.setMatrix(this.bullet4Matrix.multiply(rotX(deg2rad(90))));
        this.bullet5.setMatrix(this.bullet5Matrix.multiply(translation(0,0,-t*speed)));
        this.bullet5.setMatrix(this.bullet5Matrix.multiply(rotX(deg2rad(90))));
        this.bullet6.setMatrix(this.bullet6Matrix.multiply(translation(0,0,-t*speed)));
        this.bullet6.setMatrix(this.bullet6Matrix.multiply(rotX(deg2rad(90))));
        this.spine.setMatrix(this.spineMatrix.multiply(translation(0,-t*speed*0.012,-t*speed*0.015)));
        this.spine.setMatrix(this.spineMatrix.multiply(rotX(deg2rad(-t*speed))));
        this.legLeft.setMatrix(this.legLeftMatrix.multiply(translation(-0.1,0.0,0.0)));
        this.legLeft.setMatrix(this.legLeftMatrix.multiply(rotZ(deg2rad(t*speed*0.2))));
        this.shinLeft.setMatrix(this.shinLeftMatrix.multiply(translation(0,-t*speed*0.004,-t*speed*0.01)));
        this.shinLeft.setMatrix(this.shinLeftMatrix.multiply(rotX(deg2rad(-t*speed))));
        this.legRight.setMatrix(this.legRightMatrix.multiply(translation(0.1,0.0,0.0)));
        this.legRight.setMatrix(this.legRightMatrix.multiply(rotZ(deg2rad(-t*speed*0.2))));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(translation(0,-t*speed*0.004,-t*speed*0.01)));
        this.shinRight.setMatrix(this.shinRightMatrix.multiply(rotX(deg2rad(-t*speed))));
        this.armLeft.setMatrix(this.armLeftMatrix.multiply(rotZ(deg2rad(sin(t*speed*0.2)*30))));
        this.armLeft.setMatrix(this.armLeftMatrix.multiply(rotX(deg2rad(cos(t*speed*0.2)*30))));
        this.armRight.setMatrix(this.armRightMatrix.multiply(rotZ(deg2rad(sin(1.5+t*speed*0.2)*30))));
        this.armRight.setMatrix(this.armRightMatrix.multiply(rotX(deg2rad(cos(t*speed*0.2+1.0)*30))));
        camera.position.set(sin(t * speed * 0.1)*15, 0, cos(t* speed * 0.1)*10);
        camera.lookAt(0, 0, 0);
        this.initHierarchy();
    }
}

var keyboard = new THREEx.KeyboardState();
var channel = 'p';
var pi = Math.PI;

function init() {

    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 3, 0);

    scene = new THREE.Scene();
    scene.add(camera);

    controls = new OrbitControls(camera, container);
    controls.damping = 0.2;

    clock = new THREE.Clock();

    boneDict = {}

    boneArray = new Float32Array(12 * 16);

    humanMaterial = new THREE.ShaderMaterial({
        uniforms: {
            bones: {
                value: boneArray
            }
        }
    });

    const shaderLoader = new THREE.FileLoader();
    shaderLoader.load('glsl/human.vs.glsl',
        function (data) {
        humanMaterial.vertexShader = data;
    })
    shaderLoader.load('glsl/human.fs.glsl',
        function (data) {
        humanMaterial.fragmentShader = data;
    })

    // loading manager

    const loadingManager = new THREE.LoadingManager(function () {
        scene.add(humanMesh);
    });

    // collada
    humanGeometry = new THREE.BufferGeometry();
    const loader = new ColladaLoader(loadingManager);
    loader.load('./model/human.dae', function (collada) {
		skinIndices = collada.library.geometries['human-mesh'].build.triangles.data.attributes.skinIndex.array;
        skinWeight = collada.library.geometries['human-mesh'].build.triangles.data.attributes.skinWeight.array;
		realBones = collada.library.nodes.human.build.skeleton.bones;

        buildSkeleton();
        buildShaderBoneMatrix();
        humanGeometry.setAttribute('position', new THREE.BufferAttribute(collada.library.geometries['human-mesh'].build.triangles.data.attributes.position.array, 3));
        humanGeometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
        humanGeometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4));
        humanGeometry.setAttribute('normal', new THREE.BufferAttribute(collada.library.geometries['human-mesh'].build.triangles.data.attributes.normal.array, 3));

        humanMesh = new THREE.Mesh(humanGeometry, humanMaterial);
        robot = new Robot(humanMesh);
        robot.hideHuman();

    });

    //

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0).normalize();
    scene.add(directionalLight);

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    //

    window.addEventListener('resize', onWindowResize);
    lights = [];
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);

    lights[0].position.set(0, 200, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set( - 100,  - 200,  - 100);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    var floorTexture = new THREE.ImageUtils.loadTexture('textures/hardwood2_diffuse.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);

    var floorMaterial = new THREE.MeshBasicMaterial({
        map: floorTexture,
        side: THREE.DoubleSide
    });
    var floorGeometry = new THREE.PlaneBufferGeometry(30, 30);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y -= 2.5;
    scene.add(floor);

}


function buildSkeleton() {
	boneDict["Spine"] = new THREE.Bone();
	boneDict["Chest"] = new THREE.Bone();
	boneDict["Neck"] = new THREE.Bone();
	boneDict["Head"] = new THREE.Bone();
	boneDict["Arm_L"] = new THREE.Bone();
	boneDict["Forearm_L"] = new THREE.Bone();
	boneDict["Arm_R"] = new THREE.Bone();
	boneDict["Forearm_R"] = new THREE.Bone();
	boneDict["Leg_L"] = new THREE.Bone();
	boneDict["Shin_L"] = new THREE.Bone();
	boneDict["Leg_R"] = new THREE.Bone();
	boneDict["Shin_R"] = new THREE.Bone();
 	boneDict['Chest'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[1].matrix);
	boneDict['Neck'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[2].matrix);
	boneDict['Head'].matrixWorld = matMul(boneDict['Neck'].matrixWorld, realBones[3].matrix);
	boneDict['Arm_L'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[4].matrix);
	boneDict['Forearm_L'].matrixWorld = matMul(boneDict['Arm_L'].matrixWorld, realBones[5].matrix);
	boneDict['Arm_R'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[6].matrix);
	boneDict['Forearm_R'].matrixWorld = matMul(boneDict['Arm_R'].matrixWorld, realBones[7].matrix);
	boneDict['Leg_L'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[8].matrix);
	boneDict['Shin_L'].matrixWorld = matMul(boneDict['Leg_L'].matrixWorld, realBones[9].matrix);
	boneDict['Leg_R'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[10].matrix);
	boneDict['Shin_R'].matrixWorld = matMul(boneDict['Leg_R'].matrixWorld, realBones[11].matrix);
}

/**
* Fills the Float32Array boneArray with the bone matrices to be passed to
* the vertex shader
*/
function buildShaderBoneMatrix() {
    var c = 0;
    for (var key in boneDict) {
        for (var i = 0; i < 16; i++) {
            boneArray[c++] = boneDict[key].matrix.elements[i];
        }
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    checkKeyboard();

    updateBody();
    requestAnimationFrame(animate);
    render();
    stats.update();

}

function render() {

    const delta = clock.getDelta();

    renderer.render(scene, camera);

}

/**
* Returns a new Matrix4 as a multiplcation of m1 and m2
*
* @param {Matrix4} m1 The first matrix
* @param {Matrix4} m2 The second matrix
* @return {Matrix4} m1 x m2
*/
function matMul(m1, m2) {
    return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

/**
* Returns a new Matrix4 as a scalar multiplcation of s and m
*
* @param {number} s The scalar
* @param {Matrix4} m The  matrix
* @return {Matrix4} s * m2
*/
function scalarMul(s, m) {
    var r = m;
    return r.multiplyScalar(s)
}

/**
* Returns an array containing the x,y and z translation component 
* of a transformation matrix
*
* @param {Matrix4} M The transformation matrix
* @return {Array} x,y,z translation components
*/
function getTranslationValues(M) {
    var elems = M.elements;
    return elems.slice(12, 15);
}

/**
* Returns a new Matrix4 as a translation matrix of [x,y,z]
*
* @param {number} x x component
* @param {number} y y component
* @param {number} z z component
* @return {Matrix4} The translation matrix of [x,y,z]
*/
function translation(x, y, z) {
	//TODO Définir cette fonction
    return new THREE.Matrix4().set(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1);
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the x-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the x-axis
*/

function rotateZYX(thetaZ,thetaY,thetaX) {
    //TODO Définir cette fonction
    return rotZ(thetaZ).multiply(rotY(thetaY)).multiply(rotX(thetaX));
}

function rotX(theta) {
	//TODO Définir cette fonction
    return new THREE.Matrix4().set(
        1, 0, 0, 0,
        0, cos(theta), -sin(theta), 0,
        0, sin(theta), cos(theta), 0,
        0, 0, 0, 1);
}
/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the y-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the y-axis
*/
function rotY(theta) {
	//TODO Définir cette fonction
    return new THREE.Matrix4().set(
        cos(theta), 0, sin(theta), 0,
        0, 1, 0, 0,
        -sin(theta), 0, cos(theta), 0,
        0, 0, 0, 1);
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the z-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the z-axis
*/
function rotZ(theta) {
	//TODO Définir cette fonction
    return new THREE.Matrix4().set(
        cos(theta), -sin(theta), 0, 0,
        sin(theta), cos(theta), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1);
}
/**
* Returns a new Matrix4 as a scaling matrix with factors of x,y,z
*
* @param {number} x x component
* @param {number} y y component
* @param {number} z z component
* @return {Matrix4} The scaling matrix with factors of x,y,z
*/
function scale(x, y, z) {
	//TODO Définir cette fonction
    return new THREE.Matrix4().set(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1);
}

function inverseOf(M) {
    return M.clone().invert();
}

function deg2rad(x){
    return x * (pi / 180)
}

function cos(angle) {
    return Math.cos(angle);
}

function sin(angle) {
    return Math.sin(angle);
}

function checkKeyboard() {
    for (var i = 0; i < 10; i++) {
        if (keyboard.pressed(i.toString())) {
            channel = i;
            break;
        }
    }
}
function updateBody() {

    switch (channel) {
    case 0:
        var t = clock.getElapsedTime();
        robot.animate(t)
        break;

        // add poses here:
    case 1:
        robot.pose1();
        break;

    case 2:
        robot.pose2();
        break;

    case 3:
        robot.pose3();
        break;

    case 4:
        robot.pose4();
        break;

    case 5:
        var t = clock.getElapsedTime();
        if(robot.bullet6.position.z < -10){ //if last bullet reaches z = -10
            timeCheckpoint = t; //resets time to reset animation
        }
        robot.therealmatrix(t-timeCheckpoint);
        break;
    case 6:
        robot.hideRobot();
        break;
    case 7:
        robot.showRobot();
        break;
    case 8:
        robot.hideHuman();
        break;
    case 9:
        robot.showHuman();
        break;
    default:
        break;
    }
}
var timeCheckpoint = 0; //used for my matrix animation, to restart it!
init();
animate();