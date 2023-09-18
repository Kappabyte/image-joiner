import { Command } from "commander";
import { PathLike } from "node:fs";
import {argv, exit} from "node:process";
import * as fs from "fs";
import * as nodeCanvas from "node-canvas";
import * as pathutil from "node:path";

type Image = nodeCanvas.Image;

//@ts-ignore
const {loadImage} = nodeCanvas.default;

const program = new Command();

program.version("1.0.0")
    .description("A cli application to merge images in bulk")
    .option("-i1d <value>", "Input directory 1")
    .option("-i2d <value>", "Input directory 2")
    .option("-i1l <value>", "Locator point for input 1 images")
    .option("-i2l <value>", "Locator point for input 2 images")
    .option("-t", "Test locator position by only processing the first image of each input")
    .parse(argv);

const options = program.opts();

const loadImages = async (path: PathLike): Promise<Array<Image>> => {
    if(!fs.lstatSync(path).isDirectory) return;

    const files = fs.readdirSync(path);
    
    let images: Array<Image|Promise<Image>> = [];

    files.forEach(file => {
        const fullpath = pathutil.join(path.toString(), file);
        const image = loadImage(fullpath);
        images.push(image)
    });

    return await Promise.all(images);
}

const checkImageDimensions = (images: Image[]): [boolean, number, number] => {
    const width = images[0].width;
    const height = images[0].height;
    for(let i = 1; i < images.length; i++) {
        if(images[i].width !== width || images[i].height !== height) return [false, width, height];
    }

    return [true, width, height];
}

const input1Images = await loadImages(options.I1d + "");
const input2Images = await loadImages(options.I2d + "");

const [input1ValidDimensions, input1Width, input1Height] = checkImageDimensions(input1Images);
const [input2ValidDimensions, input2Width, input2Height] = checkImageDimensions(input2Images);

console.log(checkImageDimensions(input1Images))
console.log(checkImageDimensions(input2Images))

if(!input1ValidDimensions) {
    console.error(`Not all images in the ${options.I1d} directory are the same size`);
    exit();
}

if(!input2ValidDimensions) {
    console.error(`Not all images in the ${options.I2d} directory are the same size`);
    exit();
}

if(!/[0-9]+,[0-9]+/g.test(options.I1l)) {
    console.error(`The input 1 locator is incorectly formatted. Correct Format: x,y`);
    exit();
}

if(!/[0-9]+,[0-9]+/g.test(options.I2l)) {
    console.error(`The input 2 locator is incorectly formatted. Correct Format: x,y`);
    exit();
}

const [locator1x, locator1y]: [number, number] = options.I1l.split(",").map((a:string) => parseInt(a));
const [locator2x, locator2y]: [number, number] = options.I2l.split(",").map((a:string) => parseInt(a));

let x1 = -locator1x;
let y1 = -locator1y;

let dx1 = input1Width - locator1x;
let dy1 = input1Height - locator1y;

let x2 = -locator2x;
let y2 = -locator2y;

let dx2 = input2Width - locator2x;
let dy2 = input2Height - locator2y;

const min_x = Math.min(x1,x2);
const min_y = Math.min(y1,y2);

console.log(min_x)
console.log(min_y)

x1 -= min_x;
x2 -= min_x;
dx1 -= min_x;
dx2 -= min_x;
y1 -= min_y;
y2 -= min_y;
dy1 -= min_y;
dy2 -= min_y;

const width = Math.max(dx1, dx2)
const height = Math.max(dy1,dy2)

const process = (width: number, height: number, image1: Image, image2: Image, position1: [number, number], position2: [number,number], fileName: string) => {
    const canvas = new nodeCanvas.Canvas(width, height, "image");
    const context = canvas.getContext("2d");
    context.drawImage(image1, position1[0], position1[1]);
    context.drawImage(image2, position2[0], position2[1]);

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./out/" + fileName, buffer);
}

input1Images.forEach((image1: Image, i: number) => {input2Images.forEach((image2: Image, j: number) => {
    process(width, height, image1, image2, [x1, y1], [x2, y2], `${i}-${j}.png`);
})});
