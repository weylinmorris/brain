declare module 'react' {
  export interface Dispatch<A> {
    (value: A): void;
  }
  const React: any;
  export default React;
}

declare namespace React {
  interface Dispatch<A> {
    (value: A): void;
  }
}
