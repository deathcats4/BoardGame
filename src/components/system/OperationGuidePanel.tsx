import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { TFunction } from 'i18next';
import { HelpCircle, Maximize2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModalStack } from '../../contexts/ModalStackContext';

export type OperationGuideSurface = 'web' | 'app';

type OperationGuideButtonVariant = 'classic' | 'book';

const operationGuideScreenshots = {
    web: '/images/operation-guide/home-web-fab-annotated.png',
    app: '/images/operation-guide/home-app-fab-annotated.png',
    game: '/images/operation-guide/game-fab-annotated.png',
    opponentPublicInfo: '/images/operation-guide/opponent-public-info-annotated.png',
    longPress: '/images/operation-guide/mobile-long-press-annotated.png',
} as const;

const operationGuideScreenshotAltKeys: Record<OperationGuideSurface, string> = {
    web: 'hud.operationGuide.visual.webFabImageAlt',
    app: 'hud.operationGuide.visual.appFabImageAlt',
};

interface OperationGuideScreenshotFigureProps {
    t: TFunction;
    surface: OperationGuideSurface;
    onZoom: (screenshot: OperationGuideZoomScreenshot) => void;
}

interface OperationGuideZoomScreenshot {
    src: string;
    alt: string;
}

interface OperationGuideZoomableImageProps {
    src: string;
    alt: string;
    testId: string;
    onZoom: (screenshot: OperationGuideZoomScreenshot) => void;
}

const OperationGuideZoomableImage = ({
    src,
    alt,
    testId,
    onZoom,
}: OperationGuideZoomableImageProps) => (
    <button
        type="button"
        className="block w-full cursor-zoom-in overflow-hidden bg-transparent text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4dfb8]"
        aria-label={alt}
        data-testid={`${testId}-zoom-trigger`}
        onClick={() => onZoom({ src, alt })}
    >
        <img
            className="block w-full object-contain"
            src={src}
            alt={alt}
            loading="lazy"
            data-testid={testId}
        />
    </button>
);

const OperationGuideScreenshotFigure = ({ t, surface, onZoom }: OperationGuideScreenshotFigureProps) => {
    const homeScreenshotAlt = String(t(operationGuideScreenshotAltKeys[surface]));
    const gameScreenshotAlt = String(t('hud.operationGuide.visual.gameFabImageAlt'));
    const opponentPublicInfoAlt = String(t('hud.operationGuide.visual.opponentPublicInfoImageAlt'));
    const longPressScreenshotAlt = String(t('hud.operationGuide.visual.longPressImageAlt'));

    return (
        <div
            className="grid gap-3"
            data-testid="operation-guide-annotated-screenshot"
        >
            <figure
                className="overflow-hidden rounded-lg bg-black/10"
                data-testid="operation-guide-long-press-figure"
            >
                <OperationGuideZoomableImage
                    src={operationGuideScreenshots.longPress}
                    alt={longPressScreenshotAlt}
                    testId="operation-guide-real-screenshot-long-press"
                    onZoom={onZoom}
                />
            </figure>

            <figure
                className="overflow-hidden rounded-lg bg-black/10"
                data-testid="operation-guide-opponent-public-info-screenshot"
            >
                <OperationGuideZoomableImage
                    src={operationGuideScreenshots.opponentPublicInfo}
                    alt={opponentPublicInfoAlt}
                    testId="operation-guide-real-screenshot-opponent-public-info"
                    onZoom={onZoom}
                />
            </figure>

            <figure
                className="overflow-hidden rounded-lg bg-black/10"
                data-testid="operation-guide-home-fab-screenshot"
            >
                <OperationGuideZoomableImage
                    src={operationGuideScreenshots[surface]}
                    alt={homeScreenshotAlt}
                    testId="operation-guide-real-screenshot-home-fab"
                    onZoom={onZoom}
                />
            </figure>

            <figure
                className="overflow-hidden rounded-lg bg-black/10"
                data-testid="operation-guide-game-fab-screenshot"
            >
                <OperationGuideZoomableImage
                    src={operationGuideScreenshots.game}
                    alt={gameScreenshotAlt}
                    testId="operation-guide-real-screenshot-game-fab"
                    onZoom={onZoom}
                />
            </figure>
        </div>
    );
};

interface OperationGuideModalProps {
    t: TFunction;
    close: () => void;
    closeOnBackdrop: boolean;
    surface: OperationGuideSurface;
}

const OperationGuideModal = ({
    t,
    close,
    closeOnBackdrop,
    surface,
}: OperationGuideModalProps) => {
    const [zoomScreenshot, setZoomScreenshot] = useState<OperationGuideZoomScreenshot | null>(null);
    const closeZoomScreenshot = () => setZoomScreenshot(null);

    return (
        <>
            <div
                className="fixed inset-0 bg-black/55 backdrop-blur-sm"
                data-testid="operation-guide-backdrop"
                onClick={closeOnBackdrop ? close : undefined}
            />
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center px-3 py-[max(1rem,env(safe-area-inset-top))]">
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="operation-guide-title"
                    className="pointer-events-auto flex max-h-[min(88vh,46rem)] w-[min(66rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[#d4b36f]/70 bg-[#f8efdb] text-[#3f2c1c] shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
                    data-testid="operation-guide-modal"
                >
                    <header className="flex items-start justify-between gap-4 border-b border-[#c7aa76]/45 bg-[#4b311f] px-4 py-4 text-[#fff4dc] sm:px-5">
                        <div className="min-w-0">
                            <h2 id="operation-guide-title" className="text-xl font-black tracking-wide sm:text-2xl">
                                {t('hud.operationGuide.title')}
                            </h2>
                        </div>
                        <button
                            type="button"
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f4dfb8]/30 bg-white/8 text-[#fff4dc] transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4dfb8]"
                            aria-label={String(t('hud.actions.close'))}
                            data-testid="operation-guide-close"
                            onClick={close}
                        >
                            <X size={20} />
                        </button>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4" data-testid="operation-guide-scroll-body">
                        <OperationGuideScreenshotFigure t={t} surface={surface} onZoom={setZoomScreenshot} />
                    </div>
                </section>
            </div>
            {zoomScreenshot ? (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3 sm:p-6"
                    data-testid="operation-guide-image-viewer"
                    role="dialog"
                    aria-modal="true"
                    aria-label={String(t('hud.operationGuide.visual.zoomDialogLabel'))}
                    onClick={closeZoomScreenshot}
                >
                    <div
                        className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col gap-3"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-end text-white">
                            <button
                                type="button"
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/12 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                aria-label={String(t('hud.actions.close'))}
                                data-testid="operation-guide-image-viewer-close"
                                onClick={closeZoomScreenshot}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <img
                            className="max-h-[calc(100vh-6.5rem)] w-full rounded-xl border border-white/20 bg-black object-contain shadow-2xl"
                            src={zoomScreenshot.src}
                            alt={zoomScreenshot.alt}
                            data-testid="operation-guide-image-viewer-image"
                        />
                    </div>
                </div>
            ) : null}
        </>
    );
};

interface OperationGuideButtonProps {
    surface: OperationGuideSurface;
    variant?: OperationGuideButtonVariant;
    className?: string;
    style?: CSSProperties;
    iconSize?: number | string;
    dataTestId?: string;
}

export const OperationGuideButton = ({
    surface,
    variant = 'classic',
    className = '',
    style,
    iconSize,
    dataTestId = 'operation-guide-entry',
}: OperationGuideButtonProps) => {
    const { t } = useTranslation('game');
    const { openModal, closeModal } = useModalStack();
    const modalIdRef = useRef<string | null>(null);
    const label = String(t('hud.actions.operationGuide'));
    const resolvedIconSize = iconSize ?? (variant === 'book' ? 18 : 16);
    const variantClassName = variant === 'book'
        ? 'group flex h-full w-full items-center justify-end border-0 bg-transparent p-0 font-serif font-bold text-[#2f2116] transition-colors hover:text-[#6d3d20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e1c36c]/70'
        : 'group relative inline-flex h-8 items-center gap-1.5 whitespace-nowrap text-parchment-base-text hover:text-[#2c2216] cursor-pointer font-bold text-sm tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-parchment-brown/50';

    const handleOpen = () => {
        if (modalIdRef.current) {
            closeModal(modalIdRef.current);
            modalIdRef.current = null;
        }

        modalIdRef.current = openModal({
            id: 'operation-guide-modal',
            closeOnBackdrop: true,
            closeOnEsc: true,
            lockScroll: true,
            onClose: () => {
                modalIdRef.current = null;
            },
            render: ({ close, closeOnBackdrop }) => (
                <OperationGuideModal
                    t={t}
                    close={close}
                    closeOnBackdrop={closeOnBackdrop}
                    surface={surface}
                />
            ),
        });
    };

    return (
        <button
            type="button"
            className={`${variantClassName} ${className}`.trim()}
            style={style}
            data-testid={dataTestId}
            aria-label={label}
            title={label}
            onClick={handleOpen}
        >
            {variant === 'classic'
                ? <Maximize2 size={resolvedIconSize} aria-hidden="true" />
                : <HelpCircle size={resolvedIconSize} aria-hidden="true" />}
            <span className="relative z-10">{label}</span>
            {variant === 'classic' ? <span className="underline-center" /> : null}
        </button>
    );
};
