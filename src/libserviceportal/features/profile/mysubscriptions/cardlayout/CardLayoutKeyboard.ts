import { KeyboardEvent } from 'react';

const CARD_SELECTOR = '.nz-dynamic-card[tabindex]:not([tabindex="-1"])';

const findCardListContainer = (element: HTMLElement): HTMLElement | null => {
    const explicitList = element.closest('[data-card-layout-list]');
    if (explicitList) {
        return explicitList as HTMLElement;
    }

    let node: HTMLElement | null = element.parentElement;
    while (node) {
        const cards = node.querySelectorAll(CARD_SELECTOR);
        if (cards.length > 1) {
            return node;
        }
        node = node.parentElement;
    }

    return null;
};

const getSiblingCards = (current: HTMLElement): HTMLElement[] => {
    const listRoot = findCardListContainer(current);
    if (!listRoot) {
        return [current];
    }

    return Array.from(listRoot.querySelectorAll<HTMLElement>(CARD_SELECTOR));
};

const focusCardAtIndex = (cards: HTMLElement[], index: number) => {
    const target = cards[index];
    if (!target) {
        return;
    }

    target.focus();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};

const isCardKeyboardInteractiveTarget = (target: HTMLElement): boolean =>
    !!target.closest(
        '.nz-cardlayout-header-checkbox, .nz-cardlayout-form, .nz-dynamic-card-action, .nz-dynamic-card-node-menu'
    );

type CardKeyboardHandlerOptions = {
    orientation?: 'vertical' | 'horizontal';
    onActivate?: (event: KeyboardEvent<HTMLDivElement>) => void;
};

const createCardKeyboardHandler = ({
    orientation = 'vertical',
    onActivate,
}: CardKeyboardHandlerOptions) => (event: KeyboardEvent<HTMLDivElement>) => {
    const current = event.currentTarget;
    if (current.closest('.p-splitter-panel') || current.closest('.p-splitter')) {
        return;
    }
    const cards = getSiblingCards(current);
    const currentIndex = cards.indexOf(current);

    if (
        event.key === 'ArrowDown' ||
        (orientation === 'horizontal' && event.key === 'ArrowRight')
    ) {
        if (cards.length <= 1) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        focusCardAtIndex(cards, Math.min(Math.max(currentIndex, 0) + 1, cards.length - 1));
        return;
    }

    if (
        event.key === 'ArrowUp' ||
        (orientation === 'horizontal' && event.key === 'ArrowLeft')
    ) {
        if (cards.length <= 1) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        focusCardAtIndex(cards, Math.max(Math.max(currentIndex, 0) - 1, 0));
        return;
    }

    if (event.key === 'Home') {
        if (cards.length <= 1) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        focusCardAtIndex(cards, 0);
        return;
    }

    if (event.key === 'End') {
        if (cards.length <= 1) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        focusCardAtIndex(cards, cards.length - 1);
        return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
        if (isCardKeyboardInteractiveTarget(event.target as HTMLElement)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        onActivate?.(event);
    }
};

export {
    createCardKeyboardHandler,
    findCardListContainer,
    focusCardAtIndex,
    getSiblingCards,
    isCardKeyboardInteractiveTarget,
};
