/** @type {HTMLCanvasElement} */
let _canvas;
/** Canvas context @type {*} */
let _ctx;

export default class CanvasRenderer {
    /**
     * Escreve canvas na tela
     * @param {VideoFrame} frame 
     */
    static draw(frame) {
        const { displayHeight, displayWidth } = frame;

        _canvas.width = displayWidth;
        _canvas.height = displayHeight;
        /** plota na tela nas coordenadas */
        _ctx.drawImage(
            frame,
            0, 
            0, 
            displayWidth, 
            displayHeight
        );
        //ja usamos, pode fechar
        frame.close();
    }

    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     * @returns 
     */
    static getRenderer(canvas) {
        _canvas = canvas;
        _ctx = canvas.getContext('2d');
        const renderer = this;
        let pendingFrame = null;
        return frame => {
            /** Vai ser executada o mais rapido que o navegador pode */
            const renderAnimationFrame = () => {
                renderer.draw(pendingFrame);
                pendingFrame = null;
            }

            /** Se estiver nulo, temos que processar */
            /** Só roda se nao tiver ninguem pendente */
            if (!pendingFrame) {
                /** Processa mais de 60x por segundo?? */
                requestAnimationFrame(renderAnimationFrame);
            } else {
                /** Se tiver, encerra o anterior com close */
                pendingFrame.close();
            }

            pendingFrame = frame;
        };
    }
}