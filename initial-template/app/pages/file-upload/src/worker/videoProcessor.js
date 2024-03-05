export default class VideoProcessor {
    #mp4Demuxer;

    /**
     * 
     * @param {Object} options
     * @param {import('./mp4Demuxer.js').default} options.mp4Demuxer
     */
    constructor({ mp4Demuxer }) {
        this.#mp4Demuxer = mp4Demuxer;
    }

    /**
     * 
     * @param {*} encoderConfig 
     * @param {*} stream 
     * 
     * @returns {ReadableStream}
     */
    mp4Decoder(encoderConfig, stream) {
        return new ReadableStream({
            /**
             * Quando inicializa
             * @param {*} controller 
             */
            start: async (controller) => {
                /** QUeremos mandar video/erro para frente */
                const decoder = new VideoDecoder({
                    /** @param {VideoFrame} frame */
                    output(frame) {
                        controller.enqueue(frame);
                    },
                    error(e) {
                        console.error('error at mp4Decoder', e);
                        controller.error(e);
                    }
                })

                /** Reprocessa video */
                return this.#mp4Demuxer.run(stream,
                    {
                        onConfig(config) { decoder.configure(config); },
                        /**
                         * Vamos pegar os pequenos pedaços e entender o que é o vídeo
                         * Vai ser recebido pelo onSamples
                         * Depois vai cair no decoder.output
                         * @param {EncodedVideoChunk} chunk 
                         */
                        onChunk(chunk) { decoder.decode(chunk); },
                    }
                ).then(() => { //workaround, next class we'll remove it
                    setTimeout(() => {
                        controller.close();
                    }, 1000)
                })
            }
        })

    }

    async start({ file, encoderConfig, renderFrame }) {
        const stream = file.stream();
        const fileName = file.name.split('/').pop().replace('.mp4', '');

        await this.mp4Decoder(encoderConfig, stream)
            .pipeTo(new WritableStream({
                write(frame) {
                    renderFrame(frame)
                }
            }));
    }
}