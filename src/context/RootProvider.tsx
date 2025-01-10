'use client';

import { BlockProvider } from './BlockContext';
import { SearchProvider } from './SearchContext';
import { ToastProvider } from './ToastContext';
import { combineComponents } from './utils';

export const RootProvider = combineComponents(
    BlockProvider,
    SearchProvider,
    ToastProvider
); 