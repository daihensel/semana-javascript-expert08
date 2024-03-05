import { createFile, DataStream } from '../deps/mp4box.0.5.2.js';

/**
 * Read the file on demand as a stream
 */
export default class Mp4Demuxer {
    #onConfig;
    #onChunk;
    /** @type {import('../deps/mp4box.0.5.2.js')} */
    #file;

    /**
     * 
     * @param {ReadableStream} stream 
     * @param {Object} options 
     * @param {(config: Object) => void} options.onConfig
     * 
     * @returns {Promise<void>}
     */
    async run(stream, { onConfig, onChunk }) {
        this.#onConfig = onConfig;
        this.#onChunk = onChunk;

        this.#file = createFile();
        this.#file.onReady = this.#onReady.bind(this);
        this.#file.onSamples = this.#onSamples.bind(this);

        this.#file.onError = (error) => console.error('deu ruim mp4Demuxer', error)

        return this.#init(stream);
    }

    #description({ id }) {
        const track = this.#file.getTrackById(id);
        for (const entry of track.mdia.minf.stbl.stsd.entries) {
            const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
            if (box) {
                const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
                box.write(stream);
                return new Uint8Array(stream.buffer, 8);  // Remove the box header.
            }
        }
        throw new Error("avcC, hvcC, vpcC, or av1C box not found");
    }

    /**
    * Baixando frames do video
    * Transformando no tipo que o navegador vai trabalhar
    */
    #onSamples(trackId, ref, samples) {
        /** Generate and emit an EncodedVideoChunk for each demuxed sample */
        for (const sample of samples) {
            /** Transforming the video the way we want it */
            this.#onChunk(new EncodedVideoChunk({
                type: sample.is_sync ? "key" : "delta",
                timestamp: 1e6 * sample.cts / sample.timescale,
                duration: 1e6 * sample.duration / sample.timescale,
                data: sample.data
            }));
        }
    }

    #onReady(info) {
        const [track] = info.videoTracks;
        /** Translating file
         * Understanding the file configuration, what it was coded the first time */
        this.#onConfig({
            codec: track.codec,
            codecHeight: track.video.height,
            codecWidth: track.video.width,
            description: this.#description(track),
            durationSec: info.duration / info.timescale,
        });
        /** segmenta as infos que precisamos */
        this.#file.setExtractionOptions(track.id);
        this.#file.start()
    }

    /**
     * Initializes stream
     * consumir stream sob demanda
     * 
     * @param {ReadableStream} stream 
     * 
     * @returns {Promise<void>} 
     */
    #init(stream) {
        let _offset = 0;
        const consumeFile = new WritableStream({
            /**
             * @param {Uint8Array} chunk 
             */
            write: (chunk) => {
                const copy = chunk.buffer;
                copy.fileStart = _offset;
                this.#file.appendBuffer(copy);

                _offset += chunk.length;
            },
            /**
             * Tira file da memoria
             */
            close: () => {
                this.#file.flush();
            },
        });

        //conforme arquivo esta disponivel, manda para WritableStream
        //se browser ve que WritableStream esta demorando para responder
        //a api do browser faz backpressure, pausando processo e espera processar para mandar mais dados automaticamente
        return stream.pipeTo(consumeFile);
    }
}