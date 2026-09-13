/* @vitest-environment happy-dom */
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OperationGuideButton } from '../OperationGuidePanel';

type CapturedModalEntry = {
    id?: string;
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
    lockScroll?: boolean;
    render: (api: { close: () => void; closeOnBackdrop: boolean }) => ReactNode;
};

let capturedModalEntry: CapturedModalEntry | null = null;
const mockOpenModal = vi.fn((entry: CapturedModalEntry) => {
    capturedModalEntry = entry;
    return entry.id ?? 'operation-guide-modal';
});
const mockCloseModal = vi.fn();

const translations: Record<string, string> = {
    'hud.actions.operationGuide': '操作指南',
    'hud.actions.close': '关闭',
    'hud.operationGuide.title': '操作指南',
    'hud.operationGuide.visual.webFabImageAlt': '网页端悬浮球标注截图',
    'hud.operationGuide.visual.appFabImageAlt': 'App 端悬浮球标注截图',
    'hud.operationGuide.visual.gameFabImageAlt': '局内悬浮球标注截图',
    'hud.operationGuide.visual.opponentPublicInfoImageAlt': '对手公开信息标注截图',
    'hud.operationGuide.visual.longPressImageAlt': '移动端长按放大标注截图',
    'hud.operationGuide.visual.zoomDialogLabel': '操作指南截图放大查看',
};

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) => translations[key] ?? options?.defaultValue ?? key,
    }),
}));

vi.mock('../../../contexts/ModalStackContext', () => ({
    useModalStack: () => ({
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
    }),
}));

describe('OperationGuideButton', () => {
    beforeEach(() => {
        capturedModalEntry = null;
        mockOpenModal.mockClear();
        mockCloseModal.mockClear();
    });

    it('从右上角按钮打开居中图解弹窗，并且不把操作指南列为悬浮球功能', () => {
        render(<OperationGuideButton surface="web" dataTestId="operation-guide-test-entry" />);

        fireEvent.click(screen.getByTestId('operation-guide-test-entry'));

        expect(mockOpenModal).toHaveBeenCalledWith(expect.objectContaining({
            id: 'operation-guide-modal',
            closeOnBackdrop: true,
            closeOnEsc: true,
            lockScroll: true,
        }));
        expect(capturedModalEntry).not.toBeNull();

        render(<>{capturedModalEntry?.render({ close: vi.fn(), closeOnBackdrop: true })}</>);

        expect(screen.getByTestId('operation-guide-modal')).toBeInTheDocument();
        expect(screen.queryByText('先看这三件事')).toBeNull();
        expect(screen.queryByText('点击放大查看')).toBeNull();
        expect(screen.queryByText('新手帮助')).toBeNull();
        expect(screen.queryByTestId('operation-guide-priority-list')).toBeNull();
        expect(screen.queryByTestId('operation-guide-fab-list')).toBeNull();
        expect(screen.queryAllByTestId(/^operation-guide-fab-item-/)).toHaveLength(0);
        expect(screen.getByTestId('operation-guide-annotated-screenshot')).toBeInTheDocument();
        expect(screen.queryByTestId('operation-guide-callout-main-fab')).toBeNull();
        expect(screen.queryByTestId('operation-guide-callout-satellite-buttons')).toBeNull();
        expect(screen.queryByTestId('operation-guide-callout-long-press')).toBeNull();
        expect(screen.getByTestId('operation-guide-real-screenshot-home-fab')).toHaveAttribute(
            'src',
            '/images/operation-guide/home-web-fab-annotated.png',
        );
        expect(screen.getByTestId('operation-guide-real-screenshot-long-press')).toHaveAttribute(
            'src',
            '/images/operation-guide/mobile-long-press-annotated.png',
        );
        expect(screen.getByTestId('operation-guide-real-screenshot-opponent-public-info')).toHaveAttribute(
            'src',
            '/images/operation-guide/opponent-public-info-annotated.png',
        );
        expect(screen.getByTestId('operation-guide-real-screenshot-game-fab')).toHaveAttribute(
            'src',
            '/images/operation-guide/game-fab-annotated.png',
        );

        fireEvent.click(screen.getByTestId('operation-guide-real-screenshot-long-press-zoom-trigger'));
        expect(screen.getByTestId('operation-guide-image-viewer')).toBeInTheDocument();
        expect(screen.queryByText('移动端长按放大标注截图')).toBeNull();
        expect(screen.getByTestId('operation-guide-image-viewer-image')).toHaveAttribute(
            'src',
            '/images/operation-guide/mobile-long-press-annotated.png',
        );
        fireEvent.click(screen.getByTestId('operation-guide-image-viewer-close'));
        expect(screen.queryByTestId('operation-guide-image-viewer')).toBeNull();

        fireEvent.click(screen.getByTestId('operation-guide-real-screenshot-opponent-public-info-zoom-trigger'));
        expect(screen.getByTestId('operation-guide-image-viewer-image')).toHaveAttribute(
            'src',
            '/images/operation-guide/opponent-public-info-annotated.png',
        );
        fireEvent.click(screen.getByTestId('operation-guide-image-viewer-close'));

        fireEvent.click(screen.getByTestId('operation-guide-real-screenshot-home-fab-zoom-trigger'));
        expect(screen.getByTestId('operation-guide-image-viewer-image')).toHaveAttribute(
            'src',
            '/images/operation-guide/home-web-fab-annotated.png',
        );
        fireEvent.click(screen.getByTestId('operation-guide-image-viewer-close'));

        fireEvent.click(screen.getByTestId('operation-guide-real-screenshot-game-fab-zoom-trigger'));
        expect(screen.getByTestId('operation-guide-image-viewer-image')).toHaveAttribute(
            'src',
            '/images/operation-guide/game-fab-annotated.png',
        );
        fireEvent.click(screen.getByTestId('operation-guide-image-viewer-close'));
        expect(screen.getByTestId('operation-guide-modal')).toBeInTheDocument();
    });

    it('App 端图解弹窗只切换真实截图，不额外生成悬浮球说明列表', () => {
        render(<OperationGuideButton surface="app" dataTestId="operation-guide-test-entry" />);

        fireEvent.click(screen.getByTestId('operation-guide-test-entry'));
        render(<>{capturedModalEntry?.render({ close: vi.fn(), closeOnBackdrop: true })}</>);

        expect(screen.getByTestId('operation-guide-real-screenshot-home-fab')).toHaveAttribute(
            'src',
            '/images/operation-guide/home-app-fab-annotated.png',
        );
        expect(screen.getByTestId('operation-guide-real-screenshot-game-fab')).toHaveAttribute(
            'src',
            '/images/operation-guide/game-fab-annotated.png',
        );
        expect(screen.getByTestId('operation-guide-real-screenshot-opponent-public-info')).toHaveAttribute(
            'src',
            '/images/operation-guide/opponent-public-info-annotated.png',
        );
        expect(screen.queryByTestId('operation-guide-fab-list')).toBeNull();
        expect(screen.queryAllByTestId(/^operation-guide-fab-item-/)).toHaveLength(0);
        expect(screen.queryByTestId('operation-guide-fab-item-download-app')).toBeNull();
    });
});
