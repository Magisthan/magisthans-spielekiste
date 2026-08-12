window.PackageBuilder = {

    //--------------------------------------------------
    // Build Closed Package
    //--------------------------------------------------

    buildClosed(scene, pivot, current){

    console.log("===== BUILD CLOSED =====");

        const game = current.game;

        const boxWidth  = game.width;
        const boxHeight = game.height;
        const boxDepth  = game.depth;

        const halfW = boxWidth / 2;
        const halfH = boxHeight / 2;
        const halfD = boxDepth / 2;

        //--------------------------------------------------
        // Root
        //--------------------------------------------------

        const root = new BABYLON.TransformNode(
            "packageRoot",
            scene
        );

        root.parent = pivot;

        //--------------------------------------------------
        // Body
        //--------------------------------------------------

        const body = new BABYLON.TransformNode(
            "packageBody",
            scene
        );

        body.parent = root;

        //--------------------------------------------------
        // Cover Pivot
        //--------------------------------------------------

        const coverPivot = new BABYLON.TransformNode(
            "coverPivot",
            scene
        );

        coverPivot.parent = root;
        coverPivot.position.x = halfW;

        //--------------------------------------------------
        // Cover Root
        //--------------------------------------------------

        const coverRoot = new BABYLON.TransformNode(
            "coverRoot",
            scene
        );

        coverRoot.parent = coverPivot;
        coverRoot.position.x = -halfW;

        //--------------------------------------------------
        // Meshes
        //--------------------------------------------------

        const meshes = {};

        //--------------------------------------------------
        // Back
        //--------------------------------------------------

        meshes.back = BABYLON.MeshBuilder.CreatePlane(

            "back",

            {

                width: boxWidth,
                height: boxHeight

            },

            scene

        );

        meshes.back.parent = body;

        console.log("=== BACK MATERIAL ===");
console.log(current.materials.back);
console.log(current.materials.back instanceof BABYLON.Material);

        meshes.back.material =
            current.materials.back;

        meshes.back.position.z = -halfD;

        meshes.back.rotation.y = Math.PI;

        //--------------------------------------------------
        // Left
        //--------------------------------------------------

        meshes.left = BABYLON.MeshBuilder.CreatePlane(

            "left",

            {

                width: boxDepth,
                height: boxHeight

            },

            scene

        );

        meshes.left.parent = body;

        meshes.left.material =
             current.materials.left;

        meshes.left.position.x = -halfW;

        meshes.left.rotation.y = -Math.PI / 2;

        
        //--------------------------------------------------
        // Bottom
        //--------------------------------------------------

        meshes.bottom = BABYLON.MeshBuilder.CreatePlane(

            "bottom",

            {

                width: boxWidth,
                height: boxDepth

            },

            scene

        );

        meshes.bottom.parent = body;

        meshes.bottom.material =
            current.materials.bottom;

        meshes.bottom.position.y = -halfH;

        meshes.bottom.rotation.x = Math.PI / 2;

         //--------------------------------------------------
        // Front
        //--------------------------------------------------

        meshes.front = BABYLON.MeshBuilder.CreatePlane(

            "front",

            {

                width: boxWidth,
                height: boxHeight

            },

            scene

        );

        meshes.front.parent = coverRoot;

        meshes.front.material =
            current.materials.front;

        meshes.front.position.z = halfD;        

        //--------------------------------------------------
        // Right (Spine)
        //--------------------------------------------------

        meshes.right = BABYLON.MeshBuilder.CreatePlane(

            "right",

            {

                width: boxDepth,
                height: boxHeight

            },

            scene

        );

        meshes.right.parent = coverRoot;

        meshes.right.material =
            current.materials.right;

        meshes.right.position.x = halfW;

        meshes.right.rotation.y = Math.PI / 2;

        //--------------------------------------------------
        // Top
        //--------------------------------------------------

        meshes.top = BABYLON.MeshBuilder.CreatePlane(

            "top",

            {

                width: boxWidth,
                height: boxDepth

            },

            scene

        );

        meshes.top.parent = coverRoot;

        meshes.top.material =
            current.materials.top;

        meshes.top.position.y = halfH;

        meshes.top.rotation.x = Math.PI / 2;



        //--------------------------------------------------
        // Return
        //--------------------------------------------------

        return {

            root,
            body,
            coverPivot,
            coverRoot,
            meshes,

            openAmount: 0

        };

    },

        //--------------------------------------------------
    // Build Open Package
    //--------------------------------------------------

    buildOpen(scene, pivot, current){

    console.log("===== BUILD OPEN =====");

        const game = current.game;

        const boxWidth  = game.width;
        const boxHeight = game.height;
        const boxDepth  = game.depth;

        const halfW = boxWidth / 2;
        const halfH = boxHeight / 2;
        const halfD = boxDepth / 2;

        //--------------------------------------------------
// Root
//--------------------------------------------------

const root = new BABYLON.TransformNode(
    "packageRoot",
    scene
);

root.parent = pivot;

//--------------------------------------------------
// Spine Root
//--------------------------------------------------

const spineRoot = new BABYLON.TransformNode(
    "spineRoot",
    scene
);

spineRoot.parent = root;

//--------------------------------------------------
// Fixed Body
//--------------------------------------------------

const body = new BABYLON.TransformNode(
    "packageBody",
    scene
);

body.parent = spineRoot;
body.position.set(0,0,0);
body.position.y = 0;
body.position.z = 0;

//--------------------------------------------------
// Cover Pivot
//--------------------------------------------------

const coverPivot = new BABYLON.TransformNode(
    "coverPivot",
    scene
);

coverPivot.parent = spineRoot;
coverPivot.position.set(0,0,0);
coverPivot.position.y = 0;
coverPivot.position.z = 0;

//--------------------------------------------------
// Cover
//--------------------------------------------------

const coverRoot = new BABYLON.TransformNode(
    "coverRoot",
    scene
);

coverRoot.parent = coverPivot;

coverRoot.position.set(0, 0, 0);

//--------------------------------------------------
// Debug
//--------------------------------------------------

console.log("===== OPEN BOX HIERARCHY =====");

console.log(root.name);
console.log(body.name);
console.log(spineRoot.name);
console.log(coverPivot.name);
console.log(coverRoot.name);

        //--------------------------------------------------
        // Cover Thickness
        //--------------------------------------------------

        const coverThickness = 0.012;

        console.log("halfD =", halfD);
console.log("coverThickness =", coverThickness);

        //--------------------------------------------------
        // Meshes
        //--------------------------------------------------

        const meshes = {};

        //--------------------------------------------------
        // Back
        //--------------------------------------------------

        meshes.back = BABYLON.MeshBuilder.CreatePlane(

            "back",

            {

                width: boxWidth,
                height: boxHeight

            },

            scene

        );

        meshes.back.parent = body;    

        meshes.back.material =
            current.materials.back;

        meshes.back.position.x = 0;
        meshes.back.position.y = 0;
        meshes.back.position.z = -halfD;

        // Rückseite zeigt nach außen
meshes.back.rotation.y = Math.PI;


        //--------------------------------------------------
        // Inside Right
        //--------------------------------------------------

        /*meshes.insideRight = BABYLON.MeshBuilder.CreatePlane(

            "insideRight",

            {

                width: boxWidth,
                height: boxHeight

            },

            scene

        );

        meshes.insideRight.parent = body;

        meshes.insideRight.material =
            current.materials.insideRight;

        console.log(
            "InsideRight:",
            meshes.insideRight.material.diffuseTexture.name
        );

        // Inside wird Innenfläche
        meshes.insideRight.position.z =
            -halfD - coverThickness * 0.5;

        //--------------------------------------------------
        // Left
        //--------------------------------------------------

        meshes.left = BABYLON.MeshBuilder.CreatePlane(

            "left",

            {

                width: boxDepth,
                height: boxHeight

            },

            scene

        );

        meshes.left.parent = body;

        meshes.left.material =
             current.materials.left;

        meshes.left.position.x = -halfW;

        meshes.left.rotation.y = -Math.PI / 2;

        
        //--------------------------------------------------
        // Bottom
        //--------------------------------------------------

        meshes.bottom = BABYLON.MeshBuilder.CreatePlane(

            "bottom",

            {

                width: boxWidth,
                height: boxDepth

            },

            scene

        );

        meshes.bottom.parent = body;

        meshes.bottom.material =
            current.materials.bottom;

        meshes.bottom.position.y = -halfH;

        meshes.bottom.rotation.x = Math.PI / 2;

        //--------------------------------------------------
        // Inside Left
        //--------------------------------------------------

        meshes.insideLeft = BABYLON.MeshBuilder.CreatePlane(

            "insideLeft",

            {

                width: boxWidth,
                height: boxHeight

            },

            scene

        );

        meshes.insideLeft.parent = coverRoot;

        meshes.insideLeft.material =
            current.materials.insideLeft;

        console.log(
            "InsideLeft:",
            meshes.insideLeft.material.diffuseTexture.name
        );

        meshes.back.position.x = 0;

        // Inside wird Innenfläche
        meshes.insideLeft.position.z =
            halfD + coverThickness * 0.5;

        meshes.insideLeft.rotation.y =
    Math.PI;

// Weltmatrix aktualisieren
meshes.insideLeft.computeWorldMatrix(true);

console.log(
    "InsideLeft rotation:",
    meshes.insideLeft.rotation
);

console.log(
    "InsideLeft forward:",
    meshes.insideLeft.forward
);
*/
        //--------------------------------------------------
        // Front
        //--------------------------------------------------

        meshes.front = BABYLON.MeshBuilder.CreatePlane(

            "front",

            {

                width: boxWidth,
                height: boxHeight

            },

            scene

        );

        meshes.front.parent = coverRoot;

        meshes.front.material =
            current.materials.front;

        meshes.front.position.x = 0;
        meshes.front.position.y = 0;
        meshes.front.position.z = halfD;

// Weltmatrix aktualisieren
meshes.front.computeWorldMatrix(true);

              
        //--------------------------------------------------
        // Right (Spine)
        //--------------------------------------------------

        meshes.right = BABYLON.MeshBuilder.CreatePlane(

            "right",

            {

                width: boxDepth,
                height: boxHeight

            },

            scene

        );

        meshes.right.parent = spineRoot;

        meshes.right.material = current.materials.right;

        meshes.right.isVisible = true;
        meshes.right.position.z = 0;
        meshes.right.rotation.y = Math.PI / 2;
/*
        //--------------------------------------------------
        // Top
        //--------------------------------------------------

        meshes.top = BABYLON.MeshBuilder.CreatePlane(

            "top",

            {

                width: boxWidth,
                height: boxDepth

            },

            scene

        );

        meshes.top.parent = coverRoot;

        meshes.top.material =
            current.materials.top;

        meshes.top.position.y = halfH;

        meshes.top.position.x = halfW;
*/
        //--------------------------------------------------
// Open Package Rendering
//--------------------------------------------------

meshes.front.material.backFaceCulling = true;
meshes.back.material.backFaceCulling = true;

/*meshes.insideLeft.material.backFaceCulling = true;
meshes.insideRight.material.backFaceCulling = true;
*/
        

//--------------------------------------------------
// Geometry Debug
//--------------------------------------------------


        //--------------------------------------------------
        // Return
        //--------------------------------------------------

        return {

    root,
    body,
    spineRoot,
    coverPivot,
    coverRoot,
    meshes,

    openAmount:0

};

    },

        //--------------------------------------------------
    // Create
    //--------------------------------------------------

    create(scene, pivot, current){

        console.log("Package.create()");
console.log(current.game);
console.log("hasInside =", current.game.hasInside);

        if(current.game.hasInside){

    return PackageOpenBuilder.build(
        scene,
        pivot,
        current
    );

}

return this.buildClosed(
    scene,
    pivot,
    current
);

    },

    //--------------------------------------------------
    // Dispose
    //--------------------------------------------------

    dispose(pkg){

        if(!pkg) return;

        Object.values(pkg.meshes).forEach(mesh=>{

            if(mesh){

                mesh.dispose();

            }

        });

        pkg.coverRoot.dispose();
        pkg.coverPivot.dispose();
        pkg.body.dispose();
        pkg.root.dispose();

    }

};