import VideoProcessor from './videoProcessor.js';
import MP4Demuxer from './mp4Demuxer.js';
import CanvasRenderer from './canvasRenderer.js';

/**
 * QVGA Quarter Video Graphics Array - 144p do youtube
 */
const qvgaConstraints = {
    width: 320,
    height: 240
}
/**
 * VGA Video Graphics Array
 */
const vgaConstraints = {
    width: 640,
    height: 480
}
/**
 * HD High-definition
 */
const hdConstraints = {
    width: 1280,
    height: 720
}

/**
 * Encoder configurations
 * Exact format web decoders works with
 */
const encoderConfig = {
    ...qvgaConstraints,
    bitrate: 10e6, //velocidade que lemos arquivo

    //WebM
    coded: 'vp09.00.10.08',
    pt: 4, // perfil
    hardwareAcceleration: 'prefer-software',

    // MP4
    // coded: 'avc1.42002A',
    // pt: 1, // perfil
    // hardwareAcceleration: 'prefer-hardware',
    // avc: { format: 'annexb' }
}

const mp4Demuxer = new MP4Demuxer();
const videoProcessor = new VideoProcessor({
    mp4Demuxer
});

onmessage = async ({ data }) => {
    console.log('recebido', data);
    const renderFrame = CanvasRenderer.getRenderer(data.canvas);
    await videoProcessor.start({
        file: data.file,
        renderFrame: renderFrame,
        encoderConfig,
        sendMessage(message) {
            self.postMessage(message);
        }
    });


    self.postMessage({ status: 'done' });

    //browser tem window, worker tem self

}