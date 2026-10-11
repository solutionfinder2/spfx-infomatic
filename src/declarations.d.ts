// Allow importing the bundled world-atlas TopoJSON without generating huge literal types
declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}
