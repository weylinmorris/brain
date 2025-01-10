import React from 'react';

export function combineComponents(...components: Array<React.FC<{ children: React.ReactNode }>>) {
    return components.reduce(
        (AccumulatedComponents, CurrentComponent) => {
            return ({ children }: { children: React.ReactNode }) => {
                return (
                    <AccumulatedComponents>
                        <CurrentComponent>{children}</CurrentComponent>
                    </AccumulatedComponents>
                );
            };
        },
        ({ children }: { children: React.ReactNode }) => <>{children}</>
    );
} 