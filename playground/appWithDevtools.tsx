import { createSignal, createEffect, JSX } from 'solid-js';

import { App } from './app';
import { throttle } from '../src/utils/throttle';

export const AppWithDevtools = (): JSX.Element => {

    const MD_MIN_WIDTH_PIXELS = 768; // md tailwindcss breakpoint
    const MIN_SIZE_PIXELS = 50; // min width/height for devtools
    let outerContainer!: HTMLDivElement;
    const [resizing, setResizing] = createSignal(false);

    const ratios = loadResizeRatios() ?? {
        horizontal: 2/3, // the counterpart initial size is basis-1/3 for horizontal
        vertical: 1/2 // and basis-1/2 for vertical
    };
    const setAppSizeRatio = (appContainer: HTMLDivElement, orientation: 'horizontal' | 'vertical') => {
        appContainer.style.setProperty(`--${orientation}-resize-percent`, `${ratios[orientation] * 100}%`);
    };

    let onMouseMove: (event: MouseEvent) => void = () => {};
    let initial: {mousePos: number; appSize: number} | undefined = undefined;

    const initSplitter = (appContainer: HTMLDivElement) => {
        setAppSizeRatio(appContainer, 'horizontal');
        setAppSizeRatio(appContainer, 'vertical');
        onMouseMove = throttle(
            (event: MouseEvent) => {
                event.preventDefault();
                const {width: outerWidth, height: outerHeight} = outerContainer.getBoundingClientRect();
                const orientation = outerWidth >= MD_MIN_WIDTH_PIXELS ? 'horizontal' : 'vertical';
                if (!initial) {
                    const {width: treeWidth, height: treeHeight} = appContainer.getBoundingClientRect() ?? {width: 0, height: 0};
                    initial = orientation === 'horizontal' ? {mousePos: event.clientX, appSize: treeWidth} : {mousePos: event.clientY, appSize: treeHeight};
                }
                const currentMousePos = orientation === 'horizontal' ? event.clientX : event.clientY;
                const outerSize = orientation === 'horizontal' ? outerWidth : outerHeight;
                const newSize = initial.appSize + (currentMousePos - initial.mousePos);
                const maxSize = outerSize - MIN_SIZE_PIXELS;
                if (newSize > MIN_SIZE_PIXELS && newSize < maxSize) {
                    ratios[orientation] = newSize / outerSize;
                    setAppSizeRatio(appContainer, orientation);
                }
            },
            10
        );
    };

    const stopResizing = () => setResizing(false);
    const iframeCoverUp = () => resizing() ? 'fixed inset-0 z-50 md:cursor-col-resize cursor-row-resize' : 'hidden';

    createEffect(() => {
        if (resizing()) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', stopResizing);
            initial = undefined;
            saveResizeRatios(ratios);
        }
    });

    const style = `
        html, body, #app {
            height: 100%;
        }
        .resizable {
            flex-basis: var(--vertical-resize-percent);
        }
        @media (min-width: 768px) { .resizable {
            flex-basis: var(--horizontal-resize-percent);
        }}
    `;
    return (<>
        <style>{style}</style>
        <div class={iframeCoverUp()} />

        <div ref={outerContainer} classList={{'h-full w-full flex md:flex-row flex-col': true, 'md:cursor-col-resize': resizing(), 'cursor-row-resize': resizing()}}>
            <div ref={initSplitter} class="overflow-auto flex-grow-0 flex-shrink-0 resizable">
                <App contained />
            </div>

            <div class="flex-grow-0 flex-shrink-0 flex-basis-0 relative">
                <div onMouseDown={[setResizing, true]} class="absolute md:h-full h-[5px] md:w-[5px] w-full md:-left-[2px] md:top-0 -top-[2px] md:cursor-col-resize cursor-row-resize" />
            </div>

            <div class="overflow-auto flex-grow flex-shrink md:basis-1/3 basis:1/2 md:border-l md:border-t-0 border-t">
                <div>devtools</div>
            </div>
        </div>
    </>);
};

const LOCAL_STORAGE_DEVTOOLS_PANEL_RESIZE_KEY = 'Solid::DevtoolsPlayground::devtoolsResize';

function saveResizeRatios(ratios: {}): void {
    localStorage.setItem(LOCAL_STORAGE_DEVTOOLS_PANEL_RESIZE_KEY, JSON.stringify(ratios));
}

function loadResizeRatios(): {horizontal: number; vertical: number} | undefined {
    const data = localStorage.getItem(LOCAL_STORAGE_DEVTOOLS_PANEL_RESIZE_KEY);
    let result: {horizontal: number; vertical: number} | undefined;
    if (data) {
        try {
            result = JSON.parse(data) as typeof result;
        } catch (e) {
            // ignore - the caller will use defaults
        }
    }
    return result;
}


