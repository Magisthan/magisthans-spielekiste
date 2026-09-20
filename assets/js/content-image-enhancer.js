/* Adaptive enhancement for content.webp archive images. */
(function(){
    "use strict";

    const cache = new Map();
    const clamp = (value,min,max)=>Math.min(max,Math.max(min,value));

    function reset(image){
        if(!image) return;
        image.classList.remove("content-image-enhanced");
        ["--content-brightness","--content-contrast","--content-saturation"]
            .forEach(property=>image.style.removeProperty(property));
        delete image.dataset.contentBrightness;
        delete image.dataset.contentContrast;
        delete image.dataset.contentSaturation;
    }

    function isPlaceholder(image){
        return /content-placeholder\.svg(?:$|[?#])/i.test(image?.currentSrc || image?.src || "");
    }

    function analyse(image){
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d",{ willReadFrequently:true });
        context.drawImage(image,0,0,size,size);
        const pixels = context.getImageData(0,0,size,size).data;
        const luminance = [];

        for(let index=0;index<pixels.length;index+=4){
            if(pixels[index + 3] < 32) continue;
            luminance.push(
                .2126 * pixels[index] / 255 +
                .7152 * pixels[index + 1] / 255 +
                .0722 * pixels[index + 2] / 255
            );
        }

        if(!luminance.length) return { brightness:1,contrast:1,saturation:1 };

        luminance.sort((a,b)=>a-b);
        const percentile = value=>luminance[Math.min(
            luminance.length - 1,
            Math.floor((luminance.length - 1) * value)
        )];
        const low = percentile(.08);
        const high = percentile(.92);
        const middle = luminance.slice(
            Math.floor(luminance.length * .05),
            Math.ceil(luminance.length * .95)
        );
        const average = middle.reduce((sum,value)=>sum + value,0) / middle.length;
        const range = Math.max(high - low,.08);

        return {
            brightness:clamp(Math.pow(.54 / Math.max(average,.06),.42),.94,1.22),
            contrast:clamp(Math.pow(.52 / range,.24),.97,1.10),
            saturation:1.02
        };
    }

    function setValues(image,values){
        const brightness = Number(values.brightness).toFixed(3);
        const contrast = Number(values.contrast).toFixed(3);
        const saturation = Number(values.saturation).toFixed(3);
        image.style.setProperty("--content-brightness",brightness);
        image.style.setProperty("--content-contrast",contrast);
        image.style.setProperty("--content-saturation",saturation);
        image.dataset.contentBrightness = brightness;
        image.dataset.contentContrast = contrast;
        image.dataset.contentSaturation = saturation;
        image.classList.add("content-image-enhanced");
        return values;
    }

    async function apply(image,overrides = {}){
        if(!image || isPlaceholder(image)){
            reset(image);
            return null;
        }

        if(!image.complete || !image.naturalWidth){
            await new Promise((resolve,reject)=>{
                image.addEventListener("load",resolve,{ once:true });
                image.addEventListener("error",reject,{ once:true });
            });
        }

        const source = image.currentSrc || image.src;
        let values = cache.get(source);
        if(!values){
            try{
                values = analyse(image);
            }catch(error){
                console.warn("Content image analysis skipped:",error);
                values = { brightness:1,contrast:1,saturation:1 };
            }
            cache.set(source,values);
        }

        return setValues(image,{
            brightness:clamp(overrides.brightness ?? values.brightness,.90,1.30),
            contrast:clamp(overrides.contrast ?? values.contrast,.94,1.16),
            saturation:clamp(overrides.saturation ?? values.saturation,.90,1.15)
        });
    }

    function copy(source,target){
        if(!source || !target || !source.classList.contains("content-image-enhanced")){
            reset(target);
            return;
        }
        setValues(target,{
            brightness:Number(source.dataset.contentBrightness || 1),
            contrast:Number(source.dataset.contentContrast || 1),
            saturation:Number(source.dataset.contentSaturation || 1)
        });
    }

    window.ContentImageEnhancer = { apply,copy,reset };
})();
