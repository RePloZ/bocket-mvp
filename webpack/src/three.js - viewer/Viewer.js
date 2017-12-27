/**
 * @description The Viewer integrated with THREE.JS
 * @author bocket.me
 * @param {HTMLElement} renderingDiv
 */

import object3D from './init/object3D';
import * as Stats from 'stats.js';
import Floor from './init/floor';

export default class Viewer {
    constructor(renderArea) {
        renderArea ? null : () => { throw new Error("Render Area : Not Found") };

        /******************************************************************/
        /* Stats Initialization */
        this.stats = new Stats();
        this.stats.showPanel(0);
        renderArea.appendChild(this.stats.dom);

        /******************************************************************/
        /* renderArea Information */

        var p_width = renderArea.offsetWidth,
            p_height = renderArea.offsetHeight,
            p_axisSize = p_height * 0.15,
            p_aspectRatio = renderArea.clientWidth / renderArea.clientHeight;

        /******************************************************************/
        /* Initialization of scenes */
        this.p_scene = new THREE.Scene();

        /* The Group of the object */
        this.s_objects = new THREE.Group();
        this.s_objects.name = workspaceId;
        this.p_scene.add(this.s_objects);

        /* The group of the lights */
        this.s_lights = new THREE.Group();
        this.s_lights.name = "lights";
        this.p_scene.add(this.s_lights);

        /* The render */
        this.p_renderer = new THREE.WebGLRenderer({ canvas: renderSurface, alpha: true, antialias: true, logarithmicDepthBuffer: true });
        this.p_renderer.localClippingEnabled = true;
        //this.p_renderer.setClearColor(0xffffff);
        this.p_renderer.setClearColor(0x65676b);
        this.p_renderer.setSize(p_width, p_height);
        this.p_renderer.shadowMap = true;
        renderArea.appendChild(this.p_renderer.domElement);

        /* The axis case */
        this.p_axis;

        /* The camera */
        this.p_camera = new THREE.PerspectiveCamera(60, p_aspectRatio, 1, 2147483647);
        this.p_camera.up.set(0, 0, 1);
        this.p_camera.position.set(0, -75, 50);

        /* The floor of the scene */
//        this.p_floor =  new Floor();

        /* The name of the object to save */
        this.save = [];

        /* The Fog of the scene */
        this.p_scene.fog = new THREE.Fog(0x525252);

        /* The camera's controllers */
        this.p_controls = new THREE.OrbitControls(this.p_camera, this.p_renderer.domElement);
        this.p_controls.zoomSpeed = 1 / (Math.log10(this.p_camera.position.distanceTo(this.p_controls.target)));
        console.log(this.p_controls);

        /* The object's controllers */
        this.s_objControls = new THREE.TransformControls(this.p_camera, this.p_renderer.domElement);
        this.s_objControls.name = "Object control";
        this.p_scene.add(this.s_objControls);


        /* The box of the selected object */
        this.s_box = new THREE.BoxHelper(this.s_objects, 0x262626);
        this.s_box.material.linewidth = 6;
        this.p_scene.add(this.s_box);

        /* Add the lights to the scene */
        this.lightsScene();

        this.domElement = renderArea;

    }

    /**
     * @description The animation of the viewer
     * @static
     * @param {Viewer} viewer
     * @memberof Viewer
     */
    static animate(viewer) {
        function animation() {
            viewer.stats.begin();

            viewer.p_renderer.render(viewer.p_scene, viewer.p_camera);
            viewer.p_controls.update();
            viewer.s_objControls.update();
            viewer.s_box.update();

            viewer.stats.end();

            requestAnimationFrame(animation);
        }
        animation();
    }

    /**
     *
     * @description Initialize the lights of the scene.
     * @memberof Viewer
     */
    lightsScene() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.25),

            directLight1 = new THREE.DirectionalLight(0xf5f5f5, 0.25),
            directLight2 = new THREE.DirectionalLight(0xf5f5f5, 0.25),
            directLight3 = new THREE.DirectionalLight(0xf5f5f5, 0.25),
            directLight4 = new THREE.DirectionalLight(0xf5f5f5, 0.25),
            directLight5 = new THREE.DirectionalLight(0xf5f5f5, 0.25);

        directLight1.position.set(-1000,     0, 0);
        directLight2.position.set( 1000,     0, 0);
        directLight3.position.set(    0, -1000, 0);
        directLight4.position.set(    0, -1000, 1000);
        directLight5.position.set(    0,  1000, 1000);

        this.s_lights.add(ambientLight);
        this.s_lights.add(directLight1);
        this.s_lights.add(directLight2);
        this.s_lights.add(directLight3);
        this.s_lights.add(directLight4);
        this.s_lights.add(directLight5);


        var cameraHelper1 = new THREE.DirectionalLightHelper(directLight1, 5),
            cameraHelper2 = new THREE.DirectionalLightHelper(directLight2, 5),
            cameraHelper3 = new THREE.DirectionalLightHelper(directLight3, 5),
            cameraHelper4 = new THREE.DirectionalLightHelper(directLight4, 5),
            cameraHelper5 = new THREE.DirectionalLightHelper(directLight5, 5);


        this.s_lights.add(cameraHelper1);
        this.s_lights.add(cameraHelper2);
        this.s_lights.add(cameraHelper3);
        this.s_lights.add(cameraHelper4);
        this.s_lights.add(cameraHelper5);
    }

    /* ************************************************************************** */
    /*                                                                            */
    /*                          SCREEN MODIFICATIONS                              */
    /*                                                                            */
    /* ************************************************************************** */

    /**
     * @description [Event Function] Returns the THREE.Group directly related to the object clicked on screen
     * @param {number} mouseX offsetX value of the mouse event
     * @param {number} mouseY offsetY value of the mouse event
     * @memberof Viewer
     */
    fitToScreen(name) {
        var object = this.p_scene.getObjectByName(name);

        this.s_box.geometry.computeBoundingBox();
        var box = this.s_box.geometry.boundingBox,
            center = box.getCenter();
        this.p_camera.position.set(center.x, -(center.y + Math.abs(box.getSize().y / Math.sin((this.p_camera.fov * (Math.PI / 180)) / 2))), box.max.z * (10 / Math.log(box.max.z)));
        this.p_camera.lookAt(center);
        this.p_controls.target = center;

    }

    resize() {
        var element = this.domElement;
        this.p_camera.aspect = (element.clientWidth) / (element.clientHeight);
        this.p_camera.updateProjectionMatrix();
        this.p_renderer.setSize((element.offsetWidth), (element.offsetHeight));
    }


    /* ************************************************************************** */
    /*                                                                            */
    /*                                  RAYS                                      */
    /*                                                                            */
    /* ************************************************************************** */

    /**
     * @description [Event Function] Returns the object clicked on screen
     * @param {number} mouseX offsetX value of the mouse event
     * @param {number} mouseY offsetY value of the mouse event
     */
    rayToObject(mouseX, mouseY) {
        var mouse3D = new THREE.Vector3((mouseX / this.domElement.clientWidth) * 2 - 1, -(mouseY / this.domElement.clientHeight) * 2 + 1, 0.5),
            raycaster = new THREE.Raycaster(),
            intersects = [];

        raycaster.setFromCamera(mouse3D, this.p_camera);
        intersects = raycaster.intersectObject(this.s_objects, true);

        if (intersects.length > 0) {
            delete intersects[0].face;
            delete intersects[0].faceIndex;
            delete intersects[0].index;

            return intersects[0];
        } else
            return (null);
    }

    /**
     * @description [Event Function] Returns the THREE.Group directly related to the object clicked on screen
     * @param {number} mouseX offsetX value of the mouse event
     * @param {number} mouseY offsetY value of the mouse event
     */
    rayToGroup(mouseX, mouseY) {
        var mouse3D = new THREE.Vector3((mouseX / this.domElement.clientWidth) * 2 - 1, -(mouseY / this.domElement.clientHeight) * 2 + 1, 0.5),
            raycaster = new THREE.Raycaster(),
            intersects = [];

        raycaster.setFromCamera(mouse3D, this.p_camera);
        intersects = raycaster.intersectObject(this.scenes[0].children[5], true);

        if (intersects.length > 0) {
            delete intersects[0].face;
            delete intersects[0].faceIndex;
            delete intersects[0].index;
            intersects[0].object = intersects[0].object.parent;

            return intersects[0];
        } else
            return (null);
    }

    /**
     * @description [Event Function] Returns the highest THREE.Group related to the object clicked on screen
     * @param {number} mouseX offsetX value of the mouse event
     * @param {number} mouseY offsetY value of the mouse event
     */
    rayToAssembly(mouseX, mouseY) {
        var canvas = this.domElement;

        var mouse3D = new THREE.Vector3((mouseX / canvas.clientWidth) * 2 - 1, -(mouseY / canvas.clientHeight) * 2 + 1, 0.5),
            raycaster = new THREE.Raycaster(),
            intersects = [];

        var processIntersects = function(object) {
            if (object.parent instanceof THREE.Group)
                return processIntersects(object.parent);
            else
                return object;
        };

        raycaster.setFromCamera(mouse3D, this.p_camera);
        intersects = raycaster.intersectObject(this.p_scene.children[5], true);

        if (intersects.length > 0) {
            delete intersects[0].face;
            delete intersects[0].faceIndex;
            delete intersects[0].index;
            intersects[0].object = processIntersects(intersects[0].object);

            return intersects[0];
        } else
            return (null);
    }

    /* ************************************************************************** */
    /*                                                                            */
    /*                                  MATRIX                                    */
    /*                                                                            */
    /* ************************************************************************** */

    /**
     * @static
     * @description Assemble a matrix4 from the position, rotation and scale components of an object and returns this matrix
     * @param  {THREE.Vector3} pos Position vector of the object
     * @param  {THREE.Euler} rot Euler angle of the object
     * @param  {THREE.Vector3} scale Scale vector of the object
     * @return {THREE.Matrix4}
     */
    static matrixCompose(pos, rot, scale) {
        return new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(rot), scale);
    }


    /**
     * @static
     * @description Disassembles a matrix4 into its position, rotation and scale components and returns them in a JSON object
     * @param {THREE.Matrix4} matrix
     * @return {JSON}
     */
    static matrixDecompose(matrix) {
        var pos = new THREE.Vector3(),
            rot = new THREE.Quaternion(),
            scale = new THREE.Vector3();

        matrix.decompose(pos, rot, scale);

        return { pos: pos, rot: new THREE.Euler().setFromQuaternion(rot), scale: scale };
    }


    /* ************************************************************************** */
    /*                                                                            */
    /*                                  TRANSFORM                                 */
    /*                                                                            */
    /* ************************************************************************** */

    /**
     * @description Adds the transformation axis to the object parameter
     * @param {THREE.Group} object object you want the transformation axis to be attached to
     */
    addTransform(object) {
        var transform;

        if (!object) {
            this.removeTransform();
            return;
        }

        for (var i = 0; i < this.objects.p_scene.children.length; i++) {
            if (this.objects.p_scene.children[i] instanceof THREE.TransformControls)
                this.removeTransform();
        }

        transform = new THREE.TransformControls(this.objects.p_camera, this.objects.p_renderer.domElement);
        transform.attach(object);
        this.objects.p_scene.add(transform);
    }

    /* ************************************************************************** */
    /*                                                                            */
    /*                                  OBJECT3D                                  */
    /*                                                                            */
    /* ************************************************************************** */
    /**
     * @description Add an assembly to a scene.
     * @param {String} name - The name of the assembly
     * @param {String} parentName - The parent name of the assembly
     */
    addAssembly(name, parentName) {
        var scene = parentName == null ? this.p_scene : this.p_scene.getObjectByName(parentName);

        var group = new THREE.Group();
        group.name = name;
        scene.add(group);
    }

    setAssembly(oldname, newname) {
        var assembly = this.p_scene.getObjectByName(oldname);
        if (assembly instanceof THREE.Group)
            assembly.name = newname;
        else
            console.error(new Error("Could'nt find the name of the assembly"))
    }

    removeAssembly(name) {
            var assembly = this.p_scene.getObjectByName(name);

            if (assembly instanceof THREE.Group)
                this.p_scene.remove(assembly);
            else
                console.error(new Error('The assembly is not an instance of Group, but an instance of ', typeof(assembly)));
        }
        /**
         * @description Add an assembly to a scene.
         * @param (String) file3D.name - The File name of the object
         * @param (String) file3D.path - The path of the object
         * @param (String) file3D.path - The path of the object
         * @param (Array) file3D.geometry - The geometry of the object
         * @param {String} parentName - The parent name of the assembly
         */
    addPart(file3D, nodeID, parentName) {
        var scene = parentName == null ? this.s_objects : this.p_scene.getObjectByName(parentName);

        var geometry = new THREE.BoxGeometry(50, 50, 50);
        var material = new THREE.MeshLambertMaterial({ color: 0x809fff });
        //var mesh = object3D(file3D);
<<<<<<< HEAD
        var mesh = new THREE.Mesh(geometry, material);

=======
        var mesh = new THREE.Mesh( geometry, material );
        mesh.material.transparent = true;
>>>>>>> 3cafb1add996ce1872a992d8109ea81b3752aee8
        mesh.name = nodeID;
        mesh.receiveShadow = true;
        mesh.renderOrder = -1;

        scene.add(mesh);
    }

    setPart(oldname, newname) {
        var part = this.p_scene.getObjectByName(oldname);
        if (part instanceof THREE.Group)
            part.name = newname;
        else
            console.error(new Error("Could'nt find the name of the part"))
    }

    /**
     * @description Remove a part of the assembly
     * @param name - The name of the
     */
    removePart(name) {
        var part = this.p_scene.getObjectByName(name);

        if (part instanceof THREE.Mesh)
            this.p_scene.remove(part);
        else
            console.error(new Error('The part is not an instance of Mesh, but an instance of ', typeof(part)));
    }

    /**
     * @description Select The Object
     * @param name - The name of the Group or the Mesh
     */
    selectObject(name) {
        var object,
            piece = this.p_scene.getObjectByName(name);

        if (piece)
            this.s_objectSelected = piece;

        this.p_scene.traverse(object3d => {
           if (object3d instanceof THREE.Mesh) {
               if (object3d.material.wireframe)
               object3d.material.wireframe = false;
           }
        });

        /*****************************************/
        /*Get selected object*/
        if (piece)
            this.s_objectSelected = piece;

        /*****************************************/
        /*Set up of the object Control*/
        this.p_scene.remove(this.s_objControls);
        if (object = this.s_objControls.object)
            this.s_objControls.detach(object);

        this.s_objControls.setSpace('local');
        this.s_objControls.attach(piece);
        console.log(this.s_objControls);

        this.p_scene.add(this.s_objControls);

        if (piece instanceof THREE.Mesh){
            this.s_objects.traverse((object3d) => {
                if(object3d instanceof THREE.Mesh){
                    if(object3d.name !== piece.name) {
                        object3d.material.opacity = 0.3;
                    } else {
                        object3d.material.opacity = 1;
                    }
                }
            })
        } else if (piece instanceof THREE.Group){
            this.s_objects.traverse((object3d) => {
                if(object3d instanceof THREE.Mesh) {
                    if (object3d.name !== piece.name){
                        object3d.material.opacity = 0.3;
                    }
                }
            });
            piece.traverse(object3d => {
                if(object3d instanceof THREE.Mesh) {
                    if (object3d.name !== piece.name){
                        object3d.material.opacity = 1;
                    }
                }
            })
        }
        /*****************************************/
        /* Outline the object */
        this.s_box.setFromObject(object);

        this.p_camera.updateProjectionMatrix();
    }

    toggleWireframe(){
        if (this.s_objectSelected){
            if (this.s_objectSelected instanceof THREE.Mesh){
                if (this.s_objectSelected.material.wireframe)
                    this.s_objectSelected.material.wireframe = true;
                else
                    this.s_objectSelected.material.wireframe = false;
            }
            else if (this.s_objectSelected instanceof THREE.Group){
                this.s_objectSelected.traverse((object) => {
                    if (object instanceof  THREE.Mesh) {
                        if (object.material.wireframe)
                            object.material.wireframe = true;
                        else
                            object.material.wireframe = false;
                    }
                });
            }
        }
    }
}