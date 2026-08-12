/*
==========================================
Shelf Geometry
==========================================
*/

const FOCUS_OFFSET = 0;

const SLOT_DISTANCE =
    window.innerWidth <= 480 ? 105 :
    window.innerWidth <= 768 ? 120 :
    window.innerWidth <= 1024 ? 145 :
    185;

const SLOT_SCALE = [
    0.86,
    0.96,
    1.18,
    0.96,
    0.86
];

const SLOT_OPACITY = [

    1,
    1,
    1,
    1,
    1

];

const SHELF_SLOTS = [];

for (let i = -2; i <= 2; i++) {

    SHELF_SLOTS.push({

        x: i * SLOT_DISTANCE,

        scale: SLOT_SCALE[i + 2],

        opacity: SLOT_OPACITY[i + 2],

        z: i === 0 ? 10 : 10 - Math.abs(i),

        focus: i === 0

    });

}

