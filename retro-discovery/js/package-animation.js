window.PackageAnimation = {

    FRAME_RATE: 60,
    DURATION_FRAMES: 32,

    setOpen(pkg, amount) {
        if (!pkg?.isOpenable) return false;

        const open = amount > 0.5;
        pkg.closed.root.setEnabled(!open);
        pkg.gatefold.root.setEnabled(open);
        pkg.gatefold.frontHinge.rotation.y = open ? Math.PI : 0;
        pkg.openAmount = open ? 1 : 0;
        return true;
    },

    animateTo(scene, pkg, amount, onComplete) {
        if (!scene || !pkg?.isOpenable || pkg.isAnimating) return false;

        const opening = amount > 0.5;
        // The viewer pivot reverses local X visually: positive Y rotation
        // moves the closed front from visible right to visible left.
        const startAngle = opening ? 0 : Math.PI;
        const targetAngle = opening ? Math.PI : 0;

        if (opening) {
            pkg.closed.root.setEnabled(false);
            pkg.gatefold.root.setEnabled(true);
            pkg.gatefold.frontHinge.rotation.y = startAngle;
        }

        const animation = new BABYLON.Animation(
            "gatefoldOpenAnimation",
            "rotation.y",
            this.FRAME_RATE,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        animation.setKeys([
            { frame: 0, value: startAngle },
            { frame: this.DURATION_FRAMES, value: targetAngle }
        ]);

        const easing = new BABYLON.CubicEase();
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        animation.setEasingFunction(easing);

        pkg.isAnimating = true;
        scene.stopAnimation(pkg.gatefold.frontHinge);
        scene.beginDirectAnimation(pkg.gatefold.frontHinge, [animation], 0, this.DURATION_FRAMES, false, 1, () => {
            pkg.isAnimating = false;
            pkg.openAmount = opening ? 1 : 0;

            if (!opening) {
                pkg.gatefold.root.setEnabled(false);
                pkg.closed.root.setEnabled(true);
            }

            onComplete?.(pkg);
        });

        return true;
    }
};
