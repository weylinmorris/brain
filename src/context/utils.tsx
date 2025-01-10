import React from 'react';

export function combineComponents(...components: Array<React.FC<{ children: React.ReactNode }>>) {
    return components.reduce(
        (AccumulatedComponents, CurrentComponent) => {
            const CombinedComponent = ({ children }: { children: React.ReactNode }) => {
                return (
                    <AccumulatedComponents>
                        <CurrentComponent>{children}</CurrentComponent>
                    </AccumulatedComponents>
                );
            };
            CombinedComponent.displayName = `CombinedComponent(${CurrentComponent.displayName || CurrentComponent.name})`;
            return CombinedComponent;
        },
        ({ children }: { children: React.ReactNode }) => <>{children}</>
    );
} 