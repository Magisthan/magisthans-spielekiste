window.Package = {

    create(scene, pivot, current) {
        const packageOptions = current.gameData.package || {};

        current.closedMaterials = PackageMaterials.createClosed(
            scene,
            current.game.images,
            packageOptions.closed
        );

        if (current.game.hasInside && packageOptions.type !== "flatpack") {
            current.gatefoldMaterials = PackageMaterials.createGatefold(
                scene,
                current.game.images,
                packageOptions.gatefold
            );
        }

        // Flatpacks use the stable standard closed builder until the user
        // opens the package. Their opening geometry is isolated in the new
        // FlatpackBuilder and is enabled only for explicitly marked games.
        if (current.game.hasInside && packageOptions.type === "flatpack") {
            current.flatpackMaterials = PackageMaterials.createFlatpack(
                scene,
                current.game.images,
                packageOptions.flatpack
            );

            const closed = PackageBuilder.buildClosed(
                scene,
                pivot,
                current.game,
                current.closedMaterials,
                packageOptions
            );
            const flatpack = FlatpackBuilder.create(
                current.game,
                scene,
                pivot,
                current.flatpackMaterials
            );

            flatpack.closed = closed;
            flatpack.meshes = { ...closed.meshes, ...flatpack.meshes };
            flatpack.materials = { ...current.closedMaterials, ...current.flatpackMaterials };
            return flatpack;
        }

        return PackageBuilder.create(scene, pivot, current);
    },

    setOpen(scene, pkg, amount, onComplete) {
        if (pkg?.type === "flatpack") {
            if (pkg.isAnimating) return false;
            const opening = amount > 0.5;

            if (opening) {
                pkg.closed.root.setEnabled(false);
                pkg.root.setEnabled(true);
                FlatpackBuilder.setOpenProgress(pkg, 0);
                return FlatpackBuilder.open(scene, pkg, onComplete);
            }

            return FlatpackBuilder.close(scene, pkg, () => {
                pkg.root.setEnabled(false);
                pkg.closed.root.setEnabled(true);
                onComplete?.(pkg);
            });
        }
        return PackageAnimation.animateTo(scene, pkg, amount, onComplete);
    },

    open(scene, pkg, onComplete) {
        return this.setOpen(scene, pkg, 1, onComplete);
    },

    close(scene, pkg, onComplete) {
        return this.setOpen(scene, pkg, 0, onComplete);
    },

    toggle(scene, pkg, onComplete) {
        if (!pkg?.isOpenable) return false;
        return this.setOpen(scene, pkg, pkg.openAmount > 0.5 ? 0 : 1, onComplete);
    },

    dispose(pkg) {
        if (!pkg) return;
        if (pkg.type === "flatpack") {
            FlatpackBuilder.dispose(pkg);
            Object.values(pkg.closed?.meshes || {}).forEach((mesh) => mesh?.dispose());
            pkg.closed?.root?.dispose();
            PackageMaterials.dispose(pkg.materials);
            return;
        }
        PackageBuilder.dispose(pkg);
        PackageMaterials.dispose(pkg.materials);
    }
};
